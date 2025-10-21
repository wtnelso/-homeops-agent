# Email Embeddings Pipeline Documentation

## Overview

The Email Embeddings Pipeline is a comprehensive system that processes Gmail emails through AI analysis to extract themes, family relevance, and semantic embeddings. It operates on a **hybrid processing model** that prioritizes user chat interactions while efficiently handling background email processing through queues.

## Architecture Components

### Hybrid Processing Model (Render.com + Redis)
- **Chat Processing**: Direct OpenAI API calls with high priority (80% rate limit capacity)
- **Email Processing**: BullMQ queue-based background processing (20% rate limit capacity)
- **Rate Limiting**: Priority-based allocation prevents chat blocking
- **Queue Benefits**: Retry logic, job persistence, horizontal scaling
- **API Response Time**: < 1 second for job creation
- **Processing Time**: 2-30 minutes depending on email volume and queue depth
- **Cost**: Variable based on OpenAI API usage
- **Benefits**: Immediate chat responses, reliable background processing, simplified rate limit management

## Trigger Paths

### 1. New User Onboarding (Path 1)

**Trigger Source**: User completes Gmail OAuth integration

**Flow**:
```
Frontend User Action
    ↓
OnboardingService.startOnboardingAnalysis()
    ↓
Create email_processing_jobs record
    ↓
RedisQueueService.addOnboardingJob()
    ↓
EmbeddingWorker.processEmailJob()
    ↓
EmailEmbeddingProcessor.processEmail()
```

**Files & Functions**:
1. **`/server/src/services/onboardingService.js`**
   - `startOnboardingAnalysis(user_id)` - Main entry point (migrated from account_id)
   - `checkExistingOnboarding(user_id)` - Prevents duplicate onboarding
   - `verifyGmailIntegration(user_id)` - Validates OAuth tokens
   - `completeOnboarding(user_id, job_id)` - Finalizes process

2. **`/server/src/services/redisQueueService.js`**
   - `addOnboardingJob(jobData)` - Queues job with highest priority
   - `processOnboardingJob(job)` - BullMQ worker handler
   - **Configuration**: 1000 emails max, priority: 10

### 2. Cron Job / Scheduled Processing (Path 2)

**Trigger Source**: Daily cron job at 2:00 AM or manual trigger

**Flow**:
```
Daily Cron (2:00 AM)
    ↓
RedisQueueService cron scheduler
    ↓
DailyCronService.runDailyProcessing()
    ↓
QueueManager.addDailyJob() for each user
    ↓
EmbeddingWorker.processEmailJob()
```

**Files & Functions**:
1. **`/server/src/services/redisQueueService.js`**
   - `setupCronScheduler()` - Creates daily cron job (0 2 * * *)
   - `processDailyJob(job)` - Handles both cron trigger and individual jobs
   - `addDailyJob(jobData)` - Queues daily processing jobs

2. **`/server/src/services/queueManager.js`**
   - `triggerDailyProcessing()` - Manual trigger interface
   - `addDailyJob(jobData)` - Unified interface for Redis/in-memory queues

3. **`/server/src/services/dailyCronService.js`** *(Referenced but not found)*
   - `runDailyProcessing()` - Iterates through active users
   - **Note**: This service appears to be referenced but not implemented yet

### 3. Manual/API Triggered Processing (Path 3)

**Trigger Source**: Direct API call from frontend

**Flow**:
```
API Call to /api/embeddings/start
    ↓
Render Server validates & creates job
    ↓
EmbeddingWorker.processEmailJob()
```

**Files & Functions**:
1. **`/server/src/routes/embeddings.js`** (Render Server)
   - `POST /api/embeddings/start` - Main API endpoint
   - JWT validation via `validateJWT` middleware
   - Plan validation using `PlanConfig.getPlanConfig()`
   - User permission validation
   - Database job creation
   - Direct call to `EmbeddingWorker.processEmailJob()`

2. **`/server/src/config/planConfig.js`** (Plan Management)
   - `getPlanConfig(planName)` - Get plan limits for user
   - `getAllowedEmailLimit()` - Calculate allowed emails based on plan
   - `calculateEstimatedCost()` - Cost estimation
   - **Plan Types**: `free`, `high performer`, `family`

