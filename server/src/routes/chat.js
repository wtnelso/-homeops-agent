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
import { AgentMemorySearchTool } from '../tools/agentMemorySearchTool.js';
import { GoogleCalendarTool } from '../tools/googleCalendarTool.js';
import AgentMemoryService from '../services/agentMemoryService.js';
import IntelligentChatOrchestrator from '../services/intelligentChatOrchestrator.js';
import { SmartContextManager } from '../services/smartContextManager.js';
import { inputSanitizer } from '../services/inputSanitizer.js';
import { getHealthMonitor } from '../services/toolHealthMonitor.js';
// Caching removed for simplicity
import { validateJWT, optionalJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Estimate token count for messages
function estimateTokens(text) {
  return Math.ceil(text.length / CONVERSATION_CONFIG.TOKEN_ESTIMATION_FACTOR);
}

// Basic tool result fusion - deduplicates emails by gmail_message_id
function fuseToolResults(toolResults) {
  if (toolResults.length <= 1) return toolResults;

  const emailResults = [];
  const otherResults = [];
  const seenMessageIds = new Set();

  // Separate email tools from others
  toolResults.forEach(result => {
    try {
      const content = JSON.parse(result.content);
      const isEmailTool = content.source === 'gmail_api' ||
                         content.source === 'semantic_search' ||
                         content.source === 'gmail_api_direct';

      if (isEmailTool) {
        emailResults.push({ ...result, parsed_content: content });
      } else {
        otherResults.push(result);
      }
    } catch (error) {
      otherResults.push(result);
    }
  });

  // If no email tools or only one, no fusion needed
  if (emailResults.length <= 1) {
    return toolResults;
  }

  // Deduplicate emails by gmail_message_id
  const fusedEmailResults = [];

  emailResults.forEach(result => {
    const content = result.parsed_content;
    const emails = content.results || [];
    const uniqueEmails = [];

    emails.forEach(email => {
      const messageId = email.gmail_message_id;
      if (messageId && !seenMessageIds.has(messageId)) {
        seenMessageIds.add(messageId);
        uniqueEmails.push(email);
      }
    });

    if (uniqueEmails.length > 0) {
      fusedEmailResults.push({
        ...result,
        content: JSON.stringify({
          ...content,
          results: uniqueEmails,
          fusion_applied: true,
          original_count: emails.length
        })
      });
    }
  });

  return [...fusedEmailResults, ...otherResults];
}

// Create LangChain tools for the chat system
function createChatTools(userId, supabaseUrl, supabaseServiceKey, openaiApiKey, query = '', userContext = {}) {
  const tools = [];

  // Tool registry - simple config-driven approach
  const toolRegistry = {
    gmail: () => new GmailSearchTool({ userId }),
    semantic_search: () => new SemanticSearchTool({ userId, supabaseUrl, supabaseServiceKey, openaiApiKey }),
    agent_memory: () => new AgentMemorySearchTool({ userId }),
    calendar: () => new GoogleCalendarTool({ userId })
  };

  // Smart tool selection with fallback safety
  const selectedTools = selectToolsForQuery(query, userContext);

  // Create selected tools from config
  Object.entries(TOOLS_CONFIG).forEach(([toolKey, config]) => {
    if (config.enabled && toolRegistry[toolKey] && selectedTools.includes(toolKey)) {
      try {
        console.log(`✅ Adding ${toolKey} tool (selected by routing)`);
        tools.push(toolRegistry[toolKey]());
      } catch (error) {
        console.error(`❌ Error adding ${toolKey} tool:`, error);
      }
    }
  });

  console.log(`🧠 Smart routing: "${query.substring(0, 50)}..." → ${tools.length} tools: [${selectedTools.join(', ')}]`);
  return tools;
}

// Smart tool selection with confidence scoring and fallback safety
function selectToolsForQuery(query = '', userContext = {}) {
  if (!query) {
    // No query provided - return all enabled tools
    return Object.keys(TOOLS_CONFIG).filter(key => TOOLS_CONFIG[key].enabled);
  }

  const normalizedQuery = query.toLowerCase();
  const toolScores = {};

  // Always include agent memory (cheap, high value, rarely wrong)
  toolScores.agent_memory = 0.8;

  // Email-related scoring - comprehensive patterns
  const emailPatterns = [
    // Core email terms
    { pattern: /\b(email|inbox|mail|message|gmail|messages|correspondence)\b/, score: 0.9 },
    // Gmail operators (highest priority)
    { pattern: /\b(from:|to:|subject:|after:|before:|has:|is:|label:)\b/, score: 1.0 },
    // Email actions
    { pattern: /\b(send|sent|receive|received|reply|forward|draft|compose)\b/, score: 0.8 },
    // Email states
    { pattern: /\b(unread|read|archive|trash|spam|starred|important)\b/, score: 0.7 },
    // Email content
    { pattern: /\b(attachment|attachments|file|files|document|documents|pdf)\b/, score: 0.7 },
    // Email types
    { pattern: /\b(newsletter|notification|alert|reminder|confirmation|receipt)\b/, score: 0.6 },
    // Search phrases
    { pattern: /\b(find.*email|search.*mail|show.*inbox|check.*messages)\b/, score: 0.9 },
    // Sender/recipient references
    { pattern: /\b(sender|recipient|cc|bcc|mailing list|contact)\b/, score: 0.6 }
  ];

  emailPatterns.forEach(({ pattern, score }) => {
    if (pattern.test(normalizedQuery)) {
      if (pattern.source.includes(':|')) {
        // Gmail operators detected - prioritize Gmail API
        toolScores.gmail = Math.max(toolScores.gmail || 0, score);
        toolScores.semantic_search = Math.max(toolScores.semantic_search || 0, 0.6); // Backup
      } else {
        // Content-based search - prioritize semantic
        toolScores.semantic_search = Math.max(toolScores.semantic_search || 0, score);
        toolScores.gmail = Math.max(toolScores.gmail || 0, score * 0.7); // Backup
      }
    }
  });

  // Calendar-related scoring - comprehensive patterns
  const calendarPatterns = [
    // Core calendar terms
    { pattern: /\b(calendar|schedule|appointment|meeting|event|agenda)\b/, score: 0.9 },
    // Time references
    { pattern: /\b(today|tomorrow|yesterday|tonight|morning|afternoon|evening)\b/, score: 0.7 },
    { pattern: /\b(when|what time|at what time|time|timing|duration)\b/, score: 0.7 },
    // Week/month references
    { pattern: /\b(this week|next week|last week|this month|next month|this year)\b/, score: 0.8 },
    // Day names
    { pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/, score: 0.8 },
    // Calendar actions
    { pattern: /\b(book|reserve|confirm|cancel|reschedule|postpone|move)\b/, score: 0.7 },
    { pattern: /\b(available|free|busy|occupied|blocked|open)\b/, score: 0.7 },
    // Meeting types
    { pattern: /\b(conference|call|video call|zoom|teams|webinar|presentation)\b/, score: 0.6 },
    // Scheduling phrases
    { pattern: /\b(remind|reminder|due|deadline|upcoming|overdue)\b/, score: 0.7 },
    { pattern: /\b(what.*on|what.*scheduled|what.*planned|my.*calendar)\b/, score: 0.8 }
  ];

  calendarPatterns.forEach(({ pattern, score }) => {
    if (pattern.test(normalizedQuery)) {
      toolScores.calendar = Math.max(toolScores.calendar || 0, score);
    }
  });

  // Personal info scoring - comprehensive patterns (boosts agent memory)
  const personalPatterns = [
    // Contact information
    { pattern: /\b(contact|contacts|phone|number|address|email address)\b/, score: 0.9 },
    // Medical professionals
    { pattern: /\b(doctor|dentist|pediatrician|therapist|specialist|physician|nurse)\b/, score: 0.9 },
    { pattern: /\b(medical|health|appointment|checkup|prescription|surgery)\b/, score: 0.7 },
    // Education
    { pattern: /\b(teacher|school|principal|counselor|coach|instructor|tutor)\b/, score: 0.9 },
    { pattern: /\b(class|grade|homework|test|exam|parent conference)\b/, score: 0.6 },
    // Family
    { pattern: /\b(family|spouse|partner|child|children|kid|kids|son|daughter)\b/, score: 0.9 },
    { pattern: /\b(parent|mom|dad|mother|father|sibling|brother|sister)\b/, score: 0.8 },
    { pattern: /\b(grandparent|grandmother|grandfather|aunt|uncle|cousin)\b/, score: 0.8 },
    // Personal queries
    { pattern: /\b(who is|what is|tell me about|information about|details about)\b/, score: 0.8 },
    { pattern: /\b(my|our|his|her|their|family's)\b/, score: 0.6 },
    // Memory and preferences
    { pattern: /\b(remember|remembered|know|preference|preferences|favorite|like)\b/, score: 0.7 },
    { pattern: /\b(birthday|anniversary|age|relationship|relative)\b/, score: 0.8 },
    // Services and providers
    { pattern: /\b(plumber|electrician|mechanic|babysitter|cleaner|contractor)\b/, score: 0.8 }
  ];

  personalPatterns.forEach(({ pattern, score }) => {
    if (pattern.test(normalizedQuery)) {
      toolScores.agent_memory = Math.max(toolScores.agent_memory, score);
    }
  });

  // General search scoring
  const searchPatterns = [
    { pattern: /\b(find|search|look for|looking for|locate|discover)\b/, score: 0.6 },
    { pattern: /\b(show me|tell me|what|where|how|why)\b/, score: 0.5 },
    { pattern: /\b(list|display|get|fetch|retrieve|pull up)\b/, score: 0.5 }
  ];

  searchPatterns.forEach(({ pattern, score }) => {
    if (pattern.test(normalizedQuery)) {
      // Boost semantic search for general search queries
      toolScores.semantic_search = Math.max(toolScores.semantic_search || 0, score);
      toolScores.gmail = Math.max(toolScores.gmail || 0, score * 0.8);
    }
  });

  // Convert scores to selected tools (threshold: 0.5)
  let selectedTools = Object.entries(toolScores)
    .filter(([tool, score]) => score >= 0.5)
    .map(([tool, score]) => tool);

  // Safety fallbacks:

  // 1. If no tools selected, use all enabled tools
  if (selectedTools.length === 0) {
    console.log('🔄 No tools matched query, using all enabled tools');
    return Object.keys(TOOLS_CONFIG).filter(key => TOOLS_CONFIG[key].enabled);
  }

  // 2. If only agent_memory selected, add semantic search as backup
  if (selectedTools.length === 1 && selectedTools[0] === 'agent_memory') {
    selectedTools.push('semantic_search');
    console.log('🔄 Adding semantic_search as backup to agent_memory');
  }

  // 3. Always include semantic search for complex queries (good general fallback)
  if (query.split(' ').length > 5 && !selectedTools.includes('semantic_search')) {
    selectedTools.push('semantic_search');
    console.log('🔄 Adding semantic_search for complex query');
  }

  // 4. Limit to max 3 tools to avoid overwhelming LangChain
  if (selectedTools.length > 3) {
    const scores = selectedTools.map(tool => ({ tool, score: toolScores[tool] }));
    scores.sort((a, b) => b.score - a.score);
    selectedTools = scores.slice(0, 3).map(item => item.tool);
    console.log('🔄 Limited to top 3 tools by confidence score');
  }

  return selectedTools;
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

// Chat endpoint - temporarily using optionalJWT for testing
router.post('/', optionalJWT, async (req, res) => {
  console.log('🔥 CHAT ROUTE HIT! Raw request body:', req.body);
  console.log('🗣️ [CHAT API] Request received:', {
    message: req.body.message?.substring(0, 50) + '...',
    conversationId: req.body.conversationId,
    userId: req.user?.id,
    userEmail: req.user?.email,
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

    const { message, conversationId, userId } = req.body;
    // JWT user ID is only for authentication - don't use for data operations

    if (!message || !userId) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: {
          hasMessage: !!message,
          hasUserId: !!userId
        }
      });
    }

    // Input sanitization for security protection
    console.log('🛡️ Running input sanitization...');
    const sanitizationResult = inputSanitizer.sanitizeInput(message);

    if (sanitizationResult.blocked) {
      console.warn('🚨 Message blocked by security filter:', {
        riskLevel: sanitizationResult.riskLevel,
        warnings: sanitizationResult.warnings,
        userId: userId
      });

      return res.status(400).json({
        error: 'Message blocked for security reasons',
        message: 'Your message appears to contain potentially harmful content. Please rephrase your request.',
        riskLevel: sanitizationResult.riskLevel,
        blocked: true
      });
    }

    if (sanitizationResult.warnings.length > 0) {
      console.warn('⚠️ Security warnings detected:', {
        warnings: sanitizationResult.warnings,
        riskLevel: sanitizationResult.riskLevel,
        userId: userId
      });
    }

    // Use sanitized message for processing
    const sanitizedMessage = sanitizationResult.sanitizedMessage;
    console.log(`🛡️ Input sanitization complete. Risk level: ${sanitizationResult.riskLevel}, Warnings: ${sanitizationResult.warnings.length}`);

    // Get or create conversation first (moved up for caching)
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

    // Process fresh request (caching disabled for simplicity)
    console.log('💬 Processing fresh chat request...');

    // Initialize SmartContextManager for optimized token usage
    const contextManager = new SmartContextManager();

    // Create LangChain tools for the AI agent (now that we have userId)
    const tools = CONVERSATION_CONFIG.ENABLE_LANGCHAIN_TOOLS
      ? createChatTools(userId, process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, openaiApiKey, sanitizedMessage)
      : [];

    const llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: openaiModel,
      temperature: openaiTemperature,
    });

    // Bind tools to the language model if available
    const llmWithTools = tools.length > 0 ? llm.bindTools(tools) : llm;

    // Add user message to database
    await sql`
      INSERT INTO messages (conversation_id, role, content, metadata, created_at)
      VALUES (${currentConversationId}, 'user', ${sanitizedMessage}, ${JSON.stringify({})}, NOW())
    `;

    // Get optimized conversation context using SmartContextManager
    const recentMessages = await sql`
      SELECT * FROM messages
      WHERE conversation_id = ${currentConversationId}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    recentMessages.reverse(); // Chronological order

    const conversationContext = contextManager.optimizeConversationHistory(recentMessages);

    // Get conversation summary for very long conversations (keep existing logic)
    let conversationSummary = null;
    const totalMessages = await sql`
      SELECT COUNT(*) as count FROM messages
      WHERE conversation_id = ${currentConversationId}
    `;
    const messageCount = parseInt(totalMessages[0].count);

    if (messageCount > CONVERSATION_CONFIG.SUMMARIZE_AFTER_MESSAGES) {
      conversationSummary = await getConversationSummary(currentConversationId, sql, llmWithTools);
    }

    // Create optimized system prompt using SmartContextManager
    console.log('🧠 Creating optimized prompt with smart context management...');
    const promptResult = await contextManager.createOptimizedPrompt(userId, sanitizedMessage, SYSTEM_PROMPTS.BASE_PROMPT);

    let systemPrompt = promptResult.prompt;

    // Add conversation summary if available
    if (conversationSummary) {
      systemPrompt += `\n\n--- Conversation Summary ---\n${conversationSummary}\n--- End Summary ---`;
    }

    // Warn if conversation is getting very long
    if (messageCount > CONVERSATION_CONFIG.ARCHIVE_AFTER_MESSAGES) {
      systemPrompt += `\n\nNote: This conversation has ${messageCount} messages. Consider suggesting the user start a new conversation for better performance.`;
    }

    console.log(`🎯 Query categories: ${promptResult.categories.join(', ')}`);
    console.log(`📊 Prompt optimization: ~${promptResult.tokenCount} tokens, ${promptResult.optimization.memoriesUsed} memory types used`);

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
        console.log(`🚨 DEBUG: Tool called was "${toolCall.name}" - is this agent_memory_search?`);
      });

      // Execute tools in parallel for better performance
      console.log(`🚀 Executing ${aiResponse.tool_calls.length} tools in parallel...`);
      const healthMonitor = getHealthMonitor();

      const toolPromises = aiResponse.tool_calls.map(async (toolCall) => {
        const startTime = Date.now();
        let success = false;
        let error = null;
        let result = null;

        try {
          // Find the tool by name
          const tool = tools.find(t => t.name === toolCall.name);
          if (tool) {
            console.log(`🛠️ Starting tool: ${toolCall.name}`);
            result = await tool._call(toolCall.args);
            success = true;
            console.log(`✅ Tool ${toolCall.name} completed`);
          } else {
            error = new Error(`Tool ${toolCall.name} not found`);
            result = JSON.stringify({ error: error.message });
            console.error(`❌ Tool not found: ${toolCall.name}`);
          }
        } catch (err) {
          error = err;
          success = false;
          result = JSON.stringify({ error: err.message });
          console.error(`❌ Tool execution error for ${toolCall.name}:`, err);
        }

        // Log tool execution to health monitor
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
          queryContext: message.trim(),
          toolInput: toolCall.args,
          responseSize: result ? result.length : null
        });

        return {
          tool_call_id: toolCall.id,
          content: result,
          success
        };
      });

      // Wait for all tools to complete in parallel
      const toolResults = await Promise.all(toolPromises);
      toolCallsExecuted = toolResults.filter(result => result.success).length;
      console.log(`🎯 Parallel execution completed: ${toolCallsExecuted}/${aiResponse.tool_calls.length} tools succeeded`);

      // Apply basic tool result fusion for email deduplication
      const fusedResults = fuseToolResults(toolResults);
      console.log(`🔀 Tool fusion: ${toolResults.length} → ${fusedResults.length} results`);

      // Create a new message sequence with tool results for final response
      const messagesWithToolResults = [
        ...langChainMessages,
        aiResponse, // The original response with tool calls
        ...fusedResults.map(result => ({
          role: 'tool',
          content: result.content,
          tool_call_id: result.tool_call_id
        }))
      ];

      // Get final response from LLM after tool execution
      console.log(`🎯 Generating final response with ${toolResults.length} tool results`);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('LLM response timeout after 10 seconds')), 10000)
      );

      try {
        const finalResponse = await Promise.race([
          llm.invoke(messagesWithToolResults),
          timeoutPromise
        ]);
        finalContent = finalResponse.content;
        console.log(`✅ LLM final response generated successfully`);
      } catch (error) {
        console.error(`❌ LLM final response failed:`, error.message);
        // Fallback response if LLM fails
        finalContent = `I found information about your family members, but I'm having trouble generating a complete response right now. Please try asking again.`;
      }

    } else {
      console.log(`💬 AI responded without using tools`);
    }

    // Response caching disabled for simplicity

    // Save AI response to database
    await sql`
      INSERT INTO messages (conversation_id, role, content, metadata, created_at)
      VALUES (${currentConversationId}, 'assistant', ${finalContent}, ${JSON.stringify({
        model: openaiModel,
        temperature: openaiTemperature,
        tools_available: tools.length,
        tools_used: toolCallsExecuted,
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

    // Memory extraction disabled for now
    // await AgentMemoryService.extractAndStoreMemories(userId, currentConversationId, message, 'user');
    // await AgentMemoryService.extractAndStoreMemories(userId, currentConversationId, finalContent, 'assistant');

    // Update conversation metadata with session info
    const updatedMetadata = {
      last_model_used: openaiModel,
      last_temperature: openaiTemperature,
      tools_enabled: tools.length > 0,
      last_tools_used: toolCallsExecuted,
      message_count: messageCount + 2, // +2 for user message and AI response
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

// Streaming endpoint for real-time chat responses with AI
router.post('/stream', optionalJWT, async (req, res) => {
  console.log('🌊 STREAMING CHAT ROUTE HIT!');

  // Set up Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  try {
    const { message, conversationId, userId } = req.body;

    if (!message || !userId) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Missing required parameters' })}\n\n`);
      res.end();
      return;
    }

    // Environment validation
    const neonUrl = process.env.NEON_DATABASE_URL;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!neonUrl || !openaiApiKey) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Missing environment variables' })}\n\n`);
      res.end();
      return;
    }

    // Initialize services
    const sql = neon(neonUrl);

    // Import streaming orchestrator (dynamic import to avoid circular deps)
    const { StreamingIntelligentChatOrchestrator } = await import('../services/streamingIntelligentChatOrchestrator.js');
    const streamingOrchestrator = new StreamingIntelligentChatOrchestrator();

    // Create tools for the current user and query (reusing existing logic)
    const tools = CONVERSATION_CONFIG.ENABLE_LANGCHAIN_TOOLS
      ? createChatTools(userId, process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, openaiApiKey, message)
      : [];

    console.log(`🚀 Processing streaming message with ${tools.length} tools available`);

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Connected to AI assistant' })}\n\n`);

    // Process streaming message with AI
    await streamingOrchestrator.processStreamingMessageWithTools({
      message,
      conversationId,
      userId,
      sql,
      tools,

      onStatus: (status) => {
        res.write(`data: ${JSON.stringify({ type: 'status', message: status })}\n\n`);
      },

      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
      },

      onToolStart: (toolName, args) => {
        res.write(`data: ${JSON.stringify({
          type: 'tool_start',
          tool: toolName,
          message: `Using ${toolName}...`
        })}\n\n`);
      },

      onToolComplete: (toolName, result) => {
        const isError = typeof result === 'string' && result.startsWith('Error:');
        res.write(`data: ${JSON.stringify({
          type: 'tool_complete',
          tool: toolName,
          message: isError ? `${toolName} failed` : `${toolName} completed`,
          success: !isError
        })}\n\n`);
      },

      onComplete: (response) => {
        res.write(`data: ${JSON.stringify({ type: 'complete', message: 'Response generated successfully' })}\n\n`);
        res.end();
      },

      onError: (error) => {
        console.error('Streaming AI error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error })}\n\n`);
        res.end();
      }
    });

  } catch (error) {
    console.error('Streaming endpoint error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    res.end();
  }
});

export default router;