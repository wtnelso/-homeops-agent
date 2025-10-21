/**
 * Simple Rate Limiting Test
 * Directly tests the OpenAI API mocks to demonstrate rate limiting
 */

require('dotenv').config();

const nock = require('nock');
const { mockOpenAIAPI } = require('./load-test-setup.js');

// Simple HTTP request function to replace fetch
function makeRequest(url, options) {
  return new Promise((resolve) => {
    const https = require('https');
    const { URL } = require('url');

    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname,
      method: options.method,
      headers: options.headers
    };

    const req = https.request(reqOptions, (res) => {
      resolve({ status: res.statusCode });
    });

    req.on('error', () => {
      resolve({ status: 500 });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

describe('Simple Rate Limiting Demo', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('should demonstrate OpenAI API mocking with rate limits', async () => {
    // Setup mocks for 5 users, 200 emails each (2000 total API calls) - realistic high volume
    const users = 5;
    const emails = 200;
    mockOpenAIAPI(users, emails, true);

    console.log(`🧪 HIGH VOLUME TEST: ${users} users × ${emails} emails = ${users * emails * 2} total API calls`);
    console.log(`📊 Simulating realistic email processing load with rate limiting...`);

    const startTime = Date.now();
    const promises = [];
    let successCount = 0;
    let rateLimitCount = 0;
    let callsCompleted = 0;

    // Make embedding calls
    for (let i = 0; i < users * emails; i++) {
      promises.push(
        makeRequest('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'text-embedding-3-small', input: 'test' })
        }).then(res => {
          callsCompleted++;
          if (res.status === 200) successCount++;
          if (res.status === 429) rateLimitCount++;

          // Progress updates every 100 calls
          if (callsCompleted % 100 === 0) {
            const elapsed = Date.now() - startTime;
            const rate = callsCompleted / (elapsed / 1000);
            console.log(`📈 Progress: ${callsCompleted}/${users * emails * 2} calls | ${rate.toFixed(1)} calls/sec | ${rateLimitCount} rate limited`);
          }
        }).catch(() => {})
      );
    }

    // Make chat calls
    for (let i = 0; i < users * emails; i++) {
      promises.push(
        makeRequest('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{role: 'user', content: 'test'}] })
        }).then(res => {
          callsCompleted++;
          if (res.status === 200) successCount++;
          if (res.status === 429) rateLimitCount++;

          // Progress updates every 100 calls
          if (callsCompleted % 100 === 0) {
            const elapsed = Date.now() - startTime;
            const rate = callsCompleted / (elapsed / 1000);
            console.log(`📈 Progress: ${callsCompleted}/${users * emails * 2} calls | ${rate.toFixed(1)} calls/sec | ${rateLimitCount} rate limited`);
          }
        }).catch(() => {})
      );
    }

    await Promise.allSettled(promises);

    const totalTime = Date.now() - startTime;
    const totalCalls = users * emails * 2;
    const finalRate = totalCalls / (totalTime / 1000);

    console.log(`\n🎯 FINAL RESULTS:`);
    console.log(`   📊 Total API calls: ${totalCalls}`);
    console.log(`   ✅ Successful: ${successCount} (${(successCount/totalCalls*100).toFixed(1)}%)`);
    console.log(`   🚫 Rate limited: ${rateLimitCount} (${(rateLimitCount/totalCalls*100).toFixed(1)}%)`);
    console.log(`   ⏱️  Total time: ${(totalTime/1000).toFixed(1)}s`);
    console.log(`   ⚡ Average rate: ${finalRate.toFixed(1)} calls/second`);
    console.log(`   🔄 Rate limiting frequency: Every ~${Math.round(successCount/Math.max(rateLimitCount,1))} successful calls`);

    console.log(`\n📈 SCALABILITY PROJECTIONS:`);
    const timeFor1000Emails = (1000 / emails) * totalTime;
    console.log(`   📧 1000 emails per user: ~${(timeFor1000Emails/60000).toFixed(1)} minutes`);
    console.log(`   👥 10 concurrent users: ~${(timeFor1000Emails*0.4/60000).toFixed(1)} minutes`); // Overlap benefit
    console.log(`   🏢 Production throughput: ~${(50*finalRate).toFixed(0)} emails/hour`);

    expect(successCount + rateLimitCount).toBe(totalCalls);
    expect(nock.isDone()).toBe(true);
  }, 60000); // 60 second timeout for high volume test
});
