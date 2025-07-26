# Gmail OAuth Setup for HomeOps

## Current Status: Development Mode ✅
The onboarding flow is now working in development mode, skipping real Gmail OAuth to demonstrate the complete user experience.

## To Enable Real Gmail OAuth:

### 1. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: "HomeOps Email Intelligence"
3. Enable Gmail API:
   - APIs & Services → Library → Search "Gmail API" → Enable

### 2. OAuth Credentials
1. APIs & Services → Credentials → Create Credentials → OAuth Client ID
2. Configure OAuth consent screen:
   - App name: "HomeOps"
   - User support email: your email
   - Add scopes: `https://www.googleapis.com/auth/gmail.readonly`
3. Create Web Application credentials:
   - Authorized redirect URIs: `http://localhost:3000/auth/gmail/callback`

### 3. Environment Setup
Create `.env` file with your credentials:
```
GOOGLE_CLIENT_ID=your_actual_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/auth/gmail/callback
```

### 4. Update Server Code
In `homeops-proper-onboarding.js`, change line 10-12 to use real credentials:
```javascript
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,     // Remove 'your-client-id' fallback
  process.env.GOOGLE_CLIENT_SECRET, // Remove 'your-client-secret' fallback
  process.env.GMAIL_REDIRECT_URI
);
```

## Current Working Flow (Development Mode):
1. ✅ Landing page with form
2. ✅ Gmail OAuth (skipped in dev mode)
3. ✅ Animated scanning process
4. ✅ Calibration with 20 diverse emails

## Next Steps:
- Complete the 20-email calibration to test the Mental Load Assistant
- Set up real Gmail OAuth when ready for production
- The development flow demonstrates the complete user experience
