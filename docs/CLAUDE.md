# HomeOps Agent - Claude Code Integration

## Project Overview
HomeOps Agent is a personal AI assistant for home operations management, focusing on email intelligence and family logistics coordination.

## Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Start development server (simple version)
node simple-server.js

# Start full server (requires API keys)
node quick-server.js

# Development mode with auto-restart
npm run dev
```

### Testing
```bash
# Run basic server test
npm start

# Test specific components
node test-server.js
```

### Deployment
```bash
# Deploy to Render
./deploy-to-render.sh

# Manual deployment
git add .
git commit -m "Deploy updates"
git push origin main
```

## Key Files
- `simple-server.js` - Basic server without external dependencies
- `quick-server.js` - Full server with all integrations
- `services/` - Core business logic modules
- `public/` - Frontend files
- `.env.example` - Environment variable template

## Required Environment Variables
```bash
# OpenAI API (for AI processing)
OPENAI_API_KEY=your-openai-api-key

# Gmail API (for Email Intelligence)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/auth/gmail/callback

# Amadeus API (for flight search)
AMADEUS_API_KEY=your-amadeus-api-key
AMADEUS_API_SECRET=your-amadeus-api-secret

# Firebase (for data storage)
FIREBASE_PROJECT_ID=your-firebase-project-id
# ... additional Firebase credentials
```

## Common Tasks
- **Quick local testing**: Use `node simple-server.js` (no API keys needed)
- **Full functionality**: Configure `.env` file and use `node quick-server.js`
- **Deploy changes**: Push to main branch for auto-deployment
- **Debug issues**: Check server logs and browser console

## Architecture Notes
- Node.js/Express backend
- Firebase/Firestore for data storage
- OAuth 2.0 for Gmail integration
- OpenAI API for intelligent processing
- Render.com for hosting