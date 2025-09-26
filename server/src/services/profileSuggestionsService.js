/**
 * Profile Suggestions Service
 *
 * Manages pending profile enhancement suggestions from email analysis.
 * Handles the lifecycle of suggestions from creation to user approval/rejection.
 */

import { neon } from '@neondatabase/serverless';
import { randomUUID, createHash } from 'crypto';
import { accountProfileService } from './accountProfileService.js';
import { getPreferenceExpiration } from '../utils/preferenceTypeMapper.js';
import { detectActivityType, validateActivityType } from '../config/activityTypes.js';
import { convertSuggestionToActivity, mergeActivityIntoProfile, parseActivitySchedule, generateActivityExpiration } from '../utils/scheduleParser.js';
import { detectFrequency } from '../config/frequencies.js';

export class ProfileSuggestionsService {
  constructor() {
    this.sql = neon(process.env.NEON_DATABASE_URL);
  }

  /**
   * Generate content hash for duplicate prevention
   * @param {Object} suggestion - Suggestion data
   * @returns {string} SHA-256 hash of suggestion content
   */
  generateContentHash(suggestion) {
    const key = `${suggestion.suggestionType}-${suggestion.suggestedData.member_name || ''}-${JSON.stringify(suggestion.suggestedData)}`;
    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Detect activity type from suggestion data
   * @param {Object} suggestedData - The suggested data object
   * @param {string} emailSubject - Email subject for context
   * @returns {string} Detected activity type
   */
  detectActivityType(suggestedData, emailSubject = '') {
    if (!suggestedData.activity) {
      return null; // No activity field present
    }

    const activityName = suggestedData.activity || '';
    const activityText = suggestedData.text || '';
    const subject = emailSubject || '';

    // Combine all text for analysis
    const allText = `${subject} ${activityName} ${activityText}`;

    return detectActivityType(allText);
  }

  /**
   * Check if suggestion content was recently rejected
   * @param {string} accountId - Account ID
   * @param {string} contentHash - Content hash to check
   * @returns {Promise<boolean>} True if recently rejected
   */
  async isRecentlyRejected(accountId, contentHash) {
    try {
      const result = await this.sql`
        SELECT id FROM profile_suggestions
        WHERE account_id = ${accountId}
        AND content_hash = ${contentHash}
        AND status = 'rejected'
        AND rejected_at > NOW() - INTERVAL '30 days'
        LIMIT 1
      `;
      return result.length > 0;
    } catch (error) {
      console.error('❌ Error checking rejection history:', error);
      return false;
    }
  }

  /**
   * Fuzzy match name against existing family members
   * @param {string} suggestedName - Name from suggestion
   * @param {Array} existingMembers - Current family members
   * @returns {Object} Match result with confidence and member
   */
  fuzzyNameMatch(suggestedName, existingMembers) {
    if (!suggestedName || !existingMembers || existingMembers.length === 0) {
      return { match: false, confidence: 0, member: null };
    }

    const suggested = suggestedName.toLowerCase().trim();

    for (const member of existingMembers) {
      if (!member.name) continue;

      const existing = member.name.toLowerCase().trim();

      // Exact match
      if (suggested === existing) {
        return { match: true, confidence: 1.0, member };
      }

      // Partial match (first/last name components)
      const suggestedParts = suggested.split(' ').filter(part => part.length > 2);
      const existingParts = existing.split(' ').filter(part => part.length > 2);

      // Check if any significant name parts match
      for (const sPart of suggestedParts) {
        for (const ePart of existingParts) {
          if (sPart === ePart) {
            return { match: true, confidence: 0.7, member };
          }
        }
      }
    }

    return { match: false, confidence: 0, member: null };
  }

  /**
   * Check age proximity for additional confidence
   * @param {number} suggestedAge - Age from suggestion
   * @param {Object} member - Existing member to compare
   * @returns {number} Confidence score (0-1)
   */
  ageProximityMatch(suggestedAge, member) {
    if (!suggestedAge || !member.age) return 0;

    const ageDiff = Math.abs(suggestedAge - member.age);
    if (ageDiff <= 1) return 0.8;
    if (ageDiff <= 2) return 0.5;
    return 0;
  }

  /**
   * Categorize suggestion based on existing family data
   * @param {Object} suggestion - Suggestion data
   * @param {Array} existingMembers - Current family members
   * @returns {Object} Category with badge info
   */
  categorizeSuggestion(suggestion, existingMembers) {
    // Contact suggestions are always categorized as new contacts
    if (suggestion.suggestionType === 'contact_add') {
      return {
        category: 'new_contact',
        badge: 'New Contact',
        badgeColor: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700'
      };
    }

    // If no family members exist, it's definitely a new family member
    if (!existingMembers || existingMembers.length === 0) {
      return {
        category: 'new_person',
        badge: 'New Family Member',
        badgeColor: 'blue',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700'
      };
    }

    // For family_info suggestions, check name matching
    if (suggestion.suggestionType === 'family_info' && suggestion.suggestedData.member_name) {
      const nameMatch = this.fuzzyNameMatch(suggestion.suggestedData.member_name, existingMembers);

      // Strong match - likely an update to existing member
      if (nameMatch.match && nameMatch.confidence > 0.6) {
        // Additional age check if available
        const ageConfidence = suggestion.suggestedData.age ?
          this.ageProximityMatch(suggestion.suggestedData.age, nameMatch.member) : 0;

        if (ageConfidence > 0.5 || nameMatch.confidence === 1.0) {
          return {
            category: 'update_info',
            badge: 'Update Info',
            badgeColor: 'orange',
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-700'
          };
        }
      }

      // Weak match - might be duplicate or similar name
      if (nameMatch.confidence > 0.3) {
        return {
          category: 'possible_duplicate',
          badge: 'Possible Duplicate',
          badgeColor: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-700'
        };
      }
    }

    // Default to new family member for family_info suggestions
    return {
      category: 'new_person',
      badge: 'New Family Member',
      badgeColor: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700'
    };
  }

  /**
   * Create a new profile suggestion
   * @param {Object} suggestion - Suggestion data
   * @returns {Promise<Object>} Creation result with suggestion ID
   */
  async createSuggestion({
    accountId,
    suggestionType,
    suggestedData,
    confidenceScore,
    sourceEmailId = null,
    sourceEmailSubject = null,
    sourceEmailDate = null,
    reasoning = null
  }) {
    try {
      console.log(`📝 Creating profile suggestion for account ${accountId}: ${suggestionType}`);

      // Generate content hash for duplicate prevention
      const contentHash = this.generateContentHash({ suggestionType, suggestedData });

      // Check if this exact suggestion was recently rejected
      const isRejected = await this.isRecentlyRejected(accountId, contentHash);
      if (isRejected) {
        console.log(`⏭️ Skipping duplicate suggestion (recently rejected): ${contentHash.substring(0, 8)}...`);
        return {
          success: false,
          error: 'Suggestion recently rejected',
          skipped: true
        };
      }

      // Get existing family members for categorization
      let existingMembers = [];
      try {
        const profileResult = await accountProfileService.getProfile(accountId);
        if (profileResult.success && profileResult.profile?.members) {
          existingMembers = profileResult.profile.members;
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch existing members for categorization:', error);
      }

      // Categorize the suggestion
      const category = this.categorizeSuggestion({ suggestionType, suggestedData }, existingMembers);

      // Validate preference_type for preference_update suggestions
      if (suggestionType === 'preference_update' && suggestedData.preference_type) {
        const validPreferenceTypes = [
          'emergency_contact', 'dietary_restrictions', 'allergies', 'communication_preference',
          'bedtime', 'screen_time', 'transportation', 'homework_schedule',
          'chore_schedule', 'extracurricular', 'other'
        ];
        if (!validPreferenceTypes.includes(suggestedData.preference_type)) {
          console.log(`🔧 Invalid preference_type "${suggestedData.preference_type}" - defaulting to "other"`);
          suggestedData.preference_type = 'other';
        }
      }

      // Detect activity type for activity-related suggestions
      const activityType = this.detectActivityType(suggestedData, sourceEmailSubject);

      const result = await this.sql`
        INSERT INTO profile_suggestions (
          account_id,
          suggestion_type,
          suggested_data,
          confidence_score,
          source_email_id,
          source_email_subject,
          source_email_date,
          reasoning,
          content_hash,
          suggestion_category,
          activity_type
        ) VALUES (
          ${accountId},
          ${suggestionType},
          ${JSON.stringify(suggestedData)},
          ${confidenceScore},
          ${sourceEmailId},
          ${sourceEmailSubject},
          ${sourceEmailDate},
          ${reasoning},
          ${contentHash},
          ${category.category},
          ${activityType}
        )
        RETURNING id, created_at
      `;

      const suggestion = result[0];
      console.log(`✅ Created suggestion ${suggestion.id} (${category.category}): ${category.badge}`);

      return {
        success: true,
        suggestion_id: suggestion.id,
        created_at: suggestion.created_at,
        category: category.category,
        badge_info: category
      };
    } catch (error) {
      console.error('❌ Failed to create profile suggestion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending suggestions for an account
   * @param {string} accountId - Account identifier
   * @param {Object} options - Query options
   * @returns {Promise<Object>} List of pending suggestions
   */
  async getPendingSuggestions(accountId, options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        suggestionType = null,
        minConfidence = 0.0
      } = options;

      console.log(`📋 Getting pending suggestions for account ${accountId}`);

      let query = this.sql`
        SELECT
          id,
          suggestion_type,
          suggested_data,
          confidence_score,
          source_email_subject,
          source_email_date,
          reasoning,
          suggestion_category,
          activity_type,
          created_at
        FROM profile_suggestions
        WHERE account_id = ${accountId}
        AND status = 'pending'
        AND confidence_score >= ${minConfidence}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;

      if (suggestionType) {
        query = this.sql`
          SELECT
            id,
            suggestion_type,
            suggested_data,
            confidence_score,
            source_email_subject,
            source_email_date,
            reasoning,
            suggestion_category,
            activity_type,
            created_at
          FROM profile_suggestions
          WHERE account_id = ${accountId}
          AND status = 'pending'
          AND suggestion_type = ${suggestionType}
          AND confidence_score >= ${minConfidence}
        `;
      }

      const suggestions = await query.then(results =>
        results
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(offset, offset + limit)
      );

      console.log(`📊 Found ${suggestions.length} pending suggestions`);

      // Parse JSON data for each suggestion
      const formattedSuggestions = suggestions.map(suggestion => ({
        ...suggestion,
        suggested_data: typeof suggestion.suggested_data === 'string'
          ? JSON.parse(suggestion.suggested_data)
          : suggestion.suggested_data
      }));

      return {
        success: true,
        suggestions: formattedSuggestions,
        total: suggestions.length
      };
    } catch (error) {
      console.error('❌ Failed to get pending suggestions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Map raw suggestion data to proper profile schema format
   * @param {string} suggestionType - Type of suggestion
   * @param {Object} suggestedData - Raw suggestion data
   * @param {Object} existingProfile - Current profile data for context
   * @returns {Object} Profile update in correct schema format
   */
  mapSuggestionToProfileData(suggestionType, suggestedData, existingProfile = null, selectedMemberId = null) {
    console.log(`🗂️ Mapping ${suggestionType} suggestion to profile schema`);

    // Initialize profile update with existing data to ensure proper merging
    const profileUpdate = {
      members: existingProfile?.members || [],
      contacts: {
        schools: existingProfile?.contacts?.schools || [],
        services: existingProfile?.contacts?.services || [],
        healthcare: existingProfile?.contacts?.healthcare || []
      },
      activities: existingProfile?.activities || [],
      metadata: existingProfile?.metadata || {
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        completeness_score: 0.0
      },
      schedule: existingProfile?.schedule || ''
    };

    // Update metadata
    profileUpdate.metadata.updated_at = new Date().toISOString();
    profileUpdate.metadata.last_ai_update = new Date().toISOString();

    switch (suggestionType) {
      case 'family_info':
        this.handleFamilyInfoUpdate(suggestedData, profileUpdate, selectedMemberId);
        break;

      case 'contact_add':
        this.handleContactAddUpdate(suggestedData, profileUpdate);
        break;

      default:
        console.warn(`⚠️  Unknown suggestion type: ${suggestionType}`);
        break;
    }

    return profileUpdate;
  }

  /**
   * Handle family information updates with proper schema compliance
   */
  handleFamilyInfoUpdate(suggestedData, profileUpdate, selectedMemberId = null) {
    const { member_name, member_id, activity, activity_type, schedule, school, grade, birthday, age, memberType } = suggestedData;

    if (!member_name) {
      console.warn('⚠️  Family info suggestion missing member_name');
      return;
    }

    console.log(`👨‍👩‍👧‍👦 Processing family info for member: ${member_name}`);

    // Find existing member using member_id from suggestion, selectedMemberId, or fallback to matching strategies
    let existingMember = null;

    // Priority 1: Use member_id from the suggestion data (AI determined)
    if (member_id) {
      console.log(`🎯 Using AI-determined member ID: ${member_id}`);
      existingMember = profileUpdate.members.find(member => member.id === member_id);
      if (!existingMember) {
        console.warn(`⚠️  AI-determined member ID ${member_id} not found, falling back to other methods`);
      }
    }

    // Priority 2: Use selectedMemberId from user selection
    if (!existingMember && selectedMemberId) {
      console.log(`🎯 Using user-selected member ID: ${selectedMemberId}`);
      existingMember = profileUpdate.members.find(member => member.id === selectedMemberId);
      if (!existingMember) {
        console.warn(`⚠️  Selected member ID ${selectedMemberId} not found, falling back to name matching`);
      }
    }

    // Priority 3: Fallback to name matching
    if (!existingMember) {
      existingMember = this.findExistingMember(profileUpdate.members, member_name, suggestedData);
    }

    if (!existingMember) {
      // Create new member with required schema fields
      existingMember = {
        id: randomUUID(),
        name: member_name,
        type: memberType || 'child', // Use user-selected type from UI, fallback to child
        user: false,
        activities: [],
        schools: []
      };

      // Add age if provided
      if (age) {
        existingMember.age = parseInt(age);
      } else if (birthday) {
        const birthDate = new Date(birthday);
        if (!isNaN(birthDate.getTime())) {
          existingMember.age = this.calculateAge(birthDate);
        }
      }

      // Add birthday if provided
      if (birthday) {
        const birthDate = new Date(birthday);
        if (!isNaN(birthDate.getTime())) {
          existingMember.birthday = {
            day: birthDate.getDate().toString(),
            month: (birthDate.getMonth() + 1).toString()
          };
        }
      }

      profileUpdate.members.push(existingMember);
      console.log(`✨ Created new member: ${member_name} with ID ${existingMember.id}`);
    }

    // Handle school information
    if (school) {
      const schoolObj = {
        name: school,
        type: grade ? 'K-12' : 'Unknown',
        source: this.createSource()
      };

      if (grade) {
        schoolObj.grade = grade;
      }

      // Check if school already exists
      const existingSchool = existingMember.schools.find(s =>
        s.name && s.name.toLowerCase() === school.toLowerCase()
      );

      if (!existingSchool) {
        existingMember.schools.push(schoolObj);
        console.log(`🏫 Added school: ${school} to ${member_name}`);
      }
    }

    // Handle activity information in standardized flat format
    if (activity || activity_type || schedule || suggestedData.name) {
      try {
        let activityData = null;

        // Check if we have new standardized flat format from email processor
        if (suggestedData.name && (suggestedData.type || suggestedData.frequency || suggestedData.days)) {
          // New flat format - use as-is and add source when saving to account_profiles
          activityData = {
            name: suggestedData.name,
            type: suggestedData.type || detectActivityType(suggestedData.name),
            frequency: suggestedData.frequency || 'Weekly',
            days: suggestedData.days || [],
            end_date: suggestedData.end_date || '',
            source: this.createSource() // Add source when saving to profile
          };

          console.log(`🎯 Using standardized flat format for ${member_name}:`, {
            name: activityData.name,
            type: activityData.type,
            frequency: activityData.frequency,
            days: activityData.days,
            end_date: activityData.end_date
          });
        } else {
          // Legacy format - convert to flat format
          const activityName = activity || activity_type;
          if (activityName) {
            // Parse schedule if available
            const parsedSchedule = schedule ? parseActivitySchedule(schedule, activityName) : { days: [], time: null };

            // Map lowercase days to capitalized format
            const standardizeDays = (days = []) => {
              const dayMapping = {
                'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday',
                'thursday': 'Thursday', 'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
              };
              return days.map(day => dayMapping[day.toLowerCase()] || day);
            };

            // Convert expires_at to end_date format
            const formatEndDate = (expiresAt) => {
              if (!expiresAt) return '';
              try {
                return new Date(expiresAt).toISOString().split('T')[0];
              } catch (error) {
                return '';
              }
            };

            const expires_at = generateActivityExpiration(activityName);

            activityData = {
              name: activityName,
              type: detectActivityType(activityName),
              frequency: detectFrequency(`${activityName} ${schedule || ''}`),
              days: standardizeDays(parsedSchedule.days || []),
              end_date: formatEndDate(expires_at),
              source: this.createSource() // Add source when saving to profile
            };

            console.log(`🎯 Converted legacy to flat format for ${member_name}:`, {
              name: activityData.name,
              type: activityData.type,
              frequency: activityData.frequency,
              days: activityData.days,
              end_date: activityData.end_date
            });
          }
        }

        if (activityData) {
          // Check if activity already exists
          const existingActivity = existingMember.activities.find(a =>
            a.name && a.name.toLowerCase() === activityData.name.toLowerCase()
          );

          if (!existingActivity) {
            existingMember.activities.push(activityData);
            console.log(`✅ Added standardized activity: ${activityData.name} to ${member_name}`);
          } else {
            // Update existing activity with new data
            Object.assign(existingActivity, activityData);
            console.log(`✅ Updated standardized activity: ${activityData.name} for ${member_name}`);
          }
        }

      } catch (error) {
        console.error('❌ Error processing activity data:', error);
      }
    }
  }

  /**
   * Handle contact addition with proper schema compliance
   */
  handleContactAddUpdate(suggestedData, profileUpdate) {
    const { name, role, phone, email, address } = suggestedData;

    if (!name) {
      console.warn('⚠️  Contact suggestion missing name');
      return;
    }

    console.log(`📞 Processing contact: ${name} (${role || 'Unknown role'})`);

    // Create schema-compliant contact object
    const contactData = {
      name,
      role: role || '',
      email: email || '',
      phone: phone || '',
      address: address || '',
      source: this.createSource()
    };

    // Determine contact category based on role
    let category = 'services'; // default

    if (role && this.isHealthcareRole(role)) {
      category = 'healthcare';
      contactData.relationship = 'healthcare_provider';
    } else if (role && this.isSchoolRole(role)) {
      category = 'schools';
      contactData.relationship = 'school_staff';
    } else {
      category = 'services';
      contactData.relationship = 'service_provider';
    }

    // Check if contact already exists in this category
    const existingContact = profileUpdate.contacts[category].find(c =>
      c.name && c.name.toLowerCase() === name.toLowerCase()
    );

    if (!existingContact) {
      profileUpdate.contacts[category].push(contactData);
      console.log(`✅ Added ${name} to ${category} contacts`);
    } else {
      console.log(`ℹ️  Contact ${name} already exists in ${category}`);
    }
  }


  /**
   * Add recurring event from activity schedule
   */
  addRecurringEvent(profileUpdate, eventData) {
    const { name, schedule, participants } = eventData;

    // Parse schedule to extract frequency and time info
    const recurringEvent = {
      name,
      frequency: this.parseFrequency(schedule),
      participants: participants || [],
      notes: `Generated from activity: ${schedule}`
    };

    // Try to extract day and time
    const timeMatch = schedule.match(/(\w+)\s+(\d+:\d+|\d+\s*(?:am|pm))/i);
    if (timeMatch) {
      recurringEvent.day_of_week = timeMatch[1];
      recurringEvent.time = timeMatch[2];
    }

    profileUpdate.changes['activities.recurring_events'] = {
      operation: 'append',
      value: recurringEvent
    };
    profileUpdate._sources['activities.recurring_events'] = this.createAiSource();
  }

  /**
   * Helper methods
   */
  createAiSource() {
    return {
      type: 'ai_suggestion',
      timestamp: new Date().toISOString(),
      confidence: 0.9,
      extracted_by: 'profile-suggestions-service'
    };
  }

  /**
   * Create schema-compliant source object
   */
  createSource() {
    return {
      type: 'ai_suggestion',
      source_id: null,
      timestamp: new Date().toISOString(),
      confidence: 0.9,
      updated_at: new Date().toISOString(),
      original_text: null,
      email_subject: ''
    };
  }

  /**
   * Parse schedule string to extract days and frequency
   */
  parseSchedule(schedule) {
    const result = { days: [], frequency: 'Weekly' };

    if (!schedule || typeof schedule !== 'string') {
      return result;
    }

    const scheduleStr = schedule.toLowerCase();

    // Extract days
    const dayMappings = {
      'monday': 'Monday',
      'tuesday': 'Tuesday',
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday',
      'mon': 'Monday',
      'tue': 'Tuesday',
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday',
      'sun': 'Sunday'
    };

    for (const [key, value] of Object.entries(dayMappings)) {
      if (scheduleStr.includes(key)) {
        if (!result.days.includes(value)) {
          result.days.push(value);
        }
      }
    }

    // Extract frequency
    if (scheduleStr.includes('daily') || scheduleStr.includes('every day')) {
      result.frequency = 'Daily';
    } else if (scheduleStr.includes('weekly') || scheduleStr.includes('every week')) {
      result.frequency = 'Weekly';
    } else if (scheduleStr.includes('monthly') || scheduleStr.includes('every month')) {
      result.frequency = 'Monthly';
    } else if (scheduleStr.includes('biweekly') || scheduleStr.includes('every other week')) {
      result.frequency = 'Biweekly';
    }

    return result;
  }

  calculateAge(birthDate) {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  isHealthcareRole(role) {
    const healthcareTerms = ['doctor', 'pediatrician', 'dentist', 'physician', 'specialist', 'therapist'];
    return healthcareTerms.some(term => role.toLowerCase().includes(term));
  }

  isSchoolRole(role) {
    const schoolTerms = ['teacher', 'principal', 'school', 'educator', 'counselor'];
    return schoolTerms.some(term => role.toLowerCase().includes(term));
  }

  parseFrequency(schedule) {
    if (schedule.toLowerCase().includes('daily') || schedule.toLowerCase().includes('every day')) {
      return 'Daily';
    }
    if (schedule.toLowerCase().includes('weekly') || schedule.toLowerCase().includes('every week')) {
      return 'Weekly';
    }
    if (schedule.toLowerCase().includes('tuesday') || schedule.toLowerCase().includes('monday')) {
      return 'Weekly';
    }
    return 'Custom';
  }

  findChildPath(memberName) {
    // This would need the existing profile to work properly
    // For now, return null and handle in the calling function
    return null;
  }

  /**
   * Infer school type from grade information
   */
  inferSchoolType(grade) {
    if (!grade) return 'elementary';
    const gradeNum = parseInt(grade.replace(/[^\d]/g, ''));
    if (gradeNum >= 9) return 'high';
    if (gradeNum >= 6) return 'middle';
    return 'elementary';
  }


  /**
   * Approve a suggestion with user edits and apply it to the profile
   * @param {string} suggestionId - Suggestion identifier
   * @param {string} accountId - Account identifier for security
   * @param {Object} editData - User-edited suggestion data
   * @returns {Promise<Object>} Approval result
   */
  async approveSuggestionWithEdits(suggestionId, accountId, editData) {
    try {
      console.log(`✅ Approving edited suggestion ${suggestionId} for account ${accountId}`);
      console.log(`📝 Edit data:`, JSON.stringify(editData, null, 2));

      // First, get the original suggestion details
      const suggestions = await this.sql`
        SELECT * FROM profile_suggestions
        WHERE id = ${suggestionId}
        AND account_id = ${accountId}
        AND status = 'pending'
      `;

      if (suggestions.length === 0) {
        return { success: false, error: 'Suggestion not found or already processed' };
      }

      const suggestion = suggestions[0];

      // Extract edit data without control fields (but keep memberType for family member creation)
      const { saveAs, expirationDate, customExpiration, selectedMemberId, addAsType, forceAddAsNew, ...actualEditData } = editData;

      // Determine where to save the data
      if (saveAs === 'context' || saveAs === 'temporary') {
        // Save to agent memory instead of profile
        return await this.saveToAgentMemory(
          accountId,
          suggestion.suggestion_type,
          actualEditData,
          expirationDate,
          customExpiration,
          suggestionId
        );
      } else {
        // Get existing profile for context
        const existingProfileResult = await accountProfileService.getProfile(accountId);
        const existingProfile = existingProfileResult.success ? existingProfileResult.profile.data : null;

        // Save to profile with proper merging
        const mappedProfileData = this.mapSuggestionToProfileData(
          suggestion.suggestion_type,
          actualEditData,
          existingProfile,
          selectedMemberId
        );

        console.log(`🔄 Applying edited suggestion to profile: ${suggestion.suggestion_type}`);
        console.log(`📝 Mapped profile data:`, JSON.stringify(mappedProfileData, null, 2));

        const profileUpdateResult = await accountProfileService.updateProfile(
          accountId,
          mappedProfileData,
          'ai'
        );

        if (!profileUpdateResult.success) {
          console.error(`❌ Failed to apply suggestion to profile: ${profileUpdateResult.error}`);
          return {
            success: false,
            error: `Failed to apply changes to profile: ${profileUpdateResult.error}`
          };
        }

        // Update suggestion status
        await this.sql`
          UPDATE profile_suggestions
          SET
            status = 'accepted',
            reviewed_at = NOW(),
            applied_at = NOW(),
            updated_at = NOW()
          WHERE id = ${suggestionId}
        `;

        console.log(`✅ Edited suggestion ${suggestionId} approved and applied to profile`);

        return {
          success: true,
          suggestion_id: suggestionId,
          suggestion_type: suggestion.suggestion_type,
          applied_data: mappedProfileData,
          edited_data: actualEditData,
          destination: 'profile'
        };
      }
    } catch (error) {
      console.error('❌ Failed to approve edited suggestion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Save suggestion data to agent memory system with semantic keys and structured JSONB
   * @param {string} accountId - Account identifier
   * @param {string} suggestionType - Type of suggestion
   * @param {Object} editData - Edited suggestion data
   * @param {string} expirationDate - Expiration setting
   * @param {string} customExpiration - Custom expiration date if applicable
   * @param {string} suggestionId - Original suggestion ID
   * @returns {Promise<Object>} Save result
   */
  async saveToAgentMemory(accountId, suggestionType, editData, expirationDate, customExpiration, suggestionId) {
    try {
      console.log(`🔍 DEBUG AGENT MEMORY: Starting saveToAgentMemory`);
      console.log(`🔍 DEBUG AGENT MEMORY: accountId: ${accountId}`);
      console.log(`🔍 DEBUG AGENT MEMORY: suggestionType: ${suggestionType}`);
      console.log(`🔍 DEBUG AGENT MEMORY: editData:`, JSON.stringify(editData, null, 2));
      console.log(`🔍 DEBUG AGENT MEMORY: expirationDate: ${expirationDate}`);
      console.log(`🔍 DEBUG AGENT MEMORY: suggestionId: ${suggestionId}`);

      // Import AgentMemoryService and config dynamically to avoid circular imports
      console.log(`🔍 DEBUG AGENT MEMORY: Importing AgentMemoryService and config`);
      const { AgentMemoryService } = await import('./agentMemoryService.js');
      const { MEMORY_CONFIG } = await import('../config/agentMemoryConfig.js');
      console.log(`✅ DEBUG AGENT MEMORY: Successfully imported dependencies`);

      // Clean editData - remove UI-specific fields
      const cleanData = { ...editData };
      delete cleanData.saveAs;
      delete cleanData.expirationDate;
      delete cleanData.customExpiration;
      console.log(`🔍 DEBUG AGENT MEMORY: cleanData after removal:`, JSON.stringify(cleanData, null, 2));

      // Generate semantic memory key using new utilities
      console.log(`🔍 DEBUG AGENT MEMORY: Generating semantic key`);
      let memoryKey = MEMORY_CONFIG.MEMORY_KEY_UTILS.generateSemanticKey(suggestionType, cleanData, accountId);
      console.log(`🔍 DEBUG AGENT MEMORY: Generated initial memoryKey: ${memoryKey}`);

      const memoryType = MEMORY_CONFIG.MEMORY_KEY_UTILS.mapSuggestionToMemoryType(suggestionType);
      console.log(`🔍 DEBUG AGENT MEMORY: Mapped memoryType: ${memoryType}`);

      // For preferences, generate unique key with counter
      if (suggestionType === 'preference_update' && cleanData.preference_type && accountId) {
        console.log(`🔍 DEBUG AGENT MEMORY: Generating unique preference key`);
        const baseKey = `pref_${cleanData.preference_type.toLowerCase().replace(/\s+/g, '_')}_${accountId}`;
        console.log(`🔍 DEBUG AGENT MEMORY: baseKey: ${baseKey}`);
        memoryKey = await MEMORY_CONFIG.MEMORY_KEY_UTILS.generateUniquePreferenceKey(baseKey, this.sql);
        console.log(`🔍 DEBUG AGENT MEMORY: Generated unique memoryKey: ${memoryKey}`);
      }

      // Validate memory type
      if (!MEMORY_CONFIG.MEMORY_KEY_UTILS.validateMemoryType(memoryType)) {
        console.log(`❌ DEBUG AGENT MEMORY: Invalid memory type: ${memoryType}`);
        throw new Error(`Invalid memory type: ${memoryType}`);
      }
      console.log(`✅ DEBUG AGENT MEMORY: Memory type validated`);

      // Calculate expiration date
      let expiresAt = null;
      console.log(`🔍 DEBUG AGENT MEMORY: Calculating expiration date`);

      if (expirationDate !== 'never') {
        const now = new Date();

        switch (expirationDate) {
          case '1-month':
            expiresAt = new Date(now.setMonth(now.getMonth() + 1));
            break;
          case '3-months':
            expiresAt = new Date(now.setMonth(now.getMonth() + 3));
            break;
          case '6-months':
            expiresAt = new Date(now.setMonth(now.getMonth() + 6));
            break;
          case 'school-year':
            // Set to June 30th of the next year if after June, otherwise current year
            const currentYear = now.getFullYear();
            const schoolYearEnd = now.getMonth() >= 6 ? currentYear + 1 : currentYear;
            expiresAt = new Date(schoolYearEnd, 5, 30); // June 30th
            break;
          case '1-year':
            expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
            break;
          case 'custom':
            if (customExpiration) {
              expiresAt = new Date(customExpiration);
            }
            break;
        }
      }
      console.log(`🔍 DEBUG AGENT MEMORY: Calculated expiresAt: ${expiresAt}`);

      // Create structured JSONB value with context
      console.log(`🔍 DEBUG AGENT MEMORY: Creating structured value`);
      const structuredValue = MEMORY_CONFIG.MEMORY_KEY_UTILS.createStructuredValue(
        suggestionType,
        cleanData
      );
      console.log(`🔍 DEBUG AGENT MEMORY: structuredValue:`, JSON.stringify(structuredValue, null, 2));

      // Get default priority from memory type config
      const typeConfig = MEMORY_CONFIG.MEMORY_TYPES[memoryType];
      const priority = typeConfig?.defaultPriority || 2;
      console.log(`🔍 DEBUG AGENT MEMORY: priority: ${priority}`);

      // Create single, contextual memory entry
      const memoryEntry = {
        account_id: accountId,
        key: memoryKey,
        value: structuredValue, // JSONB structured data
        memory_type: memoryType,
        confidence_score: 0.9, // High confidence for user-edited data
        priority: priority,
        source_type: 'user_edited_suggestion',
        source_id: suggestionId,
        expires_at: expiresAt,
        tags: this.generateMemoryTags(suggestionType, cleanData)
      };

      console.log(`💾 Saving structured memory: ${memoryKey} (type: ${memoryType})`);
      console.log(`🔍 DEBUG AGENT MEMORY: Full memoryEntry:`, JSON.stringify(memoryEntry, null, 2));

      // Save to agent memory
      console.log(`🔍 DEBUG AGENT MEMORY: Calling AgentMemoryService.addMemory`);
      const addMemoryResult = await AgentMemoryService.addMemory(memoryEntry);
      console.log(`🔍 DEBUG AGENT MEMORY: addMemory result:`, JSON.stringify(addMemoryResult, null, 2));

      // Update suggestion status
      console.log(`🔍 DEBUG AGENT MEMORY: Updating suggestion status`);
      const updateResult = await this.sql`
        UPDATE profile_suggestions
        SET
          status = 'accepted',
          reviewed_at = NOW(),
          applied_at = NOW(),
          updated_at = NOW()
        WHERE id = ${suggestionId}
      `;
      console.log(`🔍 DEBUG AGENT MEMORY: Suggestion update result:`, updateResult);

      console.log(`✅ Suggestion ${suggestionId} saved as structured memory: ${memoryKey}`);

      const finalResult = {
        success: true,
        message: 'Suggestion saved to agent memory successfully',
        memory_key: memoryKey,
        memory_type: memoryType,
        suggestion_id: suggestionId,
        structured_value: structuredValue,
        destination: 'agent_memory',
        expires_at: expiresAt
      };

      console.log(`🔍 DEBUG AGENT MEMORY: Final result:`, JSON.stringify(finalResult, null, 2));
      return finalResult;

    } catch (error) {
      console.error('❌ Failed to save to agent memory:', error);
      console.error('❌ DEBUG AGENT MEMORY: Error stack:', error.stack);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate meaningful tags for memory entry based on content
   * @param {string} suggestionType - Type of suggestion
   * @param {Object} data - Suggestion data
   * @returns {Array} Array of tags
   */
  generateMemoryTags(suggestionType, data) {
    const tags = [suggestionType];

    // Add member-specific tags
    if (data.member_name) {
      tags.push(data.member_name.toLowerCase().replace(/\s+/g, '_'));
    }

    // Add activity-specific tags
    if (data.activity) {
      tags.push('activity');
      const activityType = detectActivityType(data.activity);
      if (activityType) tags.push(activityType);
    }

    // Add schedule-related tags
    if (data.schedule) {
      tags.push('schedule');
      if (data.schedule.toLowerCase().includes('daily')) tags.push('daily');
      if (data.schedule.toLowerCase().includes('weekly')) tags.push('weekly');
    }

    // Add school-related tags
    if (data.school || data.grade) {
      tags.push('school');
      if (data.grade) tags.push('grade_' + data.grade.toLowerCase().replace(/\s+/g, '_'));
    }

    // Add contact-specific tags
    if (data.role) {
      const category = this.categorizeContactRole(data.role);
      tags.push(category);
    }

    return tags;
  }


  /**
   * Categorize contact role for tagging
   */
  categorizeContactRole(role) {
    const roleStr = role.toLowerCase();
    if (roleStr.includes('doctor') || roleStr.includes('dentist')) {
      return 'healthcare';
    }
    if (roleStr.includes('teacher') || roleStr.includes('principal')) {
      return 'education';
    }
    if (roleStr.includes('coach')) {
      return 'sports';
    }
    return 'service';
  }

  /**
   * Map suggestion type to agent memory type (kept for backward compatibility)
   * @param {string} suggestionType - Suggestion type
   * @returns {string} Memory type
   */
  mapSuggestionTypeToMemoryType(suggestionType) {
    switch (suggestionType) {
      case 'family_info': return 'family_info';
      case 'contact_add': return 'contacts';
      case 'preference_update': return 'preferences';
      default: return 'preferences';
    }
  }

  /**
   * Approve a suggestion and apply it to the profile
   * @param {string} suggestionId - Suggestion identifier
   * @param {string} accountId - Account identifier for security
   * @returns {Promise<Object>} Approval result
   */
  async approveSuggestion(suggestionId, accountId) {
    try {
      console.log(`✅ Approving suggestion ${suggestionId} for account ${accountId}`);

      // First, get the suggestion details
      const suggestions = await this.sql`
        SELECT * FROM profile_suggestions
        WHERE id = ${suggestionId}
        AND account_id = ${accountId}
        AND status = 'pending'
      `;

      if (suggestions.length === 0) {
        return { success: false, error: 'Suggestion not found or already processed' };
      }

      const suggestion = suggestions[0];
      const suggestedData = typeof suggestion.suggested_data === 'string'
        ? JSON.parse(suggestion.suggested_data)
        : suggestion.suggested_data;

      // Get existing profile for context
      const existingProfileResult = await accountProfileService.getProfile(accountId);
      const existingProfile = existingProfileResult.success ? existingProfileResult.profile.data : null;

      // Map suggestion data to proper profile format
      const mappedProfileData = this.mapSuggestionToProfileData(
        suggestion.suggestion_type,
        suggestedData,
        existingProfile
      );

      // Apply the properly formatted suggestion to the account profile
      console.log(`🔄 Applying suggestion to profile: ${suggestion.suggestion_type}`);
      console.log(`📝 Mapped profile data:`, JSON.stringify(mappedProfileData, null, 2));

      const profileUpdateResult = await accountProfileService.updateProfile(
        accountId,
        mappedProfileData,
        'ai'
      );

      if (!profileUpdateResult.success) {
        console.error(`❌ Failed to apply suggestion to profile: ${profileUpdateResult.error}`);
        return {
          success: false,
          error: `Failed to apply changes to profile: ${profileUpdateResult.error}`
        };
      }

      // Update suggestion status
      await this.sql`
        UPDATE profile_suggestions
        SET
          status = 'accepted',
          reviewed_at = NOW(),
          applied_at = NOW(),
          updated_at = NOW()
        WHERE id = ${suggestionId}
      `;

      console.log(`✅ Suggestion ${suggestionId} approved and applied to profile`);

      return {
        success: true,
        suggestion_id: suggestionId,
        suggestion_type: suggestion.suggestion_type,
        applied_data: mappedProfileData,
        original_suggestion_data: suggestedData,
        profile_update: {
          version: profileUpdateResult.profile.metadata.version,
          completeness_score: profileUpdateResult.profile.metadata.completeness_score
        }
      };
    } catch (error) {
      console.error('❌ Failed to approve suggestion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a suggestion
   * @param {string} suggestionId - Suggestion identifier
   * @param {string} accountId - Account identifier for security
   * @returns {Promise<Object>} Rejection result
   */
  async rejectSuggestion(suggestionId, accountId) {
    try {
      console.log(`❌ Rejecting suggestion ${suggestionId} for account ${accountId}`);

      const result = await this.sql`
        UPDATE profile_suggestions
        SET
          status = 'rejected',
          rejection_reason = 'user_rejected',
          rejected_at = NOW(),
          reviewed_at = NOW(),
          updated_at = NOW()
        WHERE id = ${suggestionId}
        AND account_id = ${accountId}
        AND status = 'pending'
        RETURNING suggestion_type
      `;

      if (result.length === 0) {
        return { success: false, error: 'Suggestion not found or already processed' };
      }

      console.log(`✅ Suggestion ${suggestionId} rejected`);

      return {
        success: true,
        suggestion_id: suggestionId,
        suggestion_type: result[0].suggestion_type
      };
    } catch (error) {
      console.error('❌ Failed to reject suggestion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk approve multiple suggestions
   * @param {string[]} suggestionIds - Array of suggestion identifiers
   * @param {string} accountId - Account identifier for security
   * @returns {Promise<Object>} Bulk approval result
   */
  async bulkApproveSuggestions(suggestionIds, accountId) {
    try {
      console.log(`✅ Bulk approving ${suggestionIds.length} suggestions for account ${accountId}`);

      let approvedCount = 0;
      let failedCount = 0;
      const errors = [];

      for (const suggestionId of suggestionIds) {
        const result = await this.approveSuggestion(suggestionId, accountId);
        if (result.success) {
          approvedCount++;
        } else {
          failedCount++;
          errors.push({
            suggestion_id: suggestionId,
            error: result.error
          });
        }
      }

      console.log(`✅ Bulk approval complete: ${approvedCount} approved, ${failedCount} failed`);

      return {
        success: true,
        approved_count: approvedCount,
        failed_count: failedCount,
        errors: errors
      };
    } catch (error) {
      console.error('❌ Failed to bulk approve suggestions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Bulk reject multiple suggestions
   * @param {string[]} suggestionIds - Array of suggestion identifiers
   * @param {string} accountId - Account identifier for security
   * @returns {Promise<Object>} Bulk rejection result
   */
  async bulkRejectSuggestions(suggestionIds, accountId) {
    try {
      console.log(`❌ Bulk rejecting ${suggestionIds.length} suggestions for account ${accountId}`);

      let rejectedCount = 0;
      let failedCount = 0;
      const errors = [];

      for (const suggestionId of suggestionIds) {
        const result = await this.rejectSuggestion(suggestionId, accountId);
        if (result.success) {
          rejectedCount++;
        } else {
          failedCount++;
          errors.push({
            suggestion_id: suggestionId,
            error: result.error
          });
        }
      }

      console.log(`✅ Bulk rejection complete: ${rejectedCount} rejected, ${failedCount} failed`);

      return {
        success: true,
        rejected_count: rejectedCount,
        failed_count: failedCount,
        errors: errors
      };
    } catch (error) {
      console.error('❌ Failed to bulk reject suggestions:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find existing member by name with fuzzy matching
   * @param {Array} members - Array of existing members
   * @param {string} memberName - Name to search for
   * @param {Object} suggestedData - Additional data for context matching
   * @returns {Object|null} Matching member or null
   */
  findExistingMember(members, memberName, suggestedData = {}) {
    if (!members || !memberName) return null;

    const normalizedName = memberName.toLowerCase().trim();

    // Exact name match (case insensitive)
    let match = members.find(member =>
      member.name && member.name.toLowerCase().trim() === normalizedName
    );

    if (match) {
      console.log(`🎯 Found exact name match for: ${memberName}`);
      return match;
    }

    // Partial name match (first name only)
    const firstName = normalizedName.split(' ')[0];
    match = members.find(member => {
      if (!member.name) return false;
      const memberFirstName = member.name.toLowerCase().trim().split(' ')[0];
      return memberFirstName === firstName;
    });

    if (match) {
      console.log(`🎯 Found partial name match for: ${memberName} -> ${match.name}`);
      return match;
    }

    // Age-based matching for additional context
    if (suggestedData.age) {
      match = members.find(member => {
        if (!member.age || !member.name) return false;
        const memberFirstName = member.name.toLowerCase().trim().split(' ')[0];
        return memberFirstName === firstName && Math.abs(member.age - suggestedData.age) <= 1;
      });

      if (match) {
        console.log(`🎯 Found age-based match for: ${memberName} -> ${match.name} (age ${match.age})`);
        return match;
      }
    }

    console.log(`❌ No existing member found for: ${memberName}`);
    return null;
  }

}

// Export singleton instance
export const profileSuggestionsService = new ProfileSuggestionsService();