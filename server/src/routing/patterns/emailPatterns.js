/**
 * Email Tool Patterns
 *
 * Pattern definitions for Gmail and Semantic Search tool selection.
 * Used in AI-enhanced routing when direct routes don't match.
 */

export const EMAIL_PATTERNS = [
  // Core email terms
  {
    pattern: /\b(email|inbox|mail|message|gmail|messages|correspondence)\b/,
    score: 0.9,
    description: 'Core email terminology'
  },

  // Gmail operators (highest priority)
  {
    pattern: /\b(from:|to:|subject:|after:|before:|has:|is:|label:)\b/,
    score: 1.0,
    description: 'Gmail search operators'
  },

  // Email actions
  {
    pattern: /\b(send|sent|receive|received|reply|forward|draft|compose)\b/,
    score: 0.8,
    description: 'Email actions'
  },

  // Email states
  {
    pattern: /\b(unread|read|archive|trash|spam|starred|important)\b/,
    score: 0.7,
    description: 'Email states'
  },

  // Email content
  {
    pattern: /\b(attachment|attachments|file|files|document|documents|pdf)\b/,
    score: 0.7,
    description: 'Email attachments and content'
  },

  // Email types
  {
    pattern: /\b(newsletter|notification|alert|reminder|confirmation|receipt)\b/,
    score: 0.6,
    description: 'Email types'
  },

  // Search phrases
  {
    pattern: /\b(find.*email|search.*mail|show.*inbox|check.*messages)\b/,
    score: 0.9,
    description: 'Email search phrases'
  },

  // Sender/recipient references
  {
    pattern: /\b(sender|recipient|cc|bcc|mailing list|contact)\b/,
    score: 0.6,
    description: 'Email participants'
  }
];

/**
 * Calculate email tool scores for a query
 * @param {string} normalizedQuery - Lowercased query
 * @returns {object} Tool scores object
 */
export function calculateEmailScores(normalizedQuery) {
  const scores = {
    gmail: 0,
    semantic_search: 0
  };

  let isEmailQuery = false;

  EMAIL_PATTERNS.forEach(({ pattern, score, description }) => {
    if (pattern.test(normalizedQuery)) {
      isEmailQuery = true;

      if (pattern.source.includes(':|')) {
        // Gmail operators detected - prioritize Gmail API
        scores.gmail = Math.max(scores.gmail, score);
        scores.semantic_search = Math.max(scores.semantic_search, 0.6); // Backup
      } else {
        // Content-based search - boost email tools above agent memory
        scores.semantic_search = Math.max(scores.semantic_search, score);
        scores.gmail = Math.max(scores.gmail, score * 0.85);
      }
    }
  });

  return { scores, isEmailQuery };
}