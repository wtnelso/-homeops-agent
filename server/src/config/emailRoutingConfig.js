/**
 * Email Analysis Routing Configuration
 *
 * Defines intelligent routing rules for extracted information from emails:
 * - Preferences: Semi-permanent user/family preferences → account_profile
 * - Temporal Memories: Time-bound information → agent_memory
 * - Profile Updates: Suggested updates to family profile → profile_suggestions
 */

export const EMAIL_ROUTING_CONFIG = {
  // Confidence thresholds for routing decisions
  CONFIDENCE_THRESHOLDS: {
    AUTO_ROUTE_ABOVE: 0.9,        // Automatically route without user confirmation
    MANUAL_REVIEW_BELOW: 0.7,     // Require user confirmation
    DISCARD_BELOW: 0.5,           // Don't store at all
  },

  // Keywords and patterns that indicate preference updates
  PREFERENCE_PATTERNS: {
    keywords: [
      "prefers", "likes", "enjoys", "favorite", "loves", "adores", "is into", "is fond of",
      "dislikes", "hates", "avoids", "allergic", "can't eat", "won't eat", "doesn't like", "not a fan",
      "always", "usually", "typically", "generally", "tends to", "often", "frequently", "normally",
      "routine", "habit", "schedule preference", "works best", "functions best", "does well with",
      "morning person", "night owl", "early bird", "late sleeper", "early riser"
    ],
    phrases: [
      /(\w+)\s+(prefers|likes|enjoys|loves)\s+(.+)/i,
      /(\w+)\s+is\s+(allergic to|afraid of|good at)\s+(.+)/i,
      /(\w+)\s+(always|usually|typically)\s+(.+)/i,
      /(\w+)'s?\s+(favorite|preferred)\s+(.+)\s+(is|are)\s+(.+)/i
    ],
    examples: [
      "Johnny prefers morning practices",
      "Sarah loves Italian food",
      "Kids are allergic to peanuts",
      "Family usually eats dinner at 6pm"
    ]
  },

  // Keywords and patterns that indicate temporal memories
  TEMPORAL_MEMORY_PATTERNS: {
    keywords: [
      "due", "deadline", "appointment", "meeting", "practice", "game",
      "conference", "event", "party", "birthday", "vacation", "trip",
      "doctor", "dentist", "pickup", "dropoff", "carpool", "lesson",
      "homework", "project", "test", "exam", "performance", "recital"
    ],
    date_patterns: [
      /due\s+(on\s+)?(\w+day|\d{1,2}\/\d{1,2}|\w+ \d{1,2})/i,
      /(\w+day|\d{1,2}\/\d{1,2})\s+at\s+(\d{1,2}:\d{2}|\d{1,2}\s?(am|pm))/i,
      /(next|this)\s+(\w+day)/i,
      /(tomorrow|today)\s+at\s+(\d{1,2}:\d{2}|\d{1,2}\s?(am|pm))/i
    ],
    examples: [
      "Science fair project due Friday",
      "Soccer practice every Tuesday at 4pm",
      "Doctor appointment next Monday",
      "Birthday party this Saturday"
    ]
  },

  // Keywords and patterns that indicate family info updates
  FAMILY_INFO_PATTERNS: {
    keywords: [
      "teacher", "coach", "instructor", "babysitter", "sitter", "nanny", "au pair", "caregiver", "childcare",
      "doctor", "dentist", "pediatrician", "specialist", "nurse", "physician", "therapist", "counselor",
      "principal", "vice principal", "counselor", "tutor", "aide", "substitute", "sub",
      "friend", "classmate", "neighbor", "playmate", "buddy",
      "emergency contact", "contact person", "pickup person", "authorized pickup"
    ],
    relationship_patterns: [
      /(\w+)'s?\s+(teacher|coach|instructor|doctor)\s+(is|name is)\s+(.+)/i,
      /(\w+)\s+(teaches|coaches|instructs)\s+(\w+)/i,
      /contact\s+(\w+)\s+at\s+(.+)/i,
      /(new|current)\s+(teacher|coach|doctor)\s+(.+)/i
    ],
    examples: [
      "Johnny's soccer coach is Sarah",
      "New math teacher Ms. Johnson",
      "Contact Dr. Smith at 555-1234",
      "Emergency contact: Grandma at..."
    ]
  },

  // Entity types for linking memories to family profile
  ENTITY_TYPES: {
    FAMILY_MEMBER: "family_member",    // Links to profile.family.children/spouse
    SCHOOL: "school",                  // Links to profile.education.schools
    ACTIVITY: "activity",              // Links to profile.activities.recurring_events
    CONTACT: "contact",                // Links to profile.contacts.important_contacts
    LOCATION: "location",              // Links to profile.locations
    MEDICAL: "medical",                // Links to profile.medical
  },

  // Routing decisions based on content analysis
  ROUTING_RULES: {
    // Route to account_profile.preferences if:
    ROUTE_TO_PREFERENCES: {
      min_confidence: 0.8,
      conditions: [
        "contains_preference_keywords",
        "expresses_opinion_or_habit",
        "describes_recurring_behavior",
        "mentions_likes_dislikes"
      ]
    },

    // Route to agent_memory if:
    ROUTE_TO_MEMORY: {
      min_confidence: 0.7,
      conditions: [
        "contains_temporal_keywords",
        "has_specific_date_or_time",
        "mentions_upcoming_event",
        "contains_deadline"
      ]
    },

    // Create profile suggestion if:
    SUGGEST_PROFILE_UPDATE: {
      min_confidence: 0.6,
      conditions: [
        "mentions_new_contact_info",
        "describes_family_relationship",
        "updates_existing_info",
        "adds_activity_or_interest"
      ]
    }
  },

  // Default expiration rules for different content types
  EXPIRATION_RULES: {
    assignment: { days: 30 },        // "Science fair project due Friday"
    appointment: { days: 1 },        // "Doctor appointment next Monday"
    event: { days: 7 },             // "Birthday party this Saturday"
    practice: { days: 90 },         // "Soccer practice every Tuesday"
    contact_temp: { days: 365 },    // "Emergency contact this week"
    default: { days: 60 }           // General temporal information
  }
};

