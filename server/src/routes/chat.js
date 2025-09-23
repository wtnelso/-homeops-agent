/**
 * Chat API Routes for Express Server
 *
 * LangChain-powered chat system with intelligent tool selection.
 * Moved from Vercel serverless functions for better local development and testing.
 */

import express from 'express';
import { neon } from '@neondatabase/serverless';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import {
  CONVERSATION_CONFIG,
  CONTEXT_PATTERNS,
  OPENAI_CONFIG,
  SYSTEM_PROMPTS,
  TOOLS_CONFIG
} from '../config/chatConfig.js';
import { GmailSearchTool } from '../tools/gmailSearchTool.js';
import { SemanticSearchTool } from '../tools/semanticSearchTool.js';
import AgentMemoryService from '../services/agentMemoryService.js';
import IntelligentChatOrchestrator from '../services/intelligentChatOrchestrator.js';

const router = express.Router();

// Estimate token count for messages
function estimateTokens(text) {
  return Math.ceil(text.length / CONVERSATION_CONFIG.TOKEN_ESTIMATION_FACTOR);
}

// Create LangChain tools for the chat system
function createChatTools(accountId, supabaseUrl, supabaseServiceKey, openaiApiKey) {
  const tools = [];

  // Add Gmail search tool if enabled
  if (TOOLS_CONFIG.gmail.enabled) {
    tools.push(new GmailSearchTool({ accountId }));
  }

  // Add semantic search tool if enabled
  if (TOOLS_CONFIG.semantic_search.enabled) {
    tools.push(new SemanticSearchTool({
      accountId,
      supabaseUrl,
      supabaseServiceKey,
      openaiApiKey
    }));
  }

  // Future: Add Google Calendar tool when implemented
  // if (TOOLS_CONFIG.calendar.enabled) {
  //   tools.push(new GoogleCalendarTool({ accountId }));
  // }

  console.log(`🔧 Initialized ${tools.length} LangChain tools for account ${accountId}`);
  return tools;
}

// Get conversation summary from database or generate new one
async function getConversationSummary(conversationId, sql, llm) {
  try {
    // Check if we already have a summary
    const existingSummary = await sql`
      SELECT metadata FROM conversations
      WHERE id = ${conversationId}
    `;

    const metadata = existingSummary[0]?.metadata || {};
    if (metadata.summary && metadata.summary_generated_at) {
      const summaryAge = Date.now() - new Date(metadata.summary_generated_at).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (summaryAge < maxAge) {
        console.log('📋 Using existing conversation summary');
        return metadata.summary;
      }
    }

    // Generate new summary
    console.log('🤖 Generating conversation summary');
    const olderMessages = await sql`
      SELECT content, role FROM messages
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
      LIMIT 30
    `;

    if (olderMessages.length < 5) {
      return null; // Not enough content to summarize
    }

    const conversationText = olderMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const summaryResponse = await llm.invoke([
      new SystemMessage(SYSTEM_PROMPTS.SUMMARY_PROMPT),
      new HumanMessage(conversationText)
    ]);

    const summary = summaryResponse.content.substring(0, CONVERSATION_CONFIG.SUMMARY_MAX_LENGTH);

    // Save summary to conversation metadata
    await sql`
      UPDATE conversations
      SET metadata = ${JSON.stringify({
        ...metadata,
        summary,
        summary_generated_at: new Date().toISOString()
      })}
      WHERE id = ${conversationId}
    `;

    return summary;

  } catch (error) {
    console.error('Summary generation failed:', error);
    return null;
  }
}

// Get optimized conversation context
async function getOptimizedContext(conversationId, sql, llm) {
  // Get total message count
  const totalMessages = await sql`
    SELECT COUNT(*) as count FROM messages
    WHERE conversation_id = ${conversationId}
  `;

  const messageCount = parseInt(totalMessages[0].count);

  // Get recent messages
  const recentMessages = await sql`
    SELECT * FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at DESC
    LIMIT ${CONVERSATION_CONFIG.MAX_RECENT_MESSAGES}
  `;

  // Reverse to chronological order
  recentMessages.reverse();

  let context = {
    messages: recentMessages,
    summary: null,
    totalMessages: messageCount,
    estimatedTokens: 0
  };

  // Calculate estimated tokens for recent messages
  context.estimatedTokens = recentMessages.reduce((total, msg) => {
    return total + estimateTokens(msg.content);
  }, 0);

  // Get summary for long conversations
  if (messageCount > CONVERSATION_CONFIG.SUMMARIZE_AFTER_MESSAGES) {
    const summary = await getConversationSummary(conversationId, sql, llm);
    if (summary) {
      context.summary = summary;
      context.estimatedTokens += estimateTokens(summary);
    }
  }

  console.log(`📊 Context: ${messageCount} total messages, ${recentMessages.length} recent, ~${context.estimatedTokens} tokens`);

  return context;
}

