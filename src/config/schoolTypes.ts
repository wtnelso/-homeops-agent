/**
 * Normalized School Types Configuration (Frontend)
 *
 * Single source of truth for school type values used in UI components
 * Must match server-side config/schoolTypes.js
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
} as const;

// Array for UI dropdowns
export const SCHOOL_TYPE_OPTIONS = Object.values(SCHOOL_TYPES);

// Type for TypeScript
export type SchoolType = typeof SCHOOL_TYPES[keyof typeof SCHOOL_TYPES];

/**
 * Validate school type value
 * @param schoolType - School type to validate
 * @returns Valid school type or 'Other'
 */
export function validateSchoolType(schoolType: string): SchoolType {
  return Object.values(SCHOOL_TYPES).includes(schoolType as SchoolType)
    ? (schoolType as SchoolType)
    : SCHOOL_TYPES.OTHER;
}