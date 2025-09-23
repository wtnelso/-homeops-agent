/**
 * Queue Manager - Unified Interface
 *
 * Provides a single interface for job queuing that automatically
 * switches between Redis and in-memory queues based on availability.
 */

import { RedisQueueService } from './redisQueueService.js';
import { globalScalableQueue } from './scalableJobQueue.js';

export class QueueManager {
  static isRedisAvailable = false;
  static initialized = false;

  /**
   * Initialize the queue system (called on server startup)
   */
  static async initialize() {
    if (this.initialized) {
      return;
    }

    console.log('🚀 Initializing queue system...');

    try {
      // Try to initialize Redis queues
      const redisResult = await RedisQueueService.initialize();

      if (redisResult.success && !redisResult.usingFallback) {
        this.isRedisAvailable = true;
        console.log('✅ Using Redis-based queue system');
      } else {
        this.isRedisAvailable = false;
        console.log('⚠️  Using in-memory fallback queue system');
      }

      this.initialized = true;
      return {
        success: true,
        queueType: this.isRedisAvailable ? 'redis' : 'in-memory',
        redisAvailable: this.isRedisAvailable
      };

    } catch (error) {
      console.error('❌ Failed to initialize queue system:', error);
      this.isRedisAvailable = false;
      this.initialized = true;

      return {
        success: true, // Still successful with fallback
        queueType: 'in-memory',
        redisAvailable: false,
        error: error.message
      };
    }
  }

  /**
   * Add onboarding job (1000 emails)
   */
  static async addOnboardingJob(jobData) {
    if (this.isRedisAvailable) {
      return await RedisQueueService.addOnboardingJob(jobData);
    } else {
      return await globalScalableQueue.addJob({
        ...jobData,
        queueType: 'initial_load', // Map to in-memory queue type
        priority: 'high'
      });
    }
  }

  /**
   * Add daily processing job
   */
  static async addDailyJob(jobData) {
    if (this.isRedisAvailable) {
      return await RedisQueueService.addDailyJob(jobData);
    } else {
      return await globalScalableQueue.addJob({
        ...jobData,
        queueType: 'incremental', // Map to in-memory queue type
        priority: 'normal'
      });
    }
  }

  /**
   * Add priority job
   */
  static async addPriorityJob(jobData) {
    if (this.isRedisAvailable) {
      return await RedisQueueService.addPriorityJob(jobData);
    } else {
      return await globalScalableQueue.addJob({
        ...jobData,
        queueType: 'priority', // Map to in-memory queue type
        priority: 'high'
      });
    }
  }

  /**
   * Get job status
   */
  static async getJobStatus(job_id, queue_name = 'onboarding-emails') {
    if (this.isRedisAvailable) {
      return await RedisQueueService.getJobStatus(job_id, queue_name);
    } else {
      // In-memory queue doesn't have detailed job status
      return {
        id: job_id,
        status: 'processing', // Fallback status
        queue_type: 'in-memory'
      };
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats() {
    if (this.isRedisAvailable) {
      return await RedisQueueService.getQueueStats();
    } else {
      return globalScalableQueue.getQueueMetrics();
    }
  }

  /**
   * Get system information
   */
  static getSystemInfo() {
    return {
      initialized: this.initialized,
      queueType: this.isRedisAvailable ? 'redis' : 'in-memory',
      redisAvailable: this.isRedisAvailable,
      features: {
        jobPersistence: this.isRedisAvailable,
        automaticRetry: this.isRedisAvailable,
        cronJobs: this.isRedisAvailable,
        advancedMonitoring: this.isRedisAvailable,
        horizontalScaling: this.isRedisAvailable
      }
    };
  }

  /**
   * Trigger daily processing for all accounts
   */
  static async triggerDailyProcessing() {
    if (this.isRedisAvailable) {
      // Redis handles this via cron jobs automatically
      console.log('📅 Daily processing handled by Redis cron job');
      return { handled_by: 'redis_cron' };
    } else {
      // Manual trigger for in-memory system
      console.log('📅 Manually triggering daily processing...');
      const { DailyCronService } = await import('./dailyCronService.js');
      return await DailyCronService.runDailyProcessing();
    }
  }

  /**
   * Graceful shutdown
   */
  static async shutdown() {
    console.log('🛑 Shutting down queue system...');

    if (this.isRedisAvailable) {
      await RedisQueueService.shutdown();
    }

    console.log('✅ Queue system shutdown complete');
  }
}

export default QueueManager;