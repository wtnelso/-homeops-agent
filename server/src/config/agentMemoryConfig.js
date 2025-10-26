/**
 * Agent Memory Configuration
 *
 * Centralized configuration for agent memory system behavior,
 * pattern matching, and intelligent data filtering.
 */

import { randomUUID } from 'crypto';

export const MEMORY_CONFIG = {
  // Default limits and timeouts
  DEFAULT_MEMORY_LIMIT: 5,
  SEARCH_MEMORY_LIMIT: 50,
  MAX_MEMORY_LIMIT: 100,

  // Confidence scoring
  CONFIDENCE_SCORING: {
    EMAIL_EXTRACTION: 0.7,     // Medium confidence for email-derived memories
    CHAT_EXTRACTION: 0.7,      // Medium confidence for chat-derived memories
    USER_CONFIRMED: 1.0,       // High confidence for user-confirmed memories
    MANUAL_ENTRY: 0.9,         // High confidence for manually entered memories
    AI_INFERRED: 0.6,          // Lower confidence for AI-inferred data
    PATTERN_MATCH: 0.8,        // Good confidence for pattern-matched data
  },

  // Priority levels (1 = highest priority, 5 = lowest)
  PRIORITY_LEVELS: {
    EMERGENCY: 1,              // Emergency contacts, medical info
    IMPORTANT: 2,              // School schedules, recurring appointments
    NORMAL: 3,                 // General preferences, family info
    LOW: 4,                    // Optional info, temporary notes
    ARCHIVE: 5,                // Historical data, rarely accessed
  },

  // Memory categories and their default settings
  MEMORY_TYPES: {
    family_info: {
      defaultPriority: 2,
      defaultConfidence: 0.8,
      expirationDays: null,     // Never expires
      description: 'Family member information and relationships'
    },
    preferences: {
      defaultPriority: 3,
      defaultConfidence: 0.7,
      expirationDays: 365,      // Expires after 1 year
      description: 'User and family preferences'
    },
    schedule: {
      defaultPriority: 2,
      defaultConfidence: 0.8,
      expirationDays: 90,       // Expires after 3 months
      description: 'Recurring schedules and appointments'
    },
    contacts: {
      defaultPriority: 2,
      defaultConfidence: 0.9,
      expirationDays: null,     // Never expires
      description: 'Important contact information'
    },
    medical: {
      defaultPriority: 1,
      defaultConfidence: 0.9,
      expirationDays: null,     // Never expires
      description: 'Medical information and appointments'
    },
    financial: {
      defaultPriority: 2,
      defaultConfidence: 0.8,
      expirationDays: 365,      // Expires after 1 year
      description: 'Financial preferences and bill information'
    },
    school: {
      defaultPriority: 2,
      defaultConfidence: 0.8,
      expirationDays: 365,      // Expires after school year
      description: 'School-related information and schedules'
    },
    transportation: {
      defaultPriority: 3,
      defaultConfidence: 0.7,
      expirationDays: 180,      // Expires after 6 months
      description: 'Transportation and logistics information'
    },
    emergency: {
      defaultPriority: 1,
      defaultConfidence: 0.9,
      expirationDays: null,     // Never expires
      description: 'Emergency contacts and procedures'
    }
  },

  // Memory key generation utilities
  MEMORY_KEY_UTILS: {
    /**
     * Generate memory key with consistent ID-based approach for family members
     */
    generateSemanticKey(suggestionType, data, accountId = null) {
      console.log(`🔍 DEBUG KEY GENERATION: Input data:`, {
        suggestionType,
        data: JSON.stringify(data, null, 2),
        accountId
      });

      // Create a predictable prefix based on suggestion type for better organization
      let prefix = '';
      switch (suggestionType) {
        case 'family_info':
          prefix = 'family_member';
          break;
        case 'contact_add':
          prefix = 'contact';
          break;
        case 'preference_update':
          prefix = 'preference';
          break;
        default:
          prefix = suggestionType.replace(/_/g, '');
      }

      // For family_info, use family_member_id if available for consistency
      if (suggestionType === 'family_info' && data?.family_member_id) {
        const key = `${prefix}_${data.family_member_id}`;
        console.log(`🔍 DEBUG KEY GENERATION: Generated ID-based key: ${key}`);
        return key;
      }

      // Fallback to UUID-style key for anonymity when no ID available
      const uuid = randomUUID();
      const key = `${prefix}_${uuid}`;
      console.log(`🔍 DEBUG KEY GENERATION: Generated UUID-style key: ${key}`);
      return key;
    },

    /**
     * Generate unique preference key with counter
     * This function should be called by services that have database access
     */
    async generateUniquePreferenceKey(baseKey, dbQuery) {
      let counter = 1;
      let uniqueKey = `${baseKey}_${counter}`;

      // Keep checking until we find a unique key
      while (true) {
        const existing = await dbQuery`
          SELECT id FROM agent_memory
          WHERE key = ${uniqueKey}
          LIMIT 1
        `;

        if (existing.length === 0) {
          return uniqueKey;
        }

        counter++;
        uniqueKey = `${baseKey}_${counter}`;

        // Safety check to prevent infinite loops
        if (counter > 1000) {
          throw new Error('Too many preference entries with same type for this account');
        }
      }
    },

    /**
     * Validate memory type against allowed types
     */
    validateMemoryType(memoryType) {
      return Object.keys(MEMORY_CONFIG.MEMORY_TYPES).includes(memoryType);
    },

    /**
     * Get appropriate memory type for suggestion type
     */
    mapSuggestionToMemoryType(suggestionType) {
      const mapping = {
        'family_info': 'family_info',
        'contact_add': 'contacts',
        'preference_update': 'preferences'
      };
      return mapping[suggestionType] || 'preferences';
    },

    /**
     * Create structured JSONB value from suggestion data
     */
    createStructuredValue(suggestionType, data) {
      // Create clean data based on suggestion type to avoid storing UI-specific fields
      let cleanData;

      switch (suggestionType) {
        case 'preference_update':
          // Only include essential preference fields
          cleanData = {
            preference_type: data.preference_type,
            preference_value: data.preference_value,
            preference_text: data.preference_text,
            member_name: data.member_name || null
          };
          break;

        case 'contact_add':
          // Only include essential contact fields
          cleanData = {
            name: data.name,
            role: data.role,
            email: data.email,
            phone: data.phone,
            member_name: data.member_name || null
          };
          break;

        case 'family_info':
          // Only include essential family info fields
          cleanData = {
            name: data.name || data.member_name,
            relationship: data.relationship,
            category: data.category || data.relationship,
            age: data.age,
            grade: data.grade,
            birthday_month: data.birthday_month,
            birthday_day: data.birthday_day,
            email: data.email,
            activity: data.activity,
            school: data.school,
            notes: data.notes
          };
          break;

        default:
          // For unknown types, use all data but remove known UI fields
          cleanData = { ...data };
          const uiFields = ['saveAs', 'expirationDate', 'customExpiration', 'addAsType', 'forceAddAsNew', 'category', 'memberType', 'activityType'];
          uiFields.forEach(field => delete cleanData[field]);
      }

      const baseValue = {
        ...cleanData
      };

      // Add semantic context based on type
      switch (suggestionType) {
        case 'family_info':
          return {
            ...baseValue,
            context_type: data.activity ? 'activity_schedule' :
                         data.school ? 'school_info' : 'family_info'
          };

        case 'contact_add':
          return {
            ...baseValue,
            contact_category: this.categorizeContact(data.role),
            context_type: 'contact_info'
          };

        case 'preference_update':
          return {
            ...baseValue,
            context_type: 'preference_setting'
          };

        default:
          return baseValue;
      }
    },

    /**
     * Categorize contact based on role
     */
    categorizeContact(role) {
      if (!role) return 'general';

      const roleStr = role.toLowerCase();
      if (roleStr.includes('doctor') || roleStr.includes('dentist') ||
          roleStr.includes('physician') || roleStr.includes('nurse')) {
        return 'healthcare';
      }
      if (roleStr.includes('teacher') || roleStr.includes('principal') ||
          roleStr.includes('school') || roleStr.includes('tutor')) {
        return 'education';
      }
      if (roleStr.includes('coach') || roleStr.includes('instructor')) {
        return 'activities';
      }
      return 'services';
    }
  },

  // Cleanup scheduling
  CLEANUP_CONFIG: {
    // When to run automatic cleanup (cron format)
    SCHEDULE: '0 2 * * *',           // Daily at 2:00 AM
    NOTIFICATION_SCHEDULE: '0 10 * * 0', // Sundays at 10:00 AM

    // Retention policies
    SOFT_DELETE_DAYS: 30,            // Keep expired memories for 30 days
    HARD_DELETE_DAYS: 365,           // Permanently delete after 1 year

    // Notification settings
    EXPIRE_WARNING_DAYS: 7,          // Warn 7 days before expiration
    BATCH_SIZE: 100,                 // Process deletions in batches
  }
};

