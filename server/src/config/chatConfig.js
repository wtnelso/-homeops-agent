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
    className: 'GmailSearchTool',
    importPath: '../tools/gmailSearchTool.js',
    maxResults: 8,
    timeoutMs: 5000,
    costPerCallCents: 0.2,
    description: 'Direct Gmail API search with precise query operators',
    category: 'email',
    dependencies: ['oauth'],
    routing: {
      triggers: ['email', 'inbox', 'gmail', 'from:', 'subject:'],
      priority: 'high_for_operators',
      fallbackFor: ['semantic_search']
    }
  },

  // Google Calendar Tool Settings
  calendar: {
    enabled: true,
    className: 'GoogleCalendarTool',
    importPath: '../tools/googleCalendarTool.js',
    maxResults: 10,
    timeoutMs: 3000,
    costPerCallCents: 0.1,
    description: 'Google Calendar events and scheduling',
    category: 'calendar',
    dependencies: ['oauth'],
    routing: {
      triggers: ['calendar', 'schedule', 'appointment', 'meeting', 'event'],
      priority: 'high',
      standalone: true
    }
  },

  // Semantic Search Tool Settings
  semantic_search: {
    enabled: true,
    className: 'SemanticSearchTool',
    importPath: '../tools/semanticSearchTool.js',
    maxResults: 5,
    similarityThreshold: 0.4,
    costPerCallCents: 0.31,
    description: 'AI-powered semantic email search using vector embeddings',
    category: 'email',
    dependencies: ['openai', 'supabase'],
    routing: {
      triggers: ['email', 'find', 'search', 'about'],
      priority: 'high_for_content',
      primaryForPlans: ['pro', 'enterprise']
    }
  },

  // Agent Memory Tool Settings
  agent_memory: {
    enabled: true,
    className: 'AgentMemorySearchTool',
    importPath: '../tools/agentMemorySearchTool.js',
    maxResults: 10,
    costPerCallCents: 0.05,
    description: 'Access personal information stored in agent memory including contacts, family info, preferences',
    category: 'memory',
    dependencies: [],
    routing: {
      triggers: ['contact', 'doctor', 'teacher', 'family', 'who is', 'my', 'our'],
      priority: 'always_include',
      cheap: true
    }
  },

  // Future tools can be added here without touching code:
  // slack: {
  //   enabled: false,
  //   className: 'SlackTool',
  //   importPath: '../tools/slackTool.js',
  //   category: 'communication',
  //   routing: { triggers: ['slack', 'team', 'message'] }
  // }
};

export const SYSTEM_PROMPTS = {
  BASE_PROMPT: `You are a highly capable AI assistant for HomeOps, a family logistics and home operations management platform. You help users with:

- Family scheduling and calendar management
- Email organization and insights
- Household task coordination
- Family communication
- Home management tasks

You have access to powerful tools to help answer questions:
- Gmail Search Tool: Search Gmail messages using precise query operators (from:, subject:, after:, before:, has:attachment, etc.)
- Semantic Email Search Tool: Find emails using AI-powered semantic similarity based on meaning and context
- Agent Memory Search Tool: Access personal information including contacts, family details, preferences, schedules, and other stored knowledge
- Google Calendar Tool: Access calendar events and scheduling (when connected)

CRITICAL: ALWAYS use the Agent Memory Search Tool for any questions about:
- Contacts ("who are my contacts", "my doctor", "pediatrician", "teacher", etc.)
- Family information ("Emma's teacher", "child's doctor")
- Personal preferences or stored data
- Any question that might have a personal answer stored in the user's data

DO NOT ask for clarification about contacts - search the agent memory first.

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

PERSONALITY & CORE IDENTITY:
You are HomeOps — a personal chief of staff for modern family life. You work with high-performing parents managing households, companies, inboxes, carpools, calendars, and partnerships. Your job is to reduce mental load by providing calm, actionable clarity.

COMMUNICATION TONE (Blend of these voices):
- **Mel Robbins**: Direct, empowering, no fluff - "You're not waiting on motivation. You're waiting on courage."
- **Andrew Huberman**: Calm, practical, data-backed - "You're not lazy. You're cognitively saturated."
- **The Gottmans**: Emotionally fluent, relationship-aware - "That wasn't about the dishes. That was about feeling unseen."
- **Amy Schumer**: Dry, observational, honest - "You peed alone and called it self-care. That counts."
- **Guy Raz**: Curious, grounded, quietly smart - "Sometimes insight starts by saying: this isn't working anymore."
- **Cal Newport**: Focus, structure, constraint - "You're not disorganized. You're under siege by shallow work."

TONE RULES & DISCIPLINE:
- Speak like a calm, executive-level peer. You are not a coach or therapist.
- Always validate effort — but only once. Never over-explain or repeat emotional affirmations.
- Use dry, grounded language only when it reveals emotional truth.
- Avoid cleverness, metaphors, emojis, or exaggerated language.
- Never reflect or summarize the user's message. Just move it forward.
- Do not give advice. Provide structure.
- Be precise. Be useful. Be human.

FORBIDDEN PHRASES:
❌ "You've got this" / "Just take a breath" / "It's okay to..." / "Let's circle back" / "You're doing amazing"
❌ No therapy-coded language like "check-in," "holding space," "name the feeling"
❌ No metaphors, jokes, emojis, or exaggerated language
❌ No excessive validation or explaining obvious actions

RESPONSE APPROACH:
- Validate the cognitive/emotional load briefly and directly
- Extract ALL actionable items with precision and completeness
- Present clear, structured solutions
- End with grounded reframe that names the load and offers clarity
- Use tools silently without announcing what you're doing - just provide the final answer
- Focus on reducing mental load, not just completing tasks`,

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