/**
 * User Limits Service
 *
 * Handles plan-based limits, testing overrides, and usage metering
 * for email processing and other HomeOps features.
 */

import { getUserLimits, checkUsageLimit, UserLimitsConfig } from '../config/userLimitsConfig.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class UserLimitsService {
  /**
   * Get email processing limits for user with testing overrides
   */
  static async getEmailProcessingLimits(accountId, options = {}) {
    const {
      userPlan = null,
      testingOverride = null,
      processingType = 'daily'
    } = options;

    // Get effective limits based on plan and testing overrides
    const userLimits = getUserLimits(accountId, userPlan, testingOverride);
    const emailLimits = userLimits.limits.email[processingType] || userLimits.limits.email.daily;

    // Check current usage (placeholder for now)
    const usageCheck = await checkUsageLimit(accountId, `email_${processingType}`, emailLimits.maxEmails);

    return {
      accountId,
      processingType,
      maxEmails: emailLimits.maxEmails,
      days: emailLimits.days,
      userPlan: userLimits.userPlan,
      testingOverride,
      usageAllowed: usageCheck.allowed,
      remaining: usageCheck.remaining,
      resetAt: usageCheck.resetAt,
      source: testingOverride ? 'testing_override' : (userPlan ? 'plan_based' : 'default')
    };
  }

  /**
   * Get Gmail query string based on processing type and time limits
   */
  static getGmailQuery(processingType, days = null) {
    // Base query from EmailConfig
    const baseQuery = 'in:inbox -category:promotions -category:social -category:forums';

    if (!days) {
      return baseQuery; // No time restriction
    }

    const timeFilter = `newer_than:${days}d`;
    return `${baseQuery} ${timeFilter}`;
  }

  /**
   * Validate email processing request against user limits
   */
  static async validateEmailProcessingRequest(accountId, requestedEmails, options = {}) {
    const limits = await this.getEmailProcessingLimits(accountId, options);

    if (requestedEmails > limits.maxEmails) {
      return {
        valid: false,
        error: 'LIMIT_EXCEEDED',
        message: `Requested ${requestedEmails} emails exceeds limit of ${limits.maxEmails}`,
        limits,
        suggested: {
          maxEmails: limits.maxEmails,
          processingType: limits.processingType
        }
      };
    }

    if (!limits.usageAllowed) {
      return {
        valid: false,
        error: 'USAGE_QUOTA_EXCEEDED',
        message: `Daily usage quota exceeded. Resets at ${limits.resetAt}`,
        limits
      };
    }

    return {
      valid: true,
      limits,
      gmailQuery: this.getGmailQuery(limits.processingType, limits.days)
    };
  }

  /**
   * Create processing job config with appropriate limits
   */
  static async createProcessingJobConfig(accountId, options = {}) {
    const {
      processingType = 'daily',
      testingOverride = null,
      customLimits = null
    } = options;

    // Get user limits
    const validation = await this.validateEmailProcessingRequest(accountId, 1000, {
      processingType,
      testingOverride
    });

    if (!validation.valid) {
      throw new Error(`Cannot create processing job: ${validation.message}`);
    }

    const { limits } = validation;

    return {
      account_id: accountId,
      processing_type: processingType,
      email_limit: customLimits?.maxEmails || limits.maxEmails,
      time_range_days: customLimits?.days || limits.days,
      gmail_query: validation.gmailQuery,
      user_plan: limits.userPlan,
      testing_override: testingOverride,
      priority: this.getJobPriority(processingType, testingOverride),
      chunk_size: this.getChunkSize(limits.maxEmails),
      created_at: new Date().toISOString()
    };
  }

  /**
   * Get job priority based on processing type and testing status
   */
  static getJobPriority(processingType, testingOverride) {
    if (testingOverride) return 'high'; // Testing gets priority

    switch (processingType) {
      case 'onboarding': return 'high';
      case 'daily': return 'normal';
      case 'weekly': return 'normal';
      case 'monthly': return 'low';
      case 'custom': return 'normal';
      default: return 'normal';
    }
  }

  /**
   * Get appropriate chunk size based on total email count
   */
  static getChunkSize(totalEmails) {
    if (totalEmails <= 50) return 10;      // Small batches for testing
    if (totalEmails <= 200) return 25;     // Medium batches
    if (totalEmails <= 1000) return 50;    // Large batches
    return 100;                            // Very large batches
  }

  /**
   * Track email processing usage (placeholder for future implementation)
   */
  static async trackEmailProcessingUsage(accountId, emailsProcessed, processingTimeMs = 0) {
    // TODO: Implement actual usage tracking
    console.log(`📊 Usage tracked for ${accountId}: ${emailsProcessed} emails processed in ${processingTimeMs}ms`);

    // Future implementation will store in database:
    // - Daily/weekly/monthly counters
    // - API call counts
    // - Processing time metrics
    // - Storage usage tracking

    return {
      tracked: true,
      accountId,
      emailsProcessed,
      processingTimeMs,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get testing override options for dashboard UI
   */
  static getTestingOptions() {
    if (!UserLimitsConfig.testingOverrides.enabled) {
      return { enabled: false, options: [] };
    }

    const scenarios = Object.entries(UserLimitsConfig.testingOverrides.testScenarios)
      .map(([key, scenario]) => ({
        id: key,
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: scenario.description,
        limits: scenario.limits
      }));

    return {
      enabled: true,
      options: [
        {
          id: 'custom',
          name: 'Custom Testing Limits',
          description: 'Use maximum testing override limits',
          limits: UserLimitsConfig.testingOverrides.maxOverrideLimits.email.custom
        },
        ...scenarios
      ]
    };
  }
}

export default UserLimitsService;