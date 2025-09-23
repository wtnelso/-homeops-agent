# HomeOps AI Chatbot Architecture Documentation

## Overview
This document provides a comprehensive technical guide to the AI systems implemented in HomeOps. The application uses a hybrid architecture with three integrated AI processing systems:

1. **AI Chat System**: LangChain + OpenAI + Neon PostgreSQL (Vercel serverless functions)
2. **Email Processing System**: LangChain + OpenAI + Supabase (Render.com long-running server)
3. **Intelligent Semantic Search**: Vector search with automatic context retrieval (integrated into chat)

## Hybrid Architecture Overview

The HomeOps platform uses a hybrid deployment strategy to optimize for both speed and processing capabilities:
- **Vercel**: Fast frontend + quick API responses + AI chat system  
- **Render.com**: Long-running email processing server without timeout limits

## System Architecture Diagram

```
                    ┌─────────────────────────────────┐
                    │          React App              │
                    │         (Vercel CDN)            │
                    │                                 │
                    │ - Dashboard UI                  │
                    │ - Intelligent Chat Interface   │
                    │ - Email Testing Interface      │
                    └─────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
    ┌─────────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
    │   Vercel Functions  │ │   Supabase DB   │ │   Render.com Server │
    │   (Fast APIs)       │ │  (Main Data +   │ │  (Email Processing) │
    │                     │ │ Vector Search)  │ │                     │
    │ - /api/chat.js      │ │ - users         │ │ - Express.js        │
    │ - /api/conversations│ │ - accounts      │ │ - Gmail Service     │
    │ - /api/email-*      │ │ - email_*       │ │ - LangChain         │
    │ - /api/semantic-*   │ │ - embeddings    │ │ - Vector Generation │
    └─────────────────────┘ └─────────────────┘ └─────────────────────┘
                │                   │                       │
                │            ┌──────┼──────┐                │
                ▼            ▼      ▼      ▼                ▼
    ┌─────────────────────┐ ┌──────────────┐ ┌─────────────────────┐
    │     Neon DB         │ │ pgvector     │ │     OpenAI API      │
    │  (Chat Storage)     │ │ (Semantic    │ │   (AI Processing)   │
    │                     │ │  Search)     │ │                     │
    │ - conversations     │ │ - Embeddings │ │ - GPT-4o-mini       │
    │ - messages          │ │ - Similarity │ │ - text-embedding-   │
    │ - context summaries │ │   Search     │ │   3-small           │
    └─────────────────────┘ └──────────────┘ └─────────────────────┘

Key Integration Points:
- Vercel → Render: HTTP calls for email processing
- Vercel ↔ Supabase: Real-time semantic search + user data
- Chat API → Semantic Search: Automatic context retrieval
- All systems → OpenAI: Unified AI processing
- Neon → Conversation management with smart context
```

## System Components

### 1. Frontend (React)
**Location**: `src/components/dashboard/HomePage.tsx`
- **Chat Interface**: Real-time messaging UI
- **Message History**: Conversation persistence
- **User Authentication**: Supabase auth integration

### 2. Backend (Vercel Serverless Functions)
**Location**: `/api/` directory

#### 2.1 Chat API (`/api/chat.js`)
**Purpose**: Handles individual message processing and AI response generation

**Key Responsibilities**:
- Receives user messages
- Manages conversation context
- Generates AI responses via LangChain
- Stores messages in Neon DB

**Request Flow**:
```javascript
POST /api/chat
{
  "message": "Help me plan dinner for tonight",
  "conversationId": "uuid-or-null", 
  "userId": "supabase-user-id",
  "accountId": "supabase-account-id"
}
```

**Response**:
```javascript
{
  "success": true,
  "conversationId": "generated-uuid",
  "messages": [
    {
      "id": "msg-id",
      "role": "user|assistant",
      "content": "message text",
      "timestamp": "2025-01-10T...",
      "metadata": {...}
    }
  ]
}
```

#### 2.2 Conversations API (`/api/conversations.js`)
**Purpose**: Manages conversation CRUD operations

**Supported Operations**:
- **List conversations**: Get user's conversation history
- **Delete conversation**: Remove conversation and all messages
- **Update conversation**: Rename conversation titles

**Examples**:
```javascript
// List conversations
POST /api/conversations
{
  "action": "list",
  "userId": "user-id",
  "accountId": "account-id",
  "limit": 20
}

// Delete conversation
DELETE /api/conversations
{
  "conversationId": "conv-id",
  "userId": "user-id"
}

// Update conversation title
PUT /api/conversations
{
  "conversationId": "conv-id", 
  "userId": "user-id",
  "title": "New Title"
}
```

