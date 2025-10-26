/**
 * Streaming Intelligent Chat Orchestrator
 *
 * Extends the existing IntelligentChatOrchestrator to support real-time streaming responses
 * while maintaining all the same intelligence sources and logic.
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { IntelligentChatOrchestrator } from './intelligentChatOrchestrator.js';
import { SmartContextManager } from './smartContextManager.js';
import { inputSanitizer } from './inputSanitizer.js';
import { getHealthMonitor } from './toolHealthMonitor.js';
import TemporalParsingService from './temporalParsingService.js';
import { createClient } from '@supabase/supabase-js';
import {
  CONVERSATION_CONFIG,
  OPENAI_CONFIG,
  SYSTEM_PROMPTS,
  TOOLS_CONFIG
} from '../config/chatConfig.js';
import { sql } from '../config/database.js';
import { GmailSearchTool } from '../tools/gmailSearchTool.js';
import { SemanticSearchTool } from '../tools/semanticSearchTool.js';
import { AgentMemorySearchTool } from '../tools/agentMemorySearchTool.js';
import { GoogleCalendarTool } from '../tools/googleCalendarTool.js';
import  FamilyActiviesTool from '../tools/familyActivitiesTool.js';
import { EventSchedulingTool } from '../tools/eventSchedulingTool.js';
import { ConversationalLLMTool } from '../tools/conversationalLLMTool.js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class StreamingIntelligentChatOrchestrator extends IntelligentChatOrchestrator {
  constructor() {
    console.log('🏗️ StreamingIntelligentChatOrchestrator constructor called');
    super();
    this.contextManager = new SmartContextManager();
    this.commonPrompts = null; // Cache for common prompts configuration
    this.loadCommonPrompts();
    this.loadLLMClassificationSchema();
    console.log('🏗️ Constructor completed');
  }

  /**
   * Get user's timezone from database
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} User's timezone or null if not found
   */
  async getUserTimezone(userId) {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('timezone')
        .eq('id', userId)
        .single();

      if (!userError && userData?.timezone) {
        console.log(`🕒 Using user timezone: ${userData.timezone}`);
        return userData.timezone;
      } else {
        console.log(`🕒 No user timezone found, using server timezone`);
        return null;
      }
    } catch (timezoneError) {
      console.warn('🕒 Error fetching user timezone:', timezoneError.message);
      return null;
    }
  }

  /**
   * Calculate temporal range from user query
   * @param {string} prompt - User query
   * @param {string} userTimezone - User's timezone (e.g. "America/Chicago")
   * @returns {Promise<Object|null>} Temporal range with ISO dates or null
   */
  async calculateTemporalRange(prompt, userTimezone = null) {
    try {
      const temporal = await TemporalParsingService.parseTemporalQuery(prompt, new Date(), userTimezone);
      if (temporal && temporal.phrase) {
        const temporalRange = {
          phrase: temporal.phrase,
          startDate: temporal.startDate.toISOString(),
          endDate: temporal.endDate.toISOString()
        };
        console.log(`🕒 Calculated temporal range: ${temporal.phrase} → ${temporalRange.startDate} to ${temporalRange.endDate}`);
        return temporalRange;
      }
    } catch (error) {
      console.warn('🕒 Failed to parse temporal context:', error.message);
    }
    return null;
  }

  /**
   * COMMON PROMPTS CONFIGURATION LOADER
   *
   * Purpose: Load and cache the common-prompts.json configuration for fast intent detection
   *
   * PROS:
   * - Instant lookup for 80% of common queries (no LLM needed)
   * - Type-safe configuration with proper API parameters
   * - Easy to add new prompts without code changes
   * - Handles variable substitution ({name}, {subject}, etc.)
   *
   * CONS:
   * - Static file needs manual updates
   * - Limited to predefined patterns
   * - Case sensitivity requires normalization
   */
  loadCommonPrompts() {
    try {
      const configPath = path.join(process.cwd(), 'src', 'config', 'common-prompts.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      this.commonPrompts = JSON.parse(configData);
      console.log('📋 Common prompts configuration loaded successfully');
    } catch (error) {
      console.error('📋 Failed to load common prompts configuration:', error);
      this.commonPrompts = { exact_matches: {}, pattern_matches: {}, date_patterns: {} };
    }
  }

  loadLLMClassificationSchema() {
    try {
      const configPath = path.join(process.cwd(), 'src', 'config', 'llm-classification-schema.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      this.llmSchema = JSON.parse(configData);
      console.log('📋 LLM classification schema loaded successfully');
    } catch (error) {
      console.error('📋 Failed to load LLM classification schema:', error);
      this.llmSchema = {};
    }
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
      'family_activities': 'Checking family activities',
      'calendar': 'Checking Google Calendar',
      'gmail': 'Searching Gmail',
      'agent_memory': 'Searching memories',
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
    onError,
    customBasePrompt = null  // Allow injecting custom base prompt
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
        // Force using node-fetch to avoid undici cookies issue
        configuration: {
          fetch: (await import('node-fetch')).default
        }
      });

      onStatus('Looking for relevant information...');

      // Use existing smart context optimization (allow custom base prompt injection)
      const basePromptToUse = customBasePrompt || SYSTEM_PROMPTS.BASE_PROMPT;
      const promptResult = await this.contextManager.createOptimizedPrompt(
        userId,
        sanitizedMessage,
        basePromptToUse
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

      console.log('🔗 Orchestrator: Calling onComplete with conversationId:', currentConversationId);
      onComplete(fullResponse, currentConversationId);

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
    onStatus,
    onChunk,
    onToolStart,
    onToolComplete,
    onComplete,
    onStructuredData,
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

      // Step 1: Multi-Intent Detection with Priority Order
      // Priority: Exact Match → Pattern Match → Fuzzy → LLM Fallback
      onStatus('Analyzing your request...');
      const detectedIntents = await this.detectIntents(sanitizedMessage);
      console.log('🧠 DEBUG: Detected intents:', JSON.stringify(detectedIntents, null, 2));

      // Get user's timezone for all temporal calculations
      const userTimezone = await this.getUserTimezone(userId);

      // Debug logging for conversationId issue
      console.log(`🔍 CONVERSATION ID DEBUG:`, {
        conversationId,
        type: typeof conversationId,
        length: conversationId?.length,
        isEmpty: !conversationId,
        isUndefined: conversationId === undefined,
        isEmptyString: conversationId === '',
        isNull: conversationId === null
      });

      // Get/create conversation
      let currentConversationId = conversationId;
      if (!currentConversationId || currentConversationId === '') {
        const conversationTitle = sanitizedMessage.substring(0, 50).replace(/\n/g, ' ').trim() +
          (sanitizedMessage.length > 50 ? '...' : '');

        const newConversationResult = await sql`
          INSERT INTO conversations (user_id, title, metadata, created_at, updated_at)
          VALUES (${userId}, ${conversationTitle}, ${JSON.stringify({})}, NOW(), NOW())
          RETURNING id
        `;
        currentConversationId = newConversationResult[0].id;
      }

      // Step 2: Execute tools based on detected intents (if any)
      let preExecutedToolResults = [];
      let shouldBypassLLM = false;
      let responseTemplate = null;
      let hasIntentMatch = false;
      let temporalRange = null;
      let intentResult = null;

      if (detectedIntents && (Array.isArray(detectedIntents) ? detectedIntents.length > 0 : detectedIntents)) {
        // Check intent result first to decide if we should execute tools
        intentResult = Array.isArray(detectedIntents) ? detectedIntents[0] : detectedIntents;
        console.log('🔍 DEBUG: Intent result details:', {
          intentResult,
          bypass_llm: intentResult?.bypass_llm,
          response_template: intentResult?.response_template
        });

        // All intents go through normal tool execution now (including conversational_llm tool)
        {
          hasIntentMatch = true;
          console.log('🎯 INTENT MATCH FOUND - executing tools');
          onStatus('Gathering information from your integrations...');
          const { toolResults, temporalRange: extractedTemporalRange } = await this.executeIntentToolsWithTimeRange(detectedIntents, userId, sanitizedMessage, userTimezone, onToolStart, onToolComplete);
          temporalRange = extractedTemporalRange;
          preExecutedToolResults = toolResults;
          console.log('🔧 Pre-executed tool results:', preExecutedToolResults.length, 'results');
          console.log('🔧 Tool results details:', preExecutedToolResults.map(r => ({ tool: r.tool, success: r.success, resultLength: typeof r.result === 'string' ? r.result.length : 'N/A' })));

          // Check if this is a template-based response that should bypass LLM
          if (intentResult?.bypass_llm && intentResult?.response_template) {
            shouldBypassLLM = true;
            responseTemplate = intentResult.response_template;
            console.log('🚀 DEBUG: Using template-based response, bypassing LLM entirely');
          }
        }
      }

      // Step 3: Handle template-based responses (bypass LLM entirely)
      if (shouldBypassLLM && responseTemplate) {
        let templateResponse;

        // Check if it's a simple string template or structured template
        if (typeof responseTemplate === 'string') {
          // Simple string template - apply appropriate template processing
          const processedTemplate = temporalRange
            ? this.replaceDatePlaceholders(responseTemplate, temporalRange)
            : this.processTemplateWithoutDates(responseTemplate);
          const toolResultsText = this.formatToolResultsForTemplate(preExecutedToolResults);
          templateResponse = processedTemplate + '\n\n' + toolResultsText;
        } else {
          // Structured template - use existing logic
          const extractedVariables = intentResult?.variables || {};
          templateResponse = await this.generateStructuredDataResponse(responseTemplate, preExecutedToolResults, sanitizedMessage, temporalRange, extractedVariables);
        }

        // Add user message to database
        await sql`
          INSERT INTO messages (conversation_id, role, content, metadata, created_at)
          VALUES (${currentConversationId}, 'user', ${sanitizedMessage}, ${JSON.stringify({})}, NOW())
        `;

        // Add assistant response to database
        await sql`
          INSERT INTO messages (conversation_id, role, content, metadata, created_at)
          VALUES (${currentConversationId}, 'assistant', ${templateResponse}, ${JSON.stringify({ method: 'template_response', bypass_llm: true })}, NOW())
        `;

        onStatus('Response ready');

        // Check if this is structured data and handle appropriately
        if (responseTemplate.type === 'structured_data') {
          // Send as structured data message instead of streaming text
          console.log('🎯 STREAMING: Sending structured data response');

          // Send structured data directly to frontend
          const structuredData = JSON.parse(templateResponse);
          console.log('🔗 Orchestrator (structured): Calling onStructuredData with conversationId:', currentConversationId);
          onStructuredData(structuredData, currentConversationId);
        } else {
          // Stream the template response with typing effect for regular text
          await this.streamTemplateResponse(templateResponse, onChunk);
          console.log('🔗 Orchestrator (template): Calling onComplete with conversationId:', currentConversationId);
          onComplete(templateResponse, currentConversationId);
        }
        return;
      }

      // Step 4: Handle intent-based responses with LLM synthesis (tools pre-executed, LLM synthesizes)
      if (hasIntentMatch && preExecutedToolResults.length > 0) {
        console.log('🎯 DEBUG: Taking intent synthesis path - tools pre-executed, streaming synthesis directly');

        // Format pre-executed tool results using existing methods
        const toolContext = this.formatToolResultsForTemplate(preExecutedToolResults);

        // Create enhanced base prompt with tool results context
        const enhancedBasePrompt = `${SYSTEM_PROMPTS.BASE_PROMPT}

IMPORTANT CONTEXT: I have already gathered the following information using your tools:

${toolContext}

Please provide a natural, conversational response based on this information. Do not call any tools - the data has already been retrieved and is provided above.`;

        // Initialize LLM without tools for synthesis
        const llm = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: process.env.OPENAI_MODEL || OPENAI_CONFIG.DEFAULT_MODEL,
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || OPENAI_CONFIG.DEFAULT_TEMPERATURE.toString()),
          streaming: true,
          // Force using node-fetch to avoid undici cookies issue
          configuration: {
            fetch: (await import('node-fetch')).default
          }
        });

        // Get smart context with enhanced prompt
        const promptResult = await this.contextManager.createOptimizedPrompt(
          userId,
          sanitizedMessage,
          enhancedBasePrompt
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
            }),
          new HumanMessage(sanitizedMessage)
        ];

        // Add user message to database
        await sql`
          INSERT INTO messages (conversation_id, role, content, metadata, created_at)
          VALUES (${currentConversationId}, 'user', ${sanitizedMessage}, ${JSON.stringify({})}, NOW())
        `;

        onStatus('Writing response...');

        // Stream the LLM response (no tools bound, so no tool calls will be made)
        let fullResponse = '';
        const stream = await llm.stream(langChainMessages);

        for await (const chunk of stream) {
          const content = chunk.content;
          if (content) {
            fullResponse += content;
            onChunk(content);  // This should stream to client
          }
        }

        // Save AI response to database
        await sql`
          INSERT INTO messages (conversation_id, role, content, metadata, created_at)
          VALUES (${currentConversationId}, 'assistant', ${fullResponse}, ${JSON.stringify({
            model: process.env.OPENAI_MODEL || OPENAI_CONFIG.DEFAULT_MODEL,
            method: 'intent_synthesis',
            tools_pre_executed: preExecutedToolResults.length,
            streaming: true,
            generated_at: new Date().toISOString()
          })}, NOW())
        `;

        console.log('🔗 Orchestrator: Calling onComplete with conversationId:', currentConversationId);
      onComplete(fullResponse, currentConversationId);
        return;
      }

      // Initialize streaming LLM with tools
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: process.env.OPENAI_MODEL || OPENAI_CONFIG.DEFAULT_MODEL,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || OPENAI_CONFIG.DEFAULT_TEMPERATURE.toString()),
        streaming: true,
        // Force using node-fetch to avoid undici cookies issue
        configuration: {
          fetch: (await import('node-fetch')).default
        }
      });

      // Create tools locally for LangChain execution path
      const tools = this.createLangChainTools(userId);
      const llmWithTools = tools.length > 0 ? llm.bindTools(tools) : llm;

      onStatus('Looking for relevant information...');

      // Parse temporal context from user query to inject into system prompt
      let temporalContext = '';
      try {
        const temporal = await TemporalParsingService.parseTemporalQuery(sanitizedMessage, new Date(), userTimezone);
        if (temporal && temporal.phrase) {
          const startStr = temporal.startDate.toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
          });
          const endStr = temporal.endDate.toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
          });

          temporalContext = `\n\nIMPORTANT TEMPORAL CONTEXT FOR THIS QUERY:
- User asked about: "${temporal.phrase}"
- This refers to the date range: ${startStr} to ${endStr}
- CRITICAL: Use these exact dates when referring to activities, events, or schedules. Do NOT recalculate dates.
- Any tool results showing occurrence_date or event dates within this range are the authoritative dates to use.`;

          console.log(`🕒 Injecting temporal context into system prompt: ${temporal.phrase} → ${startStr} to ${endStr}`);
        }
      } catch (error) {
        console.log(`🕒 No temporal context parsed for query: "${sanitizedMessage}"`);
      }

      // Create enhanced system prompt with temporal context and current date/time
      const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const currentTime = new Date().toLocaleTimeString('en-US');

      const enhancedSystemPrompt = SYSTEM_PROMPTS.BASE_PROMPT
        .replace('[CURRENT_DATE]', currentDate)
        .replace('[CURRENT_TIME]', currentTime) + temporalContext;

      // Get smart context
      const promptResult = await this.contextManager.createOptimizedPrompt(
        userId,
        sanitizedMessage,
        enhancedSystemPrompt
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
        // Let individual tool start/complete events handle status updates
        // Removed summary status to avoid duplication

        const healthMonitor = getHealthMonitor();
        const toolPromises = aiResponse.tool_calls.map(async (toolCall) => {
          const startTime = Date.now();
          let success = false;
          let error = null;
          let result = null;

          try {
            onToolStart(this.getToolDisplayName(toolCall.name), toolCall.args);

            const tool = tools.find(t => t.name === toolCall.name);
            if (tool) {
              console.log(`🚨 DEBUG: About to enhance tool ${toolCall.name} with args:`, toolCall.args);
              // Inject temporal parsing for time-sensitive tools
              const enhancedArgs = await this.enhanceArgsWithTemporal(toolCall.name, toolCall.args, sanitizedMessage);
              console.log(`🚨 DEBUG: Enhanced args for ${toolCall.name}:`, enhancedArgs);
              result = await tool._call(enhancedArgs);
              success = true;
              onToolComplete(this.getToolDisplayName(toolCall.name), result);
            } else {
              error = new Error(`Tool ${toolCall.name} not found`);
              result = JSON.stringify({ error: error.message });
            }
          } catch (err) {
            error = err;
            success = false;
            result = JSON.stringify({ error: err.message });
            onToolComplete(this.getToolDisplayName(toolCall.name), `Error: ${err.message}`);
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

        // Transform and combine results for schedule queries
        const transformedResults = this.transformScheduleResults(toolResults, sanitizedMessage);

        onStatus('Writing response...');

        // Create final response with tool results (use transformed results if available)
        const finalToolResults = transformedResults.length > 0 ? transformedResults : toolResults;
        const messagesWithToolResults = [
          ...langChainMessages,
          aiResponse,
          ...finalToolResults.map(result => new ToolMessage({
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

      console.log('🔗 Orchestrator (final): Calling onComplete with conversationId:', currentConversationId);
      onComplete(finalContent, currentConversationId);

    } catch (error) {
      console.error('Streaming with tools error:', error);
      onError(error.message);
    }
  }

  /**
   * Setup conversation and perform initial processing
   * @private
   */
  async setupConversation({ message, conversationId, userId, sql, onStatus }) {
    onStatus('Thinking...');

    // Input sanitization
    const sanitizationResult = inputSanitizer.sanitizeInput(message);
    if (sanitizationResult.blocked) {
      throw new Error('Message blocked for security reasons');
    }

    const sanitizedMessage = sanitizationResult.sanitizedMessage;

    // Multi-Intent Detection with Priority Order
    onStatus('Analyzing your request...');
    const detectedIntents = await this.detectIntents(sanitizedMessage);
    console.log('🧠 DEBUG: Detected intents:', JSON.stringify(detectedIntents, null, 2));

    // Debug logging for conversationId issue
    console.log(`🔍 CONVERSATION ID DEBUG:`, {
      conversationId,
      type: typeof conversationId,
      length: conversationId?.length,
      isEmpty: !conversationId,
      isUndefined: conversationId === undefined,
      isEmptyString: conversationId === '',
      isNull: conversationId === null
    });

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

    return {
      sanitizedMessage,
      detectedIntents,
      currentConversationId
    };
  }

  /**
   * Create specific tool instance by name
   * @private
   */
  createTool(toolName, userId) {
    const toolFactories = {
      gmail_search: () => new GmailSearchTool({ userId }),
      semantic_search: () => new SemanticSearchTool({
        userId,
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
        openaiApiKey: process.env.OPENAI_API_KEY
      }),
      agent_memory: () => new AgentMemorySearchTool({ userId }),
      calendar: () => new GoogleCalendarTool({ userId }),
      family_activities: () => new FamilyActiviesTool({ userId }),
      event_scheduling: () => new EventSchedulingTool({ userId }),
      conversational_llm: () => new ConversationalLLMTool({ userId })
    };

    if (toolFactories[toolName]) {
      try {
        return toolFactories[toolName]();
      } catch (error) {
        console.warn(`⚠️ Tool ${toolName} failed to initialize:`, error.message);
        return null;
      }
    }

    console.warn(`⚠️ Unknown tool requested: ${toolName}`);
    return null;
  }

  /**
   * Create minimal tool set for LangChain (only common fallback tools)
   * @private
   */
  createLangChainTools(userId) {
    // For LangChain fallback, create essential tools including family_activities and event_scheduling
    const essentialTools = ['gmail_search', 'calendar', 'agent_memory', 'family_activities', 'event_scheduling', 'conversational_llm'];
    const tools = [];

    for (const toolName of essentialTools) {
      const tool = this.createTool(toolName, userId);
      if (tool) {
        tools.push(tool);
      }
    }

    console.log(`🔧 LangChain tools created: ${tools.length} essential tools`);
    return tools;
  }


  /**
   * Transform and combine calendar and family_activities results for schedule queries
   * Creates a unified interface with chronological sorting and conflict resolution
   */
  transformScheduleResults(toolResults, userQuery) {
    console.log(`🔄 TRANSFORM CALLED for query: "${userQuery}"`);
    console.log(`🔄 Tool results count: ${toolResults.length}`);

    // Identify schedule-related queries
    const scheduleKeywords = [
      'schedule', 'weekly schedule', 'this week', 'next week', 'last week',
      'rest of week', 'what\'s going on', 'what is going on', 'whats going on',
      'what\'s happening', 'what is happening', 'whats happening'
    ];

    const isScheduleQuery = scheduleKeywords.some(keyword =>
      userQuery.toLowerCase().includes(keyword.toLowerCase())
    );

    console.log(`🔄 Is schedule query: ${isScheduleQuery}`);

    if (!isScheduleQuery) {
      console.log(`🔄 Not a schedule query, returning original results`);
      return toolResults;
    }

    // Find calendar and family_activities results
    const calendarResult = toolResults.find(result =>
      result.content && this.isCalendarToolResult(result.content)
    );
    const familyActivitiesResult = toolResults.find(result =>
      result.content && this.isFamilyActivitiesToolResult(result.content)
    );

    console.log(`🔄 Found calendar result: ${!!calendarResult}`);
    console.log(`🔄 Found family_activities result: ${!!familyActivitiesResult}`);

    // If we don't have any schedule tools, return original results
    if (!calendarResult && !familyActivitiesResult) {
      console.log(`🔄 No schedule tools found, returning original results`);
      return toolResults;
    }

    try {
      // Parse tool results (handle missing results gracefully)
      const calendarData = calendarResult ? JSON.parse(calendarResult.content) : { success: false, events: [] };
      const familyActivitiesData = familyActivitiesResult ? JSON.parse(familyActivitiesResult.content) : { success: false, activities: [] };

      if (!calendarData.success && !familyActivitiesData.success) {
        console.log(`🔄 Both tools failed, returning original results`);
        return toolResults;
      }

      // Combine the events into unified schedule with formatted template
      const unifiedSchedule = this.createUnifiedSchedule(calendarData, familyActivitiesData);

      // Create new combined result with the formatted template for LLM
      const combinedResult = {
        ...calendarResult,
        content: JSON.stringify({
          success: true,
          action: 'list_events',
          formattedSchedule: unifiedSchedule.formattedSchedule, // Pre-formatted template
          eventCount: unifiedSchedule.eventCount,
          dateRange: unifiedSchedule.dateRange,
          message: 'IMPORTANT: Use the formattedSchedule field exactly as provided. Do not modify its structure or content.'
        })
      };

      // CRITICAL: Must preserve ALL tool_call_ids for LangChain compatibility
      // Instead of removing results, we'll keep the family activities result but mark it as processed
      const processedFamilyResult = familyActivitiesResult ? {
        ...familyActivitiesResult,
        content: JSON.stringify({
          success: true,
          message: 'Family activities have been integrated into the unified schedule above.',
          processed: true
        })
      } : null;

      // Keep all other results unchanged
      const otherResults = toolResults.filter(result =>
        result !== calendarResult && result !== familyActivitiesResult
      );

      console.log(`🔄 Created unified schedule with ${unifiedSchedule.events.length} total events`);
      console.log(`🔄 Preserving all tool_call_ids for LangChain compatibility`);

      // Return all results, ensuring every tool_call_id has a response
      const finalResults = [...otherResults, combinedResult];
      if (processedFamilyResult) {
        finalResults.push(processedFamilyResult);
      }

      return finalResults;

    } catch (error) {
      console.error(`🔄 Error transforming schedule results:`, error);
      return toolResults;
    }
  }

  /**
   * Check if tool result is from Google Calendar
   */
  isCalendarToolResult(content) {
    try {
      const data = JSON.parse(content);
      return data.action === 'list_events' || (data.events && Array.isArray(data.events) && data.events[0]?.title);
    } catch {
      return false;
    }
  }

  /**
   * Check if tool result is from family activities
   */
  isFamilyActivitiesToolResult(content) {
    try {
      const data = JSON.parse(content);
      return data.source === 'family_activities' || (data.activities && Array.isArray(data.activities));
    } catch {
      return false;
    }
  }

  /**
   * Create formatted schedule template combining calendar events and family activities
   * Returns a pre-formatted string that the LLM can incorporate directly
   */
  createUnifiedSchedule(calendarData, familyActivitiesData) {
    const unifiedEvents = [];

    // Process Google Calendar events (higher priority for conflicts)
    if (calendarData.success && calendarData.events) {
      calendarData.events.forEach(event => {
        unifiedEvents.push({
          id: `calendar_${event.id}`,
          title: event.title,
          type: 'calendar_event',
          source: 'Google Calendar',
          startTime: event.start,
          endTime: event.end,
          location: event.location,
          description: event.description,
          allDay: event.allDay,
          attendees: event.attendees,
          priority: 'high',
          original: event
        });
      });
    }

    // Process Family Activities (lower priority, no conflicts with calendar)
    if (familyActivitiesData.success && familyActivitiesData.activities) {
      familyActivitiesData.activities.forEach(activity => {
        // Skip if conflicts with calendar event (same time/date)
        const hasConflict = unifiedEvents.some(event =>
          this.eventsConflict(event, activity)
        );

        if (!hasConflict || !activity.occurrence_date) {
          unifiedEvents.push({
            id: `activity_${activity.id}`,
            title: activity.name,
            type: 'family_activity',
            source: 'Family Activities',
            startTime: activity.occurrence_date,
            endTime: activity.occurrence_date,
            location: activity.location,
            description: activity.schedule_details || activity.frequency,
            allDay: false,
            member: activity.member,
            family_relationship: activity.family_relationship,
            activity_type: activity.type,
            priority: 'medium',
            recurrence: activity.is_recurring ? {
              days: activity.days,
              frequency: activity.frequency
            } : null,
            original: activity
          });
        }
      });
    }

    // Sort chronologically by start time
    unifiedEvents.sort((a, b) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return dateA - dateB;
    });

    // Create formatted template that LLM will incorporate as-is
    const dateRange = calendarData.dateRange || this.getDateRangeFromEvents(unifiedEvents);
    const formattedTemplate = this.createScheduleTemplate(unifiedEvents, dateRange);

    console.log(`📋 Schedule template created with ${unifiedEvents.length} events`);
    console.log(`📋 Template preview:`, formattedTemplate.substring(0, 200) + '...');

    // Return a calendar-like structure but with the formatted template as the main content
    const result = {
      success: true,
      action: 'list_events',
      query: calendarData.query || familyActivitiesData.query,
      dateRange: dateRange,
      eventCount: unifiedEvents.length,
      formattedSchedule: formattedTemplate, // This is the key - pre-formatted template
      events: unifiedEvents // Keep raw data for any other processing needs
    };

    return result;
  }

  /**
   * Create a formatted schedule template that preserves structure and includes source icons
   */
  createScheduleTemplate(events, dateRange) {
    if (events.length === 0) {
      return 'No events scheduled for this period.';
    }

    let template = `Here's your schedule for ${dateRange}:\n\n`;

    events.forEach((event, index) => {
      const num = index + 1;
      const sourceIcon = event.source === 'Google Calendar' ? '📅' : '🏃‍♀️';
      const title = event.title;

      template += `${num}. ${title}\n`;

      // Add event details
      if (event.startTime) {
        const date = new Date(event.startTime);
        const dateStr = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        });
        template += `   - **Date**: ${dateStr}\n`;

        if (!event.allDay && event.startTime) {
          const timeStr = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
          });
          template += `   - **Time**: ${timeStr}\n`;
        }
      }

      if (event.allDay) {
        template += `   - All Day Event\n`;
      }

      if (event.location) {
        template += `   - **Location**: ${event.location}\n`;
      }

      if (event.description) {
        template += `   - **Details**: ${event.description}\n`;
      }

      // Add source attribution
      template += `   - **Source**: ${event.source}\n\n`;
    });

    return template;
  }

  /**
   * Get date range from events if not provided
   */
  getDateRangeFromEvents(events) {
    if (events.length === 0) return 'this period';

    const dates = events
      .map(e => new Date(e.startTime))
      .filter(d => !isNaN(d))
      .sort((a, b) => a - b);

    if (dates.length === 0) return 'this period';

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];

    if (startDate.toDateString() === endDate.toDateString()) {
      return startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
    }

    return `${startDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    })} - ${endDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    })}`;
  }

  /**
   * COMPREHENSIVE INTENT DETECTION SYSTEM
   *
   * Architecture: Priority-based detection with multiple fallback layers
   *
   * PRIORITY ORDER:
   * 1. Exact Match (common-prompts.json) - Instant, 0ms
   * 2. Pattern Match (with variables) - Fast, ~5ms
   * 3. Fuzzy Pattern Match - Medium, ~10ms
   * 4. LLM Classification - Slow, ~500ms
   *
   * PROS:
   * - 80% of queries resolved instantly with exact matches
   * - Variable support for dynamic content ({name}, {subject})
   * - Graceful degradation to LLM for complex cases
   * - Type-safe configuration with proper API parameters
   * - Easy to extend without code changes
   *
   * CONS:
   * - Requires maintenance of common-prompts.json
   * - Static patterns may miss edge cases
   * - Variable extraction can be imperfect
   */
  async detectIntents(prompt) {
    console.log('🧠 INTENT DETECTION: Starting priority-based analysis');

    // Step 0: Normalize input (lowercase, trim, remove extra punctuation)
    const normalizedPrompt = this.normalizePrompt(prompt);
    console.log(`🧠 Normalized: "${prompt}" → "${normalizedPrompt}"`);

    // Check all common prompt patterns in priority order
    const match = this.checkAllPatterns(normalizedPrompt);
    if (match) {
      console.log(`✅ ${match.method.toUpperCase()} MATCH FOUND:`, match);
      return match;
    }

    // Fallback to LLM classification
    console.log('🤖 No predefined match found, using LLM classification');
    return await this.classifyWithLLM(normalizedPrompt);
  }

  /**
   * Check all pattern types in priority order (exact -> pattern -> fuzzy)
   */
  checkAllPatterns(normalizedPrompt) {
    if (!this.commonPrompts) return null;

    // Priority 1: Exact matches
    const exactPatterns = this.commonPrompts.exact_matches || {};
    if (exactPatterns[normalizedPrompt]) {
      return { ...exactPatterns[normalizedPrompt], method: 'exact' };
    }

    // Priority 2: Pattern matches with variables
    const patternMatch = this.checkPatternMatch(normalizedPrompt);
    if (patternMatch) {
      return patternMatch;
    }

    // Priority 3: Fuzzy matches
    const fuzzyPatterns = this.commonPrompts.fuzzy_patterns || [];
    for (const fuzzyPattern of fuzzyPatterns) {
      if (this.fuzzyMatch(normalizedPrompt, fuzzyPattern.keywords)) {
        return { ...fuzzyPattern, method: 'fuzzy' };
      }
    }

    return null;
  }

  /**
   * PROMPT NORMALIZATION
   *
   * Purpose: Standardize user input for consistent matching
   * - Lowercase for case-insensitive matching
   * - Remove extra punctuation (? ! ...)
   * - Trim whitespace
   * - Handle common contractions
   */
  normalizePrompt(prompt) {
    return prompt
      .toLowerCase()
      .trim()
      .replace(/[?!.]+$/, '') // Remove trailing punctuation
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .replace(/what's/g, 'what is')
      .replace(/that's/g, 'that is')
      .replace(/we're/g, 'we are')
      .replace(/i'm/g, 'i am');
  }

  /**
   * EXACT MATCH CHECKER
   *
   * Purpose: O(1) lookup for common queries
   * Handles both simple tool arrays and complex parameter objects
   */
  checkExactMatch(normalizedPrompt) {
    if (!this.commonPrompts?.exact_matches) return null;

    const match = this.commonPrompts.exact_matches[normalizedPrompt];
    if (!match) return null;

    // Handle simple tool array format: ["calendar", "gmail"]
    if (Array.isArray(match)) {
      return {
        intents: match.map(tool => ({ tool, confidence: 'perfect', method: 'exact' })),
        tools: match,
        params: {},
        confidence: 'perfect',
        method: 'exact_match'
      };
    }

    // Handle complex parameter format
    return {
      intents: match.tools.map(tool => ({ tool, confidence: 'perfect', method: 'exact' })),
      tools: match.tools,
      params: match.params || {},
      confidence: 'perfect',
      method: 'exact_match',
      response_template: match.response_template,
      bypass_llm: match.bypass_llm
    };
  }

  /**
   * PATTERN MATCH CHECKER WITH VARIABLE EXTRACTION
   *
   * Purpose: Handle queries with variables like {name}, {subject}, {number}
   * Examples: "did {name} email me" → "did mike email me"
   */
  checkPatternMatch(normalizedPrompt) {
    console.log(`🔍 checkPatternMatch called with: "${normalizedPrompt}"`);
    if (!this.commonPrompts?.pattern_matches) {
      console.log(`❌ No pattern_matches found in commonPrompts`);
      return null;
    }
    console.log(`🔍 Found ${Object.keys(this.commonPrompts.pattern_matches).length} patterns to check`);

    for (const [pattern, config] of Object.entries(this.commonPrompts.pattern_matches)) {
      const extractedVars = this.extractVariables(pattern, normalizedPrompt);

      if (extractedVars) {
        console.log(`🎯 Pattern "${pattern}" matched with variables:`, extractedVars);

        // Substitute variables in parameters
        const resolvedParams = this.substituteVariables(config.params, extractedVars);

        // Substitute variables in query field as well
        let resolvedQuery = config.query;
        if (resolvedQuery && extractedVars) {
          resolvedQuery = resolvedQuery.replace(/\{([^}]+)\}/g, (match, varName) => {
            return extractedVars[varName] || match;
          });
          console.log(`🎯 Query variable substitution: "${config.query}" → "${resolvedQuery}"`);
        }

        return {
          intents: config.tools.map(tool => ({ tool, confidence: 'high', method: 'pattern' })),
          tools: config.tools,
          params: resolvedParams,
          query: resolvedQuery,
          variables: extractedVars,
          pattern: pattern,
          confidence: 'high',
          method: 'pattern_match',
          response_template: config.response_template,
          bypass_llm: config.bypass_llm,
          dateRange: config.dateRange
        };
      }
    }

    return null;
  }

  /**
   * VARIABLE EXTRACTION FROM PATTERNS
   *
   * Purpose: Extract variables from user input using pattern templates
   * Pattern: "did {name} email me"
   * Input: "did mike email me"
   * Output: { name: "mike" }
   */
  extractVariables(pattern, input) {
    // Convert pattern to regex: "did {name} email me" → /^did ([a-zA-Z0-9]+) email me$/
    const regexPattern = pattern
      .replace(/\{name\}/g, '([a-zA-Z0-9]+)')        // Names: letters/numbers
      .replace(/\{subject\}/g, '([a-zA-Z0-9 ]+)')    // Subjects: letters/numbers/spaces
      .replace(/\{number\}/g, '(\\d+)')              // Numbers: digits only
      .replace(/\{([^}]+)\}/g, '([a-zA-Z0-9 ]+)');   // Generic: letters/numbers/spaces

    const regex = new RegExp(`^${regexPattern}$`, 'i');
    const match = input.match(regex);

    if (!match) return null;

    // Extract variable names from pattern
    const variableNames = [];
    const varMatches = pattern.match(/\{([^}]+)\}/g);
    if (varMatches) {
      varMatches.forEach(varMatch => {
        const varName = varMatch.slice(1, -1); // Remove { and }
        variableNames.push(varName);
      });
    }

    // Map captured groups to variable names
    const variables = {};
    for (let i = 0; i < variableNames.length && i < match.length - 1; i++) {
      variables[variableNames[i]] = match[i + 1];
    }

    return Object.keys(variables).length > 0 ? variables : null;
  }

  /**
   * VARIABLE SUBSTITUTION IN PARAMETERS
   *
   * Purpose: Replace {variable} placeholders in tool parameters with actual values
   * Input: { gmail: { query: "from:{name}" } }, { name: "mike" }
   * Output: { gmail: { query: "from:mike" } }
   */
  substituteVariables(params, variables) {
    const resolved = JSON.parse(JSON.stringify(params)); // Deep clone

    function substitute(obj) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          // Replace all {variable} patterns in the string
          obj[key] = value.replace(/\{([^}]+)\}/g, (match, varName) => {
            return variables[varName] || match; // Use variable value or keep original
          });
        } else if (typeof value === 'object' && value !== null) {
          substitute(value); // Recursively process nested objects
        }
      }
    }

    substitute(resolved);
    return resolved;
  }

  /**
   * FUZZY PATTERN MATCHING
   *
   * Purpose: Handle variations and partial matches using regex patterns
   * Lower confidence than exact/pattern matches
   */
  checkFuzzyMatch(normalizedPrompt) {
    // This would use the fuzzy_patterns from common-prompts.json
    // For now, return null to skip to LLM classification
    return null;
  }

  /**
   * Check if a prompt matches keywords using fuzzy logic
   */
  fuzzyMatch(prompt, keywords) {
    if (!keywords || !Array.isArray(keywords)) return false;

    const promptLower = prompt.toLowerCase();

    // Check if any of the keywords appear in the prompt
    return keywords.some(keyword => {
      const keywordLower = keyword.toLowerCase();
      return promptLower.includes(keywordLower);
    });
  }

  /**
   * LLM-BASED INTENT CLASSIFICATION (Fallback)
   *
   * Purpose: Handle complex queries that don't match predefined patterns
   * Only called when all other methods fail
   */
  async classifyWithLLM(normalizedPrompt) {
    console.log('🚨 LLM CLASSIFICATION CALLED with prompt:', normalizedPrompt);
    try {
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.1,
        // Force using node-fetch to avoid undici cookies issue
        configuration: {
          fetch: (await import('node-fetch')).default
        }
      });

      const classificationPrompt = `
Analyze this user prompt and return intent information in JSON format.

Available tools: calendar, gmail_search, family_activities, agent_memory_search, event_scheduling, conversational_llm

User prompt: "${normalizedPrompt}"

Current date context: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

TOOL USAGE GUIDELINES:
- Use "event_scheduling" for creating NEW events, scheduling meetings, or planning future activities
- Use "calendar" for viewing EXISTING events, checking availability, or "what's happening" queries
- Use "gmail_search" only for specific email lookup requests (e.g., "emails from John", "recent emails about project")
- Use "family_activities" ONLY for factual data retrieval from existing activity databases (NOT for brainstorming or ideas)
- Use "agent_memory_search" only for recalling specific stored information

CONVERSATIONAL RESPONSES (USE conversational_llm TOOL):
- General conversation: "family life is hard", emotional support, casual chat
- ALL brainstorming and idea requests: "what are some good ideas", "suggestions for activities", "recommendations", "ideas for what to do", "what should we do"
- Opinion requests: "what do you think", "how should I handle", advice seeking
- Open-ended questions requiring reasoning or creativity
- ANY request asking for suggestions, ideas, or recommendations

CRITICAL: If user asks for "ideas", "suggestions", "what to do", "recommendations" - ALWAYS use conversational_llm tool, NEVER family_activities.

Be VERY conservative with other tool usage. When in doubt, use conversational_llm tool.

If creating/scheduling, you MUST include: "bypass_llm": true and "response_template": {"type": "structured_data", "template_name": "event_scheduling", "title": "appropriate title"}

Return ONLY the JSON object - no markdown formatting, no explanations:
${JSON.stringify(this.llmSchema, null, 2)}

Only include tools for specific, actionable requests. For general conversation, brainstorming, or advice, use ["conversational_llm"].`;

      const response = await llm.invoke([
        { role: 'user', content: classificationPrompt }
      ]);

      // Clean up the response content - remove markdown formatting if present
      let cleanContent = response.content.trim();
      console.log('🔧 DEBUG: Raw LLM response:', JSON.stringify(response.content));

      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        console.log('🔧 DEBUG: Cleaned content after removing markdown:', JSON.stringify(cleanContent));
      }

      console.log('🔧 DEBUG: Final content to parse:', JSON.stringify(cleanContent));
      const result = JSON.parse(cleanContent);
      result.confidence = 'medium';
      result.method = 'llm_fallback';

      console.log('🤖 LLM Classification result:', result);
      return result;

    } catch (error) {
      console.error('🤖 LLM Classification failed:', error);

      // Ultimate fallback - return general intent
      return {
        intents: [{ tool: 'general', confidence: 'low', method: 'fallback' }],
        tools: ['general'],
        params: {},
        confidence: 'low',
        method: 'error_fallback'
      };
    }
  }


  /**
   * Generate structured data response (new unified format)
   */
  async generateStructuredDataResponse(templateConfig, toolResults, query, temporalRange, extractedVariables = {}) {
    console.log('🎯 STRUCTURED DATA: Processing structured template');

    const currentDate = new Date();
    let title = temporalRange
      ? this.replaceDatePlaceholders(templateConfig.title, temporalRange)
      : this.processTemplateWithoutDates(templateConfig.title);

    // Perform variable substitution on the title
    if (extractedVariables && Object.keys(extractedVariables).length > 0) {
      title = title.replace(/\{([^}]+)\}/g, (match, varName) => {
        if (extractedVariables[varName]) {
          console.log(`🎯 STRUCTURED DATA: Title variable substitution: "${match}" → "${extractedVariables[varName]}"`);
          return extractedVariables[varName];
        }
        return match;
      });
    }

    // Build data object with raw tool results
    const data = {};
    const toolsUsed = [];

    toolResults.forEach(result => {
      if (result.success && result.result) {
        const parsedResult = typeof result.result === 'string' ?
          JSON.parse(result.result) : result.result;
        data[result.tool] = parsedResult;
        toolsUsed.push(result.tool);
      }
    });

    const structuredResponse = {
      type: 'structured_data',
      template_name: templateConfig.template_name,
      title: title,
      data: data,
      metadata: {
        query: query,
        timestamp: new Date().toISOString(),
        tools_used: toolsUsed
      }
    };

    console.log('🎯 STRUCTURED DATA: Generated response:', JSON.stringify(structuredResponse, null, 2));
    return JSON.stringify(structuredResponse);
  }


  /**
   * Stream template response with typing effect
   */
  async streamTemplateResponse(response, onChunk) {
    console.log('🎯 STREAMING: Starting template response stream');

    // Split response into words to create realistic typing effect
    const words = response.split(' ');
    let currentChunk = '';

    for (let i = 0; i < words.length; i++) {
      currentChunk += (i > 0 ? ' ' : '') + words[i];

      // Send chunk every few words to create typing effect
      if (i % 3 === 0 || i === words.length - 1) {
        onChunk(currentChunk);

        // Small delay to simulate typing (can be adjusted)
        if (i < words.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        currentChunk = '';
      }
    }

    console.log('🎯 STREAMING: Template response stream completed');
  }

  /**
   * Replace date placeholders in templates
   */
  /**
   * Format temporal range into readable date range
   */
  formatTemporalRange(temporalRange) {
    const startDate = new Date(temporalRange.startDate);
    const endDate = new Date(temporalRange.endDate);
    const phrase = temporalRange.phrase;

    // Handle dynamic day ranges first (can't be done in switch)
    if (phrase.match(/^next_\d+_days$/)) {
      const rangeOptions = { month: 'short', day: 'numeric' };
      const rangeStart = startDate.toLocaleDateString('en-US', rangeOptions);
      const rangeEnd = endDate.toLocaleDateString('en-US', rangeOptions);
      return `${rangeStart} - ${rangeEnd}`;
    }

    switch (phrase) {
      case 'today':
        return startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

      case 'tomorrow':
        return startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

      case 'this_week':
        const thisWeekOptions = { month: 'short', day: 'numeric' };
        const thisWeekStart = startDate.toLocaleDateString('en-US', thisWeekOptions);
        const thisWeekEnd = endDate.toLocaleDateString('en-US', thisWeekOptions);
        return `${thisWeekStart} - ${thisWeekEnd}`;

      case 'next_week':
        const nextWeekOptions = { month: 'short', day: 'numeric' };
        const nextWeekStart = startDate.toLocaleDateString('en-US', nextWeekOptions);
        const nextWeekEnd = endDate.toLocaleDateString('en-US', nextWeekOptions);
        return `${nextWeekStart} - ${nextWeekEnd}`;

      case 'last_week':
        const lastWeekOptions = { month: 'short', day: 'numeric' };
        const lastWeekStart = startDate.toLocaleDateString('en-US', lastWeekOptions);
        const lastWeekEnd = endDate.toLocaleDateString('en-US', lastWeekOptions);
        return `${lastWeekStart} - ${lastWeekEnd}`;

      default:
        // Fallback for any unhandled format
        const defaultOptions = { month: 'short', day: 'numeric' };
        const defaultStart = startDate.toLocaleDateString('en-US', defaultOptions);
        const defaultEnd = endDate.toLocaleDateString('en-US', defaultOptions);
        return `${defaultStart} - ${defaultEnd}`;
    }
  }

  /**
   * Replace date placeholders in templates
   */
  replaceDatePlaceholders(template, temporalRange) {
    let processedTemplate = template;

    // Replace {date_range} placeholder
    const dateRange = this.formatTemporalRange(temporalRange);
    processedTemplate = processedTemplate.replace(/\{date_range\}/g, dateRange);

    // Replace {temporal_phrase} placeholder
    if (temporalRange && temporalRange.phrase) {
      processedTemplate = processedTemplate.replace(/\{temporal_phrase\}/g, temporalRange.phrase);
    }

    return processedTemplate;
  }

  /**
   * Process template without temporal range - removes any date placeholders
   */
  processTemplateWithoutDates(template) {
    let processedTemplate = template;
    // Remove any date placeholders since there's no temporal range
    processedTemplate = processedTemplate.replace(/\{date_range\}/g, '');
    processedTemplate = processedTemplate.replace(/\{temporal_phrase\}/g, '');
    return processedTemplate;
  }

  /**
   * Format tool results for template responses
   */
  formatToolResultsForTemplate(toolResults) {
    console.log('🔧 FORMAT TOOL RESULTS: Starting with toolResults:', JSON.stringify(toolResults, null, 2));

    if (!toolResults || toolResults.length === 0) {
      console.log('🔧 FORMAT TOOL RESULTS: No tool results or empty array');
      return '';
    }

    let formattedContent = '';
    toolResults.forEach((result, index) => {
      console.log(`🔧 FORMAT TOOL RESULTS: Processing result ${index + 1}:`, {
        tool: result.tool,
        success: result.success,
        hasResult: !!result.result,
        resultType: typeof result.result,
        resultLength: result.result?.length || 'N/A'
      });

      if (!result.success) {
        console.log(`🔧 FORMAT TOOL RESULTS: Skipping ${result.tool} - not successful`);
        return;
      }

      if (!result.result) {
        console.log(`🔧 FORMAT TOOL RESULTS: Skipping ${result.tool} - no result data`);
        return;
      }

      try {
        // Determine if result is JSON or plain text
        let parsedResult;
        let isJsonResult = false;

        if (typeof result.result === 'string') {
          // Check if the string looks like JSON (starts with { or [)
          const trimmed = result.result.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            parsedResult = JSON.parse(result.result);
            isJsonResult = true;
            console.log(`🔧 FORMAT TOOL RESULTS: Parsed JSON result for ${result.tool}:`, JSON.stringify(parsedResult, null, 2));
          } else {
            // Plain text result (like conversational_llm)
            parsedResult = result.result;
            console.log(`🔧 FORMAT TOOL RESULTS: Plain text result for ${result.tool} (${result.result.length} chars)`);
          }
        } else {
          parsedResult = result.result;
          isJsonResult = true;
          console.log(`🔧 FORMAT TOOL RESULTS: Object result for ${result.tool}:`, JSON.stringify(parsedResult, null, 2));
        }

        let toolContent = '';

        if (!isJsonResult) {
          // Handle plain text results (like conversational_llm)
          toolContent = parsedResult;
          console.log(`🔧 FORMAT TOOL RESULTS: Using plain text result for ${result.tool} (${toolContent.length} chars)`);
        } else if (result.tool === 'calendar') {
          // Extract events array from the result
          const events = parsedResult.events || [];
          console.log(`🔧 FORMAT TOOL RESULTS: Calendar events array length:`, events.length);
          toolContent = this.formatCalendarEvents(events);
          console.log(`🔧 FORMAT TOOL RESULTS: Calendar formatted content length:`, toolContent.length);
        } else if (result.tool === 'family_activities') {
          // Extract activities array from the result
          const activities = parsedResult.activities || [];
          console.log(`🔧 FORMAT TOOL RESULTS: Family activities array length:`, activities.length);
          toolContent = this.formatFamilyActivities(activities);
          console.log(`🔧 FORMAT TOOL RESULTS: Family activities formatted content length:`, toolContent.length);
        } else if (result.tool === 'gmail') {
          toolContent = this.formatEmailResults(parsedResult);
          console.log(`🔧 FORMAT TOOL RESULTS: Gmail formatted content length:`, toolContent.length);
        } else if (result.tool === 'agent_memory') {
          toolContent = this.formatAgentMemoryResults(parsedResult);
          console.log(`🔧 FORMAT TOOL RESULTS: Agent memory formatted content length:`, toolContent.length);
        } else {
          console.log(`🔧 FORMAT TOOL RESULTS: Unknown tool type: ${result.tool}`);
        }

        formattedContent += toolContent;
        console.log(`🔧 FORMAT TOOL RESULTS: Total formatted content length so far:`, formattedContent.length);
      } catch (error) {
        console.error(`❌ Error formatting ${result.tool} results:`, error);
      }
    });

    console.log('🔧 FORMAT TOOL RESULTS: Final formatted content:', formattedContent);
    return formattedContent.trim();
  }

  /**
   * Format calendar events for template
   */
  formatCalendarEvents(events) {
    if (!events || !Array.isArray(events) || events.length === 0) return '';

    let content = '';
    events.forEach((event, index) => {
      content += `${index + 1}. **${event.summary || event.title}**\n`;
      if (event.startTime) {
        const eventDate = new Date(event.startTime);
        content += `   - **Date**: ${eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n`;
        content += `   - **Time**: ${eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}\n`;
      }
      if (event.location) content += `   - **Location**: ${event.location}\n`;
      content += `   - Source: Google Calendar\n\n`;
    });
    return content;
  }

  /**
   * Format family activities for template
   */
  formatFamilyActivities(activities) {
    if (!activities || !Array.isArray(activities) || activities.length === 0) return '';

    let content = '';
    activities.forEach((activity, index) => {
      content += `${index + 1}. **${activity.name}**\n`;
      if (activity.occurrence_date) {
        const activityDate = new Date(activity.occurrence_date);
        content += `   - **Date**: ${activityDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n`;
      }
      if (activity.time) content += `   - **Time**: ${activity.time}\n`;
      if (activity.location) content += `   - **Location**: ${activity.location}\n`;
      if (activity.type) content += `   - **Type**: ${activity.type}\n`;
      content += `   - Source: Family Activities\n\n`;
    });
    return content;
  }

  /**
   * Format email results for template
   */
  formatEmailResults(emails) {
    if (!emails || !Array.isArray(emails) || emails.length === 0) return '';

    let content = '';
    emails.forEach((email, index) => {
      content += `${index + 1}. **${email.subject}**\n`;
      content += `   - **From**: ${email.from}\n`;
      if (email.date) {
        const emailDate = new Date(email.date);
        content += `   - **Date**: ${emailDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n`;
      }
      if (email.snippet) content += `   - **Preview**: ${email.snippet.substring(0, 100)}...\n`;
      content += `   - Source: Gmail\n\n`;
    });
    return content;
  }

  /**
   * Format agent memory results for template
   */
  formatAgentMemoryResults(memories) {
    if (!memories || !Array.isArray(memories) || memories.length === 0) return '';

    let content = '';
    memories.forEach((memory, index) => {
      content += `${index + 1}. **${memory.content}**\n`;
      if (memory.type) content += `   - **Type**: ${memory.type}\n`;
      if (memory.context) content += `   - **Context**: ${memory.context}\n`;
      content += `   - Source: Agent Memory\n\n`;
    });
    return content;
  }

  /**
   * PARSE TIME RANGE FROM PROMPT AND EXECUTE INTENT TOOLS
   * Returns both tool results and the calculated temporal range for template usage
   */
  async executeIntentToolsWithTimeRange(detectedIntents, userId, query, userTimezone, onToolStart, onToolComplete) {
    const results = [];
    const healthMonitor = getHealthMonitor();
    const intents = Array.isArray(detectedIntents) ? detectedIntents : [detectedIntents];

    // Calculate temporal range once for all tools, but only if dateRange is specified
    let temporalRange = null;
    const firstIntent = intents[0];
    // Check for temporal data in both individual intents and the root detectedIntents object
    const shouldCalculateTemporal = (firstIntent?.dateRange !== undefined && firstIntent?.dateRange !== null) ||
                                    (firstIntent?.temporal !== undefined && firstIntent?.temporal !== null) ||
                                    (detectedIntents?.temporal !== undefined && detectedIntents?.temporal !== null);
    console.log(`🔧 DEBUG: shouldCalculateTemporal = ${shouldCalculateTemporal}, dateRange = ${firstIntent?.dateRange}, temporal = ${firstIntent?.temporal ? 'present' : 'null'}, rootTemporal = ${detectedIntents?.temporal ? 'present' : 'null'}`);

    if (shouldCalculateTemporal) {
      try {
        // Check if LLM classification already provided temporal data (for better range handling)
        if (firstIntent?.method === 'llm_fallback' && firstIntent?.temporal) {
          const llmTemporal = firstIntent.temporal;
          if (llmTemporal.startDate && llmTemporal.endDate) {
            // Create timezone-aware dates like TemporalParsingService does
            // Convert YYYY-MM-DD format to local time instead of UTC
            const startDate = new Date(llmTemporal.startDate + 'T00:00:00');
            const endDate = new Date(llmTemporal.endDate + 'T23:59:59.999');

            temporalRange = {
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
              phrase: llmTemporal.phrase || 'LLM provided range',
              source: 'llm_classification'
            };
            console.log(`🕒 Using LLM temporal range: ${temporalRange.phrase} → ${TemporalParsingService.formatDate(startDate)} to ${TemporalParsingService.formatDate(endDate)}`);
          }
        }

        // Fallback to TemporalParsingService if no LLM temporal data available
        if (!temporalRange) {
          const temporal = await TemporalParsingService.parseTemporalQuery(query, new Date(), userTimezone);
          if (temporal && temporal.startDate && temporal.endDate) {
            temporalRange = {
              startDate: temporal.startDate.toISOString(),
              endDate: temporal.endDate.toISOString(),
              phrase: temporal.phrase,
              source: temporal.source
            };
            console.log(`🕒 Calculated temporal range once: ${temporal.phrase} → ${TemporalParsingService.formatDate(temporal.startDate)} to ${TemporalParsingService.formatDate(temporal.endDate)}`);
          }
        }
      } catch (error) {
        console.warn('🕒 Failed to parse temporal context:', error.message);
      }
    } else {
      console.log(`🕒 Skipping temporal range calculation - no dateRange specified for intent`);
    }

    // Create available tools for intent execution
    const availableTools = this.createLangChainTools(userId);

    // Debug: Log all available tools and their names
    console.log('🔍 DEBUG: Available tools:', availableTools.map(t => ({ name: t.name, type: typeof t })));

    for (const intentResult of intents) {
      if (!intentResult || !intentResult.tools) continue;

      console.log('🔍 DEBUG: Intent result tools needed:', intentResult.tools);

      for (const toolName of intentResult.tools) {
        console.log(`🔍 DEBUG: Looking for tool "${toolName}" in available tools`);
        const tool = availableTools.find(t => t.name === toolName);
        if (!tool) {
          console.log(`⚠️ Tool ${toolName} not found in available tools`);
          console.log(`⚠️ Available tool names: [${availableTools.map(t => `"${t.name}"`).join(', ')}]`);
          continue;
        }

        const startTime = Date.now();
        let success = false;
        let error = null;
        let result = null;
        let toolParams = {};

        try {
          toolParams = intentResult.params?.[toolName] || {};
          console.log(`🔧 Executing ${toolName} with params:`, toolParams);
          console.log(`🔧 Tool ${toolName} userId:`, tool.userId);
          onToolStart(this.getToolDisplayName(toolName), toolParams);

          // Use config query if available, otherwise fall back to user query
          const configQuery = intentResult?.query !== undefined ? intentResult.query : query;
          console.log(`🔧 Intent query: "${intentResult?.query}", User query: "${query}", Using: "${configQuery}"`);
          const enhancedArgs = { ...toolParams, query: configQuery, temporalRange };
          console.log(`🔧 Enhanced args for ${toolName}:`, enhancedArgs);
          result = await tool._call(enhancedArgs);
          console.log(`🔧 ${toolName} returned result:`, result);
          success = true;

          onToolComplete(this.getToolDisplayName(toolName), result);
          results.push({
            tool: toolName,
            success: true,
            result,
            params: enhancedArgs
          });

        } catch (err) {
          error = err;
          success = false;
          result = JSON.stringify({ error: err.message });

          console.error(`❌ Tool ${toolName} failed:`, err);
          onToolComplete(this.getToolDisplayName(toolName), `Error: ${err.message}`);
          results.push({
            tool: toolName,
            success: false,
            error: err.message,
            params: toolParams
          });
        }

        const executionTime = Date.now() - startTime;
        await healthMonitor.logExecution({
          toolName: toolName,
          toolCallId: `intent-${Date.now()}`,
          userId: userId,
          success,
          executionTimeMs: executionTime,
          errorType: error ? healthMonitor.categorizeError(error) : null,
          errorMessage: error ? error.message : null,
          errorDetails: error ? { stack: error.stack } : null,
          queryContext: query.trim(),
          toolInput: toolParams,
          responseSize: result ? result.length : null
        });
      }
    }

    return { toolResults: results, temporalRange };
  }

  /**
   * Check if two events conflict (same date/time)
   */
  eventsConflict(calendarEvent, familyActivity) {
    if (!calendarEvent.startTime || !familyActivity.occurrence_date) {
      return false;
    }

    try {
      const calendarDate = new Date(calendarEvent.startTime).toDateString();
      const activityDate = new Date(familyActivity.occurrence_date).toDateString();

      // Simple date conflict check - same day
      return calendarDate === activityDate;
    } catch {
      return false;
    }
  }
}

export default StreamingIntelligentChatOrchestrator;