/**
 * Memory extraction patterns for identifying useful information from emails
 */

export const MEMORY_EXTRACTION_PATTERNS = {
  // Schedule & Events
  schedule: {
    memoryType: 'schedule',
    priority: 2,
    patterns: [
      /(?:practice|lesson|class|meeting|appointment)\s+(?:on\s+)?(\w+day)s?\s+(?:at\s+)?(\d{1,2}:\d{2})/i,
      /(\w+day)\s+at\s+(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i,
      /every\s+(\w+day)\s+(?:at\s+)?(\d{1,2}:\d{2})/i,
      /weekly\s+(?:on\s+)?(\w+day)s?/i
    ],
    extractors: {
      recurring_activity: /(?:weekly|every\s+\w+day|recurring)/i,
      activity_type: /(practice|lesson|class|meeting|appointment|game|event)/i,
      time: /(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i,
      day: /(\w+day)/i,
      location: /(?:at|@)\s+([^,\n]+?)(?:,|\n|$)/i
    },
    datePatterns: [
      /(?:until|through|ends?\s+(?:on\s+)?|season\s+ends?)[\s\w]*?(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i,
      /season\s+(?:runs\s+)?(?:through|until)\s+(\w+)/i
    ]
  },

  // Contact Information
  contacts: {
    memoryType: 'contacts',
    priority: 3,
    patterns: [
      /teacher:?\s*([^,\n]+)/i,
      /coach:?\s*([^,\n]+)/i,
      /contact:?\s*([^,\n]+)/i,
      /instructor:?\s*([^,\n]+)/i
    ],
    extractors: {
      name: /(?:teacher|coach|contact|instructor):?\s*([^,\n\(]+)/i,
      role: /(teacher|coach|contact|instructor)/i,
      phone: /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/,
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
    }
  },

  // Medical & Health
  medical: {
    memoryType: 'medical',
    priority: 1,
    patterns: [
      /(?:allergy|allergic\s+to|medication|prescription)/i,
      /(?:doctor|appointment|checkup|vaccination)/i,
      /(?:medical|health|condition)/i
    ],
    extractors: {
      condition: /(?:allergy\s+to|allergic\s+to|condition:?)\s*([^,\n]+)/i,
      medication: /(?:medication|prescription):?\s*([^,\n]+)/i,
      doctor: /(?:doctor|physician):?\s*([^,\n]+)/i,
      appointment_type: /(checkup|vaccination|visit|appointment)/i
    },
    datePatterns: [
      /(?:next\s+(?:visit|appointment|checkup)|due\s+for)[\s\w]*?(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i
    ]
  },

  // Financial & Payments
  financial: {
    memoryType: 'financial',
    priority: 2,
    patterns: [
      /(?:tuition|fee|payment|bill|due|cost|price)/i,
      /(?:\$\d+|\d+\s*dollars)/i,
      /(?:monthly|weekly|annual|semester)\s+(?:fee|payment|tuition)/i
    ],
    extractors: {
      amount: /\$?(\d+(?:\.\d{2})?)/,
      frequency: /(monthly|weekly|annual|semester|per\s+\w+)/i,
      item: /(?:tuition|fee|payment|bill)\s+for\s+([^,\n]+)/i,
      due_date: /due\s+(?:on\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i
    },
    datePatterns: [
      /due\s+(?:on\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i,
      /payment\s+(?:due|required)\s+(?:by\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i
    ]
  },

  // School Information
  school: {
    memoryType: 'school',
    priority: 2,
    patterns: [
      /(?:homework|assignment|project|test|exam)/i,
      /(?:field\s+trip|school\s+event|parent\s+conference)/i,
      /(?:grade|class|subject|curriculum)/i
    ],
    extractors: {
      subject: /(?:homework|assignment|test)\s+(?:for\s+)?(\w+)/i,
      teacher: /(?:teacher|instructor):?\s*([^,\n]+)/i,
      grade: /grade\s+(\d+|[A-F][+-]?|\w+)/i,
      assignment: /(homework|assignment|project|test|exam):\s*([^,\n]+)/i
    },
    datePatterns: [
      /due\s+(?:on\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)/i,
      /(?:test|exam)\s+(?:on\s+)?(\w+\s+\d{1,2}(?:st|nd|rd|th)?)/i
    ]
  },

  // Transportation & Logistics
  transportation: {
    memoryType: 'transportation',
    priority: 3,
    patterns: [
      /(?:pickup|drop\s*off|carpool|bus)/i,
      /(?:location|address|where)/i
    ],
    extractors: {
      type: /(pickup|drop\s*off|carpool|bus|transportation)/i,
      time: /(?:pickup|drop\s*off)\s+(?:at\s+)?(\d{1,2}:\d{2}(?:\s*[AP]M)?)/i,
      location: /(?:at|@|location:?)\s*([^,\n]+?)(?:,|\n|$)/i,
      person: /(?:pickup|drop\s*off)\s+(?:by\s+)?([^,\n]+?)(?:\s+at|\s+@|,|\n|$)/i
    }
  },

  // Emergency & Important Info
  emergency: {
    memoryType: 'emergency',
    priority: 1,
    patterns: [
      /(?:emergency|urgent|important|critical)/i,
      /(?:emergency\s+contact|in\s+case\s+of\s+emergency)/i
    ],
    extractors: {
      contact_name: /(?:emergency\s+contact|contact):?\s*([^,\n\(]+)/i,
      phone: /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/,
      relationship: /(?:emergency\s+contact)[\s\w]*?\(([^)]+)\)/i
    }
  }
};

/**
 * Determines expiration date based on content and context
 */
export function determineExpirationDate(content, patternType, extractedData) {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Extract any explicit end dates from content
  const pattern = MEMORY_EXTRACTION_PATTERNS[patternType];
  if (pattern?.datePatterns) {
    for (const datePattern of pattern.datePatterns) {
      const match = content.match(datePattern);
      if (match) {
        const dateStr = match[1];
        try {
          const parsedDate = new Date(`${dateStr}, ${currentYear}`);
          if (parsedDate > now) {
            return parsedDate.toISOString();
          }
          // If the date is in the past, try next year
          const nextYearDate = new Date(`${dateStr}, ${currentYear + 1}`);
          return nextYearDate.toISOString();
        } catch (error) {
          // Continue to default logic if parsing fails
        }
      }
    }
  }

  // Default expiration rules based on memory type
  switch (patternType) {
    case 'schedule':
      // Sports seasons typically run 3-4 months
      if (content.toLowerCase().includes('season')) {
        return new Date(now.getTime() + (120 * 24 * 60 * 60 * 1000)).toISOString(); // 120 days
      }
      // Regular activities expire in 1 year
      return new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString();

    case 'financial':
      // Bills and payments expire after 1 year
      return new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString();

    case 'school':
      // School info expires at end of school year (June)
      const endOfSchoolYear = new Date(currentYear, 5, 30); // June 30
      if (now > endOfSchoolYear) {
        return new Date(currentYear + 1, 5, 30).toISOString();
      }
      return endOfSchoolYear.toISOString();

    case 'medical':
    case 'emergency':
    case 'contacts':
      // These don't expire automatically
      return null;

    case 'transportation':
      // Transportation info expires in 6 months
      return new Date(now.getTime() + (180 * 24 * 60 * 60 * 1000)).toISOString();

    default:
      // Default to 1 year
      return new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString();
  }
}

/**
 * Extracts structured data from text using pattern extractors
 */
export function extractStructuredData(text, patternType) {
  const pattern = MEMORY_EXTRACTION_PATTERNS[patternType];
  if (!pattern?.extractors) return {};

  const extracted = {};

  for (const [key, regex] of Object.entries(pattern.extractors)) {
    const match = text.match(regex);
    if (match) {
      extracted[key] = match[1]?.trim();
    }
  }

  return extracted;
}

/**
 * Generates appropriate tags for memory based on content and pattern type
 */
export function generateMemoryTags(content, patternType, extractedData) {
  const tags = [patternType];

  // Add activity-specific tags
  if (extractedData.activity_type) {
    tags.push(extractedData.activity_type.toLowerCase());
  }

  // Add subject/category tags
  if (extractedData.subject) {
    tags.push(extractedData.subject.toLowerCase());
  }

  // Add day-of-week tags
  if (extractedData.day) {
    tags.push(extractedData.day.toLowerCase());
  }

  // Add recurring activity tag
  if (extractedData.recurring_activity || content.toLowerCase().includes('weekly')) {
    tags.push('recurring');
  }

  // Add seasonal tags
  if (content.toLowerCase().includes('season')) {
    tags.push('seasonal');
  }

  // Add priority-based tags
  const pattern = MEMORY_EXTRACTION_PATTERNS[patternType];
  if (pattern.priority === 1) {
    tags.push('critical');
  } else if (pattern.priority === 2) {
    tags.push('important');
  }

  return tags;
}