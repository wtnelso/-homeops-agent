#!/usr/bin/env node

/**
 * Inbound Email Load Test
 * Tests the throughput capacity of the inbound email processing endpoint
 */

import fetch from 'node-fetch';

const ENDPOINT = 'https://homeops-agent-p7ru.onrender.com/inbound-email';
const TEST_FORWARDING_ADDRESS = 'turnernelson1-659959@inbound.homeops.ai';

// Test configurations
const TEST_SCENARIOS = {
  light: { concurrent: 5, total: 20, delay: 1000 },
  medium: { concurrent: 10, total: 50, delay: 500 },
  heavy: { concurrent: 20, total: 100, delay: 100 },
  burst: { concurrent: 50, total: 200, delay: 50 }
};

/**
 * Generate test email payload
 */
function generateTestEmail(index) {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substr(2, 9);

  return {
    email: `From: test-sender-${index}@example.com
To: ${TEST_FORWARDING_ADDRESS}
Subject: Load Test Email ${index} - ${timestamp}
Date: ${new Date().toUTCString()}
Message-ID: <load-test-${timestamp}-${randomId}@example.com>

This is a load test email #${index} sent at ${new Date().toISOString()}.

Testing inbound email processing capacity with:
- Unique message ID: ${randomId}
- Timestamp: ${timestamp}
- Email index: ${index}

This email should be processed through the normal AI pipeline.`,
    to: TEST_FORWARDING_ADDRESS
  };
}

/**
 * Send single test email
 */
async function sendTestEmail(index) {
  const startTime = Date.now();
  const payload = generateTestEmail(index);

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(payload).toString()
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const result = await response.json();

    return {
      index,
      success: response.ok,
      status: response.status,
      responseTime,
      result: response.ok ? result : { error: result.error || 'Unknown error' }
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      index,
      success: false,
      status: 0,
      responseTime: endTime - startTime,
      result: { error: error.message }
    };
  }
}

/**
 * Run load test with specific configuration
 */
async function runLoadTest(scenario, config) {
  console.log(`\n🧪 Starting ${scenario.toUpperCase()} load test:`);
  console.log(`   - Concurrent requests: ${config.concurrent}`);
  console.log(`   - Total emails: ${config.total}`);
  console.log(`   - Delay between batches: ${config.delay}ms`);
  console.log(`   - Target: ${ENDPOINT}`);

  const results = [];
  const startTime = Date.now();

  // Send emails in batches
  for (let i = 0; i < config.total; i += config.concurrent) {
    const batchSize = Math.min(config.concurrent, config.total - i);
    const batch = [];

    console.log(`📤 Sending batch ${Math.floor(i / config.concurrent) + 1}: emails ${i + 1}-${i + batchSize}`);

    // Create concurrent promises for this batch
    for (let j = 0; j < batchSize; j++) {
      batch.push(sendTestEmail(i + j + 1));
    }

    // Wait for batch to complete
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);

    // Log batch results
    const batchSuccesses = batchResults.filter(r => r.success).length;
    const avgResponseTime = batchResults.reduce((sum, r) => sum + r.responseTime, 0) / batchResults.length;
    console.log(`   ✅ Batch complete: ${batchSuccesses}/${batchSize} success, avg ${avgResponseTime.toFixed(0)}ms`);

    // Delay before next batch (except for last batch)
    if (i + config.concurrent < config.total) {
      await new Promise(resolve => setTimeout(resolve, config.delay));
    }
  }

  const endTime = Date.now();
  const totalTime = endTime - startTime;

  // Calculate statistics
  const successes = results.filter(r => r.success);
  const failures = results.filter(r => !r.success);
  const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
  const minResponseTime = Math.min(...results.map(r => r.responseTime));
  const maxResponseTime = Math.max(...results.map(r => r.responseTime));
  const throughput = (successes.length / totalTime) * 1000 * 60; // emails per minute

  // Print results
  console.log(`\n📊 ${scenario.toUpperCase()} Test Results:`);
  console.log(`   Total time: ${(totalTime / 1000).toFixed(1)}s`);
  console.log(`   Success rate: ${successes.length}/${results.length} (${((successes.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`   Throughput: ${throughput.toFixed(1)} emails/minute`);
  console.log(`   Response times: ${minResponseTime}ms (min) | ${avgResponseTime.toFixed(0)}ms (avg) | ${maxResponseTime}ms (max)`);

  if (failures.length > 0) {
    console.log(`\n❌ Failures (${failures.length}):`);
    failures.slice(0, 5).forEach(f => {
      console.log(`   Email ${f.index}: ${f.status} - ${f.result.error}`);
    });
    if (failures.length > 5) {
      console.log(`   ... and ${failures.length - 5} more failures`);
    }
  }

  return {
    scenario,
    config,
    totalTime,
    successes: successes.length,
    failures: failures.length,
    successRate: (successes.length / results.length) * 100,
    throughput,
    avgResponseTime,
    minResponseTime,
    maxResponseTime,
    results
  };
}

/**
 * Main test runner
 */
async function main() {
  const scenario = process.argv[2] || 'light';

  if (!TEST_SCENARIOS[scenario]) {
    console.error(`❌ Invalid scenario: ${scenario}`);
    console.log(`Available scenarios: ${Object.keys(TEST_SCENARIOS).join(', ')}`);
    process.exit(1);
  }

  console.log('🚀 Inbound Email Load Test Starting...');
  console.log(`📧 Testing against: ${TEST_FORWARDING_ADDRESS}`);

  try {
    const result = await runLoadTest(scenario, TEST_SCENARIOS[scenario]);

    console.log(`\n✅ Load test completed successfully!`);
    console.log(`📈 Peak throughput: ${result.throughput.toFixed(1)} emails/minute`);

    if (result.successRate < 95) {
      console.log(`⚠️  Warning: Success rate below 95% (${result.successRate.toFixed(1)}%)`);
    }

  } catch (error) {
    console.error('❌ Load test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runLoadTest, TEST_SCENARIOS };