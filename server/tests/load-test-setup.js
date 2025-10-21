/**
 * Load Testing Setup for Email Processing System (CommonJS)
 *
 * Tests the email embedding pipeline under load:
 * - Multiple concurrent users starting onboarding
 * - 1000 emails per user being processed
 * - OpenAI API calls with proper rate limiting
 * - Redis queue management
 */

const nock = require('nock');

// Test configuration
const LOAD_TEST_CONFIG = {
  // Test scenarios
  scenarios: {
    single_user: { users: 1, emails_per_user: 1000 },
    light_load: { users: 5, emails_per_user: 1000 },
    heavy_load: { users: 10, emails_per_user: 1000 },
    stress_test: { users: 20, emails_per_user: 500 }
  },

  // OpenAI API limits by tier (configure for your account)
  openai_limits: {
    // Tier 2 limits (adjust to your actual tier)
    requests_per_minute: 3000,
    tokens_per_minute: 150000,

    // Realistic response time ranges (ms)
    embedding_delay_range: [50, 200],  // text-embedding-3-small
    chat_delay_range: [500, 2000],     // gpt-4o-mini (varies by complexity)

    // Burst allowance (OpenAI allows short bursts above average)
    burst_multiplier: 1.5,
    burst_duration_ms: 10000, // 10 seconds

    // Token estimates per request
    avg_embedding_tokens: 50,
    avg_chat_prompt_tokens: 100,
    avg_chat_completion_tokens: 50
  },

  // Test timeouts
  timeouts: {
    single_user: 60000, // 1 minute
    light_load: 300000, // 5 minutes
    heavy_load: 600000, // 10 minutes
    stress_test: 900000 // 15 minutes
  }
};

// Mock email data generator
function generateMockEmails(count = 1000) {
  const emails = [];
  for (let i = 0; i < count; i++) {
    emails.push({
      id: `email_${i}`,
      subject: `Test Email ${i} - ${generateRandomSubject()}`,
      from: `sender${i % 20}@example.com`, // 20 different senders
      body: generateRandomEmailBody(),
      date: new Date(Date.now() - (i * 3600000)).toISOString(), // 1 hour apart
      labels: ['INBOX'],
      snippet: `Email snippet ${i}...`
    });
  }
  return emails;
}

// Mock Gmail API responses
function mockGmailAPI(userCount, emailsPerUser) {
  const totalEmails = userCount * emailsPerUser;

  console.log(`🎭 Mocking Gmail API for ${userCount} users, ${emailsPerUser} emails each (${totalEmails} total)`);

  // Mock Gmail list messages
  nock('https://gmail.googleapis.com')
    .get('/gmail/v1/users/me/messages')
    .query(true)
    .times(userCount)
    .reply(200, (uri, body) => {
      const emails = generateMockEmails(emailsPerUser);
      return {
        messages: emails.map(email => ({ id: email.id })),
        nextPageToken: null
      };
    });

  // Mock Gmail get message (for each email)
  nock('https://gmail.googleapis.com')
    .get(/\/gmail\/v1\/users\/me\/messages\/email_\d+/)
    .times(totalEmails)
    .reply(200, (uri) => {
      const emailId = uri.split('/').pop();
      const emailIndex = parseInt(emailId.split('_')[1]);
      const mockEmail = generateMockEmails(1)[0];
      mockEmail.id = emailId;

      return {
        id: emailId,
        payload: {
          headers: [
            { name: 'Subject', value: mockEmail.subject },
            { name: 'From', value: mockEmail.from },
            { name: 'Date', value: mockEmail.date }
          ],
          body: { data: Buffer.from(mockEmail.body).toString('base64') }
        }
      };
    });
}

// Rate limiter state for realistic simulation
const rateLimiterState = {
  requestsInLastMinute: [],
  tokensInLastMinute: [],
  burstStartTime: null,
  burstRequestCount: 0
};

