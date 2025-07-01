# HomeOps Agent - Project Context Summary

## Project Overview
HomeOps Agent is a Gmail-integrated AI assistant that processes emails and provides intelligent responses. The project uses Firebase for data storage, Gmail OAuth for email access, and OpenAI for AI processing.

## Current Status
- ✅ **Fixed**: Gmail OAuth token storage issue (cleaned up 25 old timestamp-based tokens)
- ✅ **Working**: Firebase initialization via environment variables
- ✅ **Working**: Local development server (port 3000)
- ✅ **Working**: Render deployment (https://homeops-agent.onrender.com)
- 🔄 **Ready**: User needs to reconnect Gmail after token cleanup

## Key Technical Details

### Environment Variables (Render)
```
FIREBASE_CREDENTIALS=<base64-encoded-service-account>
GMAIL_OAUTH_CLIENT_ID=242818294886-jujpis5fu57kmn8djcng0um75v0ivm76.apps.googleusercontent.com
GMAIL_OAUTH_CLIENT_SECRET=<your-client-secret>
GMAIL_OAUTH_REDIRECT_URI=https://homeops-agent.onrender.com/auth/google/callback
OPENAI_API_KEY=<your-openai-key>
```

### Google Cloud Console OAuth Setup
- **Client ID**: `242818294886-jujpis5fu57kmn8djcng0um75v0ivm76.apps.googleusercontent.com`
- **Authorized Redirect URIs**:
  - `http://localhost:3000/auth/google/callback` (local development)
  - `https://homeops-agent.onrender.com/auth/google/callback` (production)

### Firebase Collections
- `gmail_tokens` - Stores OAuth tokens (document ID: `test_user`)
- `decoded_emails` - Stores processed email data
- `knowledge_chunks` - Stores AI knowledge base

### Key Files
- `index.cjs` - Main server file (1871 lines)
- `public/dashboard.html` - Main UI
- `public/dashboard.js` - Frontend logic
- `clear-gmail-tokens.js` - Token cleanup utility

## Recent Issues & Solutions

### 1. Gmail OAuth Token Storage Issue
**Problem**: Tokens were being stored with timestamp-based document IDs instead of user IDs
**Solution**: Created cleanup script that removed 25 old tokens, keeping only `test_user` document
**Status**: ✅ Fixed

### 2. Local Server Memory Issues
**Problem**: Server getting killed due to memory pressure
**Solution**: Added memory optimization settings and garbage collection
**Status**: ✅ Improved

### 3. Port Conflicts
**Problem**: EADDRINUSE errors when restarting server
**Solution**: Added port killing commands in terminal
**Status**: ✅ Workaround available

## Current User Flow
1. User visits dashboard
2. Clicks "Connect Gmail" 
3. OAuth flow redirects to Google
4. User authorizes access
5. Tokens stored in Firebase under `test_user` document
6. Email processing begins

## Next Steps for New Chat
1. **Test Gmail Connection**: User needs to reconnect Gmail after token cleanup
2. **Verify OAuth Flow**: Ensure tokens are stored correctly under `test_user`
3. **Test Email Processing**: Confirm emails are fetched and processed
4. **Monitor Memory Usage**: Watch for memory issues in production

## Development Commands
```bash
# Start local server
npm start

# Kill port 3000 and restart
lsof -ti:3000 | xargs kill -9 2>/dev/null || true && sleep 2 && npm start

# Clean up Gmail tokens
node clear-gmail-tokens.js

# Deploy to Render
./deploy-to-render.sh
```

## Important Notes
- Always use `test_user` as the user ID for consistency
- Tokens are stored in Firebase with document ID `test_user`
- Local development uses `http://localhost:3000/auth/google/callback`
- Production uses `https://homeops-agent.onrender.com/auth/google/callback`
- Memory optimization is critical for Render deployment

## Known Limitations
- Limited to 2 emails per processing run (memory optimization)
- Requires manual Gmail reconnection after token cleanup
- Local server may need frequent restarts due to memory pressure

This summary provides complete context for continuing development in a new chat session. 