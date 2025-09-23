/**
 * Normalized Activity Types Configuration (Frontend)
 *
 * Single source of truth for activity type values used in UI components
 * Must match server-side config/activityTypes.js
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
} as const;

// Array for UI dropdowns
export const ACTIVITY_TYPE_OPTIONS = Object.values(ACTIVITY_TYPES);

// Type for TypeScript
export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];

/**
 * Validate activity type value
 * @param activityType - Activity type to validate
 * @returns Valid activity type or 'Other'
 */
export function validateActivityType(activityType: string): ActivityType {
  return Object.values(ACTIVITY_TYPES).includes(activityType as ActivityType)
    ? (activityType as ActivityType)
    : ACTIVITY_TYPES.OTHER;
}