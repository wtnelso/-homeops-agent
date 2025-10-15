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

### Database Operations
- **Always Use MCP Tools**: For any database operations (Supabase OR Neon), use the respective MCP tools rather than direct SQL or API calls
- **Supabase MCP**: Use `mcp__supabase__*` tools for auth, tables, migrations, queries
- **Neon MCP**: Use `mcp__neon__*` tools for AI conversation database operations
- **Migration Safety**: Use MCP migration tools with temporary branches for testing before applying to main

### Security Best Practices
- **JWT Tokens**: Always use JWT for authentication and session management
- **Multi-layer Protection**: RLS policies, server-side validation, client-side guards
- **Token Validation**: Verify JWT signatures server-side, never trust client-only validation
- **Secure Headers**: Implement proper CORS, CSP, and security headers
- **Environment Secrets**: Never commit secrets, use environment variables exclusively

### UI/UX Standards
- **Lucide Icons**: Use Lucide React icons as the default icon library for consistency
- **Purple Gradient Branding**: Primary actions use `linear-gradient(135deg, #6366f1, #8b5cf6)`
- **Dark Theme**: Base colors `#0f0f23` (background) and `#cbd5e1` (text)
- **Component Library**: Build reusable UI components in `src/components/ui/`
- **Mobile-First**: Design responsive components with mobile as primary consideration

### Code Quality
- **Configuration-First**: Use config files for AI behavior, patterns, and defaults
- **TypeScript**: All new code must have proper type definitions
- **Component Composition**: Small, reusable components over large ones
- **Error Handling**: Structured responses with user-friendly messages
- **Testing**: Write tests for critical business logic and user flows

### Critical Thinking
- **Challenge Assumptions**: Always question requirements and propose alternative approaches
- **Consider Edge Cases**: Think through error states, loading states, and failure scenarios
- **Performance Impact**: Evaluate database queries, API calls, and bundle size implications
- **Security Implications**: Consider potential vulnerabilities and attack vectors
- **User Experience**: Question if the proposed solution truly improves the user experience

## Deployment
- **Frontend**: Auto-deploys from dev branch to Vercel
- **Backend**: Auto-deploys from dev branch to Render.com
- **Environment**: Use environment variables for all configuration
- **Testing**: Test locally with both services running before deployment