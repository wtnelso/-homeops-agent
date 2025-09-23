/**
 * Email Processing Job Queue
 *
 * Prevents multiple accounts from processing emails simultaneously
 * to avoid overwhelming OpenAI rate limits and system resources.
 */

import { EmailConfig } from '../config/emailConfig.js';

export class JobQueue {
  constructor() {
    this.maxConcurrentJobs = EmailConfig.batchProcessing.maxConcurrentJobs || 3;
    this.currentlyProcessing = new Set(); // Track active job IDs
    this.waitingQueue = []; // Jobs waiting to start
    this.jobStartTimes = new Map(); // Track job start times for metrics

    console.log(`🚦 Job Queue initialized: max ${this.maxConcurrentJobs} concurrent jobs`);
  }

  /**
   * Add a job to the queue and wait for execution slot
   */
  async waitForJobSlot(jobId, accountId) {
    console.log(`📋 Job ${jobId} requesting processing slot...`);

    // If we have capacity, start immediately
    if (this.currentlyProcessing.size < this.maxConcurrentJobs) {
      this.startJob(jobId, accountId);
      return;
    }

    // Otherwise, add to waiting queue
    return new Promise((resolve, reject) => {
      const queueEntry = {
        jobId,
        accountId,
        resolve,
        reject,
        queuedAt: Date.now()
      };

      this.waitingQueue.push(queueEntry);
      console.log(`⏳ Job ${jobId} queued (position: ${this.waitingQueue.length}, active: ${this.currentlyProcessing.size}/${this.maxConcurrentJobs})`);

      // Set timeout to prevent jobs from waiting too long
      const timeout = EmailConfig.openaiConfig.rateLimiting.requestQueueTimeout || 300000; // 5 minutes default
      setTimeout(() => {
        const index = this.waitingQueue.indexOf(queueEntry);
        if (index > -1) {
          this.waitingQueue.splice(index, 1);
          reject(new Error(`Job ${jobId} timed out waiting in queue after ${timeout}ms`));
        }
      }, timeout);
    });
  }

  /**
   * Mark a job as started and track it
   */
  startJob(jobId, accountId) {
    this.currentlyProcessing.add(jobId);
    this.jobStartTimes.set(jobId, Date.now());
    console.log(`🚀 Job ${jobId} started processing (active: ${this.currentlyProcessing.size}/${this.maxConcurrentJobs})`);
  }

  /**
   * Complete a job and process next in queue
   */
  completeJob(jobId) {
    if (!this.currentlyProcessing.has(jobId)) {
      console.warn(`⚠️  Job ${jobId} not found in processing set`);
      return;
    }

    // Remove from active processing
    this.currentlyProcessing.delete(jobId);

    // Calculate processing time
    const startTime = this.jobStartTimes.get(jobId);
    if (startTime) {
      const processingTime = Date.now() - startTime;
      console.log(`✅ Job ${jobId} completed in ${Math.round(processingTime / 1000)}s`);
      this.jobStartTimes.delete(jobId);
    }

    // Start next job in queue if any
    if (this.waitingQueue.length > 0) {
      const nextJob = this.waitingQueue.shift();
      this.startJob(nextJob.jobId, nextJob.accountId);

      // Resolve the promise to allow the job to start processing
      nextJob.resolve();
    }

    console.log(`📊 Queue status: active: ${this.currentlyProcessing.size}/${this.maxConcurrentJobs}, waiting: ${this.waitingQueue.length}`);
  }

  /**
   * Fail a job and process next in queue
   */
  failJob(jobId, error) {
    console.error(`❌ Job ${jobId} failed: ${error.message}`);
    this.completeJob(jobId); // Same cleanup as completion
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      maxConcurrent: this.maxConcurrentJobs,
      currentlyProcessing: this.currentlyProcessing.size,
      waitingInQueue: this.waitingQueue.length,
      activeJobs: Array.from(this.currentlyProcessing),
      queuedJobs: this.waitingQueue.map(job => ({
        jobId: job.jobId,
        accountId: job.accountId,
        waitTimeMs: Date.now() - job.queuedAt
      })),
      hasCapacity: this.currentlyProcessing.size < this.maxConcurrentJobs
    };
  }

  /**
   * Force clear a stuck job (emergency use)
   */
  forceRemoveJob(jobId) {
    console.warn(`🚨 Force removing stuck job: ${jobId}`);
    this.currentlyProcessing.delete(jobId);
    this.jobStartTimes.delete(jobId);

    // Start next job if any
    if (this.waitingQueue.length > 0) {
      const nextJob = this.waitingQueue.shift();
      this.startJob(nextJob.jobId, nextJob.accountId);
      nextJob.resolve();
    }
  }

  /**
   * Get processing metrics
   */
  getProcessingMetrics() {
    const now = Date.now();
    const activeJobMetrics = Array.from(this.currentlyProcessing).map(jobId => {
      const startTime = this.jobStartTimes.get(jobId);
      return {
        jobId,
        processingTimeMs: startTime ? now - startTime : 0
      };
    });

    return {
      totalActiveJobs: this.currentlyProcessing.size,
      totalQueuedJobs: this.waitingQueue.length,
      systemUtilization: Math.round((this.currentlyProcessing.size / this.maxConcurrentJobs) * 100),
      activeJobMetrics,
      averageQueueWaitTime: this.waitingQueue.length > 0
        ? Math.round(this.waitingQueue.reduce((sum, job) => sum + (now - job.queuedAt), 0) / this.waitingQueue.length)
        : 0
    };
  }
}

// Global job queue instance
export const globalJobQueue = new JobQueue();

export default JobQueue;