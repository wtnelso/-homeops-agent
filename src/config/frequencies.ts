/**
 * Normalized Frequency Types Configuration (Frontend)
 *
 * Single source of truth for frequency values used in UI components
 * Must match server-side config/frequencies.js
 */

export const FREQUENCIES = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  SEASONAL: 'Seasonal',
  OCCASIONAL: 'Occasional'
} as const;

// Array for UI dropdowns
export const FREQUENCY_OPTIONS = Object.values(FREQUENCIES);

// Type for TypeScript
export type Frequency = typeof FREQUENCIES[keyof typeof FREQUENCIES];

/**
 * Validate frequency value
 * @param frequency - Frequency to validate
 * @returns Valid frequency or 'Weekly'
 */
export function validateFrequency(frequency: string): Frequency {
  return Object.values(FREQUENCIES).includes(frequency as Frequency)
    ? (frequency as Frequency)
    : FREQUENCIES.WEEKLY;
}