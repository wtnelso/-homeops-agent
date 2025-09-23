/**
 * Redis-based Email Processing Queue Service
 *
 * Production-ready queuing system using BullMQ + Redis with fallback to in-memory queue.
 * Handles onboarding (1000 emails) and daily processing with proper job management.
 *
 * Features:
 * - Persistent job storage (survives server restarts)
 * - Built-in retry logic with exponential backoff
 * - Priority queues (onboarding > daily)
 * - Rate limiting and concurrency control
 * - Cron job scheduling for daily processing
 * - Job monitoring and progress tracking
 * - Graceful fallback when Redis unavailable
 */

import { EmailConfig } from '../config/emailConfig.js';
import { globalScalableQueue } from './scalableJobQueue.js'; // Fallback

let Queue, Worker, QueueScheduler;
let redisConnection = null;
let queuesInitialized = false;

// Queue instances
let onboardingQueue = null;
let dailyQueue = null;
let priorityQueue = null;

// Workers
let onboardingWorker = null;
let dailyWorker = null;
let priorityWorker = null;

// Queue scheduler for cron jobs
let scheduler = null;

export class RedisQueueService {
  /**
   * Initialize Redis queues (called on server startup)
   */
  static async initialize() {
    try {
      console.log('🔧 Initializing Redis queue service...');

      // Check if Redis is available
      const redisAvailable = await this.checkRedisAvailability();

      if (!redisAvailable) {
        console.log('⚠️  Redis not available, using in-memory fallback');
        return { success: true, usingFallback: true };
      }

      // Import BullMQ dependencies
      try {
        const bullmq = await import('bullmq');
        Queue = bullmq.Queue;
        Worker = bullmq.Worker;
        QueueScheduler = bullmq.QueueScheduler;
      } catch (importError) {
        console.log('⚠️  BullMQ not installed, using in-memory fallback');
        return { success: true, usingFallback: true };
      }

      // Setup Redis connection
      redisConnection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true
      };

      // Create queues
      await this.createQueues();

      // Create workers
      await this.createWorkers();

      // Setup cron scheduler
      await this.setupCronScheduler();

      queuesInitialized = true;
      console.log('✅ Redis queue service initialized successfully');

      return { success: true, usingFallback: false };

    } catch (error) {
      console.error('❌ Failed to initialize Redis queues:', error);
      console.log('🔄 Falling back to in-memory queue');
      return { success: true, usingFallback: true };
    }
  }

  /**
   * Check if Redis is available
   */
  static async checkRedisAvailability() {
    if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
      return false;
    }

    try {
      // Try to connect to Redis
      const redis = await import('ioredis');
      const testConnection = new redis.default(process.env.REDIS_URL || redisConnection);

      await testConnection.ping();
      await testConnection.disconnect();

      return true;
    } catch (error) {
      console.log('🔍 Redis availability check failed:', error.message);
      return false;
    }
  }

  /**
   * Create BullMQ queues
   */
  static async createQueues() {
    // Onboarding queue (1000 email processing)
    onboardingQueue = new Queue('onboarding-emails', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 10,    // Keep last 10 completed jobs
        removeOnFail: 20,        // Keep last 20 failed jobs
        attempts: 3,             // Retry failed jobs 3 times
        backoff: {
          type: 'exponential',
          delay: 5000,           // Start with 5 second delay
        }
      }
    });

    // Daily processing queue (24-hour emails)
    dailyQueue = new Queue('daily-emails', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 50,    // Keep more daily job history
        removeOnFail: 50,
        attempts: 2,             // Daily jobs get fewer retries
        backoff: {
          type: 'exponential',
          delay: 2000,
        }
      }
    });

    // Priority queue for urgent processing
    priorityQueue = new Queue('priority-emails', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: 5,
        removeOnFail: 10,
        attempts: 5,             // Priority jobs get more retries
        backoff: {
          type: 'exponential',
          delay: 1000,
        }
      }
    });

    console.log('✅ Created BullMQ queues: onboarding, daily, priority');
  }

  /**
   * Create BullMQ workers
   */
  static async createWorkers() {
    // Onboarding worker (1 concurrent job max)
    onboardingWorker = new Worker('onboarding-emails', async (job) => {
      return await this.processOnboardingJob(job);
    }, {
      connection: redisConnection,
      concurrency: 1,           // Only 1 onboarding job at a time
      limiter: {
        max: 1,                 // 1 job per minute max
        duration: 60 * 1000,
      }
    });

    // Daily worker (3 concurrent jobs max)
    dailyWorker = new Worker('daily-emails', async (job) => {
      return await this.processDailyJob(job);
    }, {
      connection: redisConnection,
      concurrency: 3,           // Up to 3 daily jobs
      limiter: {
        max: 5,                 // 5 jobs per minute max
        duration: 60 * 1000,
      }
    });

    // Priority worker (2 concurrent jobs max)
    priorityWorker = new Worker('priority-emails', async (job) => {
      return await this.processPriorityJob(job);
    }, {
      connection: redisConnection,
      concurrency: 2,           // Up to 2 priority jobs
      limiter: {
        max: 10,                // 10 jobs per minute max
        duration: 60 * 1000,
      }
    });

    // Setup worker event handlers
    this.setupWorkerEvents();

    console.log('✅ Created BullMQ workers with concurrency limits');
  }

  /**
   * Setup cron scheduler for daily processing
   */
  static async setupCronScheduler() {
    scheduler = new QueueScheduler('daily-emails', {
      connection: redisConnection
    });

    // Add daily cron job (runs at 2:00 AM)
    await dailyQueue.add('daily-cron-job',
      { type: 'daily-processing' },
      {
        repeat: { cron: '0 2 * * *' },  // 2:00 AM every day
        priority: 1,                    // High priority for cron jobs
        jobId: 'daily-cron'            // Prevent duplicate cron jobs
      }
    );

    console.log('✅ Setup daily cron job scheduler (2:00 AM)');
  }

  /**
   * Setup worker event handlers
   */
  static setupWorkerEvents() {
    [onboardingWorker, dailyWorker, priorityWorker].forEach(worker => {
      worker.on('completed', (job, result) => {
        console.log(`✅ Job ${job.id} completed:`, result);
      });

      worker.on('failed', (job, error) => {
        console.error(`❌ Job ${job?.id} failed:`, error.message);
      });

      worker.on('progress', (job, progress) => {
        console.log(`🔄 Job ${job.id} progress: ${progress}%`);
      });
    });
  }

  /**
   * Add onboarding job (1000 emails)
   */
  static async addOnboardingJob(jobData) {
    if (!queuesInitialized) {
      console.log('🔄 Using fallback queue for onboarding job');
      return await globalScalableQueue.addJob(jobData);
    }

    try {
      const job = await onboardingQueue.add('process-onboarding', jobData, {
        priority: 10,           // Highest priority
        delay: 0,              // Process immediately
      });

      console.log(`📋 Added onboarding job ${job.id} for account ${jobData.account_id}`);

      return {
        job_id: job.id,
        queue_name: 'onboarding-emails',
        priority: 10,
        estimated_wait_time: await this.getEstimatedWaitTime('onboarding'),
        position: await job.getPosition()
      };

    } catch (error) {
      console.error('❌ Failed to add onboarding job:', error);
      // Fallback to in-memory queue
      return await globalScalableQueue.addJob(jobData);
    }
  }

  /**
   * Add daily processing job
   */
  static async addDailyJob(jobData) {
    if (!queuesInitialized) {
      console.log('🔄 Using fallback queue for daily job');
      return await globalScalableQueue.addJob(jobData);
    }

    try {
      const job = await dailyQueue.add('process-daily', jobData, {
        priority: 5,            // Normal priority
        delay: Math.random() * 300000, // Random delay up to 5 minutes to spread load
      });

      console.log(`📋 Added daily job ${job.id} for account ${jobData.account_id}`);

      return {
        job_id: job.id,
        queue_name: 'daily-emails',
        priority: 5,
        estimated_wait_time: await this.getEstimatedWaitTime('daily'),
        position: await job.getPosition()
      };

    } catch (error) {
      console.error('❌ Failed to add daily job:', error);
      // Fallback to in-memory queue
      return await globalScalableQueue.addJob(jobData);
    }
  }

  /**
   * Add priority job
   */
  static async addPriorityJob(jobData) {
    if (!queuesInitialized) {
      console.log('🔄 Using fallback queue for priority job');
      return await globalScalableQueue.addJob(jobData);
    }

    try {
      const job = await priorityQueue.add('process-priority', jobData, {
        priority: 20,           // Highest priority
        delay: 0,              // Process immediately
      });

      return {
        job_id: job.id,
        queue_name: 'priority-emails',
        priority: 20,
        estimated_wait_time: 0,
        position: await job.getPosition()
      };

    } catch (error) {
      console.error('❌ Failed to add priority job:', error);
      return await globalScalableQueue.addJob(jobData);
    }
  }

  /**
   * Get job status and progress
   */
  static async getJobStatus(job_id, queue_name = 'onboarding-emails') {
    if (!queuesInitialized) {
      return { status: 'fallback_mode', queue: 'in-memory' };
    }

    try {
      const queue = this.getQueueByName(queue_name);
      const job = await queue.getJob(job_id);

      if (!job) {
        return { status: 'not_found' };
      }

      return {
        id: job.id,
        status: await job.getState(),
        progress: job.progress(),
        data: job.data,
        created_at: new Date(job.timestamp),
        processed_on: job.processedOn ? new Date(job.processedOn) : null,
        completed_on: job.finishedOn ? new Date(job.finishedOn) : null,
        attempts_made: job.attemptsMade,
        fail_reason: job.failedReason,
        return_value: job.returnvalue
      };

    } catch (error) {
      console.error('❌ Failed to get job status:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats() {
    if (!queuesInitialized) {
      return globalScalableQueue.getQueueMetrics();
    }

    try {
      const stats = {};

      for (const [name, queue] of Object.entries({
        onboarding: onboardingQueue,
        daily: dailyQueue,
        priority: priorityQueue
      })) {
        stats[name] = {
          waiting: await queue.getWaiting(),
          active: await queue.getActive(),
          completed: await queue.getCompleted(),
          failed: await queue.getFailed(),
          delayed: await queue.getDelayed(),
          counts: await queue.getJobCounts()
        };
      }

      return stats;

    } catch (error) {
      console.error('❌ Failed to get queue stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Process onboarding job
   */
  static async processOnboardingJob(job) {
    try {
      console.log(`🚀 Processing onboarding job ${job.id}`);

      // Import worker here to avoid circular dependency
      const { EmbeddingWorker } = await import('../workers/embeddingWorker.js');

      // Update progress
      await job.updateProgress(10);

      // Process the job
      const result = await EmbeddingWorker.processEmailJob(job.data);

      await job.updateProgress(100);
      return result;

    } catch (error) {
      console.error(`❌ Onboarding job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Process daily job
   */
  static async processDailyJob(job) {
    try {
      console.log(`🌅 Processing daily job ${job.id}`);

      if (job.data.type === 'daily-processing') {
        // This is the cron job - trigger daily processing for all accounts
        const { DailyCronService } = await import('./dailyCronService.js');
        return await DailyCronService.runDailyProcessing();
      }

      // Regular daily job for specific account
      const { EmbeddingWorker } = await import('../workers/embeddingWorker.js');

      await job.updateProgress(20);
      const result = await EmbeddingWorker.processEmailJob(job.data);
      await job.updateProgress(100);

      return result;

    } catch (error) {
      console.error(`❌ Daily job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Process priority job
   */
  static async processPriorityJob(job) {
    try {
      console.log(`⚡ Processing priority job ${job.id}`);

      const { EmbeddingWorker } = await import('../workers/embeddingWorker.js');

      await job.updateProgress(15);
      const result = await EmbeddingWorker.processEmailJob(job.data);
      await job.updateProgress(100);

      return result;

    } catch (error) {
      console.error(`❌ Priority job ${job.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Get queue by name
   */
  static getQueueByName(name) {
    switch (name) {
      case 'onboarding-emails':
        return onboardingQueue;
      case 'daily-emails':
        return dailyQueue;
      case 'priority-emails':
        return priorityQueue;
      default:
        return onboardingQueue;
    }
  }

  /**
   * Get estimated wait time for a queue
   */
  static async getEstimatedWaitTime(queueName) {
    try {
      const queue = this.getQueueByName(queueName + '-emails');
      const waiting = await queue.getWaiting();

      // Rough estimate: 2 minutes per job average
      return waiting.length * 2 * 60 * 1000; // milliseconds

    } catch (error) {
      return 0;
    }
  }

  /**
   * Graceful shutdown
   */
  static async shutdown() {
    console.log('🛑 Shutting down Redis queue service...');

    try {
      if (onboardingWorker) await onboardingWorker.close();
      if (dailyWorker) await dailyWorker.close();
      if (priorityWorker) await priorityWorker.close();
      if (scheduler) await scheduler.close();

      if (onboardingQueue) await onboardingQueue.close();
      if (dailyQueue) await dailyQueue.close();
      if (priorityQueue) await priorityQueue.close();

      console.log('✅ Redis queue service shutdown complete');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }
}

export default RedisQueueService;