// Check if request should be rate limited
function shouldRateLimit(tokens = 50) {
  const now = Date.now();
  const limits = LOAD_TEST_CONFIG.openai_limits;

  // Clean old requests (older than 1 minute)
  rateLimiterState.requestsInLastMinute = rateLimiterState.requestsInLastMinute.filter(
    time => now - time < 60000
  );
  rateLimiterState.tokensInLastMinute = rateLimiterState.tokensInLastMinute.filter(
    entry => now - entry.time < 60000
  );

  // Calculate current usage
  const currentRPM = rateLimiterState.requestsInLastMinute.length;
  const currentTPM = rateLimiterState.tokensInLastMinute.reduce((sum, entry) => sum + entry.tokens, 0);

  // Check burst allowance
  let effectiveRPMLimit = limits.requests_per_minute;
  if (rateLimiterState.burstStartTime && (now - rateLimiterState.burstStartTime) < limits.burst_duration_ms) {
    effectiveRPMLimit *= limits.burst_multiplier;
    rateLimiterState.burstRequestCount++;
  } else {
    // Reset burst
    rateLimiterState.burstStartTime = null;
    rateLimiterState.burstRequestCount = 0;
  }

  // Start burst if we're hitting regular limits but have burst available
  if (!rateLimiterState.burstStartTime && currentRPM >= limits.requests_per_minute * 0.9) {
    rateLimiterState.burstStartTime = now;
    effectiveRPMLimit *= limits.burst_multiplier;
  }

  // Check limits
  const rpmExceeded = currentRPM >= effectiveRPMLimit;
  const tpmExceeded = currentTPM + tokens >= limits.tokens_per_minute;

  if (rpmExceeded || tpmExceeded) {
    return true;
  }

  // Track this request
  rateLimiterState.requestsInLastMinute.push(now);
  rateLimiterState.tokensInLastMinute.push({ time: now, tokens });

  return false;
}

// Generate realistic response delay
function getRealisticDelay(delayRange) {
  const [min, max] = delayRange;
  return min + Math.random() * (max - min);
}

// Mock OpenAI API responses with realistic rate limiting
function mockOpenAIAPI(userCount, emailsPerUser, includeRateLimiting = false) {
  const totalEmbeddingCalls = userCount * emailsPerUser;
  const totalChatCalls = userCount * emailsPerUser; // Theme analysis

  console.log(`🤖 Mocking OpenAI API: ${totalEmbeddingCalls} embeddings + ${totalChatCalls} chat calls`);

  if (includeRateLimiting) {
    console.log(`⚠️ Including realistic rate limiting simulation`);
    console.log(`📊 Limits: ${LOAD_TEST_CONFIG.openai_limits.requests_per_minute} RPM, ${LOAD_TEST_CONFIG.openai_limits.tokens_per_minute} TPM`);
  }

  // Mock embeddings API with realistic behavior
  let embeddingCallCount = 0;
  nock('https://api.openai.com')
    .post('/v1/embeddings')
    .times(totalEmbeddingCalls)
    .reply(function() {
      embeddingCallCount++;
      const tokens = LOAD_TEST_CONFIG.openai_limits.avg_embedding_tokens;

      // Check rate limiting if enabled
      if (includeRateLimiting && shouldRateLimit(tokens)) {
        console.log(`🚫 Rate limited embedding request #${embeddingCallCount}`);
        return [429, {
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error',
            code: 'rate_limit_exceeded'
          }
        }];
      }

      // Realistic response delay
      const delay = getRealisticDelay(LOAD_TEST_CONFIG.openai_limits.embedding_delay_range);

      return new Promise(resolve => {
        setTimeout(() => {
          resolve([200, {
            object: 'list',
            data: [{
              object: 'embedding',
              embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5), // 1536-dim vector
              index: 0
            }],
            model: 'text-embedding-3-small',
            usage: { prompt_tokens: tokens, total_tokens: tokens }
          }]);
        }, delay);
      });
    });

  // Mock chat completions API with theme analysis
  let chatCallCount = 0;
  nock('https://api.openai.com')
    .post('/v1/chat/completions')
    .times(totalChatCalls)
    .reply(function() {
      chatCallCount++;

      // Calculate realistic token usage
      const promptTokens = LOAD_TEST_CONFIG.openai_limits.avg_chat_prompt_tokens + Math.floor(Math.random() * 40);
      const completionTokens = LOAD_TEST_CONFIG.openai_limits.avg_chat_completion_tokens + Math.floor(Math.random() * 40);
      const totalTokens = promptTokens + completionTokens;

      // Check rate limiting if enabled
      if (includeRateLimiting && shouldRateLimit(totalTokens)) {
        console.log(`🚫 Rate limited chat request #${chatCallCount} (${totalTokens} tokens)`);
        return [429, {
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error'
          }
        }];
      }

      // Realistic response delay (chat takes longer than embeddings)
      const delay = getRealisticDelay(LOAD_TEST_CONFIG.openai_limits.chat_delay_range);

      return new Promise(resolve => {
        setTimeout(() => {
          // Generate realistic theme analysis
          const themes = generateRandomThemes();
          resolve([200, {
            id: `chatcmpl-${Date.now()}-${chatCallCount}`,
            object: 'chat.completion',
            model: 'gpt-4o-mini',
            choices: [{
              message: {
                role: 'assistant',
                content: JSON.stringify({
                  themes: themes,
                  relevance_score: Math.random() * 0.4 + 0.6, // 0.6-1.0
                  priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
                })
              },
              finish_reason: 'stop'
            }],
            usage: {
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: totalTokens
            }
          }]);
        }, delay);
      });
    });
}

