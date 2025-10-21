/**
 * Simple BullMQ Email Processing Queue
 *
 * Uses configuration from emailConfig.js
 * Chat stays direct, email processing goes through queue
 */

import { Queue, Worker } from 'bullmq';
import { EmbeddingWorker } from '../workers/embeddingWorker.js';
import { globalRateLimiter } from './openaiRateLimiter.js';
import { EmailConfig } from '../config/emailConfig.js';

const config = EmailConfig.queueProcessing;

// Single queue for all email processing
export const emailQueue = new Queue(config.queue.name, {
  connection: config.redis,
  defaultJobOptions: {
    removeOnComplete: config.queue.removeOnComplete,
    removeOnFail: config.queue.removeOnFail,
    attempts: config.queue.maxRetries,
    backoff: {
      type: 'exponential',
      delay: config.queue.retryDelay
    }
  }
});

// Simple worker to process email jobs
export const emailWorker = new Worker(config.queue.name, async (job) => {
  console.log(`🔄 Processing email job ${job.id}: ${job.name}`);

  try {
    // Use background priority for queue processing
    return await globalRateLimiter.executeBackgroundRequest(async () => {
      return await EmbeddingWorker.processEmailJob(job.data);
    });

  } catch (error) {
    console.error(`❌ Email job ${job.id} failed:`, error);
    throw error; // Let BullMQ handle retries
  }
}, {
  connection: config.redis,
  concurrency: config.queue.concurrency
});

// Simple helper to add email processing job to queue
export async function queueEmailProcessing(jobData) {
  const priority = jobData.batch_type === 'onboarding'
    ? config.queue.onboardingPriority
    : config.queue.regularPriority;

  const job = await emailQueue.add('process-emails', jobData, { priority });

  console.log(`📦 Queued email processing job ${job.id} for user ${jobData.user_id} (priority: ${priority})`);
  return job.id;
}

// Simple status check
export async function getQueueStatus() {
  const waiting = await emailQueue.getWaiting();
  const active = await emailQueue.getActive();
  const completed = await emailQueue.getCompleted();
  const failed = await emailQueue.getFailed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length
  };
}

// Log queue events
emailQueue.on('completed', (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailQueue.on('failed', (job, err) => {
  console.log(`❌ Email job ${job.id} failed:`, err.message);
});

export default { emailQueue, emailWorker, queueEmailProcessing, getQueueStatus };