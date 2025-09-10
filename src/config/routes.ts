// Environment configuration
export const IS_LIVE = import.meta.env.VITE_APP_IS_LIVE === 'TRUE' || false;
export const BETA_MODE = import.meta.env.VITE_BETA_MODE === 'TRUE' || false;

// Application route configuration
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  DASHBOARD_HOME: '/dashboard/home',
  DASHBOARD_CALENDAR: '/dashboard/calendar',
  DASHBOARD_EMAIL: '/dashboard/email',
  DASHBOARD_OVERVIEW: '/dashboard/overview',
  DASHBOARD_ANALYTICS: '/dashboard/analytics',
  DASHBOARD_REPORTS: '/dashboard/reports',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  DASHBOARD_SETTINGS_PROFILE: '/dashboard/settings/profile',
  DASHBOARD_SETTINGS_ACCOUNT: '/dashboard/settings/account',
  DASHBOARD_SETTINGS_NOTIFICATIONS: '/dashboard/settings/notifications',
  DASHBOARD_SETTINGS_INTEGRATIONS: '/dashboard/settings/integrations',
  DASHBOARD_SETTINGS_PLAN: '/dashboard/settings/plan',
  ONBOARDING: '/onboarding',
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  SIGNUP: '/signup',
  RESET_PASSWORD: '/reset-password',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  ADMIN: '/admin',
  OAUTH_CALLBACK: '/oauth/:provider/callback',
  SUPABASE_AUTH_CALLBACK: '/auth/callback',
} as const;

// Page titles configuration
export const PAGE_TITLES = {
  HOME: 'HomeOps - AI-Powered Family Operations',
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