/**
 * Routing Decision Engine
 * Analyzes extracted information and determines routing destination
 */
export class EmailRoutingEngine {
  constructor() {
    this.config = EMAIL_ROUTING_CONFIG;
  }

  /**
   * Main routing decision method
   * @param {Object} extractedInfo - Information extracted from email
   * @param {Object} familyProfile - Current family profile context
   * @returns {Object} Routing decision with destination and confidence
   */
  routeInformation(extractedInfo, familyProfile) {
    const decisions = [];

    for (const info of extractedInfo) {
      const decision = this.analyzeContent(info, familyProfile);
      decisions.push(decision);
    }

    return decisions;
  }

  /**
   * Analyze individual piece of extracted information
   * @private
   */
  analyzeContent(info, familyProfile) {
    const {
      text,
      confidence = 0.5,
      extracted_entities = [],
      mentioned_people = []
    } = info;

    // Check for preference patterns
    const preferenceScore = this.calculatePreferenceScore(text);

    // Check for temporal memory patterns
    const temporalScore = this.calculateTemporalScore(text);

    // Check for family info patterns
    const familyInfoScore = this.calculateFamilyInfoScore(text, familyProfile);

    // Determine primary route based on highest score
    let route = 'discard';
    let routeConfidence = confidence;
    let entityLinks = [];

    if (preferenceScore > temporalScore && preferenceScore > familyInfoScore) {
      if (preferenceScore * confidence >= this.config.CONFIDENCE_THRESHOLDS.MANUAL_REVIEW_BELOW) {
        route = 'preference';
        routeConfidence = preferenceScore * confidence;
      }
    } else if (temporalScore > familyInfoScore) {
      if (temporalScore * confidence >= this.config.CONFIDENCE_THRESHOLDS.MANUAL_REVIEW_BELOW) {
        route = 'memory';
        routeConfidence = temporalScore * confidence;
        entityLinks = this.identifyEntityLinks(text, mentioned_people, familyProfile);
      }
    } else if (familyInfoScore > 0) {
      if (familyInfoScore * confidence >= this.config.CONFIDENCE_THRESHOLDS.DISCARD_BELOW) {
        route = 'profile_suggestion';
        routeConfidence = familyInfoScore * confidence;
        entityLinks = this.identifyEntityLinks(text, mentioned_people, familyProfile);
      }
    }

    // Determine if auto-route or requires manual review
    const requiresReview = routeConfidence < this.config.CONFIDENCE_THRESHOLDS.AUTO_ROUTE_ABOVE;

    return {
      original_text: text,
      route: route,
      confidence: routeConfidence,
      requires_review: requiresReview,
      entity_links: entityLinks,
      reasoning: this.generateReasoning(preferenceScore, temporalScore, familyInfoScore),
      expiration_suggestion: route === 'memory' ? this.suggestExpiration(text) : null
    };
  }