### 3. Database (Neon PostgreSQL)

#### 3.1 Database Schema

```sql
-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,        -- Links to Supabase auth.users
  account_id UUID NOT NULL,     -- Links to Supabase accounts table
  title VARCHAR(255),           -- Auto-generated from first message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'   -- Extensible conversation data
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,        -- The actual message content
  metadata JSONB DEFAULT '{}',  -- Model info, timestamps, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent memory table (future use)
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  account_id UUID NOT NULL,
  memory_type VARCHAR(50) NOT NULL, -- 'family_info', 'preferences', 'context'
  key VARCHAR(100) NOT NULL,        -- Memory key
  value JSONB NOT NULL,             -- Memory value
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3.2 Data Relationships

```
Supabase Users ────┐
                   │
                   ├─── Neon Conversations ──── Neon Messages
                   │
Supabase Accounts ─┘
```

**Key Points**:
- Conversations link to both Supabase user_id and account_id
- Messages cascade delete when conversations are deleted
- Metadata fields allow for future extensibility

### 4. AI Processing (LangChain + OpenAI)

#### 4.1 LangChain Integration
**Model**: ChatOpenAI with GPT-4o-mini
**Configuration**:
```javascript
const llm = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
});
```

#### 4.2 System Prompt
The AI assistant is configured with a family-focused system prompt:

```javascript
const systemPrompt = `You are a helpful AI assistant for HomeOps, a family logistics and home operations management platform. You help users with:

- Family scheduling and calendar management
- Email organization and insights  
- Household task coordination
- Family communication
- Home management tasks

Guidelines:
- Be helpful, friendly, and family-focused
- Provide practical, actionable advice
- Ask clarifying questions when needed
- Keep responses concise but complete`;
```

#### 4.3 Enhanced Context Management
**Smart Context Loading**: Optimized conversation context with intelligent limits

**Configuration** (`/api/config/chatConfig.js`):
```javascript
export const CONVERSATION_CONFIG = {
  MAX_RECENT_MESSAGES: 20,        // Recent messages for immediate context
  MAX_TOTAL_TOKENS: 8000,         // Stop before hitting OpenAI limits
  SUMMARIZE_AFTER_MESSAGES: 50,   // Summarize when conversation gets long
  ARCHIVE_AFTER_MESSAGES: 200,    // Suggest new conversation after this
  TOKEN_ESTIMATION_FACTOR: 4      // Rough estimate: 1 token per 4 characters
};
```

**Context Building with Summaries**:
```javascript
// Get optimized context with summaries for long conversations
const conversationContext = await getOptimizedContext(conversationId, sql, llm);

const langChainMessages = [
  new SystemMessage(systemPrompt + summaryContext + emailContext),
  ...conversationContext.messages
    .filter(m => m.role !== 'system')
    .map(msg => msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content))
];
```

**Smart Context Features**:
- **Automatic Summarization**: Long conversations (50+ messages) get auto-summarized
- **Token Management**: Prevents context overflow with intelligent truncation
- **Performance Monitoring**: Tracks context size and processing time

### 5. Intelligent Semantic Search System

#### 5.1 Overview
The chat system automatically searches user emails for relevant context using advanced semantic analysis. This happens transparently - users don't need to mention "emails" to get email information.

#### 5.2 Context Analysis Engine
**Purpose**: Analyzes user queries to determine when email context would be helpful

**Pattern Recognition**:
```javascript
const CONTEXT_PATTERNS = {
  school: {
    keywords: ['school', 'teacher', 'class', 'homework', 'test', 'exam'],
    phrases: ['kids', 'children', 'son', 'daughter', 'child'],
    weight: 0.9  // High confidence for school-related queries
  },
  schedule: {
    keywords: ['schedule', 'calendar', 'appointment', 'meeting', 'event'],
    phrases: ['what\'s on', 'when is', 'next week', 'upcoming'],
    weight: 0.8
  }
  // ... more patterns for finance, health, travel, etc.
};
```

**Query Analysis Process**:
1. **Normalize query**: Convert to lowercase, extract keywords
2. **Pattern matching**: Check against known family/logistics patterns
3. **Confidence scoring**: Calculate likelihood that email search would help
4. **Decision**: Trigger search if confidence > 30%

#### 5.3 Vector Search Implementation
**Database Function** (`search_emails_by_embedding`):
```sql
CREATE FUNCTION search_emails_by_embedding(
  query_embedding vector(1536),
  account_id_param uuid,
  similarity_threshold float DEFAULT 0.5,
  max_results integer DEFAULT 20
) RETURNS TABLE (
  id uuid,
  gmail_message_id text,
  subject text,
  from_email text,
  similarity_score float8,
  -- ... more fields
);
```

**Search Process**:
1. **Generate embedding**: User query → OpenAI text-embedding-3-small
2. **Vector similarity**: Cosine similarity search in Supabase pgvector
3. **Filter results**: Account-scoped, minimum similarity threshold
4. **Rank results**: Sort by relevance score

#### 5.4 Automatic Context Integration
**Seamless Integration**: Email context automatically added to chat prompts

**Example Flow**:
```
User: "What's on my kid's schedule next week?"
      ↓ (Context Analysis: 90% confidence - school pattern detected)
