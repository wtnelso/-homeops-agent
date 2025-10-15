/**
 * Agent Memory Tool Patterns
 *
 * Pattern definitions for Agent Memory tool selection.
 * Used in AI-enhanced routing when direct routes don't match.
 */

export const AGENT_MEMORY_PATTERNS = [
  // Personal knowledge queries
  {
    pattern: /\b(remember|recall|know|learned|told|mentioned|discussed)\b/,
    score: 0.8,
    description: 'Memory recall requests'
  },

  // Information requests
  {
    pattern: /\b(what do you know about|tell me about|information about|details about)\b/,
    score: 0.7,
    description: 'Information requests'
  },

  // Family member queries
  {
    pattern: /\b(my|our|family|personal|private)\s+(information|details|data|preferences|habits|routine)\b/,
    score: 0.8,
    description: 'Personal/family information'
  },

  // Preference queries
  {
    pattern: /\b(like|dislike|prefer|favorite|hate|love|enjoy|interest)\b/,
    score: 0.6,
    description: 'Preference queries'
  },

  // Historical queries
  {
    pattern: /\b(before|previously|earlier|past|history|background)\b/,
    score: 0.6,
    description: 'Historical references'
  },

  // Personal habits/routines
  {
    pattern: /\b(usually|normally|typically|always|never|routine|habit|pattern)\b/,
    score: 0.6,
    description: 'Routine/habit queries'
  },

  // Context questions
  {
    pattern: /\b(who is|what is|where is|why do|how do|context|background)\b/,
    score: 0.5,
    description: 'Context questions'
  }
];

/**
 * Calculate agent memory tool score for a query
 * @param {string} normalizedQuery - Lowercased query
 * @param {boolean} isEmailQuery - Whether this query is email-related
 * @returns {number} Agent memory tool score
 */
export function calculateAgentMemoryScore(normalizedQuery, isEmailQuery = false) {
  // For email queries, keep agent memory at 0 to let email tools take precedence
  if (isEmailQuery) {
    return 0;
  }

  let score = 0;

  AGENT_MEMORY_PATTERNS.forEach(({ pattern, score: patternScore }) => {
    if (pattern.test(normalizedQuery)) {
      score = Math.max(score, patternScore);
    }
  });

  return score;
}