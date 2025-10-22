#!/usr/bin/env node

/**
 * Simple Email Queue Worker
 * Processes emails from Redis queue with retry handling
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { processNextEmail, getQueueStats } from '../services/emailQueue.js';

// Worker configuration
const WORKER_INTERVAL = 1000; // Check queue every 1 second
const STATS_INTERVAL = 30000; // Log stats every 30 seconds

let isShuttingDown = false;
let processedCount = 0;
let successCount = 0;
let failureCount = 0;
let retryCount = 0;

/**
 * Main worker loop
 */
async function runWorker() {
  console.log('🔄 Email worker started, checking queue...');

  while (!isShuttingDown) {
    try {
      const result = await processNextEmail();

      if (result === null) {
        // No jobs available, wait a bit
        await sleep(WORKER_INTERVAL);
        continue;
      }

      processedCount++;

      if (result.success) {
        successCount++;
        console.log(`✅ [${processedCount}] Email ${result.emailId} processed successfully`);
      } else if (result.retried) {
        retryCount++;
        console.log(`⏰ [${processedCount}] Email ${result.emailId} retried (attempt ${result.retryCount})`);
      } else if (result.failed) {
        failureCount++;
        console.log(`❌ [${processedCount}] Email ${result.emailId} failed permanently: ${result.error}`);
      }

    } catch (error) {
      console.error('💥 Worker error:', error);
      await sleep(5000); // Wait 5 seconds before retrying
    }
  }

  console.log('👋 Email worker stopped');
}

/**
 * Log worker statistics
 */
async function logStats() {
  try {
    const queueStats = await getQueueStats();

    console.log(`📊 Worker Stats: Processed: ${processedCount} | Success: ${successCount} | Failed: ${failureCount} | Retried: ${retryCount}`);
    console.log(`📊 Queue Stats: Waiting: ${queueStats.waiting} | Retrying: ${queueStats.retrying} | Total: ${queueStats.total}`);
  } catch (error) {
    console.error('❌ Failed to get stats:', error);
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Graceful shutdown
 */
function shutdown() {
  console.log('\n👋 Received shutdown signal, stopping worker...');
  isShuttingDown = true;
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start stats logging
const statsInterval = setInterval(logStats, STATS_INTERVAL);

// Start worker
console.log('🚀 Starting email queue worker...');
runWorker().then(() => {
  clearInterval(statsInterval);
  process.exit(0);
}).catch((error) => {
  console.error('💥 Worker crashed:', error);
  clearInterval(statsInterval);
  process.exit(1);
});