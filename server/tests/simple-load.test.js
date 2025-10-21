/**
 * Simple Load Test (CommonJS)
 * Quick test to validate Redis and basic setup
 */

// Load environment variables
require('dotenv').config();

const nock = require('nock');

describe('Simple Load Test Setup', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('should have Redis URL configured', () => {
    const redisUrl = process.env.REDIS_URL;
    expect(redisUrl).toBeDefined();
    expect(redisUrl).toContain('redis://');
    console.log('✅ Redis URL configured:', redisUrl.replace(/:[^:]*@/, ':****@'));
  });

  test('should be able to mock OpenAI API', () => {
    // Mock OpenAI embeddings endpoint
    const scope = nock('https://api.openai.com')
      .post('/v1/embeddings')
      .reply(200, {
        object: 'list',
        data: [{
          object: 'embedding',
          embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5),
          index: 0
        }],
        model: 'text-embedding-3-small',
        usage: { prompt_tokens: 50, total_tokens: 50 }
      });

    console.log('✅ OpenAI API mock created');
    expect(scope).toBeDefined();
  });

  test('should be able to mock Gmail API', () => {
    // Mock Gmail messages list
    const scope = nock('https://gmail.googleapis.com')
      .get('/gmail/v1/users/me/messages')
      .query(true)
      .reply(200, {
        messages: [
          { id: 'test_email_1' },
          { id: 'test_email_2' }
        ],
        nextPageToken: null
      });

    console.log('✅ Gmail API mock created');
    expect(scope).toBeDefined();
  });

  test('environment should be ready for load testing', () => {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'REDIS_URL'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missing.length > 0) {
      console.error('❌ Missing environment variables:', missing);
      expect(missing).toHaveLength(0);
    } else {
      console.log('✅ All required environment variables present');
      expect(missing).toHaveLength(0);
    }
  });
});