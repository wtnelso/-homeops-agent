/**
 * Account Profile Service
 *
 * Manages unified account profiles storing structured family information,
 * preferences, and context for AI analysis. Replaces the scattered agent memory system.
 *
 * Features:
 * - CRUD operations for account profiles
 * - AI-powered profile updates from email analysis
 * - Profile completeness scoring
 * - Context generation for chat and email analysis
 * - Migration utilities from old agent_memory system
 */

import dotenv from 'dotenv';
dotenv.config();

import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'crypto';
import {
  ACCOUNT_PROFILE_SCHEMA,
  DEFAULT_PROFILE,
  PROFILE_VALIDATION,
  generateProfileContext
} from '../config/accountProfileSchema.js';
import { familyProfileSyncService } from './familyProfileSyncService.js';

export class AccountProfileService {
  constructor() {
    this.sql = neon(process.env.NEON_DATABASE_URL);
  }

  /**
   * Get account profile by account ID
   * @param {string} accountId - Account identifier
   * @returns {Promise<Object>} Profile data or default profile
   */
  async getProfile(accountId) {
    try {
      console.log(`📋 Getting profile for account: ${accountId}`);

      const profiles = await this.sql`
        SELECT * FROM account_profiles
        WHERE account_id = ${accountId}
        LIMIT 1
      `;

      if (profiles.length === 0) {
        console.log(`📝 No profile found for ${accountId}, creating default profile`);
        return await this.createDefaultProfile(accountId);
      }

      const profile = profiles[0];

      return {
        success: true,
        profile: {
          id: profile.id,
          account_id: profile.account_id,
          data: profile.profile_data,
          metadata: {
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            last_ai_update: profile.last_ai_update,
            version: profile.version,
            completeness_score: profile.completeness_score
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting profile:', error);
      return {
        success: false,
        error: error.message,
        profile: null
      };
    }
  }

  /**
   * Create default profile for new account
   * @param {string} accountId - Account identifier
   * @param {Object} initialData - Optional initial profile data
   * @returns {Promise<Object>} Created profile
   */
  async createDefaultProfile(accountId, initialData = {}) {
    try {
      const profileData = {
        ...DEFAULT_PROFILE,
        ...initialData,
        account: {
          ...DEFAULT_PROFILE.account,
          ...initialData.account,
          email: initialData.account?.email || '' // Email should be provided separately, not defaulted to accountId
        }
      };

      const completenessScore = this.calculateCompleteness(profileData);

      const result = await this.sql`
        INSERT INTO account_profiles (
          account_id,
          profile_data,
          completeness_score,
          created_at,
          updated_at
        )
        VALUES (
          ${accountId},
          ${JSON.stringify(profileData)},
          ${completenessScore},
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      const profile = result[0];
      console.log(`✅ Created default profile for ${accountId} (${completenessScore}% complete)`);

      return {
        success: true,
        profile: {
          id: profile.id,
          account_id: profile.account_id,
          data: profile.profile_data,
          metadata: {
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            last_ai_update: profile.last_ai_update,
            version: profile.version,
            completeness_score: profile.completeness_score
          }
        }
      };

    } catch (error) {
      console.error('❌ Error creating default profile:', error);
      return {
        success: false,
        error: error.message,
        profile: null
      };
    }
  }

  /**
   * Update account profile
   * @param {string} accountId - Account identifier
   * @param {Object} updates - Profile data updates (partial)
   * @param {string} updateSource - Source of update ('user' | 'ai' | 'email_analysis')
   * @returns {Promise<Object>} Updated profile
   */
  async updateProfile(accountId, updates, updateSource = 'user') {
    try {
      console.log(`📝 Updating profile for ${accountId} from ${updateSource}`);

      // Get current profile
      const currentProfile = await this.getProfile(accountId);
      if (!currentProfile.success) {
        return currentProfile;
      }

      // Merge updates with current data
      const updatedData = this.mergeProfileData(currentProfile.profile.data, updates);

      // Calculate new completeness score
      const completenessScore = this.calculateCompleteness(updatedData);

      // Prepare update fields
      const updateFields = {
        profile_data: JSON.stringify(updatedData),
        completeness_score: completenessScore,
        updated_at: new Date().toISOString(),
        version: currentProfile.profile.metadata.version + 1
      };

      // Update last_ai_update if this is an AI update
      if (updateSource === 'ai' || updateSource === 'email_analysis') {
        updateFields.last_ai_update = new Date().toISOString();
      }

      const result = await this.sql`
        UPDATE account_profiles
        SET
          profile_data = ${updateFields.profile_data},
          completeness_score = ${updateFields.completeness_score},
          updated_at = NOW(),
          last_ai_update = ${updateFields.last_ai_update || null},
          version = ${updateFields.version}
        WHERE account_id = ${accountId}
        RETURNING *
      `;

      if (result.length === 0) {
        throw new Error('Profile not found for update');
      }

      const profile = result[0];
      console.log(`✅ Updated profile for ${accountId} (${completenessScore}% complete, v${profile.version})`);

      // Sync family member data to agent memory if members were updated
      if (updatedData.members && Array.isArray(updatedData.members)) {
        try {
          const syncResult = await familyProfileSyncService.syncFamilyToAgentMemory(accountId, updatedData.members);
          if (syncResult.success) {
            console.log(`🔄 Family sync completed: ${syncResult.results.created} created, ${syncResult.results.updated} updated, ${syncResult.results.outdated} outdated`);
          }
        } catch (syncError) {
          console.error('⚠️ Family sync failed (non-blocking):', syncError.message);
          // Don't fail the profile update if sync fails
        }
      }

      return {
        success: true,
        profile: {
          id: profile.id,
          account_id: profile.account_id,
          data: profile.profile_data,
          metadata: {
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            last_ai_update: profile.last_ai_update,
            version: profile.version,
            completeness_score: profile.completeness_score
          }
        },
        changes: updates
      };

    } catch (error) {
      console.error('❌ Error updating profile:', error);
      return {
        success: false,
        error: error.message,
        profile: null
      };
    }
  }

  /**
   * Generate AI context from profile for chat and email analysis
   * @param {string} accountId - Account identifier
   * @returns {Promise<string>} Formatted context string
   */
  async generateAIContext(accountId) {
    try {
      const profileResult = await this.getProfile(accountId);
      if (!profileResult.success) {
        return '';
      }

      return generateProfileContext(profileResult.profile.data);

    } catch (error) {
      console.error('❌ Error generating AI context:', error);
      return '';
    }
  }

  /**
   * Extract and update profile from AI analysis (email content, etc.)
   * @param {string} accountId - Account identifier
   * @param {Object} extractedData - Data extracted by AI from emails, etc.
   * @returns {Promise<Object>} Update result
   */
  async updateFromAIExtraction(accountId, extractedData) {
    try {
      console.log(`🤖 AI updating profile for ${accountId}:`, Object.keys(extractedData));

      // Validate extracted data against auto-extractable fields
      const validatedUpdates = this.validateAIExtraction(extractedData);

      if (Object.keys(validatedUpdates).length === 0) {
        console.log(`⚠️ No valid AI updates for ${accountId}`);
        return {
          success: true,
          profile: null,
          changes: {},
          message: 'No valid updates from AI extraction'
        };
      }

      return await this.updateProfile(accountId, validatedUpdates, 'ai');

    } catch (error) {
      console.error('❌ Error in AI profile update:', error);
      return {
        success: false,
        error: error.message,
        profile: null
      };
    }
  }

  /**
   * Calculate profile completeness score (0-100)
   * @param {Object} profileData - Profile data object
   * @returns {number} Completeness percentage
   */
  calculateCompleteness(profileData) {
    const requiredFields = PROFILE_VALIDATION.required_for_completeness;
    let completedFields = 0;

    requiredFields.forEach(fieldPath => {
      const value = this.getNestedValue(profileData, fieldPath);
      if (this.isFieldCompleted(value)) {
        completedFields++;
      }
    });

    return Math.round((completedFields / requiredFields.length) * 100);
  }

  /**
   * Merge profile data with updates (deep merge)
   * @param {Object} current - Current profile data
   * @param {Object} updates - Updates to apply
   * @returns {Object} Merged profile data
   */
  mergeProfileData(current, updates) {
    const merged = JSON.parse(JSON.stringify(current)); // Deep copy

    function deepMerge(target, source) {
      for (const key in source) {
        if (Array.isArray(source[key])) {
          // Always replace arrays completely, don't merge them
          target[key] = source[key];
        } else if (source[key] && typeof source[key] === 'object') {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    }

    deepMerge(merged, updates);

    // Ensure all members have unique IDs
    if (merged.members && Array.isArray(merged.members)) {
      merged.members = merged.members.map(member => {
        if (!member.id) {
          console.log(`🆔 Adding UUID to member: ${member.name || 'unnamed'}`);
          return { ...member, id: randomUUID() };
        }
        return member;
      });
    }

    // Update metadata
    merged.metadata = {
      ...merged.metadata,
      updated_at: new Date().toISOString()
    };

    return merged;
  }

  /**
   * Merge profile updates with structured operations (append, replace, etc.)
   * @param {string} accountId - Account identifier
   * @param {Object} updateInstructions - Structured update instructions from ProfileSuggestionsService
   * @param {string} updateSource - Source of update ('user' | 'ai' | 'email_analysis')
   * @returns {Promise<Object>} Updated profile
   */
  async mergeProfileUpdates(accountId, updateInstructions, updateSource = 'ai') {
    try {
      console.log(`🔧 Merging structured profile updates for ${accountId} from ${updateSource}`);

      // Get current profile
      const currentProfile = await this.getProfile(accountId);
      if (!currentProfile.success) {
        return currentProfile;
      }

      const profileData = JSON.parse(JSON.stringify(currentProfile.profile.data)); // Deep copy

      // Apply each structured change
      for (const [fieldPath, change] of Object.entries(updateInstructions.changes || {})) {
        this.applyStructuredChange(profileData, fieldPath, change);
      }

      // Merge source tracking information
      if (updateInstructions._sources) {
        if (!profileData._sources) {
          profileData._sources = {};
        }
        Object.assign(profileData._sources, updateInstructions._sources);
      }

      // Calculate new completeness score
      const completenessScore = this.calculateCompleteness(profileData);

      // Prepare update fields
      const updateFields = {
        profile_data: JSON.stringify(profileData),
        completeness_score: completenessScore,
        updated_at: new Date().toISOString(),
        version: currentProfile.profile.metadata.version + 1
      };

      // Update last_ai_update if this is an AI update
      if (updateSource === 'ai' || updateSource === 'email_analysis') {
        updateFields.last_ai_update = new Date().toISOString();
      }

      const result = await this.sql`
        UPDATE account_profiles
        SET
          profile_data = ${updateFields.profile_data},
          completeness_score = ${updateFields.completeness_score},
          updated_at = NOW(),
          last_ai_update = ${updateFields.last_ai_update || null},
          version = ${updateFields.version}
        WHERE account_id = ${accountId}
        RETURNING *
      `;

      if (result.length === 0) {
        return {
          success: false,
          error: 'Profile not found for update',
          profile: null
        };
      }

      const updatedProfile = result[0];
      console.log(`✅ Profile updated for ${accountId} (v${updateFields.version}, ${completenessScore}% complete)`);

      return {
        success: true,
        profile: {
          id: updatedProfile.id,
          account_id: updatedProfile.account_id,
          data: updatedProfile.profile_data,
          metadata: {
            created_at: updatedProfile.created_at,
            updated_at: updatedProfile.updated_at,
            last_ai_update: updatedProfile.last_ai_update,
            version: updatedProfile.version,
            completeness_score: updatedProfile.completeness_score
          }
        }
      };

    } catch (error) {
      console.error('❌ Error merging profile updates:', error);
      return {
        success: false,
        error: error.message,
        profile: null
      };
    }
  }

  /**
   * Apply a structured change to profile data
   * @param {Object} profileData - Profile data object to modify
   * @param {string} fieldPath - Dot notation path (e.g., 'family.children.0.activities')
   * @param {*} change - Change instruction (value or object with operation)
   */
  applyStructuredChange(profileData, fieldPath, change) {
    const pathParts = fieldPath.split('.');
    let current = profileData;

    // Navigate to parent object
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];

      if (part === '-1') {
        // Special case: append to array
        if (!Array.isArray(current)) {
          current = [];
        }
        // Create new object and continue navigation
        const newObj = {};
        current.push(newObj);
        current = newObj;
      } else {
        if (!current[part]) {
          // Create structure as needed
          const nextPart = pathParts[i + 1];
          current[part] = (!isNaN(nextPart) || nextPart === '-1') ? [] : {};
        }
        current = current[part];
      }
    }

    const lastPart = pathParts[pathParts.length - 1];

    // Apply the change based on its type
    if (typeof change === 'object' && change.operation) {
      switch (change.operation) {
        case 'append':
          if (!Array.isArray(current[lastPart])) {
            current[lastPart] = [];
          }
          // Check for duplicates before appending
          if (!current[lastPart].includes(change.value)) {
            current[lastPart].push(change.value);
          }
          break;
        case 'prepend':
          if (!Array.isArray(current[lastPart])) {
            current[lastPart] = [];
          }
          current[lastPart].unshift(change.value);
          break;
        case 'replace':
          current[lastPart] = change.value;
          break;
        default:
          console.warn(`⚠️ Unknown operation: ${change.operation}`);
          current[lastPart] = change.value;
      }
    } else {
      // Direct value assignment
      if (lastPart === '-1') {
        // Append to array
        if (!Array.isArray(current)) {
          console.warn('⚠️ Trying to append to non-array');
          return;
        }
        current.push(change);
      } else {
        current[lastPart] = change;
      }
    }
  }

  /**
   * Validate AI-extracted data against allowed auto-extractable fields
   * @param {Object} extractedData - Data extracted by AI
   * @returns {Object} Validated updates
   */
  validateAIExtraction(extractedData) {
    const allowedFields = PROFILE_VALIDATION.auto_extractable_from_email;
    const validatedUpdates = {};

    // Only allow updates to fields that can be auto-extracted
    allowedFields.forEach(fieldPath => {
      const value = this.getNestedValue(extractedData, fieldPath);
      if (value !== undefined && value !== null) {
        this.setNestedValue(validatedUpdates, fieldPath, value);
      }
    });

    return validatedUpdates;
  }

  /**
   * Get nested object value by path (e.g., 'family.children.0.name')
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-separated path
   * @returns {any} Value at path or undefined
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested object value by path
   * @param {Object} obj - Object to modify
   * @param {string} path - Dot-separated path
   * @param {any} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  /**
   * Check if a field value is considered "completed"
   * @param {any} value - Field value to check
   * @returns {boolean} True if field is completed
   */
  isFieldCompleted(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  /**
   * Get profile statistics for account
   * @param {string} accountId - Account identifier
   * @returns {Promise<Object>} Profile statistics
   */
  async getProfileStats(accountId) {
    try {
      const profileResult = await this.getProfile(accountId);
      if (!profileResult.success) {
        return { success: false, error: profileResult.error };
      }

      const profile = profileResult.profile;
      const data = profile.data;

      return {
        success: true,
        stats: {
          completeness_score: profile.metadata.completeness_score,
          version: profile.metadata.version,
          last_updated: profile.metadata.updated_at,
          last_ai_update: profile.metadata.last_ai_update,
          family_members: {
            spouse: !!data.family?.spouse?.name,
            children_count: data.family?.children?.length || 0,
            pets_count: data.family?.pets?.length || 0
          },
          activities_count: data.activities?.recurring_events?.length || 0,
          contacts: {
            healthcare_count: data.contacts?.healthcare?.length || 0,
            schools_count: data.contacts?.schools?.length || 0,
            services_count: data.contacts?.services?.length || 0
          },
          preferences_set: {
            dietary_restrictions: (data.preferences?.dietary?.restrictions?.length || 0) > 0,
            favorite_cuisines: (data.preferences?.dietary?.favorite_cuisines?.length || 0) > 0,
            lifestyle_defined: !!data.preferences?.lifestyle?.activity_level
          }
        }
      };

    } catch (error) {
      console.error('❌ Error getting profile stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Migrate data from old agent_memory table to new profile system
   * @param {string} accountId - Account identifier
   * @returns {Promise<Object>} Migration result
   */
  async migrateFromAgentMemory(accountId) {
    try {
      console.log(`🔄 Migrating agent memory to profile for ${accountId}`);

      // Get existing memories
      const memories = await this.sql`
        SELECT * FROM agent_memory
        WHERE account_id = ${accountId}
        ORDER BY created_at ASC
      `;

      if (memories.length === 0) {
        console.log(`ℹ️ No memories to migrate for ${accountId}`);
        return { success: true, migrated_count: 0 };
      }

      // Convert memories to profile structure
      const profileUpdates = this.convertMemoriesToProfile(memories);

      // Update profile with converted data
      const result = await this.updateProfile(accountId, profileUpdates, 'migration');

      console.log(`✅ Migrated ${memories.length} memories to profile for ${accountId}`);

      return {
        success: true,
        migrated_count: memories.length,
        profile: result.profile
      };

    } catch (error) {
      console.error('❌ Error migrating agent memory:', error);
      return {
        success: false,
        error: error.message,
        migrated_count: 0
      };
    }
  }

  /**
   * Convert old agent memories to structured profile data
   * @param {Array} memories - Agent memory records
   * @returns {Object} Profile structure updates
   */
  convertMemoriesToProfile(memories) {
    const profileUpdates = {
      family: { children: [], pets: [] },
      activities: { recurring_events: [], hobbies: [] },
      preferences: { dietary: { restrictions: [], favorite_cuisines: [] } },
      contacts: { healthcare: [], schools: [], services: [] }
    };

    memories.forEach(memory => {
      const content = memory.content.toLowerCase();
      const extractedInfo = memory.extracted_info || {};

      // Convert based on memory type and content patterns
      if (memory.memory_type === 'family_member') {
        this.extractFamilyInfo(content, extractedInfo, profileUpdates);
      } else if (memory.memory_type === 'schedule' || memory.memory_type === 'activity') {
        this.extractActivityInfo(content, extractedInfo, profileUpdates);
      } else if (memory.memory_type === 'preference') {
        this.extractPreferenceInfo(content, extractedInfo, profileUpdates);
      }
    });

    return profileUpdates;
  }

  /**
   * Extract family information from memory content
   * @private
   */
  extractFamilyInfo(content, extractedInfo, profileUpdates) {
    // Implementation would parse family member info from old memories
    // This is a placeholder for the migration logic
    console.log('🔄 Converting family memory:', content.substring(0, 50));
  }

  /**
   * Extract activity information from memory content
   * @private
   */
  extractActivityInfo(content, extractedInfo, profileUpdates) {
    // Implementation would parse activity/schedule info from old memories
    console.log('🔄 Converting activity memory:', content.substring(0, 50));
  }

  /**
   * Extract preference information from memory content
   * @private
   */
  extractPreferenceInfo(content, extractedInfo, profileUpdates) {
    // Implementation would parse preference info from old memories
    console.log('🔄 Converting preference memory:', content.substring(0, 50));
  }
}

// Static instance for easy access
export const accountProfileService = new AccountProfileService();

export default AccountProfileService;