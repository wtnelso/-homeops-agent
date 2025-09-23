/**
 * Intelligent Preference Type Mapper
 *
 * Maps natural language phrases from emails to standardized preference types
 * used in the frontend dropdown.
 */

/**
 * Mapping patterns for preference types
 */
const PREFERENCE_TYPE_PATTERNS = {
  dietary_restrictions: [
    // Diet types
    /\b(vegetarian|vegan|paleo|keto|gluten.?free|dairy.?free|lactose.?free)\b/i,
    /\b(kosher|halal|organic|raw|whole30)\b/i,
    // Food restrictions
    /\b(no\s+meat|no\s+dairy|no\s+gluten|no\s+sugar|no\s+carbs)\b/i,
    /\b(avoid\s+\w+|can't\s+eat|won't\s+eat|doesn't\s+eat)\b/i,
    /\b(diet|dietary|nutrition|eating\s+habits)\b/i,
    // Common phrases
    /\b(special\s+diet|food\s+preference|meal\s+restriction)\b/i
  ],

  allergies: [
    /\b(allerg(y|ic)|reaction|intoleran(ce|t))\b/i,
    /\b(peanut|shellfish|tree\s+nut|dairy|egg|soy|wheat|fish)\s+(allerg|reaction)/i,
    /\b(allergic\s+to|can't\s+have|severe\s+reaction)\b/i,
    /\b(epipen|inhaler|antihistamine)\b/i
  ],

  bedtime: [
    /\b(bedtime|sleep\s+schedule|goes\s+to\s+bed|lights\s+out)\b/i,
    /\b(sleep\s+at|bed\s+by|asleep\s+by|sleeps\s+from)\b/i,
    /\b(\d{1,2}:\d{2}\s*(pm|am)|\d{1,2}\s*(pm|am)).*bed/i,
    /\b(nap\s+time|rest\s+time|quiet\s+time)\b/i,
    /\b(early\s+sleeper|night\s+owl|morning\s+person)\b/i
  ],

  screen_time: [
    /\b(screen\s+time|ipad\s+time|tablet\s+time|phone\s+time)\b/i,
    /\b(tv\s+time|television|computer\s+time|video\s+games)\b/i,
    /\b(no\s+screens|limit\s+screens|screen\s+limit)\b/i,
    /\b(youtube|netflix|games|apps)\s+(limit|time|restriction)/i,
    /\b(device\s+time|electronic\s+time|digital\s+time)\b/i
  ],

  communication_preference: [
    /\b(text\s+me|call\s+me|email\s+me|contact\s+me)\b/i,
    /\b(prefer\s+(text|call|email)|best\s+way\s+to\s+reach)\b/i,
    /\b(communication|contact\s+preference|reach\s+out)\b/i,
    /\b(don't\s+call|no\s+calls|text\s+only|email\s+only)\b/i,
    /\b(emergency\s+contact|urgent\s+matter)\b/i
  ],

  transportation: [
    /\b(pickup|drop.?off|carpool|ride|drive)\b/i,
    /\b(bus|walk|bike|scooter|skateboard)\b/i,
    /\b(transportation|getting\s+there|how\s+to\s+get)\b/i,
    /\b(after\s+school|before\s+school|practice\s+pickup)\b/i
  ],

  homework_schedule: [
    /\b(homework|study\s+time|assignment)\b/i,
    /\b(reading\s+time|math\s+time|practice\s+time)\b/i,
    /\b(after\s+school\s+routine|study\s+schedule)\b/i,
    /\b(tutoring|help\s+with\s+homework)\b/i
  ],

  chore_schedule: [
    /\b(chores|cleaning|helping\s+out|responsibilities)\b/i,
    /\b(allowance|money\s+for|earn\s+money)\b/i,
    /\b(dishes|laundry|room\s+clean|organize)\b/i,
    /\b(weekly\s+tasks|daily\s+tasks|family\s+duties)\b/i
  ],

  extracurricular: [
    /\b(practice|rehearsal|lesson|class|activity)\b/i,
    /\b(sports|music|dance|art|drama|theater)\b/i,
    /\b(soccer|basketball|piano|guitar|swimming)\b/i,
    /\b(club|team|group|program|camp)\b/i,
    /\b(after.?school\s+activity|weekend\s+activity)\b/i
  ]
};

/**
 * Maps natural language text to a standardized preference type
 * @param {string} text - The text to analyze (could be from email content or AI extraction)
 * @param {string} context - Additional context (optional)
 * @returns {string} - Mapped preference type or 'other' if no match
 */
function mapPreferenceType(text, context = '') {
  if (!text || typeof text !== 'string') {
    return 'other';
  }

  // Combine text and context for analysis
  const fullText = `${text} ${context}`.toLowerCase();

  // Check each preference type's patterns
  for (const [preferenceType, patterns] of Object.entries(PREFERENCE_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(fullText)) {
        return preferenceType;
      }
    }
  }

  // Fallback: check for exact matches in common terms
  const exactMatches = {
    'dietary': 'dietary_restrictions',
    'diet': 'dietary_restrictions',
    'food': 'dietary_restrictions',
    'allergy': 'allergies',
    'sleep': 'bedtime',
    'bed': 'bedtime',
    'screen': 'screen_time',
    'technology': 'screen_time',
    'contact': 'communication_preference',
    'transport': 'transportation',
    'homework': 'homework_schedule',
    'chore': 'chore_schedule',
    'activity': 'extracurricular'
  };

  for (const [keyword, preferenceType] of Object.entries(exactMatches)) {
    if (fullText.includes(keyword)) {
      return preferenceType;
    }
  }

  return 'other';
}

/**
 * Get smart expiration default for preference type
 * @param {string} preferenceType - The mapped preference type
 * @returns {string} - Default expiration period
 */
function getPreferenceExpiration(preferenceType) {
  const expirationMap = {
    // Permanent preferences - unlikely to change
    'dietary_restrictions': 'never',
    'allergies': 'never',

    // Semi-permanent - might change but usually last years
    'communication_preference': 'never',

    // School/schedule related - expire at school year end
    'bedtime': 'school-year',
    'homework_schedule': 'school-year',
    'chore_schedule': 'school-year',
    'extracurricular': 'school-year',

    // Technology/behavior - review annually
    'screen_time': '1-year',
    'transportation': '1-year',

    // Default for unknown types
    'other': '1-year'
  };

  return expirationMap[preferenceType] || '1-year';
}

/**
 * Enhanced preference mapping that also considers the preference value
 * @param {string} preferenceText - The raw preference text
 * @param {string} preferenceValue - The specific value/content
 * @param {string} emailSubject - Email subject for additional context
 * @returns {Object} - { type: string, confidence: number, expiration: string }
 */
function enhancedMapPreferenceType(preferenceText, preferenceValue, emailSubject = '') {
  const combinedText = `${preferenceText} ${preferenceValue} ${emailSubject}`;
  const mappedType = mapPreferenceType(combinedText);

  // Calculate confidence based on pattern matching
  let confidence = 0.5; // Default confidence

  if (mappedType !== 'other') {
    const patterns = PREFERENCE_TYPE_PATTERNS[mappedType];
    const matchCount = patterns.filter(pattern => pattern.test(combinedText)).length;
    confidence = Math.min(0.9, 0.6 + (matchCount * 0.1));
  }

  return {
    type: mappedType,
    confidence: confidence,
    expiration: getPreferenceExpiration(mappedType)
  };
}

/**
 * Get display name for preference type (matches frontend dropdown)
 * @param {string} type - The preference type key
 * @returns {string} - Human-readable display name
 */
function getPreferenceTypeDisplay(type) {
  const displayMap = {
    'dietary_restrictions': 'Dietary Restrictions',
    'bedtime': 'Bedtime Schedule',
    'screen_time': 'Screen Time Limits',
    'communication_preference': 'Communication Preference',
    'allergies': 'Allergies',
    'transportation': 'Transportation',
    'homework_schedule': 'Homework Schedule',
    'chore_schedule': 'Chore Schedule',
    'extracurricular': 'Extracurricular Activities',
    'other': 'Other'
  };

  return displayMap[type] || 'Other';
}

export {
  mapPreferenceType,
  enhancedMapPreferenceType,
  getPreferenceTypeDisplay,
  getPreferenceExpiration,
  PREFERENCE_TYPE_PATTERNS
};