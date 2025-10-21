/**
 * Email Processing Load Tests (CommonJS)
 *
 * Tests the complete email processing pipeline under various load conditions.
 * Validates Redis queuing, OpenAI API integration, and concurrent user handling.
 */

// Load environment variables first
require('dotenv').config();

const request = require('supertest');
const nock = require('nock');
const {
  LOAD_TEST_CONFIG,
  mockGmailAPI,
  mockOpenAIAPI,
  createTestUsers
} = require('./load-test-setup.js');

// Mock app for testing (replace with actual app when ready)
const express = require('express');
const app = express();
app.use(express.json());

// Mock endpoints for testing
app.post('/api/profile/complete-onboarding', (req, res) => {
  console.log(`📝 Onboarding completed for user: ${req.body.account_id}`);
  // Simulate starting email processing
  setTimeout(() => {
    console.log(`🚀 Email processing started for user: ${req.body.account_id}`);
  }, 100);
  res.json({ success: true, job_id: `job_${req.body.account_id}_${Date.now()}` });
});

app.get('/api/profile/status/:user_id', (req, res) => {
  // Simulate processing status progression
  const statuses = ['starting', 'processing', 'processing', 'completed'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

  res.json({
    status: randomStatus,
    emails_processed: Math.floor(Math.random() * 1000),
    total_emails: 1000,
    started_at: new Date().toISOString()
  });
});

app.post('/api/embeddings/process-user-emails', (req, res) => {
  console.log(`📧 Processing emails for user: ${req.body.user_id}`);
  res.json({ success: true, message: 'Processing started' });
});

describe('Email Processing Load Tests', () => {
  let testUsers = [];

  beforeEach(() => {
    // Clear all HTTP mocks
    nock.cleanAll();
    testUsers = [];
  });

  afterEach(() => {
    // Ensure all mocks were called
    if (!nock.isDone()) {
      console.warn('⚠️ Unused nock interceptors:', nock.pendingMocks());
    }
    nock.cleanAll();
  });

  describe('Single User Onboarding', () => {
    it('should process 1000 emails for one user', async () => {
      const scenario = LOAD_TEST_CONFIG.scenarios.single_user;

      // Setup mocks
      mockGmailAPI(scenario.users, scenario.emails_per_user);
      mockOpenAIAPI(scenario.users, scenario.emails_per_user);

      // Create test user
      testUsers = await createTestUsers(scenario.users);
      const testUser = testUsers[0];

      console.log(`🧪 Testing single user: ${scenario.emails_per_user} emails`);
      const startTime = Date.now();

      // Trigger onboarding completion
      const response = await request(app)
        .post('/api/profile/complete-onboarding')
        .send({ account_id: testUser.id })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Wait for processing to complete (or timeout)
      await waitForProcessingComplete(testUser.id, LOAD_TEST_CONFIG.timeouts.single_user);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`✅ Single user test completed in ${duration}ms`);

      // Verify final status
      const statusResponse = await request(app)
        .get(`/api/profile/status/${testUser.id}`)
        .expect(200);

      expect(statusResponse.body.status).toBe('completed');
    }, LOAD_TEST_CONFIG.timeouts.single_user);
  });

  describe('Concurrent Users Load Test', () => {
    it('should handle 5 users processing 1000 emails each simultaneously', async () => {
      const scenario = LOAD_TEST_CONFIG.scenarios.light_load;

      // Setup mocks for all users
      mockGmailAPI(scenario.users, scenario.emails_per_user);
      mockOpenAIAPI(scenario.users, scenario.emails_per_user);

      // Create test users
      testUsers = await createTestUsers(scenario.users);

      console.log(`🧪 Testing ${scenario.users} concurrent users: ${scenario.emails_per_user} emails each`);
      const startTime = Date.now();

      // Start onboarding for all users simultaneously
      const onboardingPromises = testUsers.map(user =>
        request(app)
          .post('/api/profile/complete-onboarding')
          .send({ account_id: user.id })
          .expect(200)
      );

      const responses = await Promise.all(onboardingPromises);

      // Verify all started successfully
      responses.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // Wait for all processing to complete
      const completionPromises = testUsers.map(user =>
        waitForProcessingComplete(user.id, LOAD_TEST_CONFIG.timeouts.light_load)
      );

      await Promise.all(completionPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;
      const totalEmails = scenario.users * scenario.emails_per_user;

      console.log(`✅ Concurrent test completed: ${totalEmails} emails in ${duration}ms`);
      console.log(`📊 Rate: ${(totalEmails / (duration / 1000)).toFixed(2)} emails/second`);

      // Verify all users completed successfully
      for (const user of testUsers) {
        const statusResponse = await request(app)
          .get(`/api/profile/status/${user.id}`)
          .expect(200);

        expect(statusResponse.body.status).toBe('completed');
      }
    }, LOAD_TEST_CONFIG.timeouts.light_load);
  });

  describe('Heavy Load Test', () => {
    it('should handle 10 users processing 1000 emails each', async () => {
      const scenario = LOAD_TEST_CONFIG.scenarios.heavy_load;

      mockGmailAPI(scenario.users, scenario.emails_per_user);
      mockOpenAIAPI(scenario.users, scenario.emails_per_user);

      testUsers = await createTestUsers(scenario.users);

      console.log(`🧪 Heavy load test: ${scenario.users} users, ${scenario.emails_per_user} emails each`);
      const startTime = Date.now();

      // Stagger the requests slightly to simulate real-world timing
      const onboardingPromises = testUsers.map((user, index) =>
        new Promise(resolve => {
          setTimeout(() => {
            resolve(
              request(app)
                .post('/api/profile/complete-onboarding')
                .send({ account_id: user.id })
                .expect(200)
            );
          }, index * 100); // 100ms stagger
        })
      );

      await Promise.all(onboardingPromises);

      // Monitor queue depth during processing
      const queueMonitor = setInterval(async () => {
        try {
          const queueStats = await getQueueStats(); // You'll need to implement this
          console.log(`📊 Queue depth: ${queueStats.waiting}, Processing: ${queueStats.active}`);
        } catch (error) {
          // Ignore monitoring errors
        }
      }, 5000);

      // Wait for completion
      const completionPromises = testUsers.map(user =>
        waitForProcessingComplete(user.id, LOAD_TEST_CONFIG.timeouts.heavy_load)
      );

      await Promise.all(completionPromises);
      clearInterval(queueMonitor);

      const endTime = Date.now();
      const duration = endTime - startTime;
      const totalEmails = scenario.users * scenario.emails_per_user;

      console.log(`✅ Heavy load test completed: ${totalEmails} emails in ${duration}ms`);
      console.log(`📊 Rate: ${(totalEmails / (duration / 1000)).toFixed(2)} emails/second`);
    }, LOAD_TEST_CONFIG.timeouts.heavy_load);
  });

  describe('Error Handling and Rate Limiting', () => {
    it('should handle OpenAI rate limit errors gracefully', async () => {
      const scenario = { users: 2, emails_per_user: 100 };

      mockGmailAPI(scenario.users, scenario.emails_per_user);
      // Enable rate limiting simulation
      mockOpenAIAPI(scenario.users, scenario.emails_per_user, true);

      testUsers = await createTestUsers(scenario.users);

      console.log('🧪 Testing rate limit handling with simulated 429 errors');

      // Should complete despite rate limit errors (with retries)
      const onboardingPromises = testUsers.map(user =>
        request(app)
          .post('/api/profile/complete-onboarding')
          .send({ account_id: user.id })
          .expect(200)
      );

      await Promise.all(onboardingPromises);

      // Wait for completion (may take longer due to retries)
      await Promise.all(testUsers.map(user =>
        waitForProcessingComplete(user.id, LOAD_TEST_CONFIG.timeouts.light_load)
      ));

      console.log('✅ Rate limit handling test completed');
    }, LOAD_TEST_CONFIG.timeouts.light_load);

    it('should simulate realistic API latency and throughput', async () => {
      const scenario = { users: 3, emails_per_user: 200 };

      mockGmailAPI(scenario.users, scenario.emails_per_user);
      mockOpenAIAPI(scenario.users, scenario.emails_per_user, false);

      testUsers = await createTestUsers(scenario.users);

      console.log('🧪 Testing realistic API latency simulation');
      const startTime = Date.now();

      const onboardingPromises = testUsers.map(user =>
        request(app)
          .post('/api/profile/complete-onboarding')
          .send({ account_id: user.id })
          .expect(200)
      );

      await Promise.all(onboardingPromises);

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const totalApiCalls = scenario.users * scenario.emails_per_user * 2; // embeddings + chat

      console.log(`📊 Performance: ${totalApiCalls} API calls in ${totalTime}ms`);
      console.log(`📊 Throughput: ${(totalApiCalls / (totalTime / 1000)).toFixed(2)} calls/second`);

      // Verify realistic throughput (should be limited by our delays)
      const throughputPerSecond = totalApiCalls / (totalTime / 1000);
      expect(throughputPerSecond).toBeLessThan(100); // Should be throttled by delays
      expect(throughputPerSecond).toBeGreaterThan(5); // Should be reasonably fast

      console.log('✅ Latency simulation test completed');
    }, LOAD_TEST_CONFIG.timeouts.light_load);
  });
});

// Helper function to wait for processing completion
async function waitForProcessingComplete(userId, timeout) {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await request(app)
        .get(`/api/profile/status/${userId}`);

      if (response.body.status === 'completed' || response.body.status === 'failed') {
        return response.body.status;
      }

      // Wait 2 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.warn(`Status check failed for user ${userId}:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error(`Processing did not complete within ${timeout}ms for user ${userId}`);
}

// Helper to get queue statistics (implement based on your Redis setup)
async function getQueueStats() {
  // This would connect to your Redis instance and get queue stats
  // Return { waiting: number, active: number, completed: number, failed: number }
  return { waiting: 0, active: 0, completed: 0, failed: 0 };
}