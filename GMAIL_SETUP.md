# Gmail OAuth Setup for Email Decoder Engine

## Overview
The Email Decoder Engine requires Gmail OAuth credentials to access and process emails. This guide walks you through setting up the necessary Google Cloud Console project and credentials.

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "HomeOps Email Decoder")
4. Click "Create"

### 1.2 Enable Gmail API
1. In your project, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" → "Enable"

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - User Type: External
   - App name: "HomeOps Email Decoder"
   - User support email: Your email
   - Developer contact information: Your email
   - Save and continue through the steps

4. Create OAuth Client ID:
   - Application type: Web application
   - Name: "HomeOps Web Client"
   - Authorized redirect URIs: 
     - `http://localhost:3000/auth/google/callback` (for development)
     - `https://your-domain.com/auth/google/callback` (for production)
   - Click "Create"

5. **Save the credentials** - you'll get a Client ID and Client Secret

## Step 2: Environment Variables

Add these to your `.env` file:

```bash
# Gmail OAuth Credentials
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## Step 3: Testing the Setup

### 3.1 Start the Server
```bash
npm start
```

### 3.2 Test Gmail Connection
1. Open your app at `http://localhost:3000`
2. Go to the Home view
3. Click "Connect Gmail" in the Email Decoder Engine card
4. You should be redirected to Google's OAuth consent screen
5. Grant permissions to access Gmail
6. You should be redirected back to your app

### 3.3 Test Email Processing
1. After connecting Gmail, click "Process Emails"
2. The system will fetch and decode your recent emails
3. You should see decoded email cards with:
   - Family Signals (school, healthcare, logistics)
   - Smart Deals (brand loyalty, promotions)
   - Priority levels and action items

## Step 4: Production Deployment

### 4.1 Update Redirect URIs
1. Go back to Google Cloud Console
2. Update your OAuth client with production redirect URI
3. Add your production domain to authorized redirect URIs

### 4.2 Environment Variables
Set these in your production environment:
```bash
GMAIL_CLIENT_ID=your_production_client_id
GMAIL_CLIENT_SECRET=your_production_client_secret
GMAIL_REDIRECT_URI=https://your-domain.com/auth/google/callback
```

## Security Considerations

### 4.1 OAuth Consent Screen
- Add your production domain to authorized domains
- Add privacy policy and terms of service URLs
- Request verification for production use (if needed)

### 4.2 Token Storage
- Gmail tokens are stored securely in Firestore
- Tokens are encrypted and tied to user IDs
- Implement token refresh logic for long-term access

### 4.3 Data Privacy
- Only read access to Gmail (no write permissions)
- Process emails locally, don't store raw email content
- Store only decoded, structured data
- Implement data retention policies

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Check that your redirect URI exactly matches what's in Google Cloud Console
   - Ensure no trailing slashes or typos

2. **"Access denied"**
   - Verify your OAuth consent screen is configured
   - Check that Gmail API is enabled
   - Ensure your app is in testing or published

3. **"Quota exceeded"**
   - Gmail API has daily quotas
   - Implement rate limiting in production
   - Monitor API usage in Google Cloud Console

4. **"Token expired"**
   - Implement automatic token refresh
   - Handle token expiration gracefully
   - Prompt user to reconnect if needed

### Debug Mode
Enable debug logging by adding to your `.env`:
```bash
DEBUG_GMAIL=true
```

## Next Steps

Once Gmail OAuth is working:

1. **Implement Brand Loyalty Engine**
   - Track purchase patterns
   - Build loyalty profiles
   - Surface relevant deals

2. **Add Email Scheduling**
   - Process emails periodically
   - Send notifications for high-priority items
   - Implement smart filtering

3. **Enhance AI Processing**
   - Improve email categorization
   - Extract more structured data
   - Add sentiment analysis

4. **Mobile Optimization**
   - Responsive email cards
   - Touch-friendly interactions
   - Push notifications

## Support

For issues with:
- **Google Cloud Console**: Check Google's documentation
- **OAuth Flow**: Review OAuth 2.0 best practices
- **Gmail API**: Consult Gmail API documentation
- **HomeOps Integration**: Check server logs and browser console 