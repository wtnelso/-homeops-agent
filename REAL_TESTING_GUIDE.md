# Real End-to-End Email Embedding Testing Guide

## Quick Start - Test the Real Pipeline

### Step 1: Get Your Credentials

1. **Start the dev server:**
   ```bash
   npm run dev
   # Server will run at http://localhost:3000
   ```

2. **Login and get your tokens:**
   - Navigate to http://localhost:3000
   - Login with your account
   - Open browser developer tools (F12)
   - Go to Application/Storage → Local Storage
   - Find your Supabase session data

3. **Extract required values:**
   - `access_token`: Your JWT token for API calls
   - `account_id`: Your account UUID (from user session data)

### Step 2: Test with cURL (Immediate Testing)

**Start a real processing job:**
```bash
curl -X POST http://localhost:3000/api/email-embeddings/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -d '{
    "account_id": "YOUR_ACCOUNT_ID_HERE",
    "batch_type": "full",
    "email_limit": 5,
    "processing_options": {
      "batch_size": 2,
      "max_content_length": 4000,
      "min_priority_score": 0.1
    }
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "job_id": "uuid-here",
  "status": "processing",
  "estimated_emails": 5,
  "estimated_cost_cents": 3,
  "estimated_duration_minutes": 1,
  "next_steps": {
    "poll_status": "/api/email-embeddings/status?job_id=uuid-here",
    "polling_interval_seconds": 10
  }
}
```

**Monitor progress:**
```bash
# Replace YOUR_JOB_ID with the job_id from above response
curl -X GET "http://localhost:3000/api/email-embeddings/status?job_id=YOUR_JOB_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Step 3: Test with Postman (Recommended)

1. **Create new Postman collection:** "HomeOps Email Embedding Tests"

2. **Set environment variables:**
   - `base_url`: `http://localhost:3000`
   - `access_token`: Your JWT token
   - `account_id`: Your account UUID

3. **Add requests:**

   **Request 1: Start Processing**
   - Method: POST
   - URL: `{{base_url}}/api/email-embeddings/start`
   - Headers: 
     ```
     Content-Type: application/json
     Authorization: Bearer {{access_token}}
     ```
   - Body (JSON):
     ```json
     {
       "account_id": "{{account_id}}",
       "batch_type": "full",
       "email_limit": 10,
       "processing_options": {
         "batch_size": 3
       }
     }
     ```

   **Request 2: Check Status**
   - Method: GET
   - URL: `{{base_url}}/api/email-embeddings/status?job_id={{job_id}}`
   - Headers:
     ```
     Authorization: Bearer {{access_token}}
     ```

4. **Add Test Scripts:**
   ```javascript
   // For Start Processing request
   pm.test("Job started successfully", function () {
       const jsonData = pm.response.json();
       pm.expect(jsonData.success).to.be.true;
       pm.expect(jsonData.job_id).to.not.be.undefined;
       pm.collectionVariables.set("job_id", jsonData.job_id);
   });

   // For Status request
   pm.test("Status retrieved", function () {
       const jsonData = pm.response.json();
       pm.expect(jsonData.success).to.be.true;
       pm.expect(jsonData.status).to.be.oneOf(["pending", "processing", "completed", "failed"]);
   });
   ```

### Step 4: Test with UI (Visual Testing)

1. **Add testing route to your app:**
   - The UI component is already created at `src/components/testing/EmailTestingPage.tsx`
   - Add this route to your React Router configuration

2. **Navigate to testing UI:**
   - Go to http://localhost:3000/testing (once route is added)
   - Configure your test parameters
   - Click "Start Processing"
   - Monitor real-time progress

## Real Testing Scenarios

### Scenario 1: Small Batch (Development)
```json
{
  "account_id": "your-account-id",
  "batch_type": "full",
  "email_limit": 3,
  "processing_options": {
    "batch_size": 1,
    "min_priority_score": 0.1
  }
}
```
- **Expected Time:** 30-60 seconds
- **Expected Cost:** $0.02-0.05
- **Purpose:** Quick validation that pipeline works

### Scenario 2: Medium Batch (Staging)
```json
{
  "account_id": "your-account-id", 
  "batch_type": "incremental",
  "email_limit": 25,
  "processing_options": {
    "batch_size": 5
  }
}
```
- **Expected Time:** 3-5 minutes
- **Expected Cost:** $0.15-0.25
- **Purpose:** Test realistic user workload

### Scenario 3: Large Batch (Production Test)
```json
{
  "account_id": "your-account-id",
  "batch_type": "full", 
  "email_limit": 100,
  "processing_options": {
    "batch_size": 10
  }
}
```
- **Expected Time:** 8-12 minutes
- **Expected Cost:** $0.60-1.00
- **Purpose:** Test scalability and cost management

## What Each Test Validates

### API Endpoints:
- ✅ Authentication works with Supabase JWT
- ✅ Request validation and error handling
- ✅ Job creation and database storage
- ✅ Supabase Edge Function triggering
- ✅ Real-time status polling
- ✅ Cost tracking and estimation

### AI Processing Pipeline:
- ✅ Email content extraction and processing
- ✅ LangChain theme analysis chains
- ✅ OpenAI embedding generation
- ✅ Family pattern recognition
- ✅ Priority scoring and action item extraction
- ✅ Error handling and retry logic

### System Integration:
- ✅ Database operations and RLS policies
- ✅ Error logging and performance monitoring  
- ✅ Rate limiting and concurrent job handling
- ✅ Cost management and budget controls

## Troubleshooting Real Tests

### Common Issues:

1. **401 Authentication Error**
   ```
   Solution: Get fresh access_token from browser localStorage
   Token expires after 1 hour, get new one from app
   ```

2. **403 Access Denied**  
   ```
   Solution: Ensure account_id belongs to authenticated user
   Check user owns the account being processed
   ```

3. **409 Job Already Active**
   ```
   Solution: Wait for current job to complete or check database:
   SELECT * FROM email_processing_jobs WHERE status IN ('pending', 'processing');
   ```

4. **500 Processing Failed**
   ```
   Solution: Check logs and verify:
   - OpenAI API key has credits
   - Supabase Edge Functions are deployed
   - Database tables exist and accessible
   ```

### Getting Support Data:

When tests fail, collect:
- Request/response JSON
- Job ID and timestamps  
- User account details
- Error messages from browser console
- Network tab for failed requests

## Next Steps After Successful Testing

1. **Monitor Costs:** Track actual vs estimated costs
2. **Performance Tuning:** Optimize batch sizes and timing
3. **Error Handling:** Test edge cases and failure scenarios  
4. **Scale Testing:** Gradually increase email limits
5. **Production Deployment:** Test on staging environment

## Quick Debug Commands

```bash
# Check if dev server is running
curl http://localhost:3000/api/health

# Test auth endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/user

# Check database connection
curl -X POST http://localhost:3000/api/test-db \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This approach tests the complete real pipeline with actual AI processing, database operations, and cost tracking!