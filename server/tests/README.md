# Email Processing Load Tests

Comprehensive load testing for the email processing system using **Nock** for API mocking and **Jest** for test execution.

## 🚀 Quick Start

```bash
# Install test dependencies
npm install

# Run all load tests
npm run test:load

# Run specific test scenarios
npm run test:single      # Single user (1000 emails)
npm run test:concurrent  # 5 concurrent users
```

## 📊 Test Scenarios

| Test | Users | Emails/User | Total Emails | Timeout |
|------|-------|-------------|--------------|---------|
| **Single User** | 1 | 1000 | 1000 | 1 min |
| **Light Load** | 5 | 1000 | 5000 | 5 min |
| **Heavy Load** | 10 | 1000 | 10000 | 10 min |
| **Stress Test** | 20 | 500 | 10000 | 15 min |

## 🎭 What Gets Mocked

### Gmail API
- `GET /gmail/v1/users/me/messages` - Email list
- `GET /gmail/v1/users/me/messages/{id}` - Individual emails

### OpenAI API
- `POST /v1/embeddings` - Text embeddings (1000+ calls)
- `POST /v1/chat/completions` - Theme analysis (1000+ calls)

## 🔍 What Gets Tested

✅ **Concurrent Processing**: Multiple users starting onboarding simultaneously
✅ **Queue Management**: Redis queue handling under load
✅ **API Rate Limiting**: OpenAI API rate limit compliance
✅ **Error Handling**: Graceful handling of API failures
✅ **Resource Management**: Memory usage and cleanup
✅ **Status Tracking**: Real-time job status updates

## 📈 Performance Metrics

The tests measure:
- **Total processing time** per scenario
- **Emails per second** throughput
- **Queue depth** during processing
- **API call success rate**
- **Memory usage** patterns

## 🛠️ Customizing Tests

Edit `load-test-setup.js` to adjust:

```javascript
// Test configuration
scenarios: {
  custom_test: { users: 15, emails_per_user: 800 }
},

// OpenAI API simulation
openai_limits: {
  requests_per_minute: 5000,  // Your API tier
  embedding_delay_ms: 15,     // Simulate latency
}
```

## 🧪 Running Individual Tests

```bash
# Test specific scenario
npx jest --testNamePattern="Single User"
npx jest --testNamePattern="Heavy Load"
npx jest --testNamePattern="Rate Limiting"

# Verbose output
npx jest tests/email-processing-load.test.js --verbose

# Watch mode for development
npx jest --watch
```

## 🚨 Prerequisites

1. **Redis running** (for queue tests)
2. **Test database** (separate from production)
3. **Environment variables** configured:
   ```
   NODE_ENV=test
   REDIS_URL=redis://localhost:6379
   SUPABASE_URL=your-test-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-test-key
   ```

## 📝 Expected Results

**Successful test run should show:**
- All API mocks consumed
- Users processing status: `completed`
- No memory leaks
- Queue properly drained
- Processing rate > 50 emails/second

**Common issues:**
- Timeout errors → Increase timeouts or reduce email count
- Mock unused → Check API endpoints match
- Redis errors → Ensure Redis is running

## 🎯 Production Readiness

Use these tests to validate:
- System can handle expected user load
- OpenAI rate limits are respected
- Queue scaling works properly
- Error recovery is robust

Run before deploying email processing changes!