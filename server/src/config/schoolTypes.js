/**
 * Normalized School Types Configuration
 *
 * Single source of truth for school type values used across:
 * - Email processing and AI analysis
 * - Profile suggestions detection
 * - UI dropdowns
 * - Family member profile storage
 */

export const SCHOOL_TYPES = {
  ELEMENTARY: 'Elementary',
  MIDDLE_SCHOOL: 'Middle School',
  HIGH_SCHOOL: 'High School',
  COLLEGE: 'College',
  UNIVERSITY: 'University',
  GRADUATE_SCHOOL: 'Graduate School',
  TRADE_SCHOOL: 'Trade School',
  PRESCHOOL: 'Preschool',
  DAYCARE: 'Daycare',
  OTHER: 'Other'
};

// Array for UI dropdowns
export const SCHOOL_TYPE_OPTIONS = Object.values(SCHOOL_TYPES);

// Detection patterns for email analysis
export const SCHOOL_DETECTION_PATTERNS = {
  [SCHOOL_TYPES.ELEMENTARY]: [
    /\b(elementary|primary|grade\s+[1-5]|kindergarten|k-5)\b/i
  ],
  [SCHOOL_TYPES.MIDDLE_SCHOOL]: [
    /\b(middle\s+school|junior\s+high|grade\s+[6-8]|6th|7th|8th)\b/i
  ],
  [SCHOOL_TYPES.HIGH_SCHOOL]: [
    /\b(high\s+school|secondary|grade\s+[9-12]|9th|10th|11th|12th|freshman|sophomore|junior|senior)\b/i
  ],
  [SCHOOL_TYPES.COLLEGE]: [
    /\b(college|community\s+college|cc|associates|associate)\b/i
  ],
  [SCHOOL_TYPES.UNIVERSITY]: [
    /\b(university|bachelor|undergraduate|campus|sorority|fraternity)\b/i
  ],
  [SCHOOL_TYPES.GRADUATE_SCHOOL]: [
    /\b(graduate|masters|phd|doctorate|law\s+school|medical\s+school|grad\s+school)\b/i
  ],
  [SCHOOL_TYPES.TRADE_SCHOOL]: [
    /\b(trade\s+school|vocational|technical\s+college|cosmetology|culinary)\b/i
  ],
  [SCHOOL_TYPES.PRESCHOOL]: [
    /\b(preschool|pre-school|nursery\s+school|pre-k|prek)\b/i
  ],
  [SCHOOL_TYPES.DAYCARE]: [
    /\b(daycare|day\s+care|childcare|child\s+care)\b/i
  ]
};

/**
 * Detect school type from text content
 * @param {string} text - Combined text to analyze
 * @returns {string} Detected school type or 'Other'
 */
export function detectSchoolType(text) {
  if (!text) return SCHOOL_TYPES.OTHER;

  const textLower = text.toLowerCase();

  for (const [schoolType, patterns] of Object.entries(SCHOOL_DETECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(textLower)) {
        return schoolType;
      }
    }
  }

  return SCHOOL_TYPES.OTHER;
}

/**
 * Validate school type value
 * @param {string} schoolType - School type to validate
 * @returns {string} Valid school type or 'Other'
 */
export function validateSchoolType(schoolType) {
  return Object.values(SCHOOL_TYPES).includes(schoolType)
    ? schoolType
    : SCHOOL_TYPES.OTHER;
}