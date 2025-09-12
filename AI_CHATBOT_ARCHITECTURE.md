# HomeOps AI Chatbot Architecture Documentation

## Overview
This document provides a comprehensive technical guide to the AI chatbot system implemented in HomeOps. The system uses LangChain + OpenAI + Neon PostgreSQL, deployed as Vercel serverless functions.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │ Vercel Functions│    │   Neon DB       │
│  (Frontend)     │───▶│   (Backend)     │───▶│ (Conversations) │
│                 │    │                 │    │                 │
│ - Chat UI       │    │ - /api/chat.js  │    │ - conversations │
│ - Message List  │    │ - /api/conver   │    │ - messages      │
│ - Input Form    │    │   sations.js    │    │ - agent_memory  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   OpenAI API    │
                       │  (LangChain)    │
                       │                 │
                       │ - GPT-4o-mini   │
                       │ - Context mgmt  │
                       │ - Conversation  │
                       └─────────────────┘
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

#### 4.3 Context Management
**Message History**: Last 10 messages from conversation
**Context Building**:
```javascript
const langChainMessages = [
  new SystemMessage(systemPrompt),
  ...recentMessages
    .filter(m => m.role !== 'system')
    .map(msg => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    })
];
```

## Environment Variables

### Required for Production
```bash
# Neon Database
NEON_DATABASE_URL=postgresql://user:password@host/dbname

# OpenAI API
OPENAI_API_KEY=sk-proj-...

# Optional Configuration
OPENAI_MODEL=gpt-4o-mini        # Default model
OPENAI_TEMPERATURE=0.3          # Response creativity (0.0-1.0)
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