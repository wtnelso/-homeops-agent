// Application route configuration
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PRICING: '/pricing',
  ABOUT: '/about',
  CONTACT: '/contact',
  LOGIN: '/login',
  SIGNUP: '/signup',
  PRIVACY: '/privacy',
  TERMS: '/terms',
} as const;

// Feature flag configuration
export const IS_LIVE = import.meta.env.VITE_APP_IS_LIVE === 'true' || false;

// Page titles configuration
export const PAGE_TITLES = {
  HOME: 'HomeOps - AI-Powered Family Operations',
  DASHBOARD: 'Dashboard - HomeOps',
  PRICING: 'Pricing - HomeOps',
  ABOUT: 'About - HomeOps', 
  CONTACT: 'Contact - HomeOps',
  LOGIN: 'Sign In - HomeOps',
  SIGNUP: 'Sign Up - HomeOps',
  PRIVACY: 'Privacy Policy - HomeOps',
  TERMS: 'Terms of Service - HomeOps',
} as const;

// Navigation items configuration
export const NAV_ITEMS = [
  { label: 'Home', path: ROUTES.HOME },
  { label: 'Dashboard', path: ROUTES.DASHBOARD },
  { label: 'Pricing', path: ROUTES.PRICING },
  { label: 'About', path: ROUTES.ABOUT },
  { label: 'Contact', path: ROUTES.CONTACT },
] as const;