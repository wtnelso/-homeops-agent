/**
 * Normalized Frequency Types Configuration
 *
 * Single source of truth for frequency values used across:
 * - Email processing and AI analysis
 * - Profile suggestions detection
 * - UI dropdowns
 * - Activity and schedule storage
 */

export const FREQUENCIES = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  SEASONAL: 'Seasonal',
  OCCASIONAL: 'Occasional'
};

// Array for UI dropdowns
export const FREQUENCY_OPTIONS = Object.values(FREQUENCIES);

// Detection patterns for email analysis
export const FREQUENCY_DETECTION_PATTERNS = {
  [FREQUENCIES.DAILY]: [
    /\b(daily|every\s+day|each\s+day|per\s+day|weekdays|monday\s+through\s+friday)\b/i
  ],
  [FREQUENCIES.WEEKLY]: [
    /\b(weekly|every\s+week|once\s+a\s+week|per\s+week|mondays|tuesdays|wednesdays|thursdays|fridays|saturdays|sundays)\b/i
  ],
  [FREQUENCIES.BI_WEEKLY]: [
    /\b(bi-weekly|biweekly|every\s+two\s+weeks|twice\s+a\s+month|every\s+other\s+week)\b/i
  ],
  [FREQUENCIES.MONTHLY]: [
    /\b(monthly|every\s+month|once\s+a\s+month|per\s+month)\b/i
  ],
  [FREQUENCIES.SEASONAL]: [
    /\b(seasonal|spring|summer|fall|winter|semester|quarterly|seasonal)\b/i
  ],
  [FREQUENCIES.OCCASIONAL]: [
    /\b(occasional|sometimes|as\s+needed|when\s+available|irregular|sporadic)\b/i
  ]
};

/**
 * Detect frequency from text content
 * @param {string} text - Combined text to analyze
 * @returns {string} Detected frequency or 'Weekly' (default)
 */
export function detectFrequency(text) {
  if (!text) return FREQUENCIES.WEEKLY;

  const textLower = text.toLowerCase();

  for (const [frequency, patterns] of Object.entries(FREQUENCY_DETECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(textLower)) {
        return frequency;
      }
    }
  }

  return FREQUENCIES.WEEKLY; // Default fallback
}

/**
 * Validate frequency value
 * @param {string} frequency - Frequency to validate
 * @returns {string} Valid frequency or 'Weekly'
 */
export function validateFrequency(frequency) {
  return Object.values(FREQUENCIES).includes(frequency)
    ? frequency
    : FREQUENCIES.WEEKLY;
}