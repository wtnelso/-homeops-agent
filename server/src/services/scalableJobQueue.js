/**
 * Scalable Job Queue System
 *
 * Handles high-volume email processing with multiple users requesting
 * initial loads of 1000 emails with 50-100 email batches.
 *
 * Features:
 * - Multi-tier priority queue (initial loads vs incremental)
 * - Rate limiting per job type
 * - Smart batching to reduce API calls
 * - Processing delays to prevent API overwhelm
 */

import { EmailConfig } from '../config/emailConfig.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class ScalableJobQueue {
  constructor() {
    // Multi-tier queues
    this.queues = {
      initial_load: [],    // High-volume initial processing (1000 emails)
      incremental: [],     // Regular incremental updates (20-50 emails)
      priority: []         // High-priority quick jobs
    };

    // Processing capacity limits
    this.limits = {
      initial_load: 1,     // Only 1 initial load at a time (very intensive)
      incremental: 3,      // Up to 3 incremental jobs
      priority: 2,         // High-priority jobs
      total_max: 4         // Never exceed 4 total concurrent jobs
    };

    // Currently processing jobs
    this.activeJobs = {
      initial_load: new Set(),
      incremental: new Set(),
      priority: new Set()
    };

    // Processing metrics
    this.metrics = {
      totalProcessed: 0,
      totalFailed: 0,
      averageProcessingTime: {},
      apiCallsToday: 0,
      lastApiCallReset: Date.now()
    };

    // Processing delays (configurable)
    this.processingDelays = {
      betweenEmails: 150,      // 150ms = ~6-7 emails/second max
      betweenBatches: 3000,    // 3 second delay between batches
      betweenJobs: 1000        // 1 second delay between different jobs
    };

    console.log('🚀 Scalable Job Queue initialized with multi-tier processing');
    this.startQueueProcessor();
  }

  /**
   * Add a job to the appropriate queue
   */
  async addJob(jobData) {
    const { job_id, account_id, batch_type, email_count, priority = 'normal' } = jobData;

    // Determine job tier based on email count and type
    let queueType;
    if (priority === 'high') {
      queueType = 'priority';
    } else if (email_count >= 500 || batch_type === 'full') {
      queueType = 'initial_load';
    } else {
      queueType = 'incremental';
    }

    const queueEntry = {
      ...jobData,
      queueType,
      queuedAt: Date.now(),
      estimatedApiCalls: this.estimateApiCalls(email_count),
      estimatedProcessingTime: this.estimateProcessingTime(email_count, queueType)
    };

    this.queues[queueType].push(queueEntry);

    // Update job status in database
    await this.updateJobStatus(job_id, {
      status: 'queued',
      queue_type: queueType,
      queue_position: this.queues[queueType].length,
      estimated_processing_time_seconds: queueEntry.estimatedProcessingTime
    });

    console.log(`📋 Job ${job_id} added to ${queueType} queue (position: ${this.queues[queueType].length})`);
    console.log(`   📊 Estimated: ${queueEntry.estimatedApiCalls} API calls, ${Math.round(queueEntry.estimatedProcessingTime/60)} min processing`);

    return {
      queueType,
      position: this.queues[queueType].length,
      estimatedWaitTime: this.calculateEstimatedWaitTime(queueType),
      estimatedProcessingTime: queueEntry.estimatedProcessingTime
    };
  }

  /**
   * Main queue processing loop
   */
  async startQueueProcessor() {
    setInterval(async () => {
      await this.processNextJobs();
      this.logQueueStatus();
      this.resetDailyApiCountIfNeeded();
    }, 2000); // Check every 2 seconds

    console.log('⚡ Queue processor started');
  }

  /**
   * Process next available jobs from queues
   */
  async processNextJobs() {
    const totalActive = this.getTotalActiveJobs();

    if (totalActive >= this.limits.total_max) {
      return; // At capacity
    }

    // Process priority queue first
    if (this.canStartJob('priority')) {
      const job = this.queues.priority.shift();
      if (job) {
        await this.startJobProcessing(job);
        return;
      }
    }

    // Process incremental queue (frequent, smaller jobs)
    if (this.canStartJob('incremental')) {
      const job = this.queues.incremental.shift();
      if (job) {
        await this.startJobProcessing(job);
        return;
      }
    }

    // Process initial load queue (large, infrequent jobs)
    if (this.canStartJob('initial_load')) {
      const job = this.queues.initial_load.shift();
      if (job) {
        await this.startJobProcessing(job);
        return;
      }
    }
  }

  /**
   * Check if we can start a job of the given type
   */
  canStartJob(queueType) {
    const activeCount = this.activeJobs[queueType].size;
    const queueHasJobs = this.queues[queueType].length > 0;
    const underLimit = activeCount < this.limits[queueType];
    const totalUnderLimit = this.getTotalActiveJobs() < this.limits.total_max;

    return queueHasJobs && underLimit && totalUnderLimit;
  }

  /**
   * Start processing a job
   */
  async startJobProcessing(job) {
    const { job_id, account_id, queueType } = job;

    // Add to active processing
    this.activeJobs[queueType].add(job_id);
    job.startedAt = Date.now();

    console.log(`🚀 Starting ${queueType} job ${job_id} for account ${account_id}`);
    console.log(`   📊 Queue status: ${this.getQueueStatusString()}`);

    // Update job status
    await this.updateJobStatus(job_id, {
      status: 'processing',
      started_at: new Date().toISOString(),
      processing_tier: queueType
    });

    // Process the job with appropriate delays
    this.processJobWithDelays(job).catch(error => {
      console.error(`❌ Job ${job_id} failed:`, error);
      this.completeJob(job_id, queueType, false, error.message);
    });
  }

  /**
   * Process a job with rate limiting and delays
   */
  async processJobWithDelays(job) {
    const { job_id, queueType, email_count } = job;

    try {
      // Import here to avoid circular dependency
      const { EmbeddingWorker } = await import('../workers/embeddingWorker.js');

      // Apply processing delays based on job type
      if (queueType === 'initial_load') {
        console.log(`⏳ Initial load job ${job_id}: processing ${email_count} emails with delays...`);

        // For initial loads, process in smaller chunks with delays
        await this.processLargeJobInChunks(job, EmbeddingWorker);

      } else {
        // Regular processing for smaller jobs
        await EmbeddingWorker.processEmailJob(job);
      }

      // Job completed successfully
      this.completeJob(job_id, queueType, true);

    } catch (error) {
      console.error(`❌ Job processing failed:`, error);
      throw error;
    }
  }

  /**
   * Process large jobs in chunks to prevent overwhelming APIs
   */
  async processLargeJobInChunks(job, EmbeddingWorker) {
    const { job_id, email_count } = job;
    const chunkSize = 25; // Process 25 emails at a time
    const totalChunks = Math.ceil(email_count / chunkSize);

    console.log(`📦 Processing job ${job_id} in ${totalChunks} chunks of ${chunkSize} emails`);

    for (let chunk = 0; chunk < totalChunks; chunk++) {
      console.log(`🔄 Processing chunk ${chunk + 1}/${totalChunks} for job ${job_id}`);

      // Create a sub-job for this chunk
      const chunkJob = {
        ...job,
        email_limit: chunkSize,
        chunk_number: chunk + 1,
        total_chunks: totalChunks
      };

      // Process this chunk
      await EmbeddingWorker.processEmailJob(chunkJob);

      // Delay between chunks (except for the last one)
      if (chunk < totalChunks - 1) {
        console.log(`⏳ Waiting ${this.processingDelays.betweenBatches}ms before next chunk...`);
        await this.sleep(this.processingDelays.betweenBatches);
      }
    }

    console.log(`✅ Completed all ${totalChunks} chunks for job ${job_id}`);
  }

  /**
   * Complete a job and remove from active processing
   */
  async completeJob(job_id, queueType, success, errorMessage = null) {
    this.activeJobs[queueType].delete(job_id);

    if (success) {
      this.metrics.totalProcessed++;
      console.log(`✅ Job ${job_id} completed successfully`);
    } else {
      this.metrics.totalFailed++;
      console.error(`❌ Job ${job_id} failed: ${errorMessage}`);
    }

    // Update job status
    await this.updateJobStatus(job_id, {
      status: success ? 'completed' : 'failed',
      completed_at: new Date().toISOString(),
      error_message: errorMessage
    });

    console.log(`📊 Updated queue status: ${this.getQueueStatusString()}`);
  }

  /**
   * Estimate API calls needed for a job
   */
  estimateApiCalls(email_count) {
    // Each email typically needs 1 LLM call + 1 embedding call = 2 API calls
    return email_count * 2;
  }

  /**
   * Estimate processing time for a job
   */
  estimateProcessingTime(email_count, queueType) {
    // Base processing time per email (including delays)
    const baseTimePerEmail = queueType === 'initial_load' ? 800 : 500; // ms per email

    // Add queue delays
    const totalProcessingTime = email_count * baseTimePerEmail;
    const delayTime = email_count * this.processingDelays.betweenEmails;

    return totalProcessingTime + delayTime; // in milliseconds
  }

  /**
   * Calculate estimated wait time for a queue type
   */
  calculateEstimatedWaitTime(queueType) {
    const queueLength = this.queues[queueType].length;
    const averageProcessingTime = this.metrics.averageProcessingTime[queueType] || 300000; // 5 min default

    return queueLength * averageProcessingTime;
  }

  /**
   * Get total active jobs across all queues
   */
  getTotalActiveJobs() {
    return Object.values(this.activeJobs).reduce((total, set) => total + set.size, 0);
  }

  /**
   * Get queue status string for logging
   */
  getQueueStatusString() {
    const active = this.getTotalActiveJobs();
    const waiting = Object.values(this.queues).reduce((total, queue) => total + queue.length, 0);

    return `Active: ${active}/${this.limits.total_max}, Waiting: ${waiting} (I:${this.queues.initial_load.length}, R:${this.queues.incremental.length}, P:${this.queues.priority.length})`;
  }

  /**
   * Log queue status periodically
   */
  logQueueStatus() {
    const totalWaiting = Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0);

    if (totalWaiting > 0 || this.getTotalActiveJobs() > 0) {
      console.log(`🚦 Queue Status: ${this.getQueueStatusString()}`);

      if (totalWaiting > 5) {
        console.warn(`⚠️  High queue load: ${totalWaiting} jobs waiting`);
      }
    }
  }

  /**
   * Update job status in database
   */
  async updateJobStatus(job_id, updates) {
    try {
      const { error } = await supabase
        .from('email_processing_jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', job_id);

      if (error) {
        console.error(`❌ Failed to update job ${job_id}:`, error);
      }
    } catch (error) {
      console.error(`❌ Exception updating job ${job_id}:`, error);
    }
  }

  /**
   * Get comprehensive queue metrics
   */
  getQueueMetrics() {
    return {
      queues: {
        initial_load: {
          waiting: this.queues.initial_load.length,
          active: this.activeJobs.initial_load.size,
          limit: this.limits.initial_load
        },
        incremental: {
          waiting: this.queues.incremental.length,
          active: this.activeJobs.incremental.size,
          limit: this.limits.incremental
        },
        priority: {
          waiting: this.queues.priority.length,
          active: this.activeJobs.priority.size,
          limit: this.limits.priority
        }
      },
      system: {
        totalActive: this.getTotalActiveJobs(),
        totalWaiting: Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0),
        systemUtilization: Math.round((this.getTotalActiveJobs() / this.limits.total_max) * 100),
        totalProcessed: this.metrics.totalProcessed,
        totalFailed: this.metrics.totalFailed,
        successRate: this.metrics.totalProcessed > 0
          ? Math.round((this.metrics.totalProcessed / (this.metrics.totalProcessed + this.metrics.totalFailed)) * 100)
          : 100
      },
      processingDelays: this.processingDelays
    };
  }

  /**
   * Reset daily API call counter
   */
  resetDailyApiCountIfNeeded() {
    const now = Date.now();
    const timeSinceReset = now - this.metrics.lastApiCallReset;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeSinceReset >= twentyFourHours) {
      this.metrics.apiCallsToday = 0;
      this.metrics.lastApiCallReset = now;
      console.log('🔄 Daily API call counter reset');
    }
  }

  /**
   * Sleep utility
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global scalable job queue instance
export const globalScalableQueue = new ScalableJobQueue();

export default ScalableJobQueue;