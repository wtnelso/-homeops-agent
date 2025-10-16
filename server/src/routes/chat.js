/**
 * Chat API Routes for Express Server
 *
 * LangChain-powered chat system with intelligent tool selection.
 * Moved from Vercel serverless functions for better local development and testing.
 */

import express from 'express';
import { getNeonDatabase } from '../config/database.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import {
  CONVERSATION_CONFIG,
  SYSTEM_PROMPTS,
  TOOLS_CONFIG
} from '../config/chatConfig.js';
import { optionalJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Estimate token count for messages
function estimateTokens(text) {
  return Math.ceil(text.length / CONVERSATION_CONFIG.TOKEN_ESTIMATION_FACTOR);
}



// Tool selection now handled by hybrid routing system - see /server/src/routing/
// OLD FUNCTION REPLACED BY MODULAR SYSTEM:
/*
function selectToolsForQuery_OLD(query = '', userContext = {}) {
  if (!query) {
    // No query provided - return all enabled tools
    return Object.keys(TOOLS_CONFIG).filter(key => TOOLS_CONFIG[key].enabled);
  }

  const normalizedQuery = query.toLowerCase();
  const toolScores = {};

  // Initialize agent memory to 0 - only include when personal/family queries detected
  toolScores.agent_memory = 0;

  // Track if this is an email query to adjust agent memory priority
  let isEmailQuery = false;

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
      isEmailQuery = true; // Mark as email query
      if (pattern.source.includes(':|')) {
        // Gmail operators detected - prioritize Gmail API
        toolScores.gmail = Math.max(toolScores.gmail || 0, score);
        toolScores.semantic_search = Math.max(toolScores.semantic_search || 0, 0.6); // Backup
      } else {
        // Content-based search - boost email tools above agent memory
        toolScores.semantic_search = Math.max(toolScores.semantic_search || 0, score);
        toolScores.gmail = Math.max(toolScores.gmail || 0, score * 0.85); // Increased from 0.7 to 0.85
      }
    }
  });

  // For email queries, keep agent memory at 0 to let email tools take precedence
  if (isEmailQuery) {
    console.log('🔄 Email query detected - keeping agent memory at 0 to let email tools lead');
  }

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
      const currentScore = toolScores.calendar || 0;
      const newScore = Math.max(currentScore, score);
      toolScores.calendar = newScore;
      console.log(`📅 Calendar pattern matched: "${pattern}" → score: ${score} (was ${currentScore}, now ${newScore})`);
    }
  });

  // Debug: Log final calendar score
  if (toolScores.calendar > 0) {
    console.log(`📅 Final calendar score: ${toolScores.calendar} for query: "${normalizedQuery}"`);
  } else {
    console.log(`📅 No calendar patterns matched for query: "${normalizedQuery}"`);
  }

  // Family Activities scoring - for recurring activities and schedules
  const activityPatterns = [
    // Core activity terms
    { pattern: /\b(activities|activity|schedule|practice|lesson|class)\b/, score: 0.9 },
    // Sports activities
    { pattern: /\b(soccer|football|basketball|baseball|tennis|swimming|dance|gymnastics)\b/, score: 0.9 },
    // Music activities
    { pattern: /\b(piano|guitar|violin|music|band|orchestra|choir)\b/, score: 0.8 },
    // Educational activities
    { pattern: /\b(tutoring|study|homework|school|education)\b/, score: 0.7 },
    // General activity queries - expanded
    { pattern: /\b(what.*do|what.*activities|weekly.*schedule|recurring)\b/, score: 0.8 },
    { pattern: /\b(when.*practice|when.*lesson|coach|instructor|teacher)\b/, score: 0.8 },
    // Common "going on" phrases for activities
    { pattern: /\b(going on|happening|what.*on).*\b(today|this week|next week|week|weekend)\b/, score: 0.9 },
    { pattern: /\b(what.*happening|what.*going on|what.*planned)\b/, score: 0.8 },
    // Time-based activity queries
    { pattern: /\b(this week|next week|today|tomorrow|weekend).*\b(activities|schedule|practice|lesson)\b/, score: 0.9 },
    { pattern: /\b(activities|schedule|practice|lesson).*\b(this week|next week|today|tomorrow|weekend)\b/, score: 0.9 },
    // Follow-up time queries (how about, what about + time)
    { pattern: /\b(how about|what about|and).*\b(next week|this week|weekend|tomorrow)\b/, score: 0.8 },
    { pattern: /\b(next week|this week|weekend|tomorrow)\b/, score: 0.7 }
  ];

  activityPatterns.forEach(({ pattern, score }) => {
    if (pattern.test(normalizedQuery)) {
      const currentScore = toolScores.family_activities || 0;
      const newScore = Math.max(currentScore, score);
      toolScores.family_activities = newScore;
      console.log(`🏃‍♀️ Activity pattern matched: "${pattern}" → score: ${score} (was ${currentScore}, now ${newScore})`);
    }
  });

  // Debug: Log final family_activities score
  if (toolScores.family_activities > 0) {
    console.log(`🏃‍♀️ Final family_activities score: ${toolScores.family_activities} for query: "${normalizedQuery}"`);
  }

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
  console.log(`🎯 All tool scores:`, toolScores);
  let selectedTools = Object.entries(toolScores)
    .filter(([tool, score]) => score >= 0.5)
    .map(([tool, score]) => tool);
  console.log(`🎯 Tools above threshold (≥0.5): [${selectedTools.join(', ')}]`);

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
*/

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


// Streaming endpoint for real-time chat responses with AI
router.post('/stream', optionalJWT, async (req, res) => {
  console.log('🌊 STREAMING CHAT ROUTE HIT!');
  console.log('📨 Request body:', JSON.stringify(req.body));

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

    // Debug logging for conversationId issue
    console.log(`🔍 STREAMING ROUTE DEBUG:`, {
      message: message?.substring(0, 50) + '...',
      conversationId,
      conversationIdType: typeof conversationId,
      conversationIdLength: conversationId?.length,
      userId,
      requestBody: JSON.stringify(req.body, null, 2)
    });

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
    const sql = getNeonDatabase();

    // Import streaming orchestrator (dynamic import to avoid circular deps)
    const { StreamingIntelligentChatOrchestrator } = await import('../services/streamingIntelligentChatOrchestrator.js');
    const streamingOrchestrator = new StreamingIntelligentChatOrchestrator();

    console.log(`🚀 Processing streaming message`);

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Connected to AI assistant' })}\n\n`);

    // Process streaming message with AI
    await streamingOrchestrator.processStreamingMessageWithTools({
      message,
      conversationId,
      userId,

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

      onStructuredData: (structuredData) => {
        res.write(`data: ${JSON.stringify({ type: 'structured_data', content: JSON.stringify(structuredData) })}\n\n`);
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