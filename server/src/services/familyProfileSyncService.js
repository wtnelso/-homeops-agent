/**
 * Family Profile Sync Service
 *
 * Manages syncing family profile data to agent memory for chat context.
 * Uses content hashing to detect changes and update agent memory accordingly.
 */

import { createHash } from 'crypto';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

export class FamilyProfileSyncService {
  constructor() {
    this.sql = neon(process.env.NEON_DATABASE_URL);
  }

  /**
   * Generate content hash for family member data
   * @param {Object} memberData - Family member data
   * @returns {string} SHA-256 hash
   */
  generateMemberHash(memberData) {
    // Create a stable string representation for hashing
    const hashString = JSON.stringify({
      id: memberData.id,
      name: memberData.name,
      type: memberData.type,
      age: memberData.age,
      email: memberData.email,
      activities: memberData.activities || [],
      schools: memberData.schools || [],
      birthday: memberData.birthday || {}
    }, Object.keys(memberData).sort()); // Sort keys for consistent hashing

    return createHash('sha256').update(hashString).digest('hex');
  }

  /**
   * Create agent memory entries from family member data
   * @param {Object} member - Family member data
   * @param {string} accountId - Account ID
   * @param {string} contentHash - Content hash for tracking
   * @returns {Array} Agent memory entries
   */
  createAgentMemoriesFromMember(member, accountId, contentHash) {
    const memories = [];
    const timestamp = new Date().toISOString();

    // Basic member info
    if (member.name) {
      memories.push({
        account_id: accountId,
        key: `family_member_${member.id}`,
        value: {
          text: `${member.name} is ${member.type || 'family member'}${member.age ? ` aged ${member.age}` : ''}`,
          member_name: member.name,
          member_type: member.type,
          member_age: member.age,
          member_id: member.id
        },
        memory_type: 'family_info',
        confidence_score: 0.95,
        priority: 1,
        source_type: 'family_profile_sync',
        source_id: member.id,
        family_member_id: member.id,
        content_hash: contentHash,
        status: 'active',
        created_at: timestamp,
        updated_at: timestamp
      });

      // Birthday info
      if (member.birthday?.month && member.birthday?.day) {
        memories.push({
          account_id: accountId,
          key: `member_${member.id}_birthday`,
          value: {
            text: `${member.name}'s birthday is ${member.birthday.month}/${member.birthday.day}`,
            member_name: member.name,
            member_id: member.id,
            birthday: member.birthday
          },
          memory_type: 'family_info',
          confidence_score: 0.95,
          priority: 1,
          source_type: 'family_profile_sync',
          source_id: member.id,
          family_member_id: member.id,
          content_hash: contentHash,
          status: 'active',
          created_at: timestamp,
          updated_at: timestamp
        });
      }

      // Activities
      if (member.activities?.length > 0) {
        member.activities.forEach((activity, index) => {
          let activityText = `${member.name} participates in ${activity.name}`;
          if (activity.days?.length > 0) {
            activityText += ` on ${activity.days.join(', ')}`;
          }
          if (activity.frequency) {
            activityText += ` (${activity.frequency})`;
          }

          // Clean activity object by removing source metadata and extracting expires_at
          const cleanActivity = { ...activity };
          delete cleanActivity.source;

          // Extract expires_at for the agent_memory table column
          const expiresAt = cleanActivity.expires_at;
          delete cleanActivity.expires_at;

          memories.push({
            account_id: accountId,
            key: `member_${member.id}_activity_${index}`,
            value: {
              text: activityText,
              member_name: member.name,
              member_id: member.id,
              activity: cleanActivity
            },
            memory_type: 'activity',
            confidence_score: 0.9,
            priority: 2,
            source_type: 'family_profile_sync',
            source_id: member.id,
            family_member_id: member.id,
            content_hash: contentHash,
            status: 'active',
            created_at: timestamp,
            updated_at: timestamp,
            expires_at: expiresAt
          });
        });
      }

      // Schools
      if (member.schools?.length > 0) {
        member.schools.forEach((school, index) => {
          let schoolText = `${member.name} attends ${school.name}`;
          if (school.grade) {
            schoolText += ` in ${school.grade}`;
          }
          if (school.type) {
            schoolText += ` (${school.type})`;
          }

          // Clean school object by removing source metadata
          const cleanSchool = { ...school };
          delete cleanSchool.source;

          memories.push({
            account_id: accountId,
            key: `member_${member.id}_school_${index}`,
            value: {
              text: schoolText,
              member_name: member.name,
              member_id: member.id,
              school: cleanSchool
            },
            memory_type: 'education',
            confidence_score: 0.9,
            priority: 2,
            source_type: 'family_profile_sync',
            source_id: member.id,
            family_member_id: member.id,
            content_hash: contentHash,
            status: 'active',
            created_at: timestamp,
            updated_at: timestamp
          });
        });
      }
    }

    return memories;
  }