  /**
   * Calculate preference score based on keywords and patterns
   * @private
   */
  calculatePreferenceScore(text) {
    let score = 0;
    const { keywords, phrases } = this.config.PREFERENCE_PATTERNS;

    // Check for preference keywords
    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword)) {
        score += 0.3;
      }
    }

    // Check for preference phrases
    for (const pattern of phrases) {
      if (pattern.test(text)) {
        score += 0.5;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate temporal memory score based on time-related patterns
   * @private
   */
  calculateTemporalScore(text) {
    let score = 0;
    const { keywords, date_patterns } = this.config.TEMPORAL_MEMORY_PATTERNS;

    // Check for temporal keywords
    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword)) {
        score += 0.2;
      }
    }

    // Check for date patterns
    for (const pattern of date_patterns) {
      if (pattern.test(text)) {
        score += 0.6;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate family info score based on relationship patterns
   * @private
   */
  calculateFamilyInfoScore(text, familyProfile) {
    let score = 0;
    const { keywords, relationship_patterns } = this.config.FAMILY_INFO_PATTERNS;

    // Check for family info keywords
    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword)) {
        score += 0.3;
      }
    }

    // Check for relationship patterns
    for (const pattern of relationship_patterns) {
      if (pattern.test(text)) {
        score += 0.4;
      }
    }

    // Boost score if mentions known family members
    if (familyProfile?.family?.children) {
      for (const child of familyProfile.family.children) {
        if (child.name && text.includes(child.name)) {
          score += 0.2;
        }
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Identify entity links to family profile
   * @private
   */
  identifyEntityLinks(text, mentionedPeople, familyProfile) {
    const links = [];

    // Link to family members
    if (familyProfile?.family?.children) {
      for (const child of familyProfile.family.children) {
        if (child.name && (text.includes(child.name) || mentionedPeople.includes(child.name))) {
          links.push({
            entity_type: this.config.ENTITY_TYPES.FAMILY_MEMBER,
            entity_id: child.id || child.name,
            confidence: 0.9
          });
        }
      }
    }

    // Link to schools
    if (familyProfile?.education?.schools) {
      for (const school of familyProfile.education.schools) {
        if (school.name && text.includes(school.name)) {
          links.push({
            entity_type: this.config.ENTITY_TYPES.SCHOOL,
            entity_id: school.id || school.name,
            confidence: 0.8
          });
        }
      }
    }

    return links;
  }

  /**
   * Suggest expiration date for temporal memories
   * @private
   */
  suggestExpiration(text) {
    const lowerText = text.toLowerCase();

    // Try to find specific content types
    if (lowerText.includes('due') || lowerText.includes('homework') || lowerText.includes('project')) {
      return this.config.EXPIRATION_RULES.assignment;
    }

    if (lowerText.includes('appointment') || lowerText.includes('doctor') || lowerText.includes('dentist')) {
      return this.config.EXPIRATION_RULES.appointment;
    }

    if (lowerText.includes('party') || lowerText.includes('birthday') || lowerText.includes('event')) {
      return this.config.EXPIRATION_RULES.event;
    }

    if (lowerText.includes('practice') || lowerText.includes('lesson') || lowerText.includes('every')) {
      return this.config.EXPIRATION_RULES.practice;
    }

    return this.config.EXPIRATION_RULES.default;
  }

  /**
   * Generate human-readable reasoning for routing decision
   * @private
   */
  generateReasoning(preferenceScore, temporalScore, familyInfoScore) {
    const scores = [
      { type: 'preference', score: preferenceScore },
      { type: 'temporal', score: temporalScore },
      { type: 'family_info', score: familyInfoScore }
    ].sort((a, b) => b.score - a.score);

    const primary = scores[0];

    if (primary.score === 0) {
      return "No clear routing patterns detected";
    }

    switch (primary.type) {
      case 'preference':
        return `Detected preference language (score: ${primary.score.toFixed(2)})`;
      case 'temporal':
        return `Detected temporal/scheduling content (score: ${primary.score.toFixed(2)})`;
      case 'family_info':
        return `Detected family relationship info (score: ${primary.score.toFixed(2)})`;
      default:
        return `Primary match: ${primary.type} (score: ${primary.score.toFixed(2)})`;
    }
  }
}