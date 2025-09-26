/**
 * Schedule Parsing Utilities
 *
 * Converts raw text schedules into structured format for activities
 */

/**
 * Parse schedule text like "tuesday and thursday at 3:30pm" into structured format
 * @param {string} scheduleText - Raw schedule text
 * @param {string} activityName - Name of the activity
 * @returns {Object} Structured schedule with days and times
 */
function parseActivitySchedule(scheduleText, activityName = '') {
  if (!scheduleText || typeof scheduleText !== 'string') {
    return {
      days: [],
      time: null,
      location: null,
      raw_text: scheduleText
    };
  }

  const result = {
    days: [],
    time: null,
    location: null,
    raw_text: scheduleText
  };

  const text = scheduleText.toLowerCase().trim();

  // Extract days of the week
  const dayPatterns = [
    { pattern: /\b(monday|mon)\b/g, day: 'monday' },
    { pattern: /\b(tuesday|tue)\b/g, day: 'tuesday' },
    { pattern: /\b(wednesday|wed)\b/g, day: 'wednesday' },
    { pattern: /\b(thursday|thu)\b/g, day: 'thursday' },
    { pattern: /\b(friday|fri)\b/g, day: 'friday' },
    { pattern: /\b(saturday|sat)\b/g, day: 'saturday' },
    { pattern: /\b(sunday|sun)\b/g, day: 'sunday' }
  ];

  dayPatterns.forEach(({ pattern, day }) => {
    if (pattern.test(text)) {
      result.days.push(day);
    }
  });

  // Extract time patterns
  const timePatterns = [
    // 3:30pm, 3:30 pm, 3:30PM
    /\b(\d{1,2}):(\d{2})\s*(pm|am|p\.m\.|a\.m\.)\b/i,
    // 3pm, 3 pm
    /\b(\d{1,2})\s*(pm|am|p\.m\.|a\.m\.)\b/i,
    // 3:30-4:30pm, 4-5pm
    /\b(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?\s*(pm|am|p\.m\.|a\.m\.)\b/i,
    // "at 3:30", "from 3:30"
    /(?:at|from)\s+(\d{1,2}):?(\d{2})?\s*(pm|am|p\.m\.|a\.m\.)?/i
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      result.time = match[0].trim();
      break;
    }
  }

  // Extract location patterns
  const locationPatterns = [
    /(?:at|@)\s+([^,\n]+?)(?:\s+on|\s+at\s+\d|$)/i,
    /(?:location|venue):\s*([^,\n]+)/i,
    /\b(community center|school|gym|field|park|home)\b/i
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      result.location = match[1] ? match[1].trim() : match[0].trim();
      break;
    }
  }

  return result;
}

/**
 * Parse activity name and schedule from combined text
 * @param {string} activityText - Combined activity text like "Basketball practice tuesday and thursday at 3:30pm"
 * @returns {Object} Parsed activity with name and schedule
 */