// Chat endpoint
router.post('/', async (req, res) => {
  console.log('🗣️ [CHAT API] Request received:', {
    message: req.body.message?.substring(0, 50) + '...',
    conversationId: req.body.conversationId,
    accountId: req.body.accountId,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
    timestamp: new Date().toISOString()
  });
  try {
    // Debug: Log environment variables (mask sensitive ones)
    console.log('=== CHAT API REQUEST ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('NEON_DATABASE_URL exists:', !!process.env.NEON_DATABASE_URL);
    console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

    // Get environment variables with config defaults
    const neonUrl = process.env.NEON_DATABASE_URL;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const openaiModel = process.env.OPENAI_MODEL || OPENAI_CONFIG.DEFAULT_MODEL;
    const openaiTemperature = parseFloat(process.env.OPENAI_TEMPERATURE || OPENAI_CONFIG.DEFAULT_TEMPERATURE.toString());

    if (!neonUrl || !openaiApiKey) {
      return res.status(500).json({
        error: 'Missing environment variables',
        details: {
          hasNeonUrl: !!neonUrl,
          hasOpenAiKey: !!openaiApiKey
        }
      });
    }

    // Initialize services
    const sql = neon(neonUrl);

    const { message, conversationId, accountId } = req.body;

    if (!message || !accountId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: {
          hasMessage: !!message,
          hasAccountId: !!accountId
        }
      });
    }

    // Initialize agent memory service
    // AgentMemoryService uses static methods

    // Create LangChain tools for the AI agent (now that we have accountId)
    const tools = CONVERSATION_CONFIG.ENABLE_LANGCHAIN_TOOLS
      ? createChatTools(accountId, process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, openaiApiKey)
      : [];

    const llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: openaiModel,
      temperature: openaiTemperature,
    });

    // Bind tools to the language model if available
    const llmWithTools = tools.length > 0 ? llm.bindTools(tools) : llm;

    // Get or create conversation
    let currentConversationId = conversationId;

    if (!currentConversationId) {
      const conversationTitle = message.substring(0, 50).replace(/\n/g, ' ').trim() +
        (message.length > 50 ? '...' : '');

      const newConversationResult = await sql`
        INSERT INTO conversations (account_id, title, metadata, created_at, updated_at)
        VALUES (${accountId}, ${conversationTitle}, ${JSON.stringify({})}, NOW(), NOW())
        RETURNING id
      `;

      currentConversationId = newConversationResult[0].id;
    }

    // Add user message to database
    await sql`
      INSERT INTO messages (conversation_id, role, content, metadata, created_at)
      VALUES (${currentConversationId}, 'user', ${message}, ${JSON.stringify({})}, NOW())
    `;

    // Get optimized conversation context
    const conversationContext = await getOptimizedContext(currentConversationId, sql, llmWithTools);

    // Initialize intelligent chat orchestrator
    const orchestrator = new IntelligentChatOrchestrator();

    // Get combined intelligence context (Agent Memory + Email Analysis + Semantic Search)
    console.log('🧠 Getting combined intelligence context...');
    const combinedIntelligence = await orchestrator.getCombinedContext(
      accountId,
      message,
      currentConversationId
    );

    // Build system prompt with conversation summary and intelligent context
    let systemPrompt = SYSTEM_PROMPTS.BASE_PROMPT;

    // Add conversation summary if available
    if (conversationContext.summary) {
      systemPrompt += `\n\n--- Conversation Summary ---\n${conversationContext.summary}\n--- End Summary ---`;
    }

    // Add intelligent context (combines Agent Memory, Email Analysis, and Semantic Search)
    if (combinedIntelligence.success) {
      systemPrompt += IntelligentChatOrchestrator.formatContextForPrompt(combinedIntelligence);

      // Log intelligence summary for debugging
      console.log('🎯 Intelligence Summary:', JSON.stringify(combinedIntelligence.context.intelligence_summary, null, 2));
    } else {
      console.warn('⚠️ Failed to get combined intelligence, falling back to basic agent memory');
      // Fallback to simple agent memory
      const memoryResult = await AgentMemoryService.getRelevantMemories(accountId, message);
      const relevantMemories = memoryResult.success ? memoryResult.memories : [];
      if (relevantMemories && Object.keys(relevantMemories).length > 0) {
        systemPrompt += AgentMemoryService.formatMemoriesForPrompt(relevantMemories);
      }
    }

    // Warn if conversation is getting very long
    if (conversationContext.totalMessages > CONVERSATION_CONFIG.ARCHIVE_AFTER_MESSAGES) {
      systemPrompt += `\n\nNote: This conversation has ${conversationContext.totalMessages} messages. Consider suggesting the user start a new conversation for better performance.`;
    }

    // Convert messages to LangChain format using optimized context
    const langChainMessages = [
      new SystemMessage(systemPrompt),
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

    // Generate AI response using tools-enabled LLM
    console.log(`🤖 Processing message with ${tools.length} available tools`);
    const aiResponse = await llmWithTools.invoke(langChainMessages);

    let finalContent = aiResponse.content;
    let toolCallsExecuted = 0;

    // Handle tool calls if they exist
    if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
      console.log(`🔧 AI called ${aiResponse.tool_calls.length} tools:`);
      aiResponse.tool_calls.forEach((toolCall, index) => {
        console.log(`   ${index + 1}. Tool: ${toolCall.name}`);
        console.log(`      Args: ${JSON.stringify(toolCall.args)}`);
      });

      // Execute tools and collect results
      const toolResults = [];
      for (const toolCall of aiResponse.tool_calls) {
        try {
          // Find the tool by name
          const tool = tools.find(t => t.name === toolCall.name);
          if (tool) {
            console.log(`🛠️ Executing tool: ${toolCall.name}`);
            const result = await tool._call(toolCall.args);
            toolResults.push({
              tool_call_id: toolCall.id,
              content: result
            });
            toolCallsExecuted++;
            console.log(`✅ Tool ${toolCall.name} completed`);
          } else {
            console.error(`❌ Tool not found: ${toolCall.name}`);
            toolResults.push({
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: `Tool ${toolCall.name} not found` })
            });
          }
        } catch (error) {
          console.error(`❌ Tool execution error for ${toolCall.name}:`, error);
          toolResults.push({
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: error.message })
          });
        }
      }

      // Create a new message sequence with tool results for final response
      const messagesWithToolResults = [
        ...langChainMessages,
        aiResponse, // The original response with tool calls
        ...toolResults.map(result => ({
          role: 'tool',
          content: result.content,
          tool_call_id: result.tool_call_id
        }))
      ];

      // Get final response from LLM after tool execution
      console.log(`🎯 Generating final response with ${toolResults.length} tool results`);
      const finalResponse = await llm.invoke(messagesWithToolResults);
      finalContent = finalResponse.content;

    } else {
      console.log(`💬 AI responded without using tools`);
    }

    // Save AI response to database
    await sql`
      INSERT INTO messages (conversation_id, role, content, metadata, created_at)
      VALUES (${currentConversationId}, 'assistant', ${finalContent}, ${JSON.stringify({
        model: openaiModel,
        temperature: openaiTemperature,
        tools_available: tools.length,
        tools_used: toolCallsExecuted,
        generated_at: new Date().toISOString()
      })}, NOW())
    `;

    // Extract and store memories from user message and AI response
    await AgentMemoryService.extractAndStoreMemories(accountId, currentConversationId, message, 'user');
    await AgentMemoryService.extractAndStoreMemories(accountId, currentConversationId, finalContent, 'assistant');

    // Update conversation metadata with session info
    const updatedMetadata = {
      last_model_used: openaiModel,
      last_temperature: openaiTemperature,
      tools_enabled: tools.length > 0,
      last_tools_used: toolCallsExecuted,
      message_count: conversationContext.totalMessages + 2, // +2 for user message and AI response
      last_response_at: new Date().toISOString()
    };

    await sql`
      UPDATE conversations
      SET updated_at = NOW(),
          metadata = ${JSON.stringify(updatedMetadata)}
      WHERE id = ${currentConversationId}
    `;

    // Get updated messages
    const updatedMessages = await sql`
      SELECT * FROM messages
      WHERE conversation_id = ${currentConversationId}
      ORDER BY created_at ASC
    `;

    return res.status(200).json({
      success: true,
      conversationId: currentConversationId,
      messages: updatedMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        metadata: msg.metadata
      }))
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;