/**
 * Streaming Intelligent Chat Orchestrator
 *
 * Extends the existing IntelligentChatOrchestrator to support real-time streaming responses
 * while maintaining all the same intelligence sources and logic.
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { IntelligentChatOrchestrator } from './intelligentChatOrchestrator.js';
import { SmartContextManager } from './smartContextManager.js';
import { inputSanitizer } from './inputSanitizer.js';
import { getHealthMonitor } from './toolHealthMonitor.js';
import {
  CONVERSATION_CONFIG,
  OPENAI_CONFIG,
  SYSTEM_PROMPTS,
  TOOLS_CONFIG
} from '../config/chatConfig.js';

export class StreamingIntelligentChatOrchestrator extends IntelligentChatOrchestrator {
  constructor() {
    super();
    this.contextManager = new SmartContextManager();
  }

  /**
   * Convert technical tool names to user-friendly descriptions
   */
  getToolDisplayName(toolName) {
    const toolNames = {
      'gmail_search': 'Searching Gmail',
      'google_calendar': 'Checking Google Calendar',
      'semantic_search': 'Searching your emails',
      'agent_memory_search': 'Searching memories',
      'supabase_query': 'Checking database',
      'web_search': 'Searching the web',
      'file_search': 'Searching files'
    };

    return toolNames[toolName] || `Using ${toolName}`;
  }

  /**
   * Process streaming message with real-time callbacks
   * Leverages all existing orchestrator logic while adding streaming
   */
  async processStreamingMessage({
    message,
    conversationId,
    userId,
    sql,
    onStatus,
    onChunk,
    onToolStart,
    onToolComplete,
    onComplete,
    onError
  }) {
    try {
      onStatus('Considering response approach');

      // Use existing input sanitization
      console.log('🛡️ Running input sanitization...');
      const sanitizationResult = inputSanitizer.sanitizeInput(message);

      if (sanitizationResult.blocked) {
        console.warn('🚨 Message blocked by security filter');
        onError('Message blocked for security reasons');
        return;
      }

      const sanitizedMessage = sanitizationResult.sanitizedMessage;
      onStatus('Understanding your question...');

      // Get or create conversation (using existing logic from chat.js)
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const conversationTitle = sanitizedMessage.substring(0, 50).replace(/\n/g, ' ').trim() +
          (sanitizedMessage.length > 50 ? '...' : '');

        const newConversationResult = await sql`
          INSERT INTO conversations (user_id, title, metadata, created_at, updated_at)
          VALUES (${userId}, ${conversationTitle}, ${JSON.stringify({})}, NOW(), NOW())
          RETURNING id
        `;
        currentConversationId = newConversationResult[0].id;
      }

      // Initialize LLM with streaming
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: process.env.OPENAI_MODEL || OPENAI_CONFIG.DEFAULT_MODEL,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || OPENAI_CONFIG.DEFAULT_TEMPERATURE.toString()),
        streaming: true,
      });

      onStatus('Looking for relevant information...');

      // Use existing smart context optimization
      const promptResult = await this.contextManager.createOptimizedPrompt(
        userId,
        sanitizedMessage,
        SYSTEM_PROMPTS.BASE_PROMPT
      );

      // Get conversation context (using existing logic)
      const recentMessages = await sql`
        SELECT * FROM messages
        WHERE conversation_id = ${currentConversationId}
        ORDER BY created_at DESC
        LIMIT 10
      `;
      recentMessages.reverse();

      const conversationContext = this.contextManager.optimizeConversationHistory(recentMessages);

      // Create LangChain messages
      const langChainMessages = [
        new SystemMessage(promptResult.prompt),
        ...conversationContext.messages
          .filter(m => m.role !== 'system')
          .map(msg => {
            if (msg.role === 'user') {
              return new HumanMessage(msg.content);
            } else {
              return new AIMessage(msg.content);
            }
          })
      ];

      // Add user message to database
      await sql`
        INSERT INTO messages (conversation_id, role, content, metadata, created_at)
        VALUES (${currentConversationId}, 'user', ${sanitizedMessage}, ${JSON.stringify({})}, NOW())
      `;

      onStatus('Writing response...');

      // Stream the LLM response
      let fullResponse = '';
      const stream = await llm.stream(langChainMessages);

      for await (const chunk of stream) {
        const content = chunk.content;
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      // Save AI response to database
      await sql`
        INSERT INTO messages (conversation_id, role, content, metadata, created_at)
        VALUES (${currentConversationId}, 'assistant', ${fullResponse}, ${JSON.stringify({
          model: process.env.OPENAI_MODEL || OPENAI_CONFIG.DEFAULT_MODEL,
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || OPENAI_CONFIG.DEFAULT_TEMPERATURE.toString()),
          streaming: true,
          generated_at: new Date().toISOString(),
          optimization: {
            context_tokens: promptResult.tokenCount,
            query_categories: promptResult.categories,
            memories_used: promptResult.optimization.memoriesUsed,
            compression_ratio: promptResult.optimization.compressionRatio,
            conversation_tokens: conversationContext.tokenCount
          }
        })}, NOW())
      `;

      // Update conversation metadata
      const updatedMetadata = {
        last_model_used: process.env.OPENAI_MODEL || OPENAI_CONFIG.DEFAULT_MODEL,
        last_temperature: parseFloat(process.env.OPENAI_TEMPERATURE || OPENAI_CONFIG.DEFAULT_TEMPERATURE.toString()),
        streaming_enabled: true,
        last_response_at: new Date().toISOString(),
        optimization: {
          last_context_tokens: promptResult.tokenCount,
          last_conversation_tokens: conversationContext.tokenCount,
          last_query_categories: promptResult.categories,
          optimization_enabled: true
        }
      };

      await sql`
        UPDATE conversations
        SET updated_at = NOW(),
            metadata = ${JSON.stringify(updatedMetadata)}
        WHERE id = ${currentConversationId}
      `;

      onComplete(fullResponse);

    } catch (error) {
      console.error('Streaming orchestrator error:', error);
      onError(error.message);
    }
  }

  /**
   * Process streaming message with LangChain tools (advanced version)
   * This adds tool execution with streaming status updates
   */
  async processStreamingMessageWithTools({
    message,
    conversationId,
    userId,
    sql,
    tools = [],
    onStatus,
    onChunk,
    onToolStart,
    onToolComplete,
    onComplete,
    onError
  }) {
    try {
      onStatus('Thinking...');

      // Input sanitization
      const sanitizationResult = inputSanitizer.sanitizeInput(message);
      if (sanitizationResult.blocked) {
        onError('Message blocked for security reasons');
        return;
      }

      const sanitizedMessage = sanitizationResult.sanitizedMessage;

      // Get/create conversation
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        const conversationTitle = sanitizedMessage.substring(0, 50).replace(/\n/g, ' ').trim() +
          (sanitizedMessage.length > 50 ? '...' : '');

        const newConversationResult = await sql`
          INSERT INTO conversations (user_id, title, metadata, created_at, updated_at)
          VALUES (${userId}, ${conversationTitle}, ${JSON.stringify({})}, NOW(), NOW())
          RETURNING id
        `;
        currentConversationId = newConversationResult[0].id;
      }

      // Initialize streaming LLM with tools
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: process.env.OPENAI_MODEL || OPENAI_CONFIG.DEFAULT_MODEL,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || OPENAI_CONFIG.DEFAULT_TEMPERATURE.toString()),
        streaming: true,
      });

      const llmWithTools = tools.length > 0 ? llm.bindTools(tools) : llm;

      onStatus('Looking for relevant information...');

      // Get smart context
      const promptResult = await this.contextManager.createOptimizedPrompt(
        userId,
        sanitizedMessage,
        SYSTEM_PROMPTS.BASE_PROMPT
      );

      // Get conversation history
      const recentMessages = await sql`
        SELECT * FROM messages
        WHERE conversation_id = ${currentConversationId}
        ORDER BY created_at DESC
        LIMIT 10
      `;
      recentMessages.reverse();

      const conversationContext = this.contextManager.optimizeConversationHistory(recentMessages);

      const langChainMessages = [
        new SystemMessage(promptResult.prompt),
        ...conversationContext.messages
          .filter(m => m.role !== 'system')
          .map(msg => {
            if (msg.role === 'user') {
              return new HumanMessage(msg.content);
            } else {
              return new AIMessage(msg.content);
            }
          })
      ];

      // Add user message to database
      await sql`
        INSERT INTO messages (conversation_id, role, content, metadata, created_at)
        VALUES (${currentConversationId}, 'user', ${sanitizedMessage}, ${JSON.stringify({})}, NOW())
      `;

      onStatus('Analyzing your request...');

      // Get AI response (potentially with tool calls)
      const aiResponse = await llmWithTools.invoke(langChainMessages);
      let finalContent = aiResponse.content;

      // Handle tool calls if they exist
      if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
        // Show specific tools being used
        const toolNames = aiResponse.tool_calls.map(tc => this.getToolDisplayName(tc.name)).join(', ');
        onStatus(toolNames);

        const healthMonitor = getHealthMonitor();
        const toolPromises = aiResponse.tool_calls.map(async (toolCall) => {
          const startTime = Date.now();
          let success = false;
          let error = null;
          let result = null;

          try {
            onToolStart(toolCall.name, toolCall.args);

            const tool = tools.find(t => t.name === toolCall.name);
            if (tool) {
              result = await tool._call(toolCall.args);
              success = true;
              onToolComplete(toolCall.name, result);
            } else {
              error = new Error(`Tool ${toolCall.name} not found`);
              result = JSON.stringify({ error: error.message });
            }
          } catch (err) {
            error = err;
            success = false;
            result = JSON.stringify({ error: err.message });
            onToolComplete(toolCall.name, `Error: ${err.message}`);
          }

          // Log to health monitor
          const executionTime = Date.now() - startTime;
          await healthMonitor.logExecution({
            toolName: toolCall.name,
            toolCallId: toolCall.id,
            userId: userId,
            success,
            executionTimeMs: executionTime,
            errorType: error ? healthMonitor.categorizeError(error) : null,
            errorMessage: error ? error.message : null,
            errorDetails: error ? { stack: error.stack } : null,
            queryContext: sanitizedMessage.trim(),
            toolInput: toolCall.args,
            responseSize: result ? result.length : null
          });

          return {
            tool_call_id: toolCall.id,
            content: result,
            success
          };
        });

        const toolResults = await Promise.all(toolPromises);

        onStatus('Writing response...');

        // Create final response with tool results
        const messagesWithToolResults = [
          ...langChainMessages,
          aiResponse,
          ...toolResults.map(result => ({
            role: 'tool',
            content: result.content,
            tool_call_id: result.tool_call_id
          }))
        ];

        // Stream final response
        let toolEnhancedResponse = '';
        const finalStream = await llm.stream(messagesWithToolResults);

        for await (const chunk of finalStream) {
          const content = chunk.content;
          if (content) {
            toolEnhancedResponse += content;
            onChunk(content);
          }
        }

        finalContent = toolEnhancedResponse;
      } else {
        // No tools needed, just stream the direct response
        onStatus('Writing response...');
        let streamedContent = '';
        const stream = await llm.stream(langChainMessages);

        for await (const chunk of stream) {
          const content = chunk.content;
          if (content) {
            streamedContent += content;
            onChunk(content);
          }
        }

        finalContent = streamedContent;
      }

      // Save AI response
      await sql`
        INSERT INTO messages (conversation_id, role, content, metadata, created_at)
        VALUES (${currentConversationId}, 'assistant', ${finalContent}, ${JSON.stringify({
          model: process.env.OPENAI_MODEL || OPENAI_CONFIG.DEFAULT_MODEL,
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || OPENAI_CONFIG.DEFAULT_TEMPERATURE.toString()),
          tools_available: tools.length,
          tools_used: aiResponse.tool_calls ? aiResponse.tool_calls.length : 0,
          streaming: true,
          generated_at: new Date().toISOString()
        })}, NOW())
      `;

      onComplete(finalContent);

    } catch (error) {
      console.error('Streaming with tools error:', error);
      onError(error.message);
    }
  }
}

export default StreamingIntelligentChatOrchestrator;