function parseActivityFromText(activityText) {
  if (!activityText || typeof activityText !== 'string') {
    return {
      name: '',
      schedule: {
        days: [],
        time: null,
        location: null,
        raw_text: activityText
      }
    };
  }

  const text = activityText.trim();

  // Common activity patterns
  const activityPatterns = [
    /^([^,]+?)\s+(?:on\s+|every\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /^([^,]+?)\s+(?:at\s+\d)/i,
    /^([^,]+?)\s+(?:from\s+\d)/i,
    /^([^,]+?)(?:\s+[-–]\s+)/i
  ];

  let activityName = '';
  let scheduleText = text;

  for (const pattern of activityPatterns) {
    const match = text.match(pattern);
    if (match) {
      activityName = match[1].trim();
      scheduleText = text.substring(match[1].length).trim();
      break;
    }
  }

  // Fallback: if no pattern matched, use the whole text as activity name
  if (!activityName) {
    activityName = text;
    scheduleText = text;
  }

  const schedule = parseActivitySchedule(scheduleText, activityName);

  return {
    name: activityName,
    schedule: schedule
  };
}

/**
 * Generate expiration date for activities based on type and current date
 * @param {string} activityType - Type of activity (e.g., 'school', 'sports', 'music')
 * @param {Date} currentDate - Current date (defaults to now)
 * @returns {string|null} ISO date string or null for no expiration
 */
function generateActivityExpiration(activityType, currentDate = new Date()) {
  const now = currentDate;
  const currentMonth = now.getMonth(); // 0-based (0 = January)

  // School year activities (September to June)
  const schoolYearTypes = ['school', 'homework', 'class', 'lesson', 'tutoring'];
  const sportsSeasonTypes = ['soccer', 'football', 'basketball', 'baseball', 'tennis', 'swimming'];
  const musicTypes = ['piano', 'guitar', 'violin', 'music', 'band', 'orchestra', 'choir'];

  if (schoolYearTypes.some(type => activityType.toLowerCase().includes(type))) {
    // Expires end of school year (June 30th)
    const schoolYearEnd = new Date(now.getFullYear(), 5, 30); // June 30th
    if (currentMonth >= 6) {
      // If we're past June, set for next year
      schoolYearEnd.setFullYear(now.getFullYear() + 1);
    }
    return schoolYearEnd.toISOString();
  }

  if (sportsSeasonTypes.some(type => activityType.toLowerCase().includes(type))) {
    // Sports seasons vary, default to 6 months
    const seasonEnd = new Date(now);
    seasonEnd.setMonth(now.getMonth() + 6);
    return seasonEnd.toISOString();
  }

  if (musicTypes.some(type => activityType.toLowerCase().includes(type))) {
    // Music lessons often run year-round but review annually
    const annualReview = new Date(now);
    annualReview.setFullYear(now.getFullYear() + 1);
    return annualReview.toISOString();
  }

  // Default: 1 year expiration
  const defaultExpiration = new Date(now);
  defaultExpiration.setFullYear(now.getFullYear() + 1);
  return defaultExpiration.toISOString();
}

/**
 * Convert suggestion data to structured activity format
 * @param {Object} suggestionData - Raw suggestion data from profile_suggestions
 * @returns {Object} Structured activity data
 */
function convertSuggestionToActivity(suggestionData) {
  const { member_name, activity, activity_type, schedule } = suggestionData;

  if (!activity && !activity_type) {
    return null;
  }

  const activityName = activity || activity_type || 'Unknown Activity';
  const scheduleText = schedule || '';

  // Parse the activity and schedule
  const parsed = parseActivityFromText(`${activityName} ${scheduleText}`);

  // Generate expiration date
  const expiresAt = generateActivityExpiration(activityName);

  return {
    name: parsed.name,
    schedule: {
      days: parsed.schedule.days,
      time: parsed.schedule.time,
      location: parsed.schedule.location,
      raw_text: scheduleText
    },
    expires_at: expiresAt,
    member_name: member_name
  };
}

/**
 * Merge activity data into family member profile
 * @param {Object} memberProfile - Existing family member profile
 * @param {Object} activityData - New activity data to merge
 * @returns {Object} Updated member profile
 */
function mergeActivityIntoProfile(memberProfile, activityData) {
  if (!memberProfile || !activityData) {
    return memberProfile;
  }

  // Initialize activities array if it doesn't exist
  if (!memberProfile.activities) {
    memberProfile.activities = [];
  }

  // Check if activity already exists (by name)
  const existingIndex = memberProfile.activities.findIndex(
    existing => existing.name.toLowerCase() === activityData.name.toLowerCase()
  );

  if (existingIndex >= 0) {
    // Update existing activity
    memberProfile.activities[existingIndex] = {
      ...memberProfile.activities[existingIndex],
      ...activityData
    };
  } else {
    // Add new activity
    memberProfile.activities.push(activityData);
  }

  return memberProfile;
}

/**
 * Convert full birthday date to privacy-safe month-day format
 * @param {string} birthday - Full date string (e.g., "2013-04-15" or "April 15, 2013")
 * @returns {string} Month-day format (e.g., "--04-15") or original if can't parse
 */
function convertBirthdayToMonthDay(birthday) {
  if (!birthday || typeof birthday !== 'string') {
    return birthday;
  }

  try {
    const date = new Date(birthday);
    if (isNaN(date.getTime())) {
      return birthday;
    }

    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `--${month}-${day}`;
  } catch (error) {
    console.warn('Failed to parse birthday:', birthday, error);
    return birthday;
  }
}

/**
 * Normalize grade text to structured format
 * @param {string} gradeText - Raw grade text (e.g., "3rd grade", "grade 3", "third grade", "Grade 3")
 * @returns {string} Normalized grade format (e.g., "3rd", "Kindergarten", "Preschool") or original if can't parse
 */
function normalizeGradeText(gradeText) {
  if (!gradeText || typeof gradeText !== 'string') {
    return gradeText;
  }

  const text = gradeText.toLowerCase().trim();

  // Handle special cases first
  if (text.includes('preschool') || text.includes('pre-school') || text.includes('pre school')) {
    return 'Preschool';
  }

  if (text.includes('kindergarten') || text.includes('k') || text === 'k' || text === 'kg') {
    return 'Kindergarten';
  }

  // Grade patterns for 1st-12th
  const gradePatterns = [
    // "3rd grade", "grade 3", "3rd", etc.
    { pattern: /(?:grade\s+)?(\d+)(?:st|nd|rd|th)?(?:\s+grade)?/i, transform: (num) => {
      const n = parseInt(num);
      if (n >= 1 && n <= 12) {
        const suffix = n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
        return `${n}${suffix}`;
      }
      return null;
    }},
    // Written numbers: "third grade", "first grade"
    { pattern: /(?:grade\s+)?(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)(?:\s+grade)?/i, transform: (word) => {
      const wordToNum = {
        'first': '1st', 'second': '2nd', 'third': '3rd', 'fourth': '4th',
        'fifth': '5th', 'sixth': '6th', 'seventh': '7th', 'eighth': '8th',
        'ninth': '9th', 'tenth': '10th', 'eleventh': '11th', 'twelfth': '12th'
      };
      return wordToNum[word.toLowerCase()] || null;
    }}
  ];

  for (const { pattern, transform } of gradePatterns) {
    const match = text.match(pattern);
    if (match) {
      const result = transform(match[1]);
      if (result) {
        return result;
      }
    }
  }

  // If no pattern matched, return original
  return gradeText;
}

/**
 * Transform activity from profile format to UI form format
 * @param {Object} activityData - Activity data from profile
 * @returns {Object} Activity data formatted for UI form
 */
function transformActivityForUIForm(activityData) {
  if (!activityData) return null;

  const {
    name = '',
    schedule = {},
    expires_at = null,
    type: existingType = null
  } = activityData;

  // Map lowercase days to capitalized format for UI
  const standardizeDays = (days = []) => {
    const dayMapping = {
      'monday': 'Monday',
      'tuesday': 'Tuesday',
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    };
    return days.map(day => dayMapping[day.toLowerCase()] || day);
  };

  // Infer activity type from name if not provided
  const inferActivityType = (activityName, existingType) => {
    if (existingType) return existingType;

    const nameLC = activityName.toLowerCase();
    if (nameLC.includes('soccer') || nameLC.includes('football') || nameLC.includes('basketball') ||
        nameLC.includes('tennis') || nameLC.includes('baseball') || nameLC.includes('sport')) {
      return 'sport';
    }
    if (nameLC.includes('piano') || nameLC.includes('guitar') || nameLC.includes('music') ||
        nameLC.includes('art') || nameLC.includes('draw') || nameLC.includes('paint')) {
      return 'creative';
    }
    if (nameLC.includes('tutor') || nameLC.includes('class') || nameLC.includes('lesson') ||
        nameLC.includes('school') || nameLC.includes('homework')) {
      return 'educational';
    }
    if (nameLC.includes('church') || nameLC.includes('sunday school') || nameLC.includes('bible')) {
      return 'faith';
    }
    if (nameLC.includes('gym') || nameLC.includes('workout') || nameLC.includes('fitness')) {
      return 'fitness';
    }
    return 'other';
  };

  // Infer frequency from schedule data
  const inferFrequency = (scheduleData) => {
    const { days = [], raw_text = '' } = scheduleData;
    const text = raw_text.toLowerCase();

    if (text.includes('daily') || text.includes('every day')) {
      return 'Daily';
    }
    if (text.includes('biweekly') || text.includes('every other week')) {
      return 'Bi-weekly';
    }
    if (text.includes('monthly')) {
      return 'Monthly';
    }
    if (days.length === 1) {
      return 'Weekly';
    }
    if (days.length > 1) {
      return 'Weekly'; // Multiple days per week still counts as weekly frequency
    }
    return 'Weekly'; // Default fallback
  };

  // Convert expires_at to end_date format (YYYY-MM-DD)
  const formatEndDate = (expiresAt) => {
    if (!expiresAt) return '';
    try {
      const date = new Date(expiresAt);
      return date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
    } catch (error) {
      console.warn('Error formatting expires_at date:', error);
      return '';
    }
  };

  // Return standardized format for UI form
  return {
    name: name,
    type: inferActivityType(name, existingType),
    frequency: inferFrequency(schedule),
    days: standardizeDays(schedule.days || []),
    end_date: formatEndDate(expires_at)
  };
}

export {
  parseActivitySchedule,
  parseActivityFromText,
  generateActivityExpiration,
  convertSuggestionToActivity,
  mergeActivityIntoProfile,
  convertBirthdayToMonthDay,
  normalizeGradeText,
  transformActivityForUIForm
};