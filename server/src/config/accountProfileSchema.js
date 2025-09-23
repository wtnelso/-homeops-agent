/**
 * Account Profile Schema Configuration
 *
 * Defines the unified structure for user account profiles that serves as:
 * 1. User-editable profile data in the UI
 * 2. Context for email analysis and AI processing
 * 3. Replacement for scattered agent memory system
 */

export const ACCOUNT_PROFILE_SCHEMA = {
  // Core account information
  account: {
    name: {
      type: 'string',
      label: 'Account Name',
      description: 'Primary account holder name',
      example: 'John Smith',
      required: true,
      editable: true
    },
    email: {
      type: 'string',
      label: 'Primary Email',
      description: 'Main email address for this account',
      example: 'john@example.com',
      required: true,
      editable: false // Managed by auth system
    },
    timezone: {
      type: 'string',
      label: 'Timezone',
      description: 'Primary timezone for scheduling',
      example: 'America/New_York',
      required: false,
      editable: true,
      default: 'America/New_York'
    }
  },

  // Family structure
  family: {
    spouse: {
      type: 'object',
      label: 'Spouse/Partner',
      description: 'Information about spouse or partner',
      editable: true,
      properties: {
        name: { type: 'string', example: 'Jane Smith' },
        email: { type: 'string', example: 'jane@example.com' },
        phone: { type: 'string', example: '555-0123' },
        work_schedule: { type: 'string', example: 'Monday-Friday 9-5' },
        preferences: { type: 'array', items: { type: 'string' }, example: ['Italian food', 'morning workouts'] }
      }
    },
    children: {
      type: 'array',
      label: 'Children',
      description: 'Information about children',
      editable: true,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Johnny Smith' },
          age: { type: 'number', example: 8 },
          grade: { type: 'string', example: '3rd grade' },
          school: { type: 'string', example: 'Lincoln Elementary' },
          activities: {
            type: 'array',
            items: { type: 'string' },
            example: ['soccer', 'piano lessons']
          },
          schedule: {
            type: 'object',
            properties: {
              monday: { type: 'string', example: 'Soccer practice 4-5pm' },
              tuesday: { type: 'string', example: 'Piano lesson 3:30pm' },
              wednesday: { type: 'string', example: 'Free' },
              thursday: { type: 'string', example: 'Soccer practice 4-5pm' },
              friday: { type: 'string', example: 'Free' },
              saturday: { type: 'string', example: 'Soccer game 10am' },
              sunday: { type: 'string', example: 'Family time' }
            }
          },
          allergies: { type: 'array', items: { type: 'string' }, example: ['peanuts'] },
          emergency_contacts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                relationship: { type: 'string' },
                phone: { type: 'string' }
              }
            }
          }
        }
      }
    },
    pets: {
      type: 'array',
      label: 'Pets',
      description: 'Family pets information',
      editable: true,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Buddy' },
          type: { type: 'string', example: 'Dog' },
          breed: { type: 'string', example: 'Golden Retriever' },
          age: { type: 'number', example: 3 },
          vet: { type: 'string', example: 'Westside Animal Hospital' },
          medications: { type: 'array', items: { type: 'string' } },
          schedule: { type: 'string', example: 'Walk at 7am and 6pm daily' }
        }
      }
    }
  },

  // Regular activities and commitments
  activities: {
    recurring_events: {
      type: 'array',
      label: 'Recurring Events',
      description: 'Regular family activities and commitments',
      editable: true,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Family dinner' },
          frequency: { type: 'string', example: 'Daily', enum: ['Daily', 'Weekly', 'Monthly', 'Custom'] },
          day_of_week: { type: 'string', example: 'Sunday' },
          time: { type: 'string', example: '6:00 PM' },
          duration: { type: 'string', example: '1 hour' },
          location: { type: 'string', example: 'Home' },
          participants: { type: 'array', items: { type: 'string' }, example: ['John', 'Jane', 'Johnny'] },
          notes: { type: 'string', example: 'Usually cook together' }
        }
      }
    },
    hobbies: {
      type: 'array',
      label: 'Hobbies & Interests',
      description: 'Family hobbies and personal interests',
      editable: true,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Photography' },
          participants: { type: 'array', items: { type: 'string' }, example: ['John'] },
          frequency: { type: 'string', example: 'Weekends' },
          equipment: { type: 'array', items: { type: 'string' }, example: ['Canon EOS R5', 'Tripod'] },
          skill_level: { type: 'string', example: 'Intermediate', enum: ['Beginner', 'Intermediate', 'Advanced'] }
        }
      }
    }
  },

  // Preferences and settings
  preferences: {
    dietary: {
      type: 'object',
      label: 'Dietary Preferences',
      description: 'Family dietary preferences and restrictions',
      editable: true,
      properties: {
        restrictions: {
          type: 'array',
          items: { type: 'string' },
          example: ['vegetarian', 'gluten-free']
        },
        allergies: {
          type: 'array',
          items: { type: 'string' },
          example: ['peanuts', 'shellfish']
        },
        favorite_cuisines: {
          type: 'array',
          items: { type: 'string' },
          example: ['Italian', 'Mexican', 'Thai']
        },
        favorite_restaurants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              cuisine: { type: 'string' },
              location: { type: 'string' },
              favorite_dishes: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    },
    communication: {
      type: 'object',
      label: 'Communication Preferences',
      description: 'How family prefers to communicate and be contacted',
      editable: true,
      properties: {
        preferred_contact_method: {
          type: 'string',
          example: 'email',
          enum: ['email', 'text', 'phone', 'app']
        },
        notification_times: {
          type: 'object',
          properties: {
            start_time: { type: 'string', example: '8:00 AM' },
            end_time: { type: 'string', example: '8:00 PM' }
          }
        },
        emergency_contact_priority: {
          type: 'array',
          items: { type: 'string' },
          example: ['text first', 'then call', 'email as backup']
        }
      }
    },
    lifestyle: {
      type: 'object',
      label: 'Lifestyle Preferences',
      description: 'General family lifestyle and preferences',
      editable: true,
      properties: {
        activity_level: {
          type: 'string',
          example: 'Active',
          enum: ['Low', 'Moderate', 'Active', 'Very Active']
        },
        social_preferences: {
          type: 'array',
          items: { type: 'string' },
          example: ['small gatherings', 'outdoor activities', 'cultural events']
        },
        budget_consciousness: {
          type: 'string',
          example: 'Moderate',
          enum: ['Budget-conscious', 'Moderate', 'Premium']
        },
        planning_style: {
          type: 'string',
          example: 'Planner',
          enum: ['Spontaneous', 'Flexible', 'Planner', 'Detailed Planner']
        }
      }
    }
  },

  // Important contacts and services
  contacts: {
    healthcare: {
      type: 'array',
      label: 'Healthcare Providers',
      description: 'Family doctors, dentists, specialists',
      editable: true,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Dr. Sarah Johnson' },
          type: { type: 'string', example: 'Family Doctor' },
          phone: { type: 'string', example: '555-0123' },
          address: { type: 'string', example: '123 Medical Center Dr' },
          for_family_members: { type: 'array', items: { type: 'string' }, example: ['John', 'Jane'] },
          appointment_booking: { type: 'string', example: 'Call office or online portal' }
        }
      }
    },
    schools: {
      type: 'array',
      label: 'Schools & Education',
      description: 'Schools, teachers, and educational contacts',
      editable: true,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Lincoln Elementary' },
          child: { type: 'string', example: 'Johnny' },
          grade: { type: 'string', example: '3rd grade' },
          teacher: { type: 'string', example: 'Mrs. Anderson' },
          phone: { type: 'string', example: '555-0123' },
          email: { type: 'string', example: 'teacher@school.edu' },
          important_dates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                event: { type: 'string' }
              }
            }
          }
        }
      }
    },
    services: {
      type: 'array',
      label: 'Service Providers',
      description: 'Regular service providers (lawn care, cleaning, etc.)',
      editable: true,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'ABC Lawn Care' },
          service_type: { type: 'string', example: 'Lawn maintenance' },
          contact: { type: 'string', example: '555-0123' },
          schedule: { type: 'string', example: 'Every other Wednesday' },
          cost: { type: 'string', example: '$120/month' },
          notes: { type: 'string', example: 'Skip if raining' }
        }
      }
    }
  },

  // System metadata
  metadata: {
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
    last_ai_update: { type: 'string', format: 'date-time' },
    version: { type: 'number', default: 1 },
    completeness_score: {
      type: 'number',
      description: 'Percentage of profile fields completed',
      min: 0,
      max: 100
    }
  }
};

