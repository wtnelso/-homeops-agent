/**
 * Calendar Tool Patterns
 *
 * Pattern definitions for Google Calendar tool selection.
 * Used in AI-enhanced routing when direct routes don't match.
 */

export const CALENDAR_PATTERNS = [
  // Core calendar terms
  {
    pattern: /\b(calendar|schedule|appointment|meeting|event|agenda)\b/,
    score: 0.9,
    description: 'Core calendar terminology'
  },

  // Time references
  {
    pattern: /\b(today|tomorrow|yesterday|tonight|morning|afternoon|evening)\b/,
    score: 0.7,
    description: 'Time references'
  },
  {
    pattern: /\b(when|what time|at what time|time|timing|duration)\b/,
    score: 0.7,
    description: 'Time questions'
  },

  // Week/month references
  {
    pattern: /\b(this week|next week|last week|this month|next month|this year)\b/,
    score: 0.8,
    description: 'Week/month references'
  },

  // Day names
  {
    pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/,
    score: 0.8,
    description: 'Day names'
  },

  // Month names
  {
    pattern: /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/,
    score: 0.8,
    description: 'Month names'
  },

  // Calendar actions
  {
    pattern: /\b(book|reserve|schedule|plan|organize|arrange)\b/,
    score: 0.7,
    description: 'Calendar actions'
  },

  // Meeting types
  {
    pattern: /\b(conference|call|zoom|teams|webinar|presentation|interview)\b/,
    score: 0.8,
    description: 'Meeting types'
  },

  // Calendar phrases
  {
    pattern: /\b(free time|available|busy|booked|conflict|overlap)\b/,
    score: 0.8,
    description: 'Availability terms'
  },

  // Event types
  {
    pattern: /\b(birthday|anniversary|holiday|vacation|trip|party|celebration)\b/,
    score: 0.7,
    description: 'Event types'
  }
];

/**
 * Calculate calendar tool scores for a query
 * @param {string} normalizedQuery - Lowercased query
 * @returns {number} Calendar tool score
 */
export function calculateCalendarScore(normalizedQuery) {
  let score = 0;

  CALENDAR_PATTERNS.forEach(({ pattern, score: patternScore }) => {
    if (pattern.test(normalizedQuery)) {
      score = Math.max(score, patternScore);
    }
  });

  return score;
}