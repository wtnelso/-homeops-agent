export const GMAIL_CONFIG = {
  clientId: import.meta.env.VITE_GMAIL_CLIENT_ID,
  redirectUri: `${window.location.origin}/oauth/gmail/callback`,
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly'
  ],
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
};