/**
 * Default profile structure for new accounts
 */
export const DEFAULT_PROFILE = {
  account: {
    name: '',
    email: '',
    timezone: 'America/New_York'
  },
  family: {
    spouse: null,
    children: [],
    pets: []
  },
  activities: {
    recurring_events: [],
    hobbies: []
  },
  preferences: {
    dietary: {
      restrictions: [],
      allergies: [],
      favorite_cuisines: [],
      favorite_restaurants: []
    },
    communication: {
      preferred_contact_method: 'email',
      notification_times: {
        start_time: '8:00 AM',
        end_time: '8:00 PM'
      },
      emergency_contact_priority: ['text first', 'then call']
    },
    lifestyle: {
      activity_level: 'Moderate',
      social_preferences: [],
      budget_consciousness: 'Moderate',
      planning_style: 'Flexible'
    }
  },
  contacts: {
    healthcare: [],
    schools: [],
    services: []
  },
  metadata: {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_ai_update: null,
    version: 1,
    completeness_score: 0
  }
};

/**
 * Profile validation rules
 */
export const PROFILE_VALIDATION = {
  required_for_completeness: [
    'account.name',
    'account.email',
    'family.children', // At least basic info if applicable
    'preferences.dietary.allergies',
    'contacts.healthcare'
  ],

  auto_extractable_from_email: [
    'family.children.activities',
    'family.children.schedule',
    'activities.recurring_events',
    'contacts.schools',
    'contacts.healthcare',
    'preferences.favorite_restaurants'
  ],

  user_input_required: [
    'account.name',
    'family.spouse',
    'family.children.name',
    'family.children.age',
    'preferences.dietary.restrictions'
  ]
};

