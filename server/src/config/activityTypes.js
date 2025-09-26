/**
 * Activity Type Detection Configuration
 *
 * Single source of truth for activity type classification used across:
 * - Email processing and AI analysis
 * - Profile suggestions detection
 * - UI dropdowns
 * - Activity storage
 */

export const ACTIVITY_TYPES = {
  SPORT: 'sport',
  CREATIVE: 'creative',
  EDUCATIONAL: 'educational',
  SOCIAL: 'social',
  OUTDOOR: 'outdoor',
  INDOOR: 'indoor',
  FITNESS: 'fitness',
  FAITH: 'faith',
  HOBBY: 'hobby',
  OTHER: 'other'
};

// Array for UI dropdowns
export const ACTIVITY_TYPE_OPTIONS = Object.values(ACTIVITY_TYPES);

// Detection patterns for activity type classification
export const ACTIVITY_TYPE_PATTERNS = {
  [ACTIVITY_TYPES.SPORT]: [
    /\b(soccer|football|basketball|tennis|baseball|volleyball|hockey|swimming|golf|track|field|sports?|athletics|team)\b/i
  ],
  [ACTIVITY_TYPES.CREATIVE]: [
    /\b(piano|guitar|violin|music|art|draw|drawing|paint|painting|dance|dancing|theater|drama|craft|creative|singing|choir|band|orchestra)\b/i
  ],
  [ACTIVITY_TYPES.EDUCATIONAL]: [
    /\b(tutor|tutoring|homework|study|class|lesson|learning|school|academic|math|reading|writing|science|history)\b/i
  ],
  [ACTIVITY_TYPES.FITNESS]: [
    /\b(gym|workout|fitness|yoga|pilates|exercise|training|martial arts|karate|judo|taekwondo)\b/i
  ],
  [ACTIVITY_TYPES.FAITH]: [
    /\b(church|sunday school|bible|prayer|youth group|religious|faith|worship|ministry)\b/i
  ],
  [ACTIVITY_TYPES.SOCIAL]: [
    /\b(scouts|club|playdate|birthday|party|social|group|friends|community)\b/i
  ],
  [ACTIVITY_TYPES.OUTDOOR]: [
    /\b(hiking|camping|fishing|hunting|outdoor|nature|park|trail|biking|cycling)\b/i
  ],
  [ACTIVITY_TYPES.INDOOR]: [
    /\b(indoor|library|museum|mall|arcade|bowling|skating)\b/i
  ],
  [ACTIVITY_TYPES.HOBBY]: [
    /\b(collect|collecting|building|model|puzzle|game|gaming|chess|coding|programming)\b/i
  ]
};

/**
 * Detect activity type from activity name
 * @param {string} activityName - Activity name to analyze
 * @returns {string} Detected activity type or 'other' (default)
 */
export function detectActivityType(activityName) {
  if (!activityName || typeof activityName !== 'string') {
    return ACTIVITY_TYPES.OTHER;
  }

  const nameLC = activityName.toLowerCase();

  for (const [activityType, patterns] of Object.entries(ACTIVITY_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(nameLC)) {
        return activityType;
      }
    }
  }

  return ACTIVITY_TYPES.OTHER; // Default fallback
}

/**
 * Validate activity type value
 * @param {string} activityType - Activity type to validate
 * @returns {string} Valid activity type or 'other'
 */
export function validateActivityType(activityType) {
  return Object.values(ACTIVITY_TYPES).includes(activityType)
    ? activityType
    : ACTIVITY_TYPES.OTHER;
}