System: Searches emails for "schedule activities school events"
      ↓ (Finds: Teacher email about field trip, piano lesson confirmation)
AI: "Next week your child has a field trip to the science museum on Tuesday
     and piano lesson on Wednesday at 4pm"
```

**Context Formatting**:
```javascript
function formatContextForChat(contextEmails) {
  let contextString = '\n\n--- Relevant Email Context ---\n';
  contextEmails.forEach((email, index) => {
    contextString += `${index + 1}. From: ${email.from_email}\n`;
    contextString += `   Subject: ${email.subject}\n`;
    contextString += `   Content: ${email.content_snippet}\n`;
    contextString += `   Relevance: ${Math.round(email.similarity_score * 100)}%\n`;
  });
  contextString += '\nUse this context naturally without mentioning email search.';
  return contextString;
}
```

#### 5.5 Performance Characteristics
**Search Speed**: Sub-2 second response times including embedding generation
**Cost Per Search**: ~$0.0031 (OpenAI embedding API call)
**Context Limits**: Maximum 5 emails per search to prevent prompt overflow
**Cache Strategy**: Embedding model responses cached for 24 hours

#### 5.6 API Endpoints

**Semantic Search API** (`/api/semantic-search.js`):
```javascript
POST /api/semantic-search
{
  "query": "upcoming school events",
  "account_id": "user-account-id",
  "max_results": 10,
  "similarity_threshold": 0.5
}

Response:
{
  "success": true,
  "results": [
    {
      "id": "email-id",
      "subject": "Field Trip Permission Slip",
      "from_email": "teacher@school.edu",
      "similarity_score": 0.89,
      "content_snippet": "Please return the signed permission slip..."
    }
  ],
  "metadata": {
    "total_results": 3,
    "processing_time_ms": { "embedding": 245, "search": 12, "total": 257 },
    "estimated_cost_cents": 0.31
  }
}
```

**Frontend Service** (`/src/services/semanticSearchService.js`):
```javascript
export class SemanticSearchService {
  static async searchEmails({ query, account_id, max_results = 10 }) {
    // Handles authentication, validation, API calls
    // Returns formatted results with enhanced metadata
  }
}
```

#### 5.7 Chat Integration Architecture

**Enhanced Chat Flow**:
```
User Message → Context Analysis → [Email Search if needed] → LLM Processing → Response
     │              │                        │                    │
     │              ▼                        ▼                    │
     │    Pattern Recognition       Vector Similarity             │
     │    (90% confidence)         Search (5 emails)             │
     │              │                        │                    │
     └──────────────┴────── Combined Context ──────────────────┘
```

**Integration Points**:
- **Chat API**: Automatically triggers semantic search based on query analysis
- **Context Merging**: Combines conversation history + email context + summaries
- **Token Management**: Email context counted toward total context limits
- **Error Handling**: Graceful fallback if email search fails

## Environment Variables

### Required for Production
```bash
# Neon Database (Chat Storage)
NEON_DATABASE_URL=postgresql://user:password@host/dbname

# Supabase (Email Data & Vector Search)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI API (Chat + Embeddings)
OPENAI_API_KEY=sk-proj-...

# Optional Configuration
OPENAI_MODEL=gpt-4o-mini        # Default chat model
OPENAI_TEMPERATURE=0.3          # Response creativity (0.0-1.0)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # Embedding model
OPENAI_EMBEDDING_DIMENSIONS=1536                # Embedding dimensions
```

### Vercel Deployment
Environment variables must be set in Vercel dashboard:
1. Go to Project → Settings → Environment Variables
2. Add each required variable
3. Deploy or redeploy to apply changes

## Message Flow Diagram

```
User types message
       │
       ▼
