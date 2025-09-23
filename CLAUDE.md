# HomeOps Agent - Claude Code Integration

## Project Overview
Personal AI assistant for home operations management with email intelligence and family logistics coordination.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Hosting**: Vercel (frontend) + Render.com (email processing server)
- **Database**: Supabase (main) + Neon DB (AI conversations)
- **Authentication**: Supabase Auth with Google OAuth
- **AI/Chat**: LangChain + OpenAI GPT-4o-mini + agent memory system
- **Email Processing**: Express.js server with LangChain for heavy AI analysis

## Key Features
- **AI Chat Assistant**: Conversational AI with persistent memory and email context
- **Email Intelligence**: Gmail integration with semantic search and analysis
- **Agent Memory**: Smart information extraction and temporal filtering
- **User Management**: Authentication, profiles, account settings with beta access control
- **Admin Panel**: Founder access for platform management

## Development Commands
```bash
# Frontend development
npm run dev              # Start frontend dev server
npm run build           # Build for production

# Backend development
cd server && npm run dev # Start email processing server

# Deployment
git push origin dev     # Auto-deploys to Vercel + Render
```

## Environment Variables
```bash
# Core Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
NEON_DATABASE_URL=postgresql://user:pass@host/db
OPENAI_API_KEY=your-openai-key

# Email Processing Server
VITE_RENDER_SERVER_URL=http://localhost:10000

# Access Control
VITE_BETA_MODE=TRUE     # Enable/disable beta access control
```

## Project Structure
```
src/                     # React frontend
├── components/         # React components (ui/, dashboard/, settings/)
├── services/          # API services and business logic
└── contexts/          # React Context providers

server/                 # Email processing server (Render.com)
├── src/config/        # Configuration files
├── src/services/      # Backend services (agentMemoryService, etc.)
├── src/routes/        # Express API routes
└── src/tools/         # LangChain tools for AI

api/                   # Vercel serverless functions
```

## 🧠 Agent Memory System
**Configuration**: `/server/src/config/agentMemoryConfig.js`
- **Smart Temporal Filtering**: Automatically includes expired memories for historical queries
- **Pattern Extraction**: Configurable regex patterns for family, preferences, schedules
- **Type Defaults**: Automatic confidence scores, priorities, expiration rules per memory type
- **Query Detection**: Distinguishes past/present/future queries for appropriate memory filtering

**Examples**:
- `"What did my kid do last week?"` → Includes expired memories
- `"What's my child's schedule?"` → Only active memories

## 🚀 Hybrid Architecture: Vercel + Render
- **Vercel**: Fast API responses, static site deployment
- **Render**: Long-running email processing, LangChain operations
- **Integration**: Shared database, environment-based URL routing

## Key Services
- **UserSessionService**: Authentication and session management
- **AgentMemoryService**: AI memory extraction and retrieval with config-based logic
- **EdgeFunctionChatService**: Frontend chat integration with full URL support
- **AdminService**: Beta access and admin user management

## Recent Enhancements
1. **Configurable Agent Memory**: All memory logic moved to config files for easy updates
2. **Smart Historical Queries**: Automatic detection of past vs present questions
3. **Chat Debugging**: Enhanced logging for frontend-backend communication
4. **Beta Access Control**: Post-authentication user gating system
5. **Admin Panel**: Secure founder access for platform management

## Development Guidelines
- **Configuration-First**: Use config files for AI behavior, patterns, and defaults
- **TypeScript**: All new code must have proper type definitions
- **Component Composition**: Small, reusable components over large ones
- **Error Handling**: Structured responses with user-friendly messages
- **Security**: Multi-layer file validation, RLS policies, JWT validation

## Deployment
- **Frontend**: Auto-deploys from dev branch to Vercel
- **Backend**: Auto-deploys from dev branch to Render.com
- **Environment**: Use environment variables for all configuration
- **Testing**: Test locally with both services running before deployment