# Gmail OAuth Setup for Email Decoder Engine

This guide will help you set up Gmail OAuth credentials for the HomeOps Email Decoder Engine.

## Prerequisites

- Google account
- Access to Google Cloud Console
- HomeOps backend running locally or deployed

## Step 1: Google Cloud Console Setup

### 1.1 Access Google Cloud Console
1. Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Sign in with your Google account

### 1.2 Create or Select Project
1. If you have an existing project, select it from the dropdown
2. If not, click "New Project" and create one named "HomeOps Email Decoder"

### 1.3 Enable Gmail API
1. In the left sidebar, go to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" in the results
4. Click "Enable" button

## Step 2: Configure OAuth Consent Screen

### 2.1 Create OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Click "Create"

### 2.2 Fill in App Information
- **App name**: `HomeOps Email Decoder`
- **User support email**: Your email address
- **App logo**: Optional - you can add the HomeOps logo
- **App domain**: Leave blank for now
- **Developer contact information**: Your email address

### 2.3 Add Scopes
1. Click "Add or remove scopes"
2. Find and select: `https://www.googleapis.com/auth/gmail.readonly`
3. Click "Update"

### 2.4 Add Test Users
1. Click "Add users"
2. Add your email address as a test user
3. Click "Add"

### 2.5 Save and Continue
1. Review the summary
2. Click "Back to dashboard"

## Step 3: Create OAuth 2.0 Credentials

### 3.1 Create Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"

### 3.2 Configure OAuth Client
- **Application type**: Web application
- **Name**: `HomeOps Email Decoder Web Client`

### 3.3 Add Authorized Redirect URIs
Add these redirect URIs:

**For Development:**
```
http://localhost:3000/api/gmail/oauth/callback
```

**For Production (replace with your domain):**
```
https://your-homeops-domain.com/api/gmail/oauth/callback
```

### 3.4 Create Client
1. Click "Create"
2. **IMPORTANT**: Copy the Client ID and Client Secret immediately
3. You won't be able to see the Client Secret again

## Step 4: Set Environment Variables

### 4.1 Local Development
Add these to your `.env` file:

```bash
# Gmail OAuth Credentials
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
```

### 4.2 Production (Render)
1. Go to your Render dashboard
2. Select your HomeOps backend service
3. Go to "Environment" tab
4. Add these environment variables:
   - `GMAIL_CLIENT_ID`: Your Gmail Client ID
   - `GMAIL_CLIENT_SECRET`: Your Gmail Client Secret
5. Redeploy the service

## Step 5: Test the Setup

### 5.1 Start Your Server
```bash
npm start
```

### 5.2 Test Gmail Connection
1. Go to your HomeOps app
2. Navigate to the Email Decoder Engine
3. Click "Connect Gmail"
4. You should be redirected to Google's OAuth consent screen
5. Authorize the application
6. You should be redirected back to HomeOps

## Step 6: Production Deployment

### 6.1 Update OAuth Consent Screen
1. Go back to Google Cloud Console
2. Navigate to "OAuth consent screen"
3. Add your production domain to "Authorized domains"
4. Publish the app (if ready for production)

### 6.2 Update Redirect URIs
1. Go to "Credentials" > Your OAuth client
2. Add your production redirect URI
3. Remove the localhost URI for production

## Troubleshooting

### Common Issues

**"redirect_uri_mismatch" Error**
- Ensure the redirect URI in Google Cloud Console matches exactly
- Check for trailing slashes or protocol differences

**"access_denied" Error**
- Make sure you're using a test user email
- Check that the Gmail API is enabled

**"invalid_client" Error**
- Verify your Client ID and Client Secret are correct
- Check that environment variables are properly set

### Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables for all secrets**
3. **Rotate credentials regularly**
4. **Use HTTPS in production**
5. **Limit OAuth scopes to minimum required**

## Next Steps

Once Gmail OAuth is working:

1. **Test email processing**: Try processing some emails
2. **Verify decoded emails**: Check that emails are being stored in Firestore
3. **Test the Home Base UI**: Ensure decoded emails appear in the interface
4. **Monitor usage**: Check Google Cloud Console for API usage

## Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure the Gmail API is enabled in your Google Cloud project
4. Check that your OAuth consent screen is properly configured

## API Endpoints

The Email Decoder Engine provides these endpoints:

- `GET /api/gmail/oauth/url` - Get OAuth authorization URL
- `GET /api/gmail/oauth/callback` - Handle OAuth callback
- `POST /api/gmail/process` - Process emails with AI
- `GET /api/gmail/decoded` - Get decoded emails for user

All endpoints require Firebase authentication and proper Gmail OAuth setup. 