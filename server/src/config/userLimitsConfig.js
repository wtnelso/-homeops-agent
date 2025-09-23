/**
 * User Limits Configuration
 *
 * Centralized configuration for email processing limits based on user plans,
 * testing overrides, and usage metering. Designed to scale from testing to
 * production with multiple subscription tiers.
 */

export const UserLimitsConfig = {
  // Default limits when no plan is specified (for testing/beta)
  defaultLimits: {
    email: {
      onboarding: { maxEmails: 100, days: null },    // Small onboarding for testing
      daily: { maxEmails: 50, days: 1 },             // Conservative daily processing
      weekly: { maxEmails: 150, days: 7 },           // Weekly catch-up
      monthly: { maxEmails: 300, days: 30 },         // Monthly refresh
      custom: { maxEmails: 200, days: null }         // Custom testing ranges
    },
    memory: {
      maxMemoriesPerDay: 100,                        // Agent memory extractions
      maxMemoryRetentionDays: 90                     // How long to keep memories
    },
    api: {
      openaiCallsPerDay: 500,                        // OpenAI API calls
      embeddingCallsPerDay: 200                      // Embedding generations
    }
  },

  // Future plan-based limits (ready for subscription system)
  planLimits: {
    free: {
      email: {
        onboarding: { maxEmails: 100, days: null },
        daily: { maxEmails: 25, days: 1 },
        weekly: { maxEmails: 75, days: 7 },
        monthly: { maxEmails: 150, days: 30 },
        custom: { maxEmails: 50, days: null }
      },
      memory: {
        maxMemoriesPerDay: 50,
        maxMemoryRetentionDays: 30
      },
      api: {
        openaiCallsPerDay: 200,
        embeddingCallsPerDay: 100
      }
    },

    pro: {
      email: {
        onboarding: { maxEmails: 1000, days: null },
        daily: { maxEmails: 200, days: 1 },
        weekly: { maxEmails: 500, days: 7 },
        monthly: { maxEmails: 1000, days: 30 },
        custom: { maxEmails: 500, days: null }
      },
      memory: {
        maxMemoriesPerDay: 200,
        maxMemoryRetentionDays: 365
      },
      api: {
        openaiCallsPerDay: 1000,
        embeddingCallsPerDay: 500
      }
    },

    enterprise: {
      email: {
        onboarding: { maxEmails: 10000, days: null },
        daily: { maxEmails: 1000, days: 1 },
        weekly: { maxEmails: 2000, days: 7 },
        monthly: { maxEmails: 5000, days: 30 },
        custom: { maxEmails: 2000, days: null }
      },
      memory: {
        maxMemoriesPerDay: 1000,
        maxMemoryRetentionDays: -1  // Unlimited retention
      },
      api: {
        openaiCallsPerDay: 5000,
        embeddingCallsPerDay: 2000
      }
    }
  },

  // Testing override system for /dashboard/testing UI
  testingOverrides: {
    enabled: true,  // Can be disabled in production
    maxOverrideLimits: {
      email: {
        onboarding: { maxEmails: 50, days: null },     // Smaller for testing
        daily: { maxEmails: 20, days: 1 },
        weekly: { maxEmails: 50, days: 7 },
        monthly: { maxEmails: 100, days: 30 },
        custom: { maxEmails: 100, days: 90 }           // Wide range for testing
      },
      memory: {
        maxMemoriesPerDay: 500,
        maxMemoryRetentionDays: 365
      },
      api: {
        openaiCallsPerDay: 200,
        embeddingCallsPerDay: 100
      }
    },
    // Specific testing scenarios
    testScenarios: {
      memory_extraction: {
        description: "Test memory extraction patterns",
        limits: { maxEmails: 10, days: 7 }
      },
      email_processing: {
        description: "Test email processing pipeline",
        limits: { maxEmails: 25, days: 30 }
      },
      performance_test: {
        description: "Performance testing with larger batches",
        limits: { maxEmails: 50, days: null }
      }
    }
  },

  // Usage tracking configuration (for future metering)
  usageTracking: {
    enabled: true,
    trackingPeriods: ['daily', 'weekly', 'monthly'],
    metrics: {
      emailsProcessed: 'counter',
      memoriesExtracted: 'counter',
      apiCallsMade: 'counter',
      processingTimeMs: 'gauge',
      storageUsedMB: 'gauge'
    },
    resetSchedules: {
      daily: '0 0 * * *',      // Midnight daily
      weekly: '0 0 * * 0',     // Midnight Sunday
      monthly: '0 0 1 * *'     // 1st of month
    }
  }
};

/**
 * Get effective limits for a user based on plan and testing overrides
 */
export function getUserLimits(accountId, userPlan = null, testingOverride = null) {
  // 1. Start with default limits
  let limits = UserLimitsConfig.defaultLimits;

  // 2. Apply plan-based limits if user has a plan
  if (userPlan && UserLimitsConfig.planLimits[userPlan]) {
    limits = UserLimitsConfig.planLimits[userPlan];
  }

  // 3. Apply testing override if in testing mode and overrides enabled
  if (testingOverride && UserLimitsConfig.testingOverrides.enabled) {
    if (UserLimitsConfig.testingOverrides.testScenarios[testingOverride]) {
      // Use specific test scenario
      const scenario = UserLimitsConfig.testingOverrides.testScenarios[testingOverride];
      limits = {
        ...limits,
        email: {
          ...limits.email,
          custom: scenario.limits
        }
      };
    } else if (testingOverride === 'custom') {
      // Use max testing override limits
      limits = UserLimitsConfig.testingOverrides.maxOverrideLimits;
    }
  }

  return {
    accountId,
    userPlan: userPlan || 'default',
    testingOverride,
    limits,
    effectiveAt: new Date().toISOString()
  };
}

/**
 * Check if user can perform an operation based on current usage
 */
export async function checkUsageLimit(accountId, operation, requestedAmount = 1) {
  // TODO: Implement actual usage tracking against database
  // For now, return true to allow all operations during development

  const userLimits = getUserLimits(accountId);

  // This will integrate with your usage tracking system
  // Example implementation:
  // const currentUsage = await getUserCurrentUsage(accountId, operation);
  // const limit = getUserLimitForOperation(userLimits, operation);
  // return currentUsage + requestedAmount <= limit;

  return {
    allowed: true,
    remaining: 1000, // Placeholder
    resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    limits: userLimits
  };
}

export default UserLimitsConfig;