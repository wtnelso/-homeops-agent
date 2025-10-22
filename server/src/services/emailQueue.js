/**
 * Simple Redis Email Queue
 * Handles email processing with basic rate limit retries
 */

import Redis from 'ioredis';

// Redis client setup
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  console.log('📧 Redis email queue connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis email queue error:', err);
});

const QUEUE_NAME = 'email_queue';
const RETRY_QUEUE_NAME = 'email_retry_queue';

/**
 * Add email to processing queue
 */
export async function queueEmail(emailData, emailId, userId) {
  try {
    const job = {
      emailId,
      userId,
      emailData,
      retryCount: 0,
      queuedAt: new Date().toISOString()
    };

    await redis.lpush(QUEUE_NAME, JSON.stringify(job));
    console.log(`📤 Queued email ${emailId} for processing`);

    return { success: true };
  } catch (error) {
    console.error('❌ Failed to queue email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process next email from queue
 */
export async function processNextEmail() {
  try {
    // Check retry queue first (simple time-based)
    const retryJob = await checkRetryQueue();
    if (retryJob) {
      return await processEmailJob(retryJob);
    }

    // Process main queue
    const result = await redis.brpop(QUEUE_NAME, 1); // 1 second timeout
    if (!result) {
      return null; // No jobs available
    }

    const job = JSON.parse(result[1]);
    return await processEmailJob(job);

  } catch (error) {
    console.error('❌ Error processing queue:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Check retry queue for jobs ready to process
 */
async function checkRetryQueue() {
  try {
    const retryJobs = await redis.zrangebyscore(RETRY_QUEUE_NAME, 0, Date.now(), 'LIMIT', 0, 1);
    if (retryJobs.length === 0) {
      return null;
    }

    // Remove from retry queue and return job
    const jobData = retryJobs[0];
    await redis.zrem(RETRY_QUEUE_NAME, jobData);
    return JSON.parse(jobData);
  } catch (error) {
    console.error('❌ Error checking retry queue:', error);
    return null;
  }
}

/**
 * Process individual email job
 */
async function processEmailJob(job) {
  const { emailId, userId, emailData, retryCount = 0 } = job;

  try {
    console.log(`🔄 Processing email ${emailId} (attempt ${retryCount + 1})`);

    // For now, just mark as processed (remove when ready to add real processing)
    const result = { success: true };

    if (result.success) {
      console.log(`✅ Email ${emailId} processed successfully`);
      return { success: true, emailId, result };
    } else {
      throw new Error(result.error);
    }

  } catch (error) {
    console.error(`❌ Error processing email ${emailId}:`, error);

    // Check if it's a rate limit error
    if (isRateLimitError(error) && retryCount < 5) {
      await scheduleRetry(job, retryCount + 1);
      return { success: false, retried: true, emailId, retryCount: retryCount + 1 };
    } else {
      // Mark as failed in database
      await markEmailFailed(emailId, error.message);
      return { success: false, failed: true, emailId, error: error.message };
    }
  }
}

/**
 * Schedule job for retry with exponential backoff
 */
async function scheduleRetry(job, newRetryCount) {
  try {
    const delay = Math.pow(2, newRetryCount) * 1000; // 2s, 4s, 8s, 16s, 32s
    const retryAt = Date.now() + delay;

    const retryJob = {
      ...job,
      retryCount: newRetryCount,
      retryAt: new Date(retryAt).toISOString()
    };

    await redis.zadd(RETRY_QUEUE_NAME, retryAt, JSON.stringify(retryJob));
    console.log(`⏰ Scheduled email ${job.emailId} for retry in ${delay}ms (attempt ${newRetryCount + 1})`);
  } catch (error) {
    console.error('❌ Failed to schedule retry:', error);
  }
}

/**
 * Check if error is rate limit related
 */
function isRateLimitError(error) {
  const message = error.message?.toLowerCase() || '';
  return error.status === 429 ||
         message.includes('rate limit') ||
         message.includes('too many requests') ||
         error.code === 'rate_limit_exceeded';
}

/**
 * Mark email as failed in database
 */
async function markEmailFailed(emailId, errorMessage) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    await supabase
      .from('inbound_emails')
      .update({
        processing_status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);

    console.log(`💾 Marked email ${emailId} as failed in database`);
  } catch (error) {
    console.error('❌ Failed to update email status:', error);
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats() {
  try {
    const queueLength = await redis.llen(QUEUE_NAME);
    const retryQueueLength = await redis.zcard(RETRY_QUEUE_NAME);

    return {
      waiting: queueLength,
      retrying: retryQueueLength,
      total: queueLength + retryQueueLength
    };
  } catch (error) {
    console.error('❌ Failed to get queue stats:', error);
    return { waiting: 0, retrying: 0, total: 0 };
  }
}

export default {
  queueEmail,
  processNextEmail,
  getQueueStats
};