/**
 * Email Processing Configuration
 * 
 * Centralized configuration for email categorization, domain mapping,
 * and other email processing logic that may need frequent updates.
 */

export const EmailConfig = {
  // Domain-based categorization rules
  domainCategories: {
    education: [
      'school', 'edu', 'university', 'college', 'academy', 
      'kindergarten', 'preschool', 'elementary', 'middle', 'high'
    ],
    finance: [
      'bank', 'finance', 'credit', 'loan', 'mortgage', 'investment',
      'paypal', 'venmo', 'chase', 'wellsfargo', 'bofa', 'citibank'
    ],
    health: [
      'health', 'medical', 'hospital', 'clinic', 'doctor', 'dentist',
      'pharmacy', 'kaiser', 'sutter', 'healthcare'
    ],
    work: [
      'work', 'company', 'corp', 'inc', 'office', 'business',
      'linkedin', 'indeed', 'glassdoor'
    ],
    shopping: [
      'amazon', 'ebay', 'walmart', 'target', 'costco', 'shop',
      'store', 'retail', 'buy', 'sale'
    ],
    social: [
      'facebook', 'twitter', 'instagram', 'tiktok', 'snapchat',
      'linkedin', 'youtube', 'social'
    ],
    travel: [
      'airline', 'hotel', 'booking', 'expedia', 'airbnb',
      'uber', 'lyft', 'rental', 'travel'
    ],
    utilities: [
      'electric', 'gas', 'water', 'internet', 'phone', 'cable',
      'utility', 'bill', 'service'
    ],
    family: [
      'family', 'parent', 'child', 'kid', 'baby', 'daycare',
      'babysit', 'nanny', 'camp'
    ]
  },

  // Content quality mapping for database constraints
  contentQualityMap: {
    'high': 'excellent',
    'very high': 'excellent', 
    'excellent': 'excellent',
    'good': 'good',
    'medium': 'fair',
    'fair': 'fair',
    'low': 'poor',
    'poor': 'poor',
    'error': 'poor',
    'unknown': 'fair'
  },

  // Priority level thresholds
  priorityThresholds: {
    high: 0.8,     // family_relevance_score > 0.8 = high priority
    medium: 0.6    // family_relevance_score > 0.6 = medium priority
                   // everything else = low priority
  },

  // Content type classification rules
  contentTypeRules: {
    actionable: {
      condition: 'has_action_items',
      description: 'Emails with specific action items or tasks'
    },
    urgent: {
      condition: 'high_family_relevance',
      threshold: 0.8,
      description: 'High family relevance emails requiring attention'
    },
    informational: {
      condition: 'default',
      description: 'General informational emails'
    }
  },

  // Theme-based categorization (from AI analysis)
  themeCategories: {
    'family': 'family',
    'work': 'work', 
    'finance': 'finance',
    'health': 'health',
    'education': 'education',
    'shopping': 'shopping',
    'travel': 'travel',
    'social': 'social',
    'utilities': 'utilities',
    'general': 'general'
  },

  // Default fallback category
  defaultCategory: 'general',

  // Confidence score calculation weights
  confidenceWeights: {
    parsing_success: 0.30,  // 30% weight for successful parsing
    content_quality: 0.25,  // 25% weight for content quality
    analysis_completeness: 0.25, // 25% weight for complete analysis fields
    processing_time: 0.20   // 20% weight for reasonable processing time
  },

  // Processing performance thresholds (in milliseconds)
  processingThresholds: {
    fast: 1000,     // < 1 second = excellent performance
    normal: 3000,   // < 3 seconds = good performance
    slow: 10000     // < 10 seconds = acceptable performance
                    // > 10 seconds = poor performance
  },

  // ===== EMAIL PROCESSING CONFIGURATION =====

  // Batch processing settings
  batchProcessing: {
    defaultEmailLimit: 50,        // Default number of emails per batch (increased for scale)
    progressUpdateInterval: 10,   // Update progress every N emails (less frequent for large batches)
    maxEmailsPerBatch: 100,       // Maximum emails allowed in one batch

    // Processing delays to prevent API overwhelm
    delayBetweenEmails: 150,      // 150ms delay between emails (~6.7 emails/second max)
    delayBetweenBatches: 3000,    // 3 second delay between batches
    maxConcurrentJobs: 2,         // Maximum accounts processing simultaneously (conservative)

    // Large batch handling for initial loads
    initialLoadBatchSize: 100,    // Larger batches for 1000 email initial loads
    maxEmailsPerInitialLoad: 1000, // Maximum emails for initial processing
    initialLoadConcurrency: 1,    // Only 1 initial load at a time

    // Gmail query settings by batch type
    queries: {
      // User onboarding - process last 1000 emails for initial theme analysis
      onboarding: 'in:inbox -category:promotions -category:social -category:forums',

      // Daily cron job - process emails from last 24 hours
      daily: 'in:inbox -category:promotions -category:social -category:forums newer_than:1d',

      // Manual refresh options
      incremental: 'in:inbox -category:promotions -category:social -category:forums newer_than:7d',
      refresh: 'in:inbox -category:promotions -category:social -category:forums newer_than:30d',
      full: 'in:inbox -category:promotions -category:social -category:forums'
    },

    // Job-specific configurations
    jobConfigs: {
      onboarding: {
        maxEmails: 1000,
        priority: 'high',
        chunkSize: 50,           // Process in chunks of 50
        description: 'Initial email analysis for new user'
      },
      daily: {
        maxEmails: 200,          // Most users get <200 emails/day
        priority: 'normal',
        chunkSize: 25,
        description: 'Daily email processing'
      }
    }
  },

  // Email content processing settings
  contentProcessing: {
    max_content_length: 8000,     // Maximum content length before truncation
    truncation_suffix: '...',     // Suffix added to truncated content
  },

  // OpenAI Analysis Prompt Template
  analysisPrompt: `Analyze this email content. Return ONLY valid JSON with no additional text or markdown.

Email: {content}

JSON format:
{
  "primary_theme": "family_logistics|school|work|health|finance|social|household|travel|emergency|general",
  "family_relevance_score": 0.5,
  "involves_children": false,
  "requires_coordination": false,
  "has_deadline": false,
  "deadline_date": null,
  "action_items": [],
  "mentioned_people": [],
  "key_information": "brief summary",
  "sentiment_score": 0.5,
  "references_previous_email": false,
  "content_quality": "excellent",
  "extracted_entities": [],
  "family_suggestions": [
    {
      "member_name": "string",
      "activity": "string",
      "schedule": "string",
      "school": "string",
      "grade": "string",
      "birthday": "YYYY-MM-DD",
      "age": number
    }
  ],
  "contact_suggestions": [
    {
      "name": "string",
      "role": "string",
      "phone": "string",
      "email": "string",
      "address": "string"
    }
  ]
}

Requirements:
- family_relevance_score: 0.0-1.0
- sentiment_score: 0.0-1.0
- content_quality: excellent|good|fair|poor
- deadline_date: ISO string or null
- Keep arrays under 3 items
- key_information: max 100 characters
- family_suggestions: Extract specific family member information (activities, schools, birthdays)
- contact_suggestions: Extract contact details for teachers, coaches, doctors, service providers
- role: Use specific terms like "teacher", "coach", "doctor", "dentist", "tutor", "principal"
- schedule: Include day/time patterns like "Mondays 3-4pm", "Tuesdays and Thursdays"
- Only include suggestions with high confidence - leave arrays empty if uncertain`,

  // OpenAI Model Configuration
  openaiConfig: {
    chatModel: 'gpt-4o-mini',
    embeddingModel: 'text-embedding-3-small',
    temperature: 0.1,         // Lower for more consistent JSON
    maxTokens: 500,          // Sufficient for JSON response
    topP: 0.9,               // More focused responses
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,

    // Rate Limiting Configuration
    rateLimiting: {
      llmRequestsPerMinute: 80,        // Conservative limit per worker (GPT-4o-mini: ~10k/min org-wide)
      embeddingRequestsPerMinute: 40,  // Conservative limit per worker (embedding: ~3k/min org-wide)
      maxRetries: 3,                   // Number of retry attempts
      baseRetryDelayMs: 1000,         // Initial delay between retries (1 second)
      backoffMultiplier: 2,           // Exponential backoff (1s, 2s, 4s)
      requestQueueTimeout: 30000,     // Max time to wait in queue (30 seconds)

      // Sliding window rate limiting
      windowSizeMs: 60000,            // 1 minute window for rate limiting
      maxBurstRequests: 10,           // Allow bursts up to 10 requests before rate limiting kicks in
    }
  },

  // ===== QUEUE PROCESSING CONFIGURATION =====

  // Queue Processing Configuration (Redis disabled)
  queueProcessing: {
    // Redis connection settings (disabled)
    redis: null,

    // Queue settings
    queue: {
      name: 'email-embeddings',
      concurrency: 2,                   // Process 2 jobs at once max
      removeOnComplete: 10,             // Keep last 10 completed jobs
      removeOnFail: 50,                 // Keep last 50 failed jobs for debugging
      maxRetries: 3,                    // Retry failed jobs 3 times
      retryDelay: 5000,                 // 5s, 10s, 20s exponential backoff
      onboardingPriority: 10,           // Higher priority for onboarding jobs
      regularPriority: 1                // Normal priority for regular processing
    },

    // Processing priorities (true = high priority for chat, false = normal for background)
    priorities: {
      chat: true,                       // Chat gets 80% of rate limit capacity
      email_processing: false,          // Email processing uses remaining 20%
      background_capacity: 0.2          // 20% of rate limit reserved for background
    }
  }
};

export default EmailConfig;