## Core Processing Pipeline

### Step-by-Step Email Processing

#### 1. Job Initialization
**Location**: `EmbeddingWorker.processEmailJob()`
**Purpose**: Setup and validation
```javascript
// Update job status to 'processing'
await updateJobStatus(job_id, { status: 'processing', started_at: new Date().toISOString() });

// Get Gmail integration tokens
const gmailIntegration = await getGmailIntegration(account_id);

// Initialize services
const gmailService = new GmailService(gmailIntegration);
const processor = new EmailEmbeddingProcessor({ job_id, account_id, batch_type });
```

#### 2. Email Fetching
**Location**: `GmailService.fetchEmails()`
**Purpose**: Retrieve emails from Gmail API
```javascript
// Build query based on batch type
const query = buildGmailQuery(batch_type);
// Queries from EmailConfig:
// - onboarding: 'in:inbox -category:promotions -category:social -category:forums'
// - daily: 'in:inbox -category:promotions -category:social -category:forums newer_than:1d'
// - incremental: 'newer_than:7d'
// - refresh: 'newer_than:30d'

const emails = await gmailService.fetchEmails({
  maxResults: email_limit,
  query: query
});
```

#### 3. Individual Email Processing
**Location**: `EmailEmbeddingProcessor.processEmail()`
**Purpose**: AI analysis and data extraction

**Sub-steps**:
1. **Content Preparation**
   ```javascript
   // Truncate content to max_content_length (8000 chars)
   // Clean and format email text
   ```

2. **Embedding Generation**
   ```javascript
   // Call OpenAI text-embedding-3-small
   // Generate 1536-dimensional vector
   // Apply rate limiting via globalRateLimiter
   ```

3. **Theme Analysis**
   ```javascript
   // Call OpenAI GPT-4o-mini with structured prompt
   // Extract: themes, family_relevance_score, action_items, etc.
   // JSON response with 15+ fields
   ```

4. **Database Storage**
   - **email_embeddings** table: Vector data for semantic search
   - **email_content_analysis** table: Structured analysis results
   - **Account theme summaries**: Aggregated insights

#### 4. Agent Memory Extraction
**Location**: `AgentMemoryService.extractMemoriesFromEmail()`
**Purpose**: Extract family information for AI assistant
```javascript
// Pattern-based extraction of:
// - Family member info (names, ages, schools)
// - Schedules and activities
// - Important dates and preferences
// - Contact information
```

#### 5. Profile Suggestions
**Location**: `userProfileService.generateSuggestions()`
**Purpose**: Update user profile with discovered information
```javascript
// Generate suggestions for:
// - Family member profiles
// - Contact information
// - Preferences and settings
```

#### 6. Theme Summary Updates
**Location**: `EmailEmbeddingProcessor.updateThemeSummary()`
**Purpose**: Maintain aggregated statistics
```javascript
// Update account_theme_summary table:
// - total_emails per theme
// - average_relevance_score
// - recent_7d_count, recent_30d_count
// - high_relevance_count
```

## Configuration & Settings

### Email Processing Config
**Location**: `/server/src/config/emailConfig.js`

**Key Settings**:
```javascript
batchProcessing: {
  defaultEmailLimit: 50,
  maxEmailsPerBatch: 100,
  delayBetweenEmails: 150,        // Rate limiting
  progressUpdateInterval: 10,      // Progress reporting

  queries: {
    onboarding: 'in:inbox -category:promotions -category:social -category:forums',
    daily: 'in:inbox -category:promotions -category:social -category:forums newer_than:1d',
    incremental: 'newer_than:7d',
    refresh: 'newer_than:30d'
  },

  jobConfigs: {
    onboarding: { maxEmails: 1000, priority: 'high', chunkSize: 50 },
    daily: { maxEmails: 200, priority: 'normal', chunkSize: 25 }
  }
},

openaiConfig: {
  chatModel: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-3-small',
  temperature: 0.1,
  maxTokens: 500
}
```

### Queue Configuration
**Location**: `/server/src/services/redisQueueService.js`

**Queue Types**:
- **onboarding-emails**: Concurrency: 1, Priority: 10, Max emails: 1000
- **daily-emails**: Concurrency: 3, Priority: 5, Max emails: 200
- **priority-emails**: Concurrency: 2, Priority: 20, Immediate processing

