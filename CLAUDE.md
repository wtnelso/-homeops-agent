# HomeOps Agent - Claude Code Integration

## Project Overview
HomeOps Agent is a personal AI assistant for home operations management, focusing on email intelligence and family logistics coordination.

## Development Commands

### Local Development
```bash
# Install dependencies (from root directory)
npm install

# Frontend Development (React + Vite)
npm run dev              # Start Vite dev server with hot reload

# Build React application
npm run build           # Build React app to dist/ folder

# Backend Development
npm start               # Start simple server (no API keys needed)
npm run server          # Start full server (requires API keys in .env)
npm run serve           # Build React app and serve with backend

# Testing
npm test                # Run server tests
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
- `react-server.js` - React app server (serves from dist/)
- `src/` - React application source code (TypeScript + Vite)
- `services/` - Core business logic modules
- `dist/` - Built React application files
- `public/` - Static assets
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
- **Frontend development**: Use `npm run dev` for React development with hot reload
- **Quick local testing**: Use `npm start` (no API keys needed)  
- **Full functionality**: Configure `.env` file and use `npm run server`
- **Production build**: Use `npm run serve` to build and serve the full application
- **Deploy changes**: Push to main branch for auto-deployment
- **Debug issues**: Check server logs and browser console

## Architecture Notes
- Node.js/Express backend
- Firebase/Firestore for data storage
- OAuth 2.0 for Gmail integration
- OpenAI API for intelligent processing
- Render.com for hosting