┌─────────────────┐
│ React Frontend  │
│ - Validate msg  │
│ - Show loading  │
└─────────────────┘
       │
       ▼ POST /api/chat
┌─────────────────┐
│ Vercel Function │
│ - Get/create    │
│   conversation  │
│ - Save user msg │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Neon Database   │
│ - Store message │
│ - Get context   │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ LangChain+OpenAI│
│ - Build context │
│ - Generate resp │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ Neon Database   │
│ - Store AI resp │
│ - Update conv   │
└─────────────────┘
       │
       ▼
┌─────────────────┐
│ React Frontend  │
│ - Display resp  │
│ - Update UI     │
└─────────────────┘
```

## Error Handling

### API Error Responses
```javascript
// Environment variable missing
{
  "error": "Missing environment variables",
  "details": {
    "hasNeonUrl": false,
    "hasOpenAiKey": true
  }
}

// Missing request parameters
{
  "error": "Missing required parameters", 
  "details": {
    "hasMessage": true,
    "hasUserId": false,
    "hasAccountId": true
  }
}

// Database or AI errors
{
  "error": "Internal server error",
  "message": "Connection to database failed"
}
```

### Frontend Error Handling
- API request failures show user-friendly error messages
- Loading states prevent duplicate submissions
- Offline mode gracefully degrades functionality

## Email Processing System (Render.com)

### Overview
The email processing system handles long-running AI analysis of Gmail emails using LangChain and OpenAI. This system runs on Render.com to avoid serverless timeout limitations.

### Architecture Components

#### 1. Express.js Server (`server/src/index.js`)
**Purpose**: Main HTTP server handling email processing requests
**Deployment**: Render.com with persistent connections
**Health Check**: `/health` endpoint for monitoring

#### 2. Email Processing Routes (`server/src/routes/embeddings.js`)
**Endpoints**:
- `POST /api/embeddings/process` - Start email analysis job
- `GET /api/embeddings/status/:jobId` - Check job progress

#### 3. Background Workers (`server/src/workers/embeddingWorker.js`)
**Purpose**: Handles long-running email processing tasks
**Key Functions**:
- Fetches emails via Gmail API
- Generates embeddings with OpenAI
- Analyzes content with LangChain
- Stores results in Supabase

#### 4. Gmail Integration (`server/src/services/gmailService.js`)
**Purpose**: OAuth-based Gmail API integration
**Features**:
- Fetches email messages and metadata
- Parses email content (HTML/text)
- Base64 decoding for Gmail format

#### 5. AI Processing (`server/src/services/emailProcessor.js`)
**Purpose**: LangChain + OpenAI email analysis
**Capabilities**:
- Content extraction and cleaning
- Embedding generation (text-embedding-3-small)
- Family logistics theme detection
- Action item identification

### Processing Flow

```
User Request → Vercel API → Render Server → Background Processing
     │              │            │               │
     │              │            │               ├─ Gmail API
     │              │            │               ├─ OpenAI Embeddings  
     │              │            │               ├─ LangChain Analysis
     │              │            │               └─ Supabase Storage
     │              │            │
     └── Status ←───┴── Poll ←───┴─── Job Updates