  /**
   * Categorize contact type for better agent reasoning
   * @param {string} contactType - Contact type from database
   * @returns {string} Category for agent memory
   */
  categorizeContact(contactType) {
    if (!contactType) return 'general';

    const type = contactType.toLowerCase();

    // Medical contacts
    if (type.includes('doctor') || type.includes('pediatrician') || type.includes('dentist') ||
        type.includes('therapist') || type.includes('nurse') || type.includes('medical')) {
      return 'medical';
    }

    // Education contacts
    if (type.includes('teacher') || type.includes('principal') || type.includes('school') ||
        type.includes('tutor') || type.includes('counselor') || type.includes('coach')) {
      return 'education';
    }

    // Emergency contacts
    if (type.includes('emergency') || type.includes('babysitter') || type.includes('nanny')) {
      return 'emergency';
    }

    // Service providers
    if (type.includes('plumber') || type.includes('electrician') || type.includes('mechanic') ||
        type.includes('contractor') || type.includes('repair') || type.includes('maintenance')) {
      return 'services';
    }

    return 'general';
  }

  /**
   * Generate content hash for Supabase family_contacts data
   * @param {Object} contactData - Family contact data from Supabase
   * @returns {string} SHA-256 hash
   */
  generateContactHash(contactData) {
    const hashString = JSON.stringify({
      id: contactData.id,
      family_id: contactData.family_id,
      name: contactData.name,
      contact_type: contactData.contact_type,
      phone: contactData.phone,
      email: contactData.email,
      notes: contactData.notes
    }, Object.keys(contactData).sort());

    return createHash('sha256').update(hashString).digest('hex');
  }

  /**
   * Generate content hash for Supabase family_members data
   * @param {Object} memberData - Family member data from Supabase
   * @returns {string} SHA-256 hash
   */
  generateMemberHashFromSupabase(memberData) {
    const hashString = JSON.stringify({
      id: memberData.id,
      family_id: memberData.family_id,
      name: memberData.name,
      family_relationship: memberData.family_relationship,
      age: memberData.age,
      birthday_month: memberData.birthday_month,
      birthday_day: memberData.birthday_day
    }, Object.keys(memberData).sort());

    return createHash('sha256').update(hashString).digest('hex');
  }

  /**
   * Generate content hash for Supabase family_activities data
   * @param {Object} activityData - Family activity data from Supabase
   * @returns {string} SHA-256 hash
   */
  generateActivityHash(activityData) {
    const hashString = JSON.stringify({
      id: activityData.id,
      family_id: activityData.family_id,
      family_member_id: activityData.family_member_id,
      activity_name: activityData.activity_name,
      activity_type: activityData.activity_type,
      schedule: activityData.schedule,
      start_date: activityData.start_date,
      end_date: activityData.end_date
    }, Object.keys(activityData).sort());

    return createHash('sha256').update(hashString).digest('hex');
  }

  /**
   * Generate content hash for Supabase family_schools data
   * @param {Object} schoolData - Family school data from Supabase
   * @returns {string} SHA-256 hash
   */
  generateSchoolHash(schoolData) {
    const hashString = JSON.stringify({
      id: schoolData.id,
      family_id: schoolData.family_id,
      family_member_id: schoolData.family_member_id,
      school_name: schoolData.school_name,
      school_type: schoolData.school_type,
      grade_level: schoolData.grade_level,
      start_date: schoolData.start_date,
      end_date: schoolData.end_date
    }, Object.keys(schoolData).sort());

    return createHash('sha256').update(hashString).digest('hex');
  }

