/**
 * Simple BullMQ Email Processing Queue - DISABLED
 *
 * Redis/BullMQ disabled - using direct processing only
 */

// import { Queue, Worker } from 'bullmq';
import { EmbeddingWorker } from '../workers/embeddingWorker.js';
import { globalRateLimiter } from './openaiRateLimiter.js';
// import { EmailConfig } from '../config/emailConfig.js';

// const config = EmailConfig.queueProcessing;

// Redis queue disabled - using direct processing
export const emailQueue = null;
export const emailWorker = null;

// Simple helper to add email processing job to queue - now processes directly
export async function queueEmailProcessing(jobData) {
  console.log(`🔄 Processing email job directly for user ${jobData.user_id} (queue disabled)`);

  try {
    // Process directly without queue
    return await globalRateLimiter.executeBackgroundRequest(async () => {
      return await EmbeddingWorker.processEmailJob(jobData);
    });
  } catch (error) {
    console.error(`❌ Direct email processing failed:`, error);
    throw error;
  }
}

// Simple status check - disabled queue version
export async function getQueueStatus() {
  return {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    note: 'Queue disabled - using direct processing'
  };
}

// Queue events disabled (no queue)

export default { emailQueue, emailWorker, queueEmailProcessing, getQueueStatus };