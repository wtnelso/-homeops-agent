/**
 * Authentication Images Configuration
 *
 * Centralized configuration for all auth page images including
 * background images and hero images.
 */

export const AUTH_IMAGES = {
  // Background images for auth pages
  backgrounds: {
    login: '/images/login-background.png',
    signup: '/images/signup-background.png',
    resetPassword: '/images/reset-password-background.png',
    resetPasswordConfirm: '/images/new-password-background.png'
  },

  // Background positioning for each page
  backgroundPositions: {
    login: '97% center',
    signup: '60% center',
    resetPassword: '57% center',
    resetPasswordConfirm: '97% center'
  },

  // Hero images
  hero: {
    favicon: '/homeops_logo.png',
    logo: '/homeops_logo.png'
  },

  // Alternative logos for different contexts
  logos: {
    google: '/google-logo.svg'
  }
} as const;

export type AuthImageKey = keyof typeof AUTH_IMAGES.backgrounds;