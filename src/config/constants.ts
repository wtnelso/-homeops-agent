import { User, Home, Users, UserCheck } from 'lucide-react';

// Account name configuration
export const ACCOUNT_NAME_CONFIG = {
  // Template for default account name when user signs up
  // {name} will be replaced with the user's name
  DEFAULT_TEMPLATE: "{name}'s Family Dashboard",
  // Fallback if no user name is available
  FALLBACK: "Family Dashboard"
} as const;

/**
 * Generates a default account name based on user's name
 * @param userName - The user's name (optional)
 * @returns Default account name following the configured pattern
 */
export const generateDefaultAccountName = (userName?: string | null): string => {
  if (userName?.trim()) {
    return ACCOUNT_NAME_CONFIG.DEFAULT_TEMPLATE.replace('{name}', userName.trim());
  }
  return ACCOUNT_NAME_CONFIG.FALLBACK;
};

// House/Household types used in onboarding and account settings
export const HOUSEHOLD_TYPES = [
  { 
    id: 'single', 
    label: 'Just Me', 
    icon: User, 
    description: 'Individual household management' 
  },
  { 
    id: 'couple', 
    label: 'Couple', 
    icon: UserCheck, 
    description: 'Shared household for two' 
  },
  { 
    id: 'family', 
    label: 'Family', 
    icon: Users, 
    description: 'Parents with children' 
  },
  { 
    id: 'roommates', 
    label: 'Roommates', 
    icon: Home, 
    description: 'Shared living arrangement' 
  }
];

// Comprehensive timezone list for both onboarding and account settings
export const TIMEZONES = [
  // US Timezones
  { value: 'America/New_York', label: 'Eastern Time (UTC-5/-4)', group: 'US' },
  { value: 'America/Chicago', label: 'Central Time (UTC-6/-5)', group: 'US' },
  { value: 'America/Denver', label: 'Mountain Time (UTC-7/-6)', group: 'US' },
  { value: 'America/Phoenix', label: 'Arizona Time (UTC-7)', group: 'US' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8/-7)', group: 'US' },
  { value: 'America/Anchorage', label: 'Alaska Time (UTC-9/-8)', group: 'US' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (UTC-10)', group: 'US' },
  
  // Canada
  { value: 'America/Halifax', label: 'Atlantic Time (UTC-4/-3)', group: 'Canada' },
  { value: 'America/Toronto', label: 'Eastern Time (UTC-5/-4)', group: 'Canada' },
  { value: 'America/Winnipeg', label: 'Central Time (UTC-6/-5)', group: 'Canada' },
  { value: 'America/Edmonton', label: 'Mountain Time (UTC-7/-6)', group: 'Canada' },
  { value: 'America/Vancouver', label: 'Pacific Time (UTC-8/-7)', group: 'Canada' },
  
  // Europe
  { value: 'Europe/London', label: 'London (UTC+0/+1)', group: 'Europe' },
  { value: 'Europe/Dublin', label: 'Dublin (UTC+0/+1)', group: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (UTC+1/+2)', group: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (UTC+1/+2)', group: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (UTC+1/+2)', group: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (UTC+1/+2)', group: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (UTC+1/+2)', group: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm (UTC+1/+2)', group: 'Europe' },
  { value: 'Europe/Helsinki', label: 'Helsinki (UTC+2/+3)', group: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens (UTC+2/+3)', group: 'Europe' },
  { value: 'Europe/Moscow', label: 'Moscow (UTC+3)', group: 'Europe' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)', group: 'Asia' },
  { value: 'Asia/Karachi', label: 'Karachi (UTC+5)', group: 'Asia' },
  { value: 'Asia/Kolkata', label: 'Mumbai/Delhi (UTC+5:30)', group: 'Asia' },
  { value: 'Asia/Dhaka', label: 'Dhaka (UTC+6)', group: 'Asia' },
  { value: 'Asia/Bangkok', label: 'Bangkok (UTC+7)', group: 'Asia' },
  { value: 'Asia/Singapore', label: 'Singapore (UTC+8)', group: 'Asia' },
  { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)', group: 'Asia' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (UTC+8)', group: 'Asia' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)', group: 'Asia' },
  { value: 'Asia/Seoul', label: 'Seoul (UTC+9)', group: 'Asia' },
  
  // Australia & Oceania
  { value: 'Australia/Perth', label: 'Perth (UTC+8)', group: 'Australia' },
  { value: 'Australia/Adelaide', label: 'Adelaide (UTC+9:30/+10:30)', group: 'Australia' },
  { value: 'Australia/Darwin', label: 'Darwin (UTC+9:30)', group: 'Australia' },
  { value: 'Australia/Brisbane', label: 'Brisbane (UTC+10)', group: 'Australia' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+10/+11)', group: 'Australia' },
  { value: 'Australia/Melbourne', label: 'Melbourne (UTC+10/+11)', group: 'Australia' },
  { value: 'Pacific/Auckland', label: 'Auckland (UTC+12/+13)', group: 'Australia' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Cairo (UTC+2)', group: 'Africa' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (UTC+2)', group: 'Africa' },
  { value: 'Africa/Lagos', label: 'Lagos (UTC+1)', group: 'Africa' },
  
  // South America
  { value: 'America/Sao_Paulo', label: 'São Paulo (UTC-3)', group: 'South America' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (UTC-3)', group: 'South America' },
  { value: 'America/Lima', label: 'Lima (UTC-5)', group: 'South America' },
  { value: 'America/Bogota', label: 'Bogotá (UTC-5)', group: 'South America' },
];

// Group timezones by region for better UX
export const TIMEZONE_GROUPS = [
  { label: 'United States', value: 'US' },
  { label: 'Canada', value: 'Canada' },
  { label: 'Europe', value: 'Europe' },
  { label: 'Asia', value: 'Asia' },
  { label: 'Australia & Oceania', value: 'Australia' },
  { label: 'Africa', value: 'Africa' },
  { label: 'South America', value: 'South America' },
];

// Subscription status options
export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'cancelled', label: 'Cancelled' },
];