// Create test users
async function createTestUsers(count) {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push({
      id: `test_user_${i}`,
      email: `testuser${i}@example.com`,
      onboarding_completed_at: null,
      email_processing_status: 'not_started'
    });
  }
  return users;
}

// Helper functions for random data
function generateRandomSubject() {
  const subjects = [
    'Soccer practice reminder',
    'Piano lesson schedule',
    'School pickup info',
    'Birthday party invitation',
    'Doctor appointment',
    'Parent-teacher conference',
    'Field trip permission slip',
    'Homework assignment'
  ];
  return subjects[Math.floor(Math.random() * subjects.length)];
}

function generateRandomEmailBody() {
  const bodies = [
    'Just a reminder about soccer practice this Thursday at 4 PM.',
    'Your child has a piano lesson scheduled for next Tuesday.',
    'Please pick up your child at 3:15 PM today.',
    'You\'re invited to Emma\'s birthday party this Saturday!',
    'Appointment reminder: Dr. Smith on Friday at 2 PM.',
    'Parent-teacher conference scheduled for next week.',
    'Please sign and return the field trip permission slip.',
    'Math homework is due tomorrow morning.'
  ];
  return bodies[Math.floor(Math.random() * bodies.length)];
}

function generateRandomThemes() {
  const allThemes = [
    'family', 'school', 'activities', 'medical', 'social', 'sports',
    'music', 'homework', 'appointments', 'events', 'transportation',
    'childcare', 'emergencies', 'parent-teacher', 'nutrition', 'bedtime'
  ];

  // Return 1-4 random themes
  const themeCount = Math.floor(Math.random() * 4) + 1;
  const selectedThemes = [];

  for (let i = 0; i < themeCount; i++) {
    const theme = allThemes[Math.floor(Math.random() * allThemes.length)];
    if (!selectedThemes.includes(theme)) {
      selectedThemes.push(theme);
    }
  }

  return selectedThemes;
}

module.exports = {
  LOAD_TEST_CONFIG,
  generateMockEmails,
  mockGmailAPI,
  mockOpenAIAPI,
  createTestUsers
};