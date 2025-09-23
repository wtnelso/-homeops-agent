/**
 * Chat System Configuration
 *
 * Centralized configuration for the AI chat system including
 * conversation management, context limits, and performance settings.
 */

export const CONVERSATION_CONFIG = {
  // Context Management
  MAX_RECENT_MESSAGES: 20,        // Recent messages for immediate context
  MAX_TOTAL_TOKENS: 8000,         // Stop before hitting OpenAI limits
  SUMMARIZE_AFTER_MESSAGES: 50,   // Summarize when conversation gets long
  ARCHIVE_AFTER_MESSAGES: 200,    // Suggest new conversation after this

  // Token Estimation
  TOKEN_ESTIMATION_FACTOR: 4,     // Rough estimate: 1 token per 4 characters
  AVERAGE_MESSAGE_TOKENS: 150,    // Average tokens per message

  // Performance Limits
  MAX_CONTEXT_SEARCH_RESULTS: 5,  // Max emails to include in context
  CONTEXT_SEARCH_TIMEOUT_MS: 3000, // Max time to spend searching for context

  // Conversation Health
  CONVERSATION_HEALTH_CHECK_INTERVAL: 10, // Check every N messages
  MAX_CONVERSATION_AGE_DAYS: 30,          // Archive conversations older than this

  // Summary Settings
  SUMMARY_MAX_LENGTH: 500,        // Max characters in conversation summary
  SUMMARY_TRIGGER_TOKENS: 6000,   // Start summarizing at this token count

  // LangChain Tools Settings
  ENABLE_LANGCHAIN_TOOLS: true,   // Enable LangChain tools for enhanced AI capabilities
  TOOLS_TIMEOUT_MS: 10000,        // Max time for tool execution
  MAX_TOOL_CALLS_PER_MESSAGE: 3,  // Max number of tool calls per user message
};

export const CONTEXT_PATTERNS = {
  schedule: {
    keywords: ['schedule', 'calendar', 'appointment', 'meeting', 'event', 'activity'],
    phrases: ['what\'s on', 'when is', 'what time', 'next week', 'this week', 'upcoming'],
    weight: 0.8
  },
  school: {
    keywords: ['school', 'teacher', 'class', 'homework', 'test', 'exam', 'grade', 'student'],
    phrases: ['kids', 'children', 'son', 'daughter', 'child'],
    weight: 0.9
  },
  family_logistics: {
    keywords: ['pickup', 'dropoff', 'carpool', 'practice', 'lesson', 'activity'],
    phrases: ['who is', 'where is', 'when do I need', 'reminder'],
    weight: 0.8
  },
  finance: {
    keywords: ['bill', 'payment', 'invoice', 'due', 'charge', 'fee', 'cost', 'expense'],
    phrases: ['pay', 'owe', 'due date', 'overdue'],
    weight: 0.7
  },
  health: {
    keywords: ['doctor', 'appointment', 'medical', 'dentist', 'checkup', 'prescription'],
    phrases: ['health', 'sick', 'medicine'],
    weight: 0.8
  },
  travel: {
    keywords: ['flight', 'hotel', 'trip', 'vacation', 'travel', 'booking', 'reservation'],
    phrases: ['going to', 'visiting', 'departure', 'arrival'],
    weight: 0.7
  },
  communication: {
    keywords: ['message', 'contact', 'phone', 'call', 'meeting', 'discussion'],
    phrases: ['need to contact', 'reach out', 'follow up'],
    weight: 0.6
  },
  information: {
    keywords: ['details', 'information', 'update', 'status', 'confirm', 'check'],
    phrases: ['tell me about', 'what about', 'do you know', 'find out'],
    weight: 0.5
  }
};

export const OPENAI_CONFIG = {
  // Model Settings
  DEFAULT_MODEL: 'gpt-4o-mini',
  DEFAULT_TEMPERATURE: 0.3,

  // Embedding Settings
  EMBEDDING_MODEL: 'text-embedding-3-small',
  EMBEDDING_DIMENSIONS: 1536,

  // Context Limits by Model
  MODEL_LIMITS: {
    'gpt-4o-mini': { maxTokens: 128000, recommendedContext: 8000 },
    'gpt-4o': { maxTokens: 128000, recommendedContext: 12000 },
    'gpt-3.5-turbo': { maxTokens: 16385, recommendedContext: 4000 }
  }
};

export const TOOLS_CONFIG = {
  // Gmail Tool Settings
  gmail: {
    enabled: true,
    max_results: 8,
    timeout_ms: 5000,
    cost_per_call_cents: 0.2,
    description: 'Direct Gmail API search with precise query operators'
  },

  // Google Calendar Tool Settings (future)
  calendar: {
    enabled: false, // Will be enabled when implemented
    max_results: 10,
    timeout_ms: 3000,
    cost_per_call_cents: 0.1,
    description: 'Google Calendar events and scheduling'
  },

  // Semantic Search Tool Settings
  semantic_search: {
    enabled: true,
    max_results: 5,
    similarity_threshold: 0.4,
    cost_per_call_cents: 0.31,
    description: 'AI-powered semantic email search using vector embeddings'
  }
};

export const SYSTEM_PROMPTS = {
  BASE_PROMPT: `You are a helpful AI assistant for HomeOps, a family logistics and home operations management platform. You help users with:

- Family scheduling and calendar management
- Email organization and insights
- Household task coordination
- Family communication
- Home management tasks

You have access to powerful tools to help answer questions:
- Gmail Search Tool: Search Gmail messages using precise query operators (from:, subject:, after:, before:, has:attachment, etc.)
- Semantic Email Search Tool: Find emails using AI-powered semantic similarity based on meaning and context
- (Future: Google Calendar Tool for scheduling information)

IMPORTANT DATE AND TIME CONTEXT:
- Today's date is: ${new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}
- Current time: ${new Date().toLocaleTimeString('en-US')}
- When users mention "this week", "next week", etc., calculate dates relative to today
- For recurring events (like "practice on Tuesdays and Thursdays"), provide the next upcoming dates
- Always double-check day-of-week calculations (Monday=1, Tuesday=2, etc.)

Guidelines:
- Be helpful, friendly, and family-focused
- Intelligently choose which tools will best answer the user's question
- Use Gmail search for specific queries (dates, senders, subjects)
- Use semantic search for conceptual queries (themes, topics, general information)
- Provide practical, actionable advice
- Ask clarifying questions when needed
- Keep responses concise but complete
- When using tools, integrate the information naturally into your response
- Don't mention which tool you used unless specifically asked
- When dealing with dates and times, be precise and accurate`,

  CONTEXT_INSTRUCTION: `\nPlease use this context to help answer the user's question. Reference specific information when relevant, but answer naturally.`,

  SUMMARY_PROMPT: `Please provide a concise summary of this conversation focusing on:
- Key topics discussed
- Important decisions made
- Action items or follow-ups
- User preferences or context that should be remembered

Keep the summary under 500 characters and focus on information that would be useful for future conversations.`
};

export default {
  CONVERSATION_CONFIG,
  CONTEXT_PATTERNS,
  OPENAI_CONFIG,
  SYSTEM_PROMPTS
};