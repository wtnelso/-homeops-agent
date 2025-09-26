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
        memory_type: 'family_member',
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
}

export const familyProfileSyncService = new FamilyProfileSyncService();