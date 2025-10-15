/**
 * Direct Routing Rules
 *
 * High-confidence patterns that immediately map to specific tools.
 * These bypass AI decision-making for predictable "everything from everywhere" results.
 */

/**
 * Direct route mappings for guaranteed tool execution
 * Pattern: exact matches and high-confidence keywords
 */
export const DIRECT_ROUTE_MAPPINGS = {
  // Schedule/Calendar queries - Always get both calendar and activities
  schedule: ['calendar', 'family_activities'],
  'weekly schedule': ['calendar', 'family_activities'],
  'this week': ['calendar', 'family_activities'],
  'next week': ['calendar', 'family_activities'],
  'last week': ['calendar', 'family_activities'],
  'rest of the week': ['calendar', 'family_activities'],
  'rest of week': ['calendar', 'family_activities'],
  'what\'s going on': ['calendar', 'family_activities'],
  'what is going on': ['calendar', 'family_activities'],
  'whats going on': ['calendar', 'family_activities'],

  // Activity-specific queries
  activities: ['family_activities'],
  'family activities': ['family_activities'],
  practice: ['family_activities', 'calendar'],
  lessons: ['family_activities', 'calendar'],

  // Calendar-specific queries
  calendar: ['calendar'],
  events: ['calendar'],
  meetings: ['calendar', 'gmail'], // Meetings might be in email too
  appointments: ['calendar'],

  // Email-specific queries
  emails: ['gmail', 'semantic_search'],
  email: ['gmail', 'semantic_search'],
  inbox: ['gmail', 'semantic_search'],
  mail: ['gmail', 'semantic_search'],
  messages: ['gmail', 'semantic_search'],

  // Memory-specific queries
  remember: ['agent_memory'],
  'what do you know': ['agent_memory'],
  'tell me about': ['agent_memory', 'semantic_search'], // Could be in memory or emails
};

/**
 * Fuzzy pattern matching for direct routes
 * These patterns catch variations and natural language
 */
export const DIRECT_ROUTE_PATTERNS = [
  {
    pattern: /\b(what'?s\s+(going\s+on|happening)|schedule)\s+(this\s+week|next\s+week|rest\s+of\s+the\s+week|today|tomorrow)\b/i,
    tools: ['calendar', 'family_activities'],
    description: 'Schedule queries with time reference'
  },
  {
    pattern: /\b(my\s+|our\s+|family\s+)?(schedule|calendar|activities)\b/i,
    tools: ['calendar', 'family_activities'],
    description: 'Family schedule references'
  },
  {
    pattern: /\b(when\s+is|what\s+time|time\s+of)\s+.*(practice|lesson|class|activity|appointment|meeting)\b/i,
    tools: ['calendar', 'family_activities'],
    description: 'Time-specific activity queries'
  },
  {
    pattern: /\b(find|search|look\s+for)\s+.*(email|mail|message)\b/i,
    tools: ['gmail', 'semantic_search'],
    description: 'Email search requests'
  },
  {
    pattern: /\b(show\s+me|list|get)\s+.*(email|inbox|mail|message)\b/i,
    tools: ['gmail', 'semantic_search'],
    description: 'Email listing requests'
  }
];

/**
 * Check if a query matches any direct routes
 * @param {string} normalizedQuery - Lowercased query string
 * @returns {string[]} Array of tool names or empty array
 */
export function checkDirectRoutes(normalizedQuery) {
  // Check exact mappings first
  for (const [key, tools] of Object.entries(DIRECT_ROUTE_MAPPINGS)) {
    if (normalizedQuery.includes(key.toLowerCase())) {
      return tools;
    }
  }

  // Check pattern-based routes
  for (const route of DIRECT_ROUTE_PATTERNS) {
    if (route.pattern.test(normalizedQuery)) {
      return route.tools;
    }
  }

  return [];
}

/**
 * Get routing method information for logging
 * @param {string} normalizedQuery
 * @returns {object} Routing metadata
 */
export function getRoutingInfo(normalizedQuery) {
  // Check exact mappings
  for (const [key, tools] of Object.entries(DIRECT_ROUTE_MAPPINGS)) {
    if (normalizedQuery.includes(key.toLowerCase())) {
      return {
        method: 'direct_exact',
        matched_key: key,
        tools: tools,
        confidence: 1.0
      };
    }
  }

  // Check patterns
  for (const route of DIRECT_ROUTE_PATTERNS) {
    if (route.pattern.test(normalizedQuery)) {
      return {
        method: 'direct_pattern',
        matched_pattern: route.description,
        tools: route.tools,
        confidence: 1.0
      };
    }
  }

  return {
    method: 'ai_enhanced',
    tools: [],
    confidence: 0.0
  };
}