/**
 * Smart Query Detection for Historical vs Current Context
 */
export const QUERY_PATTERNS = {
  // Patterns that indicate user is asking about past events
  PAST_INDICATORS: {
    temporal_words: [
      'last', 'yesterday', 'ago', 'was', 'were', 'happened',
      'did', 'back', 'previous', 'earlier', 'before', 'used to'
    ],
    question_patterns: [
      /\b(what was|how was|when did|who was|where was)\b/i,
      /\b(tell me about.*last|remember when|what happened)\b/i,
      /\b(used to|in the past|previously|before)\b/i
    ],
    temporal_references: [
      /\b(last week|last month|last year|yesterday)\b/i,
      /\b(\d+\s+(days?|weeks?|months?|years?)\s+ago)\b/i,
      /\b(in \d{4}|back in|that time when)\b/i
    ]
  },

  // Patterns that indicate future planning
  FUTURE_INDICATORS: {
    temporal_words: [
      'next', 'tomorrow', 'upcoming', 'will', 'going to',
      'plan', 'schedule', 'later', 'soon', 'future'
    ],
    question_patterns: [
      /\b(what's next|what are we|when is|who is)\b/i,
      /\b(coming up|in the future|planning|scheduled)\b/i,
      /\b(will we|are we going|do we have)\b/i
    ]
  },

  // Patterns for current/general information
  PRESENT_INDICATORS: {
    temporal_words: [
      'now', 'today', 'current', 'currently', 'this',
      'always', 'usually', 'prefer', 'like', 'dislike'
    ],
    question_patterns: [
      /\b(what do|how do|where do|who does)\b/i,
      /\b(tell me about|what's|who's|where's)\b/i,
      /\b(prefer|like|dislike|always|usually)\b/i
    ]
  }
};

/**
 * Memory Extraction Patterns for Chat and Email Processing
 */
export const EXTRACTION_PATTERNS = {
  // Family member mentions
  family_info: {
    patterns: [
      {
        regex: /my (wife|husband|son|daughter|child|kid|partner|spouse)\s+([\w\s]+)(?:\s|$|\.|\,)/gi,
        extract: (match) => ({
          key: `family_member_${match[2].trim().toLowerCase().replace(/\s+/g, '_')}`,
          value: { name: match[2].trim(), relationship: match[1] },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      },
      {
        regex: /(?!(?:who|what|where|when|why|how|which))\b([\w]+)\s+is\s+my\s+(wife|husband|son|daughter|child|kid|partner|spouse)/gi,
        extract: (match) => ({
          key: `family_member_${match[1].toLowerCase()}`,
          value: { name: match[1], relationship: match[2] },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      },
      {
        regex: /my (wife|husband|son|daughter|child|kid|partner|spouse)(?:'s)?\s+(?:name\s+is|is\s+named|is\s+called)\s+([\w\s]+)(?:\s|$|\.|\,)/gi,
        extract: (match) => ({
          key: `family_member_${match[2].trim().toLowerCase().replace(/\s+/g, '_')}`,
          value: { name: match[2].trim(), relationship: match[1] },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      }
    ]
  },

  // Preference mentions
  preferences: {
    patterns: [
      {
        regex: /(prefers?|likes?|loves?|wants?|enjoys?)\s+(.{1,100})(?:\s|$|\.)/gi,
        extract: (match) => ({
          key: 'user_preference',
          value: { preference: match[2].trim(), type: match[1] },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.CHAT_EXTRACTION
        })
      },
      {
        regex: /(dislikes?|hates?|avoids?|doesn't like)\s+(.{1,100})(?:\s|$|\.)/gi,
        extract: (match) => ({
          key: 'user_negative_preference',
          value: { preference: match[2].trim(), type: match[1] },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.CHAT_EXTRACTION
        })
      }
    ]
  },

  // Schedule and appointment patterns
  schedule: {
    patterns: [
      {
        regex: /(every|each)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+at\s+)?(.{1,50})/gi,
        extract: (match) => ({
          key: `weekly_${match[2].toLowerCase()}`,
          value: { day: match[2], activity: match[3].trim(), frequency: 'weekly' },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      },
      {
        regex: /(\w+\s+(?:practice|lesson|class|appointment))\s+(?:is\s+)?(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
        extract: (match) => ({
          key: `schedule_${match[1].toLowerCase().replace(/\s+/g, '_')}`,
          value: { activity: match[1], day: match[2], type: 'recurring' },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      },
      {
        regex: /(my|our)\s+(son|daughter|child|kid)\s+has\s+([\w\s]+?)\s+(?:practices?|lessons?|classes?)\s+(weekly|biweekly|bi-weekly|monthly)\s+on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?(?:\s+till?\s+(\w+))?/gi,
        extract: (match) => {
          const frequency = match[4].replace(/-/g, '').toLowerCase();
          const endDate = match[6] || null;

          return {
            key: `child_${match[3].toLowerCase().replace(/\s+/g, '_')}_schedule`,
            value: {
              child: match[2],
              activity: match[3].trim(),
              frequency: frequency,
              day: match[5].replace(/s$/, ''), // Remove plural 's' from day
              endDate: endDate
            },
            confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH,
            expiresAt: DATE_PARSER.calculateExpirationDate(frequency, endDate)
          };
        }
      },
      {
        regex: /(every other week|every other|biweekly|bi-weekly|once every two weeks)\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:we have|there's|for)\s+)?(.{1,50})/gi,
        extract: (match) => ({
          key: `biweekly_${match[2].toLowerCase()}`,
          value: {
            day: match[2],
            activity: match[3].trim(),
            frequency: 'biweekly',
            pattern: match[1]
          },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      },
      {
        regex: /(monthly|once a month|every month)\s+(?:on\s+)?(?:the\s+)?(first|second|third|fourth|last)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)?(?:\s+(?:we have|there's|for)\s+)?(.{1,50})/gi,
        extract: (match) => ({
          key: `monthly_${match[3] || 'schedule'}`,
          value: {
            frequency: 'monthly',
            week: match[2] || null,
            day: match[3] || null,
            activity: match[4] ? match[4].trim() : 'monthly appointment'
          },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      },
      {
        regex: /([\w\s]+?)\s+(?:practices?|lessons?|classes?)\s+(?:are\s+)?(weekly|biweekly|bi-weekly|monthly|every other week|once every two weeks)\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)?/gi,
        extract: (match) => ({
          key: `schedule_${match[1].toLowerCase().replace(/\s+/g, '_')}`,
          value: {
            activity: match[1].trim(),
            frequency: match[2].replace(/-/g, '').toLowerCase().replace(/\s+/g, ''),
            day: match[3] || null,
            type: 'recurring'
          },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      },
      {
        regex: /(?:we have|there's)\s+([\w\s]+?)\s+(weekly|biweekly|bi-weekly|monthly|every other week|once every two weeks)\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)?/gi,
        extract: (match) => ({
          key: `family_${match[1].toLowerCase().replace(/\s+/g, '_')}`,
          value: {
            activity: match[1].trim(),
            frequency: match[2].replace(/-/g, '').toLowerCase().replace(/\s+/g, ''),
            day: match[3] || null,
            type: 'family_activity'
          },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      }
    ]
  },

  // Contact information
  contacts: {
    patterns: [
      {
        regex: /([\w\s]+?)(?:'s)?\s+(?:email|email address)\s+is\s+([\w\.-]+@[\w\.-]+\.\w+)/gi,
        extract: (match) => ({
          key: `contact_email_${match[1].trim().toLowerCase().replace(/\s+/g, '_')}`,
          value: { name: match[1].trim(), email: match[2], type: 'email' },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      },
      {
        regex: /([\w\s]+?)(?:'s)?\s+(?:phone|number|phone number)\s+is\s+([\d\-\(\)\s\+]+)/gi,
        extract: (match) => ({
          key: `contact_phone_${match[1].trim().toLowerCase().replace(/\s+/g, '_')}`,
          value: { name: match[1].trim(), phone: match[2].trim(), type: 'phone' },
          confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.PATTERN_MATCH
        })
      }
    ]
  }
};

/**
 * Query Analysis Functions
 */
export const QUERY_ANALYZER = {
  /**
   * Detect if query is asking about past events
   */
  isPastQuery(context) {
    if (!context || typeof context !== 'string') return false;

    const lowerContext = context.toLowerCase();

    // Check temporal words
    const hasPastWords = QUERY_PATTERNS.PAST_INDICATORS.temporal_words.some(
      word => lowerContext.includes(word)
    );

    // Check question patterns
    const hasPastPatterns = QUERY_PATTERNS.PAST_INDICATORS.question_patterns.some(
      pattern => pattern.test(context)
    );

    // Check temporal references
    const hasPastReferences = QUERY_PATTERNS.PAST_INDICATORS.temporal_references.some(
      pattern => pattern.test(context)
    );

    return hasPastWords || hasPastPatterns || hasPastReferences;
  },

  /**
   * Detect if query is asking about future events
   */
  isFutureQuery(context) {
    if (!context || typeof context !== 'string') return false;

    const lowerContext = context.toLowerCase();

    // Check temporal words
    const hasFutureWords = QUERY_PATTERNS.FUTURE_INDICATORS.temporal_words.some(
      word => lowerContext.includes(word)
    );

    // Check question patterns
    const hasFuturePatterns = QUERY_PATTERNS.FUTURE_INDICATORS.question_patterns.some(
      pattern => pattern.test(context)
    );

    return hasFutureWords || hasFuturePatterns;
  },

  /**
   * Get appropriate memory filter based on query type
   */
  getMemoryFilter(context) {
    if (this.isPastQuery(context)) {
      return {
        includeExpired: true,
        prioritizeRecent: false,
        temporalFilter: 'past'
      };
    } else if (this.isFutureQuery(context)) {
      return {
        includeExpired: false,
        prioritizeRecent: true,
        temporalFilter: 'future'
      };
    } else {
      return {
        includeExpired: false,
        prioritizeRecent: true,
        temporalFilter: 'present'
      };
    }
  }
};

/**
 * Date Parsing Utilities for Smart Memory Expiration
 */
export const DATE_PARSER = {
  /**
   * Parse relative dates and convert to proper ISO dates
   */
  parseRelativeDate(dateStr) {
    if (!dateStr) return null;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Month names mapping
    const monthMap = {
      january: 0, jan: 0,
      february: 1, feb: 1,
      march: 2, mar: 2,
      april: 3, apr: 3,
      may: 4,
      june: 5, jun: 5,
      july: 6, jul: 6,
      august: 7, aug: 7,
      september: 8, sep: 8, sept: 8,
      october: 9, oct: 9,
      november: 10, nov: 10,
      december: 11, dec: 11
    };

    const cleanDate = dateStr.toLowerCase().trim();

    // Handle month names (e.g., "january", "jan")
    if (monthMap.hasOwnProperty(cleanDate)) {
      const targetMonth = monthMap[cleanDate];
      let targetYear = currentYear;

      // If the target month has already passed this year, use next year
      if (targetMonth <= currentMonth) {
        targetYear = currentYear + 1;
      }

      // Return end of month for expiration
      return new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    }

    // Handle "next [month]" patterns
    const nextMonthMatch = cleanDate.match(/^next\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)$/);
    if (nextMonthMatch) {
      const targetMonth = monthMap[nextMonthMatch[1]];
      const targetYear = currentYear + 1;
      return new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    }

    // Handle specific year patterns (e.g., "january 2026")
    const yearMatch = cleanDate.match(/^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{4})$/);
    if (yearMatch) {
      const targetMonth = monthMap[yearMatch[1]];
      const targetYear = parseInt(yearMatch[2]);
      return new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    }

    // Handle "end of [year]" patterns
    const endOfYearMatch = cleanDate.match(/^end\s+of\s+(\d{4})$/);
    if (endOfYearMatch) {
      const targetYear = parseInt(endOfYearMatch[1]);
      return new Date(targetYear, 11, 31, 23, 59, 59); // December 31st
    }

    // Try to parse as regular date string
    try {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    } catch (error) {
      console.warn('Could not parse date:', dateStr);
    }

    return null;
  },

  /**
   * Calculate expires_at date based on activity frequency and end date
   */
  calculateExpirationDate(frequency, endDate) {
    if (endDate) {
      const parsedEndDate = this.parseRelativeDate(endDate);
      if (parsedEndDate) {
        return parsedEndDate;
      }
    }

    // Default expiration based on frequency
    const now = new Date();
    switch (frequency?.toLowerCase()) {
      case 'daily':
        return new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
      case 'weekly':
        return new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 3 months
      case 'biweekly':
      case 'bi-weekly':
      case 'every other week':
        return new Date(now.getTime() + (120 * 24 * 60 * 60 * 1000)); // 4 months
      case 'monthly':
      case 'once a month':
        return new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)); // 1 year
      case 'yearly':
      case 'annually':
        return new Date(now.getTime() + (2 * 365 * 24 * 60 * 60 * 1000)); // 2 years
      default:
        return new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000)); // 6 months default
    }
  }
};

/**
 * Standard Agent Memory Value JSON Formats
 *
 * Defines the expected structure for the 'value' JSONB field in agent_memory table
 * based on memory_type. This ensures consistency across the application.
 *
 * All memory values should include source tracking for transparency and auditability.
 */
export const AGENT_MEMORY_VALUE_FORMATS = {
  /**
   * Note: source_type, source_id, confidence_score, is_user_confirmed are table columns
   * Only include additional source context in the value JSON if needed
   */

  /**
   * Family Member Information
   * Used for: family_info memory_type
   */
  family_member: {
    // Core data
    name: "string (required)",              // Full name of family member
    relationship: "string (required)",      // spouse, child, parent, etc.
    age: "number (optional)",              // Age in years
    grade: "string (optional)",            // School grade level
    school: "string (optional)",           // School name
    activities: "array[string] (optional)", // List of activities/interests
    schedule: "object (optional)",         // Weekly schedule object
    notes: "string (optional)",            // Additional notes

    // Optional source context (only if useful)
    original_text: "string (optional)"     // Original text that triggered extraction
  },

  /**
   * Preference Information
   * Used for: preferences memory_type
   */
  preference: {
    preference: "string (required)",        // The actual preference description
    type: "string (required)",             // prefers, likes, dislikes, etc.
    member_name: "string (optional)",      // Which family member (null = family-wide)
    category: "string (optional)",         // food, activity, schedule, etc.
    intensity: "string (optional)",        // strong, mild, absolute
    notes: "string (optional)",
    original_text: "string (optional)"     // Original text that triggered extraction
  },

  /**
   * Schedule/Activity Information
   * Used for: schedule memory_type
   */
  schedule: {
    activity: "string (required)",         // Name of the activity
    day: "string (optional)",             // Day of week (monday, tuesday, etc.)
    frequency: "string (optional)",       // weekly, biweekly, monthly, etc.
    member_name: "string (optional)",     // Which family member
    location: "string (optional)",        // Where it takes place
    time: "string (optional)",           // Time of day
    type: "string (optional)",           // recurring, one-time, seasonal
    endDate: "string (optional)",         // When it ends (for automatic expiration)
    original_text: "string (optional)"    // Original text that triggered extraction
  },

  /**
   * Contact Information
   * Used for: contacts memory_type
   */
  contact: {
    name: "string (required)",            // Contact's name
    type: "string (required)",           // email, phone, emergency, etc.
    email: "string (optional)",          // Email address
    phone: "string (optional)",          // Phone number
    relationship: "string (optional)",   // teacher, coach, doctor, etc.
    member_name: "string (optional)",    // Associated family member
    notes: "string (optional)",
    original_text: "string (optional)"    // Original text that triggered extraction
  },

  /**
   * Medical Information
   * Used for: medical memory_type
   */
  medical: {
    member_name: "string (optional)",     // Which family member (null = family-wide)
    category: "string (required)",       // allergy, medication, condition, etc.
    info: "string (required)",          // The medical information
    severity: "string (optional)",      // mild, moderate, severe
    notes: "string (optional)",
    original_text: "string (optional)"    // Original text that triggered extraction
  },

  /**
   * Generic Structured Data
   * Used for: any memory_type as fallback
   */
  generic: {
    content: "string (required)",         // The main content/description
    category: "string (optional)",       // Classification category
    member_name: "string (optional)",    // Associated family member
    metadata: "object (optional)",       // Additional structured data
    notes: "string (optional)",
    original_text: "string (optional)"    // Original text that triggered extraction
  }
};

/**
 * Simple Example Memory Entries
 */
export const MEMORY_EXAMPLES = {
  // Email-extracted family member (source info in table columns)
  email_family_member: {
    // Table columns: source_type='email', source_id='email_abc123', confidence_score=0.85
    value: {
      name: "Sarah",
      relationship: "daughter",
      age: 8,
      school: "Washington Elementary",
      activities: ["soccer", "piano"],
      original_text: "Sarah has soccer practice every Tuesday and piano lessons on Thursdays"
    }
  },

  // Chat-extracted preference (source info in table columns)
  chat_preference: {
    // Table columns: source_type='chat', source_id='conversation_xyz789', confidence_score=0.90
    value: {
      preference: "Italian food",
      type: "prefers",
      member_name: "family",
      category: "food",
      intensity: "strong",
      original_text: "We really love Italian food, especially pasta dishes"
    }
  },

  // Manually entered contact (source info in table columns)
  manual_contact: {
    // Table columns: source_type='manual', source_id='user_456', confidence_score=1.0, is_user_confirmed=true
    value: {
      name: "Dr. Smith",
      type: "emergency",
      phone: "555-123-4567",
      email: "dsmith@familydoc.com",
      relationship: "family doctor",
      member_name: "family"
      // No original_text for manual entries
    }
  }
};

/**
 * Source Type Definitions
 */
export const SOURCE_TYPES = {
  EMAIL: 'email',
  CHAT: 'chat',
  MANUAL: 'manual'
};

/**
 * Memory Processing Utilities
 */
export const MEMORY_UTILS = {
  /**
   * Calculate expiration date based on memory type
   */
  calculateExpirationDate(memoryType, customDays = null) {
    const typeConfig = MEMORY_CONFIG.MEMORY_TYPES[memoryType];
    const days = customDays || typeConfig?.expirationDays;

    if (!days) return null; // Never expires

    const expiration = new Date();
    expiration.setDate(expiration.getDate() + days);
    return expiration.toISOString();
  },

  /**
   * Get default settings for memory type
   */
  getTypeDefaults(memoryType) {
    const typeConfig = MEMORY_CONFIG.MEMORY_TYPES[memoryType];
    if (!typeConfig) {
      return {
        priority: MEMORY_CONFIG.PRIORITY_LEVELS.NORMAL,
        confidence: MEMORY_CONFIG.CONFIDENCE_SCORING.AI_INFERRED,
        expiresAt: null
      };
    }

    return {
      priority: typeConfig.defaultPriority,
      confidence: typeConfig.defaultConfidence,
      expiresAt: this.calculateExpirationDate(memoryType)
    };
  },

  /**
   * Create memory entry with optional original text
   */
  createMemoryEntry(coreData, originalText = null) {
    return originalText ? { ...coreData, original_text: originalText } : coreData;
  },

  /**
   * Format source information for UI display
   */
  formatSourceForDisplay(memoryRecord) {
    const { source_type, confidence_score, created_at, value } = memoryRecord;

    const sourceLabels = {
      email: '📧 Email',
      chat: '💬 Chat',
      manual: '✋ Manual Entry'
    };

    const date = new Date(created_at).toLocaleDateString();
    const confidence = Math.round(confidence_score * 100);

    return {
      source_label: sourceLabels[source_type] || source_type,
      date: date,
      confidence_percentage: confidence,
      can_show_original: !!(value && value.original_text)
    };
  },

  /**
   * Validate memory data before storage
   */
  validateMemoryData(memoryData) {
    const errors = [];

    if (!memoryData.userId) errors.push('User ID is required');
    if (!memoryData.memoryType) errors.push('Memory type is required');
    if (!memoryData.key) errors.push('Memory key is required');
    if (memoryData.value === undefined || memoryData.value === null) {
      errors.push('Memory value is required');
    }

    // Validate confidence score (table column)
    if (memoryData.confidenceScore !== undefined) {
      if (memoryData.confidenceScore < 0 || memoryData.confidenceScore > 1) {
        errors.push('Confidence score must be between 0 and 1');
      }
    }

    // Validate priority (table column)
    if (memoryData.priority !== undefined) {
      if (memoryData.priority < 1 || memoryData.priority > 5) {
        errors.push('Priority must be between 1 and 5');
      }
    }

    // Validate source_type (table column)
    if (memoryData.sourceType && !Object.values(SOURCE_TYPES).includes(memoryData.sourceType)) {
      errors.push('Invalid source type');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

export default MEMORY_CONFIG;