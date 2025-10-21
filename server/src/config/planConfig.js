/**
 * Plan Configuration
 *
 * Centralized configuration for user plans, limits, and pricing.
 * Controls access to features and processing capabilities.
 */

export const PlanConfig = {
  // Plan limits and capabilities
  plans: {
    free: {
      name: 'Free',
      maxEmailsPerJob: 100,
      monthlyEmailLimit: 500,
      maxConcurrentJobs: 1,
      features: {
        emailProcessing: true,
        semanticSearch: true,
        agentMemory: true,
        profileSuggestions: true,
        loadTesting: false,
        priorityProcessing: false
      }
    },
    'high performer': {
      name: 'High Performer',
      maxEmailsPerJob: 1000,
      monthlyEmailLimit: 10000,
      maxConcurrentJobs: 3,
      features: {
        emailProcessing: true,
        semanticSearch: true,
        agentMemory: true,
        profileSuggestions: true,
        loadTesting: true,
        priorityProcessing: true
      }
    },
    family: {
      name: 'Family',
      maxEmailsPerJob: 5000,
      monthlyEmailLimit: 50000,
      maxConcurrentJobs: 5,
      features: {
        emailProcessing: true,
        semanticSearch: true,
        agentMemory: true,
        profileSuggestions: true,
        loadTesting: true,
        priorityProcessing: true
      }
    }
  },

  // Processing configuration
  processing: {
    defaultBatchSize: 10,
    estimatedCostPerEmail: 0.21, // cents
    defaultProcessingOptions: {
      embedding_model: 'text-embedding-3-small',
      theme_analysis_model: 'gpt-4o-mini',
      max_content_length: 8000,
      min_priority_score: 0.2
    }
  },

  // Get plan configuration for a user
  getPlanConfig(planName = 'free') {
    return this.plans[planName] || this.plans.free;
  },

  // Validate if user can perform an action
  canPerformAction(planName, action, currentUsage = 0) {
    const plan = this.getPlanConfig(planName);

    switch (action) {
      case 'start_job':
        return currentUsage < plan.maxConcurrentJobs;
      case 'monthly_limit':
        return currentUsage < plan.monthlyEmailLimit;
      default:
        return plan.features[action] || false;
    }
  },

  // Calculate allowed email limit for a job
  getAllowedEmailLimit(planName, requestedLimit) {
    const plan = this.getPlanConfig(planName);
    if (!requestedLimit) {
      return plan.maxEmailsPerJob;
    }
    return Math.min(requestedLimit, plan.maxEmailsPerJob);
  },

  // Calculate estimated cost
  calculateEstimatedCost(emailCount) {
    return Math.ceil(emailCount * this.processing.estimatedCostPerEmail);
  }
};

export default PlanConfig;