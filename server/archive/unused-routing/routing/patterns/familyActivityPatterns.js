/**
 * Family Activities Tool Patterns
 *
 * Pattern definitions for Family Activities tool selection.
 * Used in AI-enhanced routing when direct routes don't match.
 */

export const FAMILY_ACTIVITY_PATTERNS = [
  // Core activity terms
  {
    pattern: /\b(activities|activity|practice|practices|lesson|lessons|class|classes)\b/,
    score: 0.9,
    description: 'Core activity terminology'
  },

  // Family references
  {
    pattern: /\b(family|child|children|kid|kids|son|daughter|my|our)\s+(activities|practice|lesson|class|schedule)\b/,
    score: 0.9,
    description: 'Family activity references'
  },

  // Sports activities
  {
    pattern: /\b(soccer|football|basketball|baseball|tennis|swimming|gymnastics|martial arts|karate|judo|track|field|wrestling|volleyball|hockey)\b/,
    score: 0.8,
    description: 'Sports activities'
  },

  // Music activities
  {
    pattern: /\b(piano|guitar|violin|drums|music|choir|band|orchestra|singing|voice)\s*(lesson|lessons|practice|class|classes)?\b/,
    score: 0.8,
    description: 'Music activities'
  },

  // Arts activities
  {
    pattern: /\b(art|drawing|painting|dance|ballet|theater|drama|acting|pottery|crafts)\s*(lesson|lessons|practice|class|classes)?\b/,
    score: 0.8,
    description: 'Arts activities'
  },

  // Educational activities
  {
    pattern: /\b(tutoring|tutor|homework|study|academic|education|learning|science|math|reading)\s*(class|classes|session|sessions)?\b/,
    score: 0.7,
    description: 'Educational activities'
  },

  // Activity questions
  {
    pattern: /\b(what does.*do|what activities|what classes|what practices|what lessons)\b/,
    score: 0.9,
    description: 'Activity questions'
  },

  // Schedule-related
  {
    pattern: /\b(schedule.*child|schedule.*kid|child.*schedule|kid.*schedule)\b/,
    score: 0.8,
    description: 'Child schedule references'
  },

  // Coaches and instructors
  {
    pattern: /\b(coach|instructor|teacher|trainer|mentor)\b/,
    score: 0.6,
    description: 'Activity leaders'
  }
];

/**
 * Calculate family activities tool score for a query
 * @param {string} normalizedQuery - Lowercased query
 * @returns {number} Family activities tool score
 */
export function calculateFamilyActivityScore(normalizedQuery) {
  let score = 0;

  FAMILY_ACTIVITY_PATTERNS.forEach(({ pattern, score: patternScore }) => {
    if (pattern.test(normalizedQuery)) {
      score = Math.max(score, patternScore);
    }
  });

  return score;
}