```

### Database Schema (Supabase)

```sql
-- Email processing jobs
CREATE TABLE email_processing_jobs (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  batch_type VARCHAR(20) DEFAULT 'full',
  total_emails INTEGER DEFAULT 0,
  processed_emails INTEGER DEFAULT 0,
  failed_emails INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email embeddings with pgvector
CREATE TABLE email_embeddings (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES email_processing_jobs(id),
  account_id UUID NOT NULL,
  gmail_message_id VARCHAR(255),
  embedding vector(1536), -- OpenAI text-embedding-3-small
  subject TEXT,
  from_email TEXT,
  content_snippet TEXT,
  priority_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content analysis results  
CREATE TABLE email_content_analysis (
  id UUID PRIMARY KEY,
  email_embedding_id UUID REFERENCES email_embeddings(id),
  account_id UUID NOT NULL,
  family_relevance_score DECIMAL(3,2),
  action_items JSONB,
  mentioned_people JSONB,
  content_type VARCHAR(50),
  priority_level VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Environment Variables (Render.com)

```bash
# Server Configuration
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-vercel-app.vercel.app

# Supabase (shared with Vercel)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key

# OpenAI API
OPENAI_API_KEY=your-openai-key
```

### Integration with Vercel

The Vercel API endpoints call the Render server for heavy processing:

```javascript
// In Vercel function (/api/email-embeddings/start.js)
const response = await fetch(`${process.env.RENDER_SERVER_URL}/api/embeddings/process`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    job_id: jobId,
    account_id: accountId,
    batch_type: 'full',
    processing_options: { email_limit: 20 }
  })
});
```

### Deployment Configuration

#### Render.yaml
```yaml
services:
  - type: web
    name: homeops-email-processor
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        fromGroup: homeops-secrets
```

#### Docker Support
- Containerized deployment with Node.js 20
- Health checks for uptime monitoring
- Optimized build with production dependencies only

## Security Considerations

### Authentication
- All API requests require valid user authentication
- User ID and Account ID validated on each request
- Database queries filtered by user ownership

### Data Privacy
- Conversations isolated per user/account
- No cross-user data leakage
- Messages stored with minimal metadata

### API Security
- CORS headers configured for domain restrictions
- Input validation on all parameters
- SQL injection prevention via parameterized queries

## Performance Optimizations

### Database
- Indexed queries on user_id and account_id
- Conversation message limits (10 recent messages for context)
- Efficient JOIN queries for conversation listings

### API Functions
- Serverless scaling with Vercel
- Connection pooling via Neon
- Minimal context loading (recent messages only)

### Frontend
- Optimistic UI updates
- Message pagination for long conversations
- Efficient re-rendering with React keys

## Debugging and Monitoring

### Environment Debug Logging
The chat API includes comprehensive environment debugging:

```javascript
console.log('NEON_DATABASE_URL exists:', !!process.env.NEON_DATABASE_URL);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL);
```

### Vercel Function Logs
Access logs via:
- Vercel Dashboard → Project → Functions → View Logs
- Vercel CLI: `vercel logs` or `vercel logs --follow`

### Common Debug Steps
1. **Check environment variables** in Vercel dashboard
2. **Verify Neon DB connection** with test query
3. **Validate OpenAI API key** with simple request
4. **Check request payloads** in browser network tab
5. **Review function logs** for specific error messages

## Future Enhancements

### Planned Features
1. **Agent Memory**: Long-term context storage in agent_memory table
2. **Tool Integration**: LangChain tools for calendar, email access
3. **Voice Interface**: Speech-to-text and text-to-speech
4. **Image Analysis**: Visual understanding for family photos
5. **Smart Notifications**: Proactive family assistance

### Scalability Considerations
- **Message archiving**: Move old messages to cold storage
- **Context optimization**: Smarter context selection algorithms
- **Caching**: Redis for frequently accessed conversations
- **Rate limiting**: API throttling for cost control

## Troubleshooting Guide

### Common Issues

#### 1. Environment Variables Not Set
**Symptoms**: 500 error with "Missing environment variables"
**Solution**: 
1. Check Vercel dashboard → Project → Settings → Environment Variables
2. Ensure all required variables are set: `NEON_DATABASE_URL`, `OPENAI_API_KEY`
3. Redeploy the project to pick up new variables

#### 2. Database Connection Failures
**Symptoms**: "Connection to database failed" errors
**Solution**:
1. Verify Neon database URL format and credentials
2. Check database status in Neon dashboard
3. Ensure database is not suspended (Neon free tier auto-suspends)

#### 3. OpenAI API Errors
**Symptoms**: AI response generation failures
**Solution**:
1. Verify OpenAI API key validity
2. Check API quota and billing status
3. Ensure model name is correct (gpt-4o-mini)

#### 4. Message History Not Loading
**Symptoms**: Conversations appear empty
**Solution**:
1. Check user authentication status
2. Verify conversation ownership (user_id match)
3. Confirm database tables exist and have data

### Development Tips

#### Local Testing
```bash
# Test API endpoints locally
npm run dev  # Start frontend
# Functions run on localhost:3000/api/

# Test with curl
curl -X POST localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","userId":"123","accountId":"456"}'
```

#### Database Inspection
```sql
-- Check conversation count
SELECT COUNT(*) FROM conversations;

-- View recent messages
SELECT c.title, m.role, m.content, m.created_at 
FROM conversations c 
JOIN messages m ON c.id = m.conversation_id 
ORDER BY m.created_at DESC 
LIMIT 10;

-- Check user's conversations
SELECT * FROM conversations 
WHERE user_id = 'your-user-id' 
ORDER BY updated_at DESC;
```

This comprehensive documentation should give you everything needed to understand, modify, and extend the AI chatbot system.