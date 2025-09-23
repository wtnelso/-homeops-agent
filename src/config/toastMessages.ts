/**
 * Toast Messages Configuration
 *
 * Centralized configuration for all toast messages used throughout the application.
 * This makes it easy to update messages, maintain consistency, and support internationalization in the future.
 */

export const TOAST_MESSAGES = {
  // Profile Management
  PROFILE: {
    SAVE_SUCCESS: 'Profile saved successfully!',
    SAVE_ERROR: 'Failed to save profile. Please try again.',
    FIELD_UPDATE_SUCCESS: 'Field updated successfully!',
    FIELD_UPDATE_ERROR: 'Failed to update field. Please try again.',
  },

  // Family Members
  FAMILY_MEMBER: {
    ADD_SUCCESS: 'Family member added successfully!',
    ADD_ERROR: 'Failed to add family member. Please try again.',
    UPDATE_SUCCESS: 'Family member updated successfully!',
    UPDATE_ERROR: 'Failed to update family member. Please try again.',
    DELETE_SUCCESS: 'Family member removed successfully!',
    DELETE_ERROR: 'Failed to remove family member. Please try again.',
  },

  // Schools
  SCHOOL: {
    ADD_SUCCESS: 'School added successfully!',
    ADD_ERROR: 'Failed to add school. Please try again.',
    UPDATE_SUCCESS: 'School information updated successfully!',
    UPDATE_ERROR: 'Failed to update school information. Please try again.',
    DELETE_SUCCESS: 'School removed successfully!',
    DELETE_ERROR: 'Failed to remove school. Please try again.',
  },

  // Activities
  ACTIVITY: {
    ADD_SUCCESS: 'Activity added successfully!',
    ADD_ERROR: 'Failed to add activity. Please try again.',
    UPDATE_SUCCESS: 'Activity updated successfully!',
    UPDATE_ERROR: 'Failed to update activity. Please try again.',
    DELETE_SUCCESS: 'Activity removed successfully!',
    DELETE_ERROR: 'Failed to remove activity. Please try again.',
  },

  // Pets
  PET: {
    ADD_SUCCESS: 'Pet added successfully!',
    ADD_ERROR: 'Failed to add pet. Please try again.',
    UPDATE_SUCCESS: 'Pet information updated successfully!',
    UPDATE_ERROR: 'Failed to update pet information. Please try again.',
    DELETE_SUCCESS: 'Pet removed successfully!',
    DELETE_ERROR: 'Failed to remove pet. Please try again.',
  },

  // Authentication & User Management
  AUTH: {
    LOGIN_SUCCESS: 'Successfully logged in!',
    LOGIN_ERROR: 'Login failed. Please check your credentials.',
    LOGOUT_SUCCESS: 'Successfully logged out!',
    LOGOUT_ERROR: 'Failed to logout. Please try again.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    ACCESS_DENIED: 'Access denied. Please check your permissions.',
  },

  // Data Operations
  DATA: {
    SAVE_SUCCESS: 'Data saved successfully!',
    SAVE_ERROR: 'Failed to save data. Please try again.',
    LOAD_SUCCESS: 'Data loaded successfully!',
    LOAD_ERROR: 'Failed to load data. Please refresh the page.',
    DELETE_SUCCESS: 'Data deleted successfully!',
    DELETE_ERROR: 'Failed to delete data. Please try again.',
    SYNC_SUCCESS: 'Data synchronized successfully!',
    SYNC_ERROR: 'Failed to synchronize data. Please try again.',
  },

  // Form Validation
  VALIDATION: {
    REQUIRED_FIELDS: 'Please fill in all required fields.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_PHONE: 'Please enter a valid phone number.',
    INVALID_DATE: 'Please enter a valid date.',
    PASSWORD_MISMATCH: 'Passwords do not match.',
    WEAK_PASSWORD: 'Password must be at least 8 characters long.',
  },

  // Network & System
  SYSTEM: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    MAINTENANCE: 'System is under maintenance. Please try again later.',
    RATE_LIMIT: 'Too many requests. Please wait before trying again.',
    TIMEOUT: 'Request timed out. Please try again.',
  },

  // Generic Messages
  GENERIC: {
    SUCCESS: 'Operation completed successfully!',
    ERROR: 'An error occurred. Please try again.',
    WARNING: 'Please review your input and try again.',
    INFO: 'Information updated.',
    COMING_SOON: 'This feature is coming soon!',
    NO_DATA: 'No data available.',
    LOADING: 'Loading...',
    PROCESSING: 'Processing your request...',
  }
} as const;

// Helper function to get nested messages with type safety
export const getToastMessage = (category: keyof typeof TOAST_MESSAGES, key: string): string => {
  const categoryMessages = TOAST_MESSAGES[category] as Record<string, string>;
  return categoryMessages[key] || TOAST_MESSAGES.GENERIC.ERROR;
};

// Export specific message groups for easier imports
export const profileMessages = TOAST_MESSAGES.PROFILE;
export const familyMemberMessages = TOAST_MESSAGES.FAMILY_MEMBER;
export const schoolMessages = TOAST_MESSAGES.SCHOOL;
export const activityMessages = TOAST_MESSAGES.ACTIVITY;
export const petMessages = TOAST_MESSAGES.PET;
export const authMessages = TOAST_MESSAGES.AUTH;
export const dataMessages = TOAST_MESSAGES.DATA;
export const validationMessages = TOAST_MESSAGES.VALIDATION;
export const systemMessages = TOAST_MESSAGES.SYSTEM;
export const genericMessages = TOAST_MESSAGES.GENERIC;