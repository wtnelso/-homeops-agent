# Email Processing Pipeline

## Overview
The HomeOps email processing system creates intelligent email analysis with AI-powered memory extraction for family logistics coordination.

## Architecture Components
- **Email Processor**: Core service handling email analysis and storage
- **Agent Memory Service**: Unified memory extraction across chat and email
- **LangChain Integration**: Content analysis and theme extraction
- **OpenAI Models**: GPT-4o-mini (analysis) + text-embedding-3-small (embeddings)
- **Database**: Supabase (emails/embeddings) + Neon (agent memory)

## Processing Pipeline (6 Steps)

### Step 1: Content Extraction & Cleaning
**Method**: `extractEmailContent(email)`
- Extracts subject + body content from email object
- Removes HTML tags, entities, and formatting artifacts
- Cleans whitespace and normalizes text
- Combines into unified content string

**Output**: Clean, readable email text

### Step 2: Generate Embeddings
**Method**: `generateEmbedding(content)`
- Creates 1536-dimensional vector using OpenAI `text-embedding-3-small`
- Enables semantic search across email content
- Tracks token usage for cost monitoring
- Handles rate limiting and retries

**Output**: Vector embedding array for semantic search

### Step 3: AI Content Analysis
**Method**: `analyzeEmailContent(content)`
**Model**: OpenAI GPT-4o-mini via LangChain
- **Theme Classification**: social, work, family, urgent, etc.
- **People Extraction**: Names mentioned in email content
- **Action Items**: Tasks and next steps identified
- **Family Relevance**: Scoring for family logistics importance
- **Sentiment Analysis**: Emotional tone assessment
- **Deadline Detection**: Time-sensitive items and dates

**Output**: Structured analysis object with themes, entities, and metadata

### Step 4: 🧠 Agent Memory Extraction (Unified System)
**Method**: `AgentMemoryService.extractAndStoreMemories()`
**Config**: `/server/src/config/agentMemoryConfig.js`

Processes combined `subject + body` text through regex patterns:

#### Family Information
- Relationship patterns: `"my wife's name is Karen"`
- Member identification: `"our son Johnny"`
- Family structure mapping

#### Preferences
- Likes/dislikes: `"prefer Italian food on weekends"`
- Dietary restrictions, activity preferences
- Household preferences and routines

#### Schedule Patterns
- Recurring events: `"every Tuesday at 4pm"`
- Practice schedules, appointments, meetings
- Weekly/monthly recurring patterns

#### Contact Information
- Email addresses and phone numbers
- Emergency contacts and key people

**Storage**: Neon PostgreSQL `agent_memory` table with confidence scoring

### Step 5: Processing Metadata
- Calculate total processing time (milliseconds)
- Generate confidence score based on content quality
- Track API call counts and token usage
- Add performance metrics to analysis data

### Step 6: Database Storage
**Method**: `storeEmailResults()`
**Tables**:
- `emails`: Email content and metadata
- `email_embeddings`: Vector embeddings for search
- `agent_memory`: Extracted family/preference data (via Step 4)

## Memory Extraction Examples

### Input Email:
```
Subject: Soccer practice reminder
Body: Hi honey, don't forget Johnny has soccer practice every Tuesday at 4pm.
Also, Karen mentioned she prefers Italian restaurants for date night.
```

### Extracted Memories:
1. **Schedule**: `weekly_tuesday` → "Johnny soccer practice 4pm"
2. **Family**: `family_member_johnny` → son relationship
3. **Preferences**: `user_preference` → "Italian restaurants for date night"

## Configuration & Tuning

### Memory Pattern Configuration
Edit `/server/src/config/agentMemoryConfig.js`:
- Add new regex patterns for extraction
- Modify confidence scoring thresholds
- Adjust memory expiration rules
- Configure priority levels per memory type

### User Limits & Plan-Based Processing
**Configuration**: `/server/src/config/userLimitsConfig.js`

#### Plan-Based Email Limits:
- **Free Plan**: 25 daily emails, 100 onboarding emails
- **Pro Plan**: 200 daily emails, 1000 onboarding emails
- **Enterprise**: 1000 daily emails, 10000 onboarding emails

#### Testing Override System:
- **Dashboard Testing UI**: Custom limits for `/dashboard/testing`
- **Test Scenarios**: Predefined limits for specific testing workflows
- **Override Controls**: Can be disabled in production environments

#### Usage Tracking & Metering:
- **Daily/Weekly/Monthly** usage counters
- **API Call Tracking**: OpenAI embedding and chat API usage
- **Memory Extraction Limits**: Agent memory generation quotas
- **Storage Quotas**: Email content and embedding storage limits

### Processing Job Configuration
**Service**: `UserLimitsService.createProcessingJobConfig()`

```javascript
// Example: Create job with plan-based limits
const jobConfig = await UserLimitsService.createProcessingJobConfig(accountId, {
  processingType: 'daily',
  testingOverride: 'memory_extraction' // For testing UI
});

// Example: Validate processing request
const validation = await UserLimitsService.validateEmailProcessingRequest(
  accountId,
  requestedEmails,
  { processingType: 'onboarding', userPlan: 'pro' }
);
```

### Rate Limiting & Performance
- **Rate Limiting**: 80 LLM calls/min, 40 embedding calls/min
- **Content Length**: No hard limit (pays per token)
- **Batch Size**: Auto-calculated based on email count (10-100 per chunk)
- **Retry Logic**: 3 attempts with exponential backoff

## Performance Metrics
- **Average Processing Time**: 3-8 seconds per email
- **Token Usage**: ~40-80 tokens per email for embeddings
- **Memory Extraction**: 0-5 memories per email depending on content
- **API Calls**: 2 calls per email (embedding + analysis)

## Error Handling
- **Rate Limiting**: Automatic retry with backoff
- **Network Issues**: 3-attempt retry logic
- **Invalid Content**: Graceful degradation with logging
- **Database Errors**: Transaction rollback and error reporting

## Integration Points
- **Gmail API**: Email fetching and authentication
- **Supabase**: Email storage and vector search
- **Neon**: Agent memory persistence
- **Frontend**: Real-time processing status via API