**Cron Schedule**: `'0 2 * * *'` (Daily at 2:00 AM)

## Database Schema

### Core Tables

#### email_processing_jobs
```sql
- id (uuid)
- user_id (uuid)  -- Migrated from account_id
- status (pending|processing|completed|failed)
- batch_type (onboarding|daily|incremental|refresh)
- total_emails (int)
- processed_emails (int)
- failed_emails (int)
- embedding_api_calls (int)
- theme_analysis_calls (int)
- actual_cost_cents (int)
- estimated_cost_cents (int)
- processing_config (jsonb)  -- Plan-based configuration
- token_usage (jsonb)
- created_at, updated_at, started_at, completed_at
```

#### email_embeddings
```sql
- id (uuid)
- job_id (uuid)
- user_id (uuid)
- email_record_id (text)
- embedding (vector(1536))  -- 1536-dimensional vector
- content_hash (text)
- processed_at (timestamp)
```

#### email_content_analysis
```sql
- id (uuid)
- job_id (uuid)
- user_id (uuid)
- email_record_id (text)
- primary_theme (text)
- family_relevance_score (float)
- involves_children (boolean)
- action_items (jsonb)
- mentioned_people (jsonb)
- sentiment_score (float)
- confidence_score (float)
- processing_duration_ms (int)
```

#### account_theme_summary
```sql
- user_id (uuid)
- theme_name (text)
- total_emails (int)
- average_relevance_score (float)
- recent_7d_count (int)
- recent_30d_count (int)
- high_relevance_count (int)
- last_updated (timestamp)
```

## Error Handling & Recovery

### Rate Limiting
**Location**: `/server/src/services/openaiRateLimiter.js`
- Sliding window rate limiting
- Exponential backoff on failures
- Token-based limits (RPM/TPM)

### Retry Logic
**BullMQ Configuration**:
- Onboarding jobs: 3 attempts, 5s initial delay
- Daily jobs: 2 attempts, 2s initial delay
- Priority jobs: 5 attempts, 1s initial delay

### Fallback Systems
- Redis unavailable → In-memory queue (`globalScalableQueue`)
- Render server down → Job marked as failed, can be retried
- OpenAI API errors → Individual email failures, batch continues

## Performance & Scaling

### Processing Capacity
- **Onboarding**: 1 concurrent job (1000 emails)
- **Daily**: 3 concurrent jobs (200 emails each)
- **Priority**: 2 concurrent jobs (immediate)

### Cost Optimization
- Rate limiting prevents API overages
- Content truncation (8000 chars) reduces token costs
- Efficient batching and progress tracking

### Monitoring
- Real-time job status via database
- Queue statistics and metrics
- Token usage tracking
- Cost calculation per job

## API Endpoints

### Render Server (Unified)
- `POST /api/embeddings/start` - Initiate email processing
- `GET /api/embeddings/status/:job_id` - Get detailed job status with progress, costs, and timing

### Additional Endpoints
- `POST /testing/start-load-test` - Load testing (test mode)
- `GET /testing/test-status/:testId` - Load test monitoring

## Environment Variables

### Required
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small  # Optional, defaults to config

# Database
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...

# Queue System
REDIS_URL=redis://...

