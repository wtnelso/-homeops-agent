// Google Calendar OAuth Configuration
console.log('🔧 Loading Google Calendar config...');
console.log('🌍 Environment check:', {
  origin: window.location.origin,
  env: import.meta.env.MODE,
  clientId: import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID ? 'SET' : 'MISSING'
});

export const GOOGLE_CALENDAR_CONFIG = {
  clientId: import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID,
  redirectUri: `${window.location.origin}/oauth/google-calendar/callback`,
  scopes: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.owned'
  ],
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
};

console.log('📋 Google Calendar Config loaded:', {
  redirectUri: GOOGLE_CALENDAR_CONFIG.redirectUri,
  scopesCount: GOOGLE_CALENDAR_CONFIG.scopes.length,
  authUrl: GOOGLE_CALENDAR_CONFIG.authUrl
});