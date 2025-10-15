// Environment configuration
export const IS_LIVE = import.meta.env.VITE_APP_IS_LIVE === 'TRUE' || false;
export const BETA_MODE = import.meta.env.VITE_BETA_MODE === 'TRUE' || false;

// Application route configuration
export const ROUTES = {
  HOME: '/',
  HOMEPAGE: '/homepage',
  DASHBOARD: '/dashboard',
  DASHBOARD_HOME: '/dashboard/home',
  DASHBOARD_CALENDAR: '/dashboard/calendar',
  DASHBOARD_EMAIL: '/dashboard/email',
  DASHBOARD_OVERVIEW: '/dashboard/overview',
  DASHBOARD_ANALYTICS: '/dashboard/analytics',
  DASHBOARD_REPORTS: '/dashboard/reports',
  DASHBOARD_FAMILY: '/dashboard/family',
  DASHBOARD_FAMILY_MEMBERS: '/dashboard/family/members',
  DASHBOARD_FAMILY_ACTIVITIES: '/dashboard/family/activities',
  DASHBOARD_FAMILY_CONTACTS: '/dashboard/family/contacts',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  DASHBOARD_SETTINGS_PROFILE: '/dashboard/settings/profile',
  DASHBOARD_SETTINGS_ACCOUNT: '/dashboard/settings/account',
  DASHBOARD_SETTINGS_FAMILY: '/dashboard/settings/family',
  DASHBOARD_SETTINGS_MEMORY: '/dashboard/settings/memory',
  DASHBOARD_SETTINGS_NOTIFICATIONS: '/dashboard/settings/notifications',
  DASHBOARD_SETTINGS_INTEGRATIONS: '/dashboard/settings/integrations',
  DASHBOARD_SETTINGS_PLAN: '/dashboard/settings/plan',
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  SIGNUP: '/signup',
  RESET_PASSWORD: '/reset-password',
  RESET_PASSWORD_CONFIRM: '/reset-password-confirm',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  ADMIN: '/admin',
  STREAMING_TEST: '/streaming-test',
  OAUTH_CALLBACK: '/oauth/:provider/callback',
  SUPABASE_AUTH_CALLBACK: '/auth/callback',
} as const;

// Page titles configuration
export const PAGE_TITLES = {
  HOME: 'HomeOps - AI-Powered Family Operations',
  HOMEPAGE: 'HomeOps - Mental Load Operating System for High Performing Families',
  DASHBOARD: 'Dashboard - HomeOps',
  PRICING: 'Pricing - HomeOps',
  ABOUT: 'About - HomeOps', 
  CONTACT: 'Contact - HomeOps',
  LOGIN: 'Sign In - HomeOps',
  SIGNUP: 'Sign Up - HomeOps',
  RESET_PASSWORD: 'Reset Password - HomeOps',
  PRIVACY: 'Privacy Policy - HomeOps',
  TERMS: 'Terms of Service - HomeOps',
  ADMIN: 'Admin Panel - HomeOps',
} as const;

// Navigation items configuration
export const NAV_ITEMS = [
  { label: 'Home', path: ROUTES.HOME },
  { label: 'Dashboard', path: ROUTES.DASHBOARD },
  { label: 'Pricing', path: ROUTES.PRICING },
  { label: 'About', path: ROUTES.ABOUT },
  { label: 'Contact', path: ROUTES.CONTACT },
] as const;