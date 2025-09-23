/**
 * Normalized Activity Types Configuration
 *
 * Single source of truth for activity type values used across:
 * - Email processing and AI analysis
 * - Profile suggestions detection
 * - UI dropdowns
 * - Family member profile storage
 */

export const ACTIVITY_TYPES = {
  SPORT: 'Sport',
  CREATIVE: 'Creative',
  EDUCATIONAL: 'Educational',
  SOCIAL: 'Social',
  OUTDOOR: 'Outdoor',
  INDOOR: 'Indoor',
  FITNESS: 'Fitness',
  FAITH: 'Faith',
  HOBBY: 'Hobby',
  OTHER: 'Other'
};

// Array for UI dropdowns
export const ACTIVITY_TYPE_OPTIONS = Object.values(ACTIVITY_TYPES);

// Detection patterns for email analysis
export const ACTIVITY_DETECTION_PATTERNS = {
  [ACTIVITY_TYPES.SPORT]: [
    /\b(soccer|football|basketball|baseball|tennis|swimming|volleyball|hockey|golf|track|field|practice|game|match|tournament|league|team|sport|athletic|coach)\b/i
  ],
  [ACTIVITY_TYPES.EDUCATIONAL]: [
    /\b(school|class|homework|study|lesson|tutor|education|academic|math|science|reading|writing|test|exam|grade|teacher)\b/i
  ],
  [ACTIVITY_TYPES.CREATIVE]: [
    /\b(art|music|piano|guitar|violin|drawing|painting|dance|theater|drama|creative|craft|pottery|photography)\b/i
  ],
  [ACTIVITY_TYPES.SOCIAL]: [
    /\b(playdate|party|birthday|gathering|group|friend|social|club|meetup)\b/i
  ],
  [ACTIVITY_TYPES.OUTDOOR]: [
    /\b(hiking|camping|outdoor|nature|park|playground|garden|bike|walk|trail)\b/i
  ],
  [ACTIVITY_TYPES.INDOOR]: [
    /\b(indoor|inside|home|library|museum|mall|movie|cinema)\b/i
  ],
  [ACTIVITY_TYPES.FITNESS]: [
    /\b(fitness|gym|workout|exercise|yoga|pilates|martial|karate|judo)\b/i
  ],
  [ACTIVITY_TYPES.FAITH]: [
    /\b(church|temple|mosque|synagogue|prayer|worship|faith|religious|sunday|bible)\b/i
  ],
  [ACTIVITY_TYPES.HOBBY]: [
    /\b(hobby|collection|model|puzzle|board|game|chess|coding|programming)\b/i
  ]
};

/**
 * Detect activity type from text content
 * @param {string} text - Combined text to analyze
 * @returns {string} Detected activity type or 'Other'
 */
export function detectActivityType(text) {
  if (!text) return ACTIVITY_TYPES.OTHER;

  const textLower = text.toLowerCase();

  for (const [activityType, patterns] of Object.entries(ACTIVITY_DETECTION_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(textLower)) {
        return activityType;
      }
    }
  }

  return ACTIVITY_TYPES.OTHER;
}

/**
 * Validate activity type value
 * @param {string} activityType - Activity type to validate
 * @returns {string} Valid activity type or 'Other'
 */
export function validateActivityType(activityType) {
  return Object.values(ACTIVITY_TYPES).includes(activityType)
    ? activityType
    : ACTIVITY_TYPES.OTHER;
}