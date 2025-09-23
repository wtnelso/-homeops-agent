# Email Embedding Framework - Comprehensive Testing Guide

## Overview

This guide provides complete testing strategies for the LangChain-powered email embedding framework, covering both UI and API testing approaches. The framework processes emails through sophisticated AI analysis pipelines using OpenAI embeddings and GPT-4o-mini for theme extraction.

## Table of Contents

1. [Testing Approaches](#testing-approaches)
2. [UI Testing](#ui-testing)
3. [API Testing with Postman](#api-testing)
4. [Manual Testing Procedures](#manual-testing)
5. [Mock Data Testing](#mock-data-testing)
6. [Performance Testing](#performance-testing)
7. [Cost Monitoring](#cost-monitoring)
8. [Troubleshooting](#troubleshooting)

## Testing Approaches

### 1. UI-Based Testing (Recommended for Development)

**Location:** `/testing` route in the application dashboard
**Features:**
- Real-time job monitoring with progress bars
- Cost tracking and API call visualization
- Interactive configuration options
- Live logging with timestamps
- JSON response inspection

**Best for:**
- Development and debugging
- Visual monitoring of processing pipeline
- Understanding system behavior
- Cost analysis during development

### 2. API Testing (Recommended for Integration/Production)

**Tools:** Postman, cURL, or HTTP clients
**Features:**
- Direct API endpoint testing
- Authentication testing
- Error handling validation
- Performance benchmarking
- Automated testing workflows

**Best for:**
- Integration testing
- Performance validation
- Production readiness testing
- CI/CD pipeline integration

## UI Testing

### Setup Steps

1. **Enable Testing UI in Dashboard:**
   ```bash
   # Add route to React Router configuration
   # Component: src/components/testing/EmailTestingPage.tsx
   ```

2. **Access Testing Interface:**
   - Login to HomeOps dashboard
   - Navigate to `/testing` or add testing link to navigation
   - Ensure you have valid account and authentication

### Testing Workflow

1. **Configuration:**
   - Set batch type: `full`, `incremental`, or `refresh`
   - Configure email limit (1-1000 emails)
   - Adjust batch size (1-50 emails per batch)
   - Set processing options (content length, priority score)

2. **Job Initiation:**
   - Click "Start Processing" button
   - Monitor real-time status changes
   - Observe cost estimations and timing predictions

3. **Progress Monitoring:**
   - Watch progress bar updates (every 3 seconds)
   - Track processed/remaining email counts
   - Monitor ETA calculations
   - Observe API call counts and costs

4. **Results Analysis:**
   - Review completion status and final metrics
   - Analyze cost breakdown (embeddings vs theme analysis)
   - Export API responses for further analysis
   - Review execution logs for debugging

### Sample Testing Scenarios

**Scenario 1: Small Batch Test (Development)**
```
Configuration:
- Batch Type: full
- Email Limit: 5
- Batch Size: 2
Expected: Quick processing, detailed logging, cost ~$0.03
```

**Scenario 2: Medium Batch Test (Staging)**
```
Configuration:
- Batch Type: incremental  
- Email Limit: 50
- Batch Size: 10
Expected: 3-5 minute processing, cost ~$0.30
```

**Scenario 3: Production Scale Test**
```
Configuration:
- Batch Type: full
- Email Limit: 200
- Batch Size: 20
Expected: 10-15 minute processing, cost ~$1.20
```

## API Testing

### Prerequisites

1. **Authentication Token:**
   ```bash
   # Get Supabase auth token from browser developer tools
   # Or authenticate via Supabase auth API
   ```

2. **Account ID:**
   ```bash
   # Retrieve from user session or database
   # Required for all email processing requests
   ```

### Core Endpoints

#### 1. Start Processing Job

**Endpoint:** `POST /api/email-embeddings/start`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
```

**Request Body:**
```json
{
  "account_id": "uuid-account-id",
  "batch_type": "full",
  "email_limit": 20,
  "processing_options": {
    "batch_size": 5,
    "max_content_length": 8000,
    "min_priority_score": 0.2
  }
}
```

**Expected Response (Success):**
```json
{
  "success": true,
  "job_id": "uuid-job-id",
  "status": "processing",
  "batch_type": "full",
  "estimated_emails": 20,
  "estimated_cost_cents": 12,
  "estimated_duration_minutes": 3,
  "started_at": "2025-01-15T10:30:00Z",
  "execution_time_ms": 234,
  "next_steps": {
    "poll_status": "/api/email-embeddings/status?job_id=uuid-job-id",
    "cancel_job": "/api/email-embeddings/cancel?job_id=uuid-job-id",
    "polling_interval_seconds": 10
  }
}
```

#### 2. Poll Job Status

**Endpoint:** `GET /api/email-embeddings/status?job_id=<job_id>`

**Headers:**
```
Authorization: Bearer <supabase_jwt_token>
```

**Expected Response (Processing):**
```json
{
  "success": true,
  "job_id": "uuid-job-id",
  "status": "processing",
  "status_message": "Analyzing emails with AI to extract insights and themes...",
  "batch_type": "full",
  "progress": {
    "percentage": 45,
    "processed": 9,
    "failed": 0,
    "skipped": 1,
    "total": 20,
    "remaining": 10
  },
  "timing": {
    "started_at": "2025-01-15T10:30:00Z",
    "eta_minutes": 2,
    "last_updated": "2025-01-15T10:32:15Z"
  },
  "cost": {
    "estimated_cents": 12,
    "actual_cents": 6,
    "embedding_api_calls": 9,
    "theme_analysis_calls": 9
  }
}
```

### Postman Collection Setup

1. **Create New Collection:** "Email Embedding API Tests"

2. **Set Collection Variables:**
   ```
   base_url: http://localhost:3000 (or your deployment URL)
   auth_token: {{supabase_jwt_token}}
   account_id: {{user_account_id}}
   ```

3. **Add Pre-request Scripts:**
   ```javascript
   // Auto-refresh auth token if needed
   pm.test("Auth token exists", function () {
       pm.expect(pm.collectionVariables.get("auth_token")).to.not.be.undefined;
   });
   ```

4. **Sample Test Scripts:**
   ```javascript
   pm.test("Status code is 200", function () {
       pm.response.to.have.status(200);
   });

   pm.test("Response has job_id", function () {
       const jsonData = pm.response.json();
       pm.expect(jsonData).to.have.property("job_id");
       pm.collectionVariables.set("current_job_id", jsonData.job_id);
   });

   pm.test("Cost is reasonable", function () {
       const jsonData = pm.response.json();
       pm.expect(jsonData.estimated_cost_cents).to.be.below(100); // Less than $1
   });
   ```

### cURL Examples

**Start Job:**
```bash
curl -X POST http://localhost:3000/api/email-embeddings/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "account_id": "YOUR_ACCOUNT_ID",
    "batch_type": "full",
    "email_limit": 10
  }'
```

**Check Status:**
```bash
curl -X GET "http://localhost:3000/api/email-embeddings/status?job_id=YOUR_JOB_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Manual Testing Procedures

### Pre-Flight Checklist

1. **Environment Setup:**
   - [ ] All environment variables configured (.env file)
   - [ ] Database connections active (Supabase + Neon)
   - [ ] OpenAI API key valid with sufficient credits
   - [ ] Supabase Edge Functions deployed and active
   - [ ] User authenticated with valid session

2. **System Health:**
   - [ ] Error logging system operational
   - [ ] Database tables exist and accessible
   - [ ] Rate limiting not exceeded
   - [ ] No active processing jobs for test account

### Test Execution Steps

1. **Authentication Test:**
   - Attempt API call without auth header
   - Verify 401 Unauthorized response
   - Add valid auth header and retry

2. **Input Validation Test:**
   - Send request without account_id
   - Send request with invalid batch_type
   - Send request with email_limit > plan allowance
   - Verify appropriate 400 Bad Request responses

3. **Processing Pipeline Test:**
   - Start small batch job (5 emails)
   - Poll status every 10 seconds
   - Monitor progress increments
   - Verify completion and final status

4. **Error Handling Test:**
   - Start job with invalid account_id
   - Start concurrent jobs (should fail)
   - Test network timeout scenarios
   - Verify graceful error responses

5. **Cost Verification:**
   - Track estimated vs actual costs
   - Verify API call counts align with processing
   - Confirm cost calculations match expectations

## Mock Data Testing

For development and testing without real email processing, we can add mock endpoints:

### Mock Testing Endpoint

**Endpoint:** `POST /api/email-embeddings/mock-test`

**Purpose:** Simulate processing pipeline without AI costs

**Implementation:**
```javascript
// Returns realistic progress updates without real processing
// Simulates timing, costs, and status changes
// Useful for UI testing and development
```

## Performance Testing

### Benchmarks to Track

1. **API Response Times:**
   - Start endpoint: < 1 second
   - Status endpoint: < 100ms
   - Error responses: < 500ms

2. **Processing Performance:**
   - Small batch (5 emails): 30-60 seconds
   - Medium batch (50 emails): 3-5 minutes
   - Large batch (200 emails): 10-15 minutes

3. **Cost Efficiency:**
   - Per email processing: $0.006-$0.008
   - Embedding generation: $0.0001 per email
   - Theme analysis: $0.002 per email

### Load Testing

Use tools like Apache Bench or Artillery for load testing:

```bash
# Test concurrent API requests
ab -n 100 -c 10 -H "Authorization: Bearer TOKEN" \
   -H "Content-Type: application/json" \
   -p test_payload.json \
   http://localhost:3000/api/email-embeddings/start
```

## Cost Monitoring

### Cost Tracking Dashboard

Monitor these metrics during testing:

1. **API Call Counts:**
   - OpenAI embedding calls per job
   - GPT-4o-mini analysis calls per job
   - Total API spend per user

2. **Cost per Email:**
   - Target: < $0.01 per email processed
   - Alert threshold: > $0.02 per email
   - Monthly budget per user: < $5.00

3. **Error Rate Impact:**
   - Failed jobs and wasted costs
   - Retry attempts and additional costs
   - Optimization opportunities

### Cost Alerts

Set up monitoring alerts for:
- Individual job costs > $1.00
- Daily API spend > $10.00
- Error rates > 5%
- Processing times > expected benchmarks

## Troubleshooting

### Common Issues

1. **"Job already active" Error:**
   - Check for existing processing jobs
   - Wait for completion or cancel existing job
   - Clear any stuck jobs in database

2. **Authentication Failures:**
   - Verify JWT token is fresh (< 1 hour)
   - Check user has access to specified account
   - Ensure proper Authorization header format

3. **Processing Timeouts:**
   - Check Supabase Edge Function logs
   - Verify OpenAI API connectivity
   - Monitor for rate limiting issues

4. **Cost Overruns:**
   - Review batch sizes and email limits
   - Check for inefficient processing patterns
   - Verify cost calculations are accurate

### Debug Information

Enable detailed logging:
```bash
# Set debug environment variables
VITE_APP_ENV=DEV
VITE_DEBUG_MODE=TRUE
OPENAI_LOG_LEVEL=DEBUG
```

### Support Information

For testing issues, collect:
- Job IDs and timestamps
- API request/response logs
- User account and authentication details
- Processing configuration settings
- Error messages and stack traces

This comprehensive testing framework ensures the email embedding system is robust, cost-effective, and ready for production deployment.