  /**
   * Sync individual family contact to agent memory
   * @param {string} userId - User ID
   * @param {string} familyId - Family ID
   * @param {Object} contactData - Contact data from Supabase
   * @returns {Promise<Object>} Sync result
   */
  async syncContactToAgentMemory(userId, familyId, contactData) {
    try {
      const newHash = this.generateContactHash(contactData);

      // Check existing memory
      const existingMemories = await this.sql`
        SELECT content_hash FROM agent_memory
        WHERE user_id = ${userId}
          AND family_id = ${familyId}
          AND source_id = ${contactData.id}
          AND source_type = 'supabase_contact_sync'
          AND memory_type = 'contacts'
      `;

      let needsUpdate = true;
      if (existingMemories.length > 0) {
        const existingHash = existingMemories[0].content_hash;
        if (existingHash === newHash) {
          needsUpdate = false;
        }
      }

      if (!needsUpdate) {
        return { success: true, message: 'No changes detected', updated: false };
      }

      // Generate memory key using contact ID to ensure updates work correctly
      const memoryKey = `family_contact_${contactData.id}`;

      // Prepare simplified agent memory data for V1
      const memoryValue = {
        name: contactData.name,
        role: contactData.contact_type,
        phone: contactData.phone,
        email: contactData.email,
        notes: contactData.notes,
        context_type: "contact_info",
        category: this.categorizeContact(contactData.contact_type)
      };

      // Use AgentMemoryService to store
      const AgentMemoryService = (await import('./agentMemoryService.js')).AgentMemoryService;
      const result = await AgentMemoryService.addMemory({
        user_id: userId,
        key: memoryKey,
        value: memoryValue,
        memory_type: 'contacts',
        confidence_score: 0.9,
        priority: 3,
        source_type: 'supabase_contact_sync',
        source_id: contactData.id,
        familyId: familyId,
        contentHash: newHash
      });

      return { success: true, message: 'Contact synced to agent memory', updated: true, result };

    } catch (error) {
      console.error('❌ Error syncing contact to agent memory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync individual family member to agent memory
   * @param {string} userId - User ID
   * @param {string} familyId - Family ID
   * @param {Object} memberData - Member data from Supabase
   * @returns {Promise<Object>} Sync result
   */
  async syncMemberToAgentMemory(userId, familyId, memberData) {
    try {
      const newHash = this.generateMemberHashFromSupabase(memberData);

      // Check existing memory
      const existingMemories = await this.sql`
        SELECT content_hash FROM agent_memory
        WHERE user_id = ${userId}
          AND family_id = ${familyId}
          AND source_id = ${memberData.id}
          AND source_type = 'supabase_member_sync'
          AND memory_type = 'family_info'
      `;

      let needsUpdate = true;
      if (existingMemories.length > 0) {
        const existingHash = existingMemories[0].content_hash;
        if (existingHash === newHash) {
          needsUpdate = false;
        }
      }

      if (!needsUpdate) {
        return { success: true, message: 'No changes detected', updated: false };
      }

      // Generate memory key using member ID to ensure updates work correctly
      const memoryKey = `family_member_${memberData.id}`;

      // Prepare standardized agent memory data for V1
      const memoryValue = {
        name: memberData.name,
        relationship: memberData.family_relationship,
        age: memberData.age,
        birthday_month: memberData.birthday_month,
        birthday_day: memberData.birthday_day,
        context_type: "family_info",
        category: memberData.family_relationship?.toLowerCase() || 'general'
      };

      // Use AgentMemoryService to store
      const AgentMemoryService = (await import('./agentMemoryService.js')).AgentMemoryService;
      const result = await AgentMemoryService.addMemory({
        user_id: userId,
        key: memoryKey,
        value: memoryValue,
        memory_type: 'family_info',
        confidence_score: 0.9,
        priority: 3,
        source_type: 'supabase_member_sync',
        source_id: memberData.id,
        familyId: familyId,
        contentHash: newHash
      });

      return { success: true, message: 'Family member synced to agent memory', updated: true, result };

    } catch (error) {
      console.error('❌ Error syncing family member to agent memory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync individual family activity to agent memory
   * @param {string} userId - User ID
   * @param {string} familyId - Family ID
   * @param {Object} activityData - Activity data from Supabase
   * @returns {Promise<Object>} Sync result
   */
  async syncActivityToAgentMemory(userId, familyId, activityData, familyMemberName = null) {
    try {
      const newHash = this.generateActivityHash(activityData);

      // Check existing memory
      const existingMemories = await this.sql`
        SELECT content_hash FROM agent_memory
        WHERE user_id = ${userId}
          AND family_id = ${familyId}
          AND source_id = ${activityData.id}
          AND source_type = 'supabase_activity_sync'
          AND memory_type = 'family_info'
      `;

      let needsUpdate = true;
      if (existingMemories.length > 0) {
        const existingHash = existingMemories[0].content_hash;
        if (existingHash === newHash) {
          needsUpdate = false;
        }
      }

      if (!needsUpdate) {
        return { success: true, message: 'No changes detected', updated: false };
      }

      // Generate memory key using activity ID to ensure updates work correctly
      const memoryKey = `family_activity_${activityData.id}`;

      // Prepare standardized agent memory data for V1
      const memoryValue = {
        name: activityData.activity_name,
        type: activityData.activity_type,
        frequency: activityData.frequency,
        days: activityData.days,
        end_date: activityData.end_date,
        context_type: "activity_info",
        category: activityData.activity_type?.toLowerCase() || 'general',
        ...(familyMemberName && { member_name: familyMemberName })
      };

      // Use AgentMemoryService to store
      const AgentMemoryService = (await import('./agentMemoryService.js')).AgentMemoryService;
      const result = await AgentMemoryService.addMemory({
        user_id: userId,
        key: memoryKey,
        value: memoryValue,
        memory_type: 'family_info',
        confidence_score: 0.9,
        priority: 3,
        source_type: 'supabase_activity_sync',
        source_id: activityData.id,
        expires_at: activityData.end_date ? new Date(activityData.end_date).toISOString() : null,
        familyId: familyId,
        familyMemberId: activityData.family_member_id,
        contentHash: newHash
      });

      return { success: true, message: 'Family activity synced to agent memory', updated: true, result };

    } catch (error) {
      console.error('❌ Error syncing family activity to agent memory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync individual family school to agent memory
   * @param {string} userId - User ID
   * @param {string} familyId - Family ID
   * @param {Object} schoolData - School data from Supabase
   * @returns {Promise<Object>} Sync result
   */
  async syncSchoolToAgentMemory(userId, familyId, schoolData, familyMemberName = null) {
    try {
      const newHash = this.generateSchoolHash(schoolData);

      // Check existing memory
      const existingMemories = await this.sql`
        SELECT content_hash FROM agent_memory
        WHERE user_id = ${userId}
          AND family_id = ${familyId}
          AND source_id = ${schoolData.id}
          AND source_type = 'supabase_school_sync'
          AND memory_type = 'family_info'
      `;

      let needsUpdate = true;
      if (existingMemories.length > 0) {
        const existingHash = existingMemories[0].content_hash;
        if (existingHash === newHash) {
          needsUpdate = false;
        }
      }

      if (!needsUpdate) {
        return { success: true, message: 'No changes detected', updated: false };
      }

      // Generate memory key using school ID to ensure updates work correctly
      const memoryKey = `family_school_${schoolData.id}`;

      // Prepare standardized agent memory data for V1
      const memoryValue = {
        name: schoolData.school_name,
        type: schoolData.school_type,
        grade: schoolData.grade_level,
        email_domain: schoolData.email_domain,
        end_date: schoolData.end_date,
        context_type: "education_info",
        category: schoolData.school_type?.toLowerCase() || 'general',
        ...(familyMemberName && { member_name: familyMemberName })
      };

      // Use AgentMemoryService to store
      const AgentMemoryService = (await import('./agentMemoryService.js')).AgentMemoryService;
      const result = await AgentMemoryService.addMemory({
        user_id: userId,
        key: memoryKey,
        value: memoryValue,
        memory_type: 'family_info',
        confidence_score: 0.9,
        priority: 3,
        source_type: 'supabase_school_sync',
        source_id: schoolData.id,
        expires_at: schoolData.end_date ? new Date(schoolData.end_date).toISOString() : null,
        familyId: familyId,
        familyMemberId: schoolData.family_member_id,
        contentHash: newHash
      });

      return { success: true, message: 'Family school synced to agent memory', updated: true, result };

    } catch (error) {
      console.error('❌ Error syncing family school to agent memory:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync family member data to agent memory
   * @param {string} accountId - Account ID
   * @param {Array} familyMembers - Array of family member data
   * @returns {Promise<Object>} Sync results
   */
  async syncFamilyToAgentMemory(accountId, familyMembers) {
    try {
      console.log(`🔄 Syncing family data to agent memory for account: ${accountId}`);

      const syncResults = {
        updated: 0,
        created: 0,
        outdated: 0,
        errors: []
      };

      for (const member of familyMembers) {
        try {
          const newHash = this.generateMemberHash(member);

          // Check if we have existing memories for this member
          const existingMemories = await this.sql`
            SELECT DISTINCT content_hash
            FROM agent_memory
            WHERE account_id = ${accountId}
              AND family_member_id = ${member.id}
              AND source_type = 'family_profile_sync'
              AND status = 'active'
          `;

          let needsUpdate = true;
          if (existingMemories.length > 0) {
            const existingHash = existingMemories[0].content_hash;
            if (existingHash === newHash) {
              needsUpdate = false;
              console.log(`✓ No changes for member ${member.name} (${member.id})`);
            }
          }

          if (needsUpdate) {
            console.log(`📝 Updating memories for member ${member.name} (${member.id})`);

            // Mark old memories as outdated
            if (existingMemories.length > 0) {
              await this.sql`
                UPDATE agent_memory
                SET status = 'outdated',
                    outdated_at = NOW(),
                    outdated_reason = 'family_data_changed'
                WHERE account_id = ${accountId}
                  AND family_member_id = ${member.id}
                  AND source_type = 'family_profile_sync'
                  AND status = 'active'
              `;
              syncResults.outdated++;
            }

            // Create new memories
            const newMemories = this.createAgentMemoriesFromMember(member, accountId, newHash);

            for (const memory of newMemories) {
              await this.sql`
                INSERT INTO agent_memory (
                  account_id, key, value, memory_type,
                  confidence_score, priority, source_type, source_id,
                  family_member_id, content_hash, status, created_at, updated_at, expires_at
                ) VALUES (
                  ${memory.account_id}, ${memory.key}, ${JSON.stringify(memory.value)},
                  ${memory.memory_type}, ${memory.confidence_score}, ${memory.priority},
                  ${memory.source_type}, ${memory.source_id}, ${memory.family_member_id},
                  ${memory.content_hash}, ${memory.status}, ${memory.created_at}, ${memory.updated_at}, ${memory.expires_at}
                )
                ON CONFLICT (account_id, memory_type, key)
                DO UPDATE SET
                  value = EXCLUDED.value,
                  confidence_score = EXCLUDED.confidence_score,
                  priority = EXCLUDED.priority,
                  source_type = EXCLUDED.source_type,
                  source_id = EXCLUDED.source_id,
                  family_member_id = EXCLUDED.family_member_id,
                  content_hash = EXCLUDED.content_hash,
                  status = EXCLUDED.status,
                  updated_at = EXCLUDED.updated_at,
                  expires_at = EXCLUDED.expires_at
              `;
            }

            if (existingMemories.length > 0) {
              syncResults.updated++;
            } else {
              syncResults.created++;
            }
          }
        } catch (memberError) {
          console.error(`❌ Error syncing member ${member.id}:`, memberError);
          syncResults.errors.push({
            memberId: member.id,
            error: memberError.message
          });
        }
      }

      console.log(`✅ Family sync complete for ${accountId}:`, syncResults);
      return {
        success: true,
        results: syncResults
      };

    } catch (error) {
      console.error('❌ Error in family profile sync:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Remove agent memories for deleted family members
   * @param {string} accountId - Account ID
   * @param {Array} deletedMemberIds - Array of deleted member IDs
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupDeletedMembers(accountId, deletedMemberIds) {
    try {
      console.log(`🧹 Cleaning up memories for deleted members: ${deletedMemberIds.join(', ')}`);

      for (const memberId of deletedMemberIds) {
        await this.sql`
          UPDATE agent_memory
          SET status = 'outdated',
              outdated_at = NOW(),
              outdated_reason = 'family_member_deleted'
          WHERE account_id = ${accountId}
            AND family_member_id = ${memberId}
            AND source_type = 'family_profile_sync'
            AND status = 'active'
        `;
      }

      return {
        success: true,
        cleaned_count: deletedMemberIds.length
      };

    } catch (error) {
      console.error('❌ Error cleaning up deleted members:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Delete family data from agent memory by key
   * @param {string} dataType - Type of data (activity, school, member, contact)
   * @param {string} dataId - ID of the data to delete
   * @returns {Promise<Object>} Deletion result
   */
  async deleteFromAgentMemory(dataType, dataId) {
    try {
      const memoryKey = `family_${dataType}_${dataId}`;
      console.log('🗑️ Deleting family data from agent memory:', { dataType, dataId, memoryKey });

      let result;
      if (dataType === 'member') {
        // For family members, also delete any records associated with this family member
        result = await this.sql`
          DELETE FROM agent_memory
          WHERE key = ${memoryKey} OR family_member_id = ${dataId}
        `;
      } else {
        // For activities, schools, contacts - just delete by key
        result = await this.sql`
          DELETE FROM agent_memory
          WHERE key = ${memoryKey}
        `;
      }

      console.log(`✅ Family ${dataType} deleted from agent memory:`, result.count);
      return { success: true, deletedCount: result.count };

    } catch (error) {
      console.error(`❌ Error deleting family ${dataType} from agent memory:`, error);
      return { success: false, error: error.message };
    }
  }
}

export const familyProfileSyncService = new FamilyProfileSyncService();