# Server Communication
RENDER_SERVER_URL=https://homeops-agent-p7ru.onrender.com
```

### Test Mode
```bash
EMAIL_EMBEDDING_TEST_MODE=TRUE  # Enables nock mocking for OpenAI calls
```

## Testing & Development

### Load Testing
**Location**: `/server/src/routes/testing.js`
- Nock-based OpenAI API mocking
- Real infrastructure testing (Redis, database)
- Configurable test scenarios (single_user, light_load, heavy_load, stress_test)

### Debugging
- Comprehensive logging throughout pipeline
- Job progress tracking in database
- Queue monitoring via Redis/BullMQ tools

## Current Issues & Immediate Improvements

### 🚨 Critical Issues
1. **Embedding Dimension Mismatch**
   - **Problem**: System expecting 1536 dimensions but receiving 384
   - **Location**: `EmailEmbeddingProcessor` database insertion
   - **Fix**: Verify OpenAI model configuration and nock mock responses
   - **Impact**: Blocks all email processing

2. **Missing DailyCronService**
   - **Problem**: Referenced in code but not implemented
   - **Location**: `/server/src/services/dailyCronService.js`
   - **Fix**: Implement service to iterate through active users for daily processing
   - **Impact**: Daily cron jobs won't work properly

### ✅ Recently Completed
1. **Vercel Migration**
   - **Completed**: Migrated email embeddings endpoints from Vercel to Render server
   - **Benefits**: Simplified architecture, better error handling, consistent authentication
   - **Files Updated**: `/server/src/routes/embeddings.js`, removed `/api/email-embeddings/`

2. **Plan Configuration System**
   - **Completed**: Created centralized plan configuration with proper plan names
   - **File**: `/server/src/config/planConfig.js`
   - **Plans**: `free`, `high performer`, `family`

3. **Database Schema Migration**
   - **Completed**: Migrated from `account_id` to `user_id` throughout system
   - **Files Updated**: `embeddingWorker.js`, `emailProcessor.js`, all related services

### ⚠️ Current Process Improvements

#### Performance Optimizations
1. **Batch API Calls**
   - **Current**: Individual OpenAI calls per email (slow, expensive)
   - **Improvement**: Batch multiple emails per embedding call
   - **Files**: `EmailEmbeddingProcessor.processEmail()`
   - **Benefit**: 50-80% cost reduction, faster processing

2. **Smart Content Filtering**
   - **Current**: Processes all emails including promotions/newsletters
   - **Improvement**: Pre-filter low-value emails before AI processing
   - **Files**: `GmailService.fetchEmails()`, Gmail query strings
   - **Benefit**: Reduce irrelevant processing by 60-70%

3. **Incremental Processing**
   - **Current**: May reprocess emails unnecessarily
   - **Improvement**: Hash-based deduplication to skip already processed emails
   - **Files**: `EmailEmbeddingProcessor` (add content hash checking)
   - **Benefit**: Avoid redundant processing on refresh operations

#### Reliability Improvements
1. **Enhanced Error Recovery**
   - **Current**: Individual email failures don't provide detailed feedback
   - **Improvement**: Categorize failures (rate limit, network, parsing) for targeted retry
   - **Files**: `EmailEmbeddingProcessor.processEmail()`
   - **Benefit**: Better success rates and faster recovery

2. **Queue Health Monitoring**
   - **Current**: Basic queue stats
   - **Improvement**: Dead letter queues, health checks, auto-recovery
   - **Files**: `RedisQueueService`
   - **Benefit**: Prevent stuck jobs and improve observability

3. **Token Management**
   - **Current**: Basic rate limiting
   - **Improvement**: OAuth token refresh automation, expiry monitoring
   - **Files**: `GmailService`, `OnboardingService`
   - **Benefit**: Reduce authentication failures

#### User Experience Improvements
1. **Better Progress Tracking**
   - **Current**: Basic email count updates
   - **Improvement**: Stage-based progress (fetching, analyzing, storing)
   - **Files**: `EmbeddingWorker.processEmailJob()`
   - **Benefit**: More accurate time estimates and user feedback

2. **Cost Prediction**
   - **Current**: Simple estimation based on email count
   - **Improvement**: Content-based cost prediction before processing
   - **Files**: `/api/email-embeddings/start.js`
   - **Benefit**: Better user expectations and budget control

## 🚀 Long-term Strategic Improvements

### Architecture Evolution
1. **Microservices Architecture**
   - **Vision**: Separate services for Gmail, AI processing, and storage
   - **Benefits**: Independent scaling, fault isolation, technology flexibility
   - **Considerations**: Increased complexity, inter-service communication overhead
   - **Timeline**: 6-12 months

2. **Event-Driven Processing**
   - **Vision**: Gmail webhooks trigger immediate processing vs. polling
   - **Benefits**: Real-time updates, reduced API calls, better responsiveness
   - **Considerations**: Webhook reliability, message ordering, replay capabilities
   - **Timeline**: 3-6 months

3. **Multi-Cloud Strategy**
   - **Vision**: Distribute processing across multiple cloud providers
   - **Benefits**: Cost optimization, vendor lock-in reduction, improved reliability
   - **Considerations**: Data consistency, network latency, operational complexity
   - **Timeline**: 12+ months

### AI & ML Enhancements
1. **Model Optimization**
   - **Vision**: Fine-tuned models for family/household content
   - **Benefits**: Better accuracy, lower costs, domain-specific insights
   - **Considerations**: Training data requirements, model maintenance, evaluation metrics
   - **Timeline**: 6-9 months

2. **Smart Scheduling**
   - **Vision**: AI-driven processing schedules based on user patterns
   - **Benefits**: Optimal resource utilization, personalized experience
   - **Considerations**: Privacy implications, complexity, user control
   - **Timeline**: 3-6 months

3. **Advanced Analytics**
   - **Vision**: Trend analysis, predictive insights, family lifecycle tracking
   - **Benefits**: Proactive suggestions, long-term value, user engagement
   - **Considerations**: Data retention policies, compute requirements, privacy
   - **Timeline**: 6-12 months

### Scalability Considerations
1. **Horizontal Worker Scaling**
   - **Vision**: Auto-scaling worker instances based on queue depth
   - **Benefits**: Handle traffic spikes, cost efficiency, improved throughput
   - **Considerations**: State management, coordination overhead, cold start delays
   - **Timeline**: 3-6 months

2. **Database Optimization**
   - **Vision**: Read replicas, data partitioning, advanced indexing
   - **Benefits**: Better query performance, higher concurrency, cost efficiency
   - **Considerations**: Consistency models, migration complexity, monitoring
   - **Timeline**: 6-9 months

3. **Global Distribution**
   - **Vision**: Regional processing centers for reduced latency
   - **Benefits**: Faster response times, compliance with data residency
   - **Considerations**: Data synchronization, operational complexity, costs
   - **Timeline**: 12+ months

### Business Intelligence & Analytics
1. **Advanced Metrics**
   - **Vision**: Processing efficiency, user engagement, cost optimization metrics
   - **Benefits**: Data-driven decisions, performance optimization, business insights
   - **Considerations**: Privacy compliance, storage costs, analysis complexity
   - **Timeline**: 3-6 months

2. **Predictive Maintenance**
   - **Vision**: ML-based prediction of system failures and bottlenecks
   - **Benefits**: Proactive issue resolution, improved uptime, cost reduction
   - **Considerations**: Training data collection, false positive handling, automation risks
   - **Timeline**: 6-12 months

### Security & Compliance
1. **Zero-Trust Architecture**
   - **Vision**: End-to-end encryption, minimal privilege access, continuous verification
   - **Benefits**: Enhanced security posture, compliance readiness, audit trail
   - **Considerations**: Performance impact, implementation complexity, user experience
   - **Timeline**: 6-12 months

2. **Privacy-First Design**
   - **Vision**: On-device processing options, selective data sharing, user control
   - **Benefits**: User trust, compliance with evolving regulations, competitive advantage
   - **Considerations**: Processing power requirements, feature limitations, cost impact
   - **Timeline**: 12+ months

## Implementation Priority Matrix

### High Impact, Low Effort (Quick Wins)
- Fix embedding dimension mismatch
- Implement DailyCronService
- Smart content filtering
- Enhanced error categorization

### High Impact, High Effort (Strategic Projects)
- Batch API calls optimization
- Event-driven architecture
- Advanced analytics platform
- Horizontal scaling implementation

### Low Impact, Low Effort (Nice to Have)
- Better progress tracking
- Queue health monitoring
- Basic cost prediction improvements

### Low Impact, High Effort (Avoid/Future)
- Multi-cloud distribution
- Global processing centers
- Advanced privacy-first architecture

## Success Metrics

### Performance Metrics
- Processing time per email (target: <5 seconds)
- Queue throughput (target: 1000+ emails/hour)
- API cost per email (target: <$0.002)
- Error rate (target: <1% failed emails)

### Business Metrics
- User onboarding completion rate
- Daily active processing users
- Feature adoption rates
- Customer satisfaction scores

### Technical Metrics
- System uptime (target: 99.9%)
- Average queue depth
- Token usage efficiency
- Database query performance