/**
 * Generate AI context prompt from profile
 */
export function generateProfileContext(profile) {
  let context = '--- FAMILY PROFILE CONTEXT ---\n\n';

  // Account info
  if (profile.account?.name) {
    context += `Account Holder: ${profile.account.name}\n`;
  }

  // Family members
  if (profile.family?.spouse?.name) {
    context += `Spouse: ${profile.family.spouse.name}`;
    if (profile.family.spouse.preferences?.length > 0) {
      context += ` (Preferences: ${profile.family.spouse.preferences.join(', ')})`;
    }
    context += '\n';
  }

  if (profile.family?.children?.length > 0) {
    context += '\nChildren:\n';
    profile.family.children.forEach(child => {
      context += `- ${child.name}`;
      if (child.age) context += ` (age ${child.age})`;
      if (child.grade) context += ` - ${child.grade}`;
      if (child.school) context += ` at ${child.school}`;
      context += '\n';

      if (child.activities?.length > 0) {
        context += `  Activities: ${child.activities.join(', ')}\n`;
      }

      if (child.schedule) {
        const scheduleEntries = Object.entries(child.schedule)
          .filter(([day, activity]) => activity && activity !== 'Free')
          .map(([day, activity]) => `${day}: ${activity}`);
        if (scheduleEntries.length > 0) {
          context += `  Schedule: ${scheduleEntries.join(', ')}\n`;
        }
      }
    });
  }

  // Key preferences
  if (profile.preferences?.dietary?.allergies?.length > 0) {
    context += `\nAllergies: ${profile.preferences.dietary.allergies.join(', ')}\n`;
  }

  if (profile.preferences?.dietary?.favorite_cuisines?.length > 0) {
    context += `Favorite Cuisines: ${profile.preferences.dietary.favorite_cuisines.join(', ')}\n`;
  }

  // Regular activities
  if (profile.activities?.recurring_events?.length > 0) {
    context += '\nRegular Family Activities:\n';
    profile.activities.recurring_events.forEach(event => {
      context += `- ${event.name}`;
      if (event.frequency) context += ` (${event.frequency})`;
      if (event.day_of_week && event.time) context += ` - ${event.day_of_week}s at ${event.time}`;
      context += '\n';
    });
  }

  context += '\n--- END PROFILE CONTEXT ---\n';

  return context;
}

/**
 * Data source tracking structure
 * Tracks where each piece of data came from for transparency and linking
 */
export const DATA_SOURCE_SCHEMA = {
  type: {
    type: 'string',
    enum: ['manual', 'chat', 'email'],
    description: 'How this data was collected'
  },
  reference_id: {
    type: 'string',
    description: 'ID reference to original source (chat message ID, email ID, etc.)'
  },
  content: {
    type: 'string',
    description: 'Relevant content snippet from source (for chat messages)'
  },
  email_subject: {
    type: 'string',
    description: 'Email subject line (for email sources)'
  },
  timestamp: {
    type: 'string',
    format: 'date-time',
    description: 'When this data was collected/last updated'
  },
  confidence: {
    type: 'number',
    min: 0,
    max: 1,
    description: 'AI confidence score for extracted data (0-1)'
  },
  extracted_by: {
    type: 'string',
    description: 'Which AI model/system extracted this data'
  }
};

/**
 * Enhanced profile schema with source tracking
 * Each editable field can have an associated _source object
 */
export const ENHANCED_PROFILE_SCHEMA = {
  ...ACCOUNT_PROFILE_SCHEMA,
  // Add source tracking for all major fields
  _sources: {
    type: 'object',
    description: 'Source tracking for profile fields',
    properties: {
      'account.name': DATA_SOURCE_SCHEMA,
      'family.spouse.name': DATA_SOURCE_SCHEMA,
      'family.spouse.email': DATA_SOURCE_SCHEMA,
      'family.spouse.phone': DATA_SOURCE_SCHEMA,
      'family.children.*.name': DATA_SOURCE_SCHEMA,
      'family.children.*.age': DATA_SOURCE_SCHEMA,
      'family.children.*.school': DATA_SOURCE_SCHEMA,
      'family.children.*.activities': DATA_SOURCE_SCHEMA,
      'family.children.*.schedule': DATA_SOURCE_SCHEMA,
      'family.pets.*.name': DATA_SOURCE_SCHEMA,
      'family.pets.*.type': DATA_SOURCE_SCHEMA,
      'activities.recurring_events.*.name': DATA_SOURCE_SCHEMA,
      'activities.recurring_events.*.time': DATA_SOURCE_SCHEMA,
      'activities.recurring_events.*.location': DATA_SOURCE_SCHEMA,
      'preferences.dietary.restrictions': DATA_SOURCE_SCHEMA,
      'preferences.dietary.allergies': DATA_SOURCE_SCHEMA,
      'preferences.dietary.favorite_cuisines': DATA_SOURCE_SCHEMA,
      'contacts.healthcare.*.name': DATA_SOURCE_SCHEMA,
      'contacts.healthcare.*.phone': DATA_SOURCE_SCHEMA,
      'contacts.schools.*.name': DATA_SOURCE_SCHEMA,
      'contacts.schools.*.teacher': DATA_SOURCE_SCHEMA
    }
  }
};

/**
 * Helper function to get source for a specific field path
 */
export function getFieldSource(profile, fieldPath) {
  return profile._sources?.[fieldPath] || null;
}

/**
 * Helper function to set source for a specific field path
 */
export function setFieldSource(profile, fieldPath, source) {
  if (!profile._sources) {
    profile._sources = {};
  }
  profile._sources[fieldPath] = {
    ...source,
    timestamp: source.timestamp || new Date().toISOString()
  };
  return profile;
}

/**
 * Helper function to create a manual source entry
 */
export function createManualSource() {
  return {
    type: 'manual',
    timestamp: new Date().toISOString()
  };
}

/**
 * Helper function to create a chat source entry
 */
export function createChatSource(messageId, content, confidence = null) {
  return {
    type: 'chat',
    reference_id: messageId,
    content: content,
    confidence: confidence,
    timestamp: new Date().toISOString(),
    extracted_by: 'claude-4-sonnet'
  };
}

/**
 * Helper function to create an email source entry
 */
export function createEmailSource(emailId, subject, confidence = null) {
  return {
    type: 'email',
    reference_id: emailId,
    email_subject: subject,
    confidence: confidence,
    timestamp: new Date().toISOString(),
    extracted_by: 'claude-4-sonnet'
  };
}

export default ACCOUNT_PROFILE_SCHEMA;