/**
 * Onboarding Data Processor
 *
 * Processes onboarding data from localStorage and stores it in:
 * - Supabase tables (family_members, family_activities, family_keywords)
 * - Neon agent_memory with appropriate types
 * - Updates users table with onboarding_completed_at timestamp
 */

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

class OnboardingDataProcessor {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Neon connection for agent_memory
    this.neonPool = new Pool({
      connectionString: process.env.NEON_DATABASE_URL,
    });
  }

  /**
   * Process complete onboarding data
   */
  async processOnboardingData(userId, onboardingData, familyId) {
    console.log('🎯 Processing onboarding data for user:', userId);

    const results = {
      success: true,
      errors: [],
      processed: {
        familyMembers: 0,
        activities: 0,
        schools: 0,
        emailDomains: 0,
        importantPlaces: 0,
        agentMemories: 0
      }
    };

    try {
      console.log('📋 Using provided family ID:', familyId);

      // Process each data type (save what we can, log what fails)
      await this.processFamilyMembers(familyId, userId, onboardingData.familyMembers, results);
      await this.processFamilyActivities(familyId, onboardingData.activities, results);
      await this.processSchools(familyId, onboardingData.schools, results);
      await this.processEmailDomains(familyId, onboardingData.emailDomains, results);
      await this.processImportantPlaces(familyId, onboardingData.importantPlaces, results);

      // Store in agent memory
      console.log(`🔍 DEBUG ONBOARDING: About to call storeInAgentMemory with:`, {
        userId,
        familyId,
        familyMembersCount: onboardingData.familyMembers?.length || 0,
        activitiesCount: onboardingData.activities?.length || 0
      });
      await this.storeInAgentMemory(userId, onboardingData, familyId, results);
      console.log(`🔍 DEBUG ONBOARDING: storeInAgentMemory completed`);

      // Mark onboarding as completed
      await this.markOnboardingCompleted(userId);

      console.log('✅ Onboarding data processing completed:', results);
      return results;

    } catch (error) {
      console.error('❌ Critical error processing onboarding data:', error);
      results.success = false;
      results.errors.push(`Critical error: ${error.message}`);
      return results;
    }
  }

  /**
   * Get user's family ID
   */
  async getUserFamilyId(userId) {
    try {
      const { data, error } = await this.supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data?.family_id;
    } catch (error) {
      console.error('❌ Error getting family ID:', error);
      return null;
    }
  }

  /**
   * Process family members
   */
  async processFamilyMembers(familyId, userId, familyMembers, results) {
    if (!familyMembers || familyMembers.length === 0) return;

    // Store family member IDs for agent memory
    results.familyMemberIds = [];

    for (const member of familyMembers) {
      try {
        const { data, error } = await this.supabase
          .from('family_members')
          .insert({
            family_id: familyId,
            name: member.name,
            family_relationship: member.relationship,
            age: member.age || null,
            email: member.email || null,
            created_by: userId
          })
          .select('id')
          .single();

        if (error) throw error;

        // Store the Supabase ID with the member data
        member.supabase_id = data.id;
        results.familyMemberIds.push({ name: member.name, id: data.id });

        results.processed.familyMembers++;
        console.log(`✅ Added family member: ${member.name} with ID: ${data.id}`);

      } catch (error) {
        console.error(`❌ Error adding family member ${member.name}:`, error);
        results.errors.push(`Failed to add family member: ${member.name}`);
      }
    }
  }

  /**
   * Process family activities as keywords
   */
  async processFamilyActivities(familyId, activities, results) {
    if (!activities || activities.length === 0) return;

    for (const activity of activities) {
      try {
        const { data, error } = await this.supabase
          .from('family_keywords')
          .insert({
            family_id: familyId,
            keyword: activity,
            category: 'activity'
          });

        if (error) throw error;
        results.processed.activities++;
        console.log(`✅ Added activity: ${activity}`);

      } catch (error) {
        console.error(`❌ Error adding activity ${activity}:`, error);
        results.errors.push(`Failed to add activity: ${activity}`);
      }
    }
  }

  /**
   * Process schools as keywords
   */
  async processSchools(familyId, schools, results) {
    if (!schools || schools.length === 0) return;

    for (const school of schools) {
      try {
        const { data, error } = await this.supabase
          .from('family_keywords')
          .insert({
            family_id: familyId,
            keyword: school,
            category: 'school'
          });

        if (error) throw error;
        results.processed.schools++;
        console.log(`✅ Added school: ${school}`);

      } catch (error) {
        console.error(`❌ Error adding school ${school}:`, error);
        results.errors.push(`Failed to add school: ${school}`);
      }
    }
  }

  /**
   * Process email domains as keywords
   */
  async processEmailDomains(familyId, emailDomains, results) {
    if (!emailDomains || emailDomains.length === 0) return;

    for (const domain of emailDomains) {
      try {
        const { data, error } = await this.supabase
          .from('family_keywords')
          .insert({
            family_id: familyId,
            keyword: domain,
            category: 'email_domain'
          });

        if (error) throw error;
        results.processed.emailDomains++;
        console.log(`✅ Added email domain: ${domain}`);

      } catch (error) {
        console.error(`❌ Error adding email domain ${domain}:`, error);
        results.errors.push(`Failed to add email domain: ${domain}`);
      }
    }
  }

  /**
   * Process important places as keywords
   */
  async processImportantPlaces(familyId, importantPlaces, results) {
    if (!importantPlaces || importantPlaces.length === 0) return;

    for (const place of importantPlaces) {
      try {
        const { data, error } = await this.supabase
          .from('family_keywords')
          .insert({
            family_id: familyId,
            keyword: place,
            category: 'location'
          });

        if (error) throw error;
        results.processed.importantPlaces++;
        console.log(`✅ Added important place: ${place}`);

      } catch (error) {
        console.error(`❌ Error adding important place ${place}:`, error);
        results.errors.push(`Failed to add important place: ${place}`);
      }
    }
  }

  /**
   * Store data in Neon agent_memory using ProfileSuggestionsService
   */
  async storeInAgentMemory(userId, onboardingData, familyId, results) {
    console.log(`🔍 DEBUG ONBOARDING MEMORY: Starting storeInAgentMemory`);
    console.log(`🔍 DEBUG ONBOARDING MEMORY: userId: ${userId}`);
    console.log(`🔍 DEBUG ONBOARDING MEMORY: familyId: ${familyId}`);
    console.log(`🔍 DEBUG ONBOARDING MEMORY: onboardingData:`, JSON.stringify(onboardingData, null, 2));

    try {
      console.log(`🔍 DEBUG ONBOARDING MEMORY: Attempting to import profileSuggestionsService`);

      // Import ProfileSuggestionsService dynamically to avoid circular imports
      const profileSuggestionsModule = await import('./profileSuggestionsService.js');
      console.log(`🔍 DEBUG ONBOARDING MEMORY: Import successful, keys:`, Object.keys(profileSuggestionsModule));

      const { profileSuggestionsService } = profileSuggestionsModule;
      console.log(`🔍 DEBUG ONBOARDING MEMORY: profileSuggestionsService available:`, !!profileSuggestionsService);
      console.log(`🔍 DEBUG ONBOARDING MEMORY: syncFamilyMemberToAgentMemory method available:`, typeof profileSuggestionsService?.syncFamilyMemberToAgentMemory);

      // Process family members
      if (onboardingData.familyMembers && onboardingData.familyMembers.length > 0) {
        console.log(`🔍 DEBUG ONBOARDING MEMORY: Processing ${onboardingData.familyMembers.length} family members`);

        for (let i = 0; i < onboardingData.familyMembers.length; i++) {
          const member = onboardingData.familyMembers[i];
          console.log(`🔍 DEBUG ONBOARDING MEMORY: Processing member ${i + 1}/${onboardingData.familyMembers.length}:`, member);

          try {
            const memberData = {
              member_name: member.name,  // Use member_name to match config expectations
              context_type: "family_info"
            };

            // Only add properties if they have values
            if (member.relationship) memberData.relationship = member.relationship;
            if (member.relationship) memberData.category = member.relationship;
            if (member.age) memberData.age = parseInt(member.age);
            if (member.grade) memberData.grade = member.grade;
            if (member.email) memberData.email = member.email;
            if (member.birthday_month) memberData.birthday_month = parseInt(member.birthday_month);
            if (member.birthday_day) memberData.birthday_day = parseInt(member.birthday_day);

            // Add family_member_id for consistent key generation
            if (member.supabase_id) {
              memberData.family_member_id = member.supabase_id;
            }

            console.log(`🔍 DEBUG ONBOARDING MEMORY: About to save member to agent memory:`, {
              memberName: member.name,
              supabaseId: member.supabase_id,
              memberData: JSON.stringify(memberData, null, 2)
            });

            // Prepare the data structure for syncFamilyMemberToAgentMemory
            const memberDataForSync = {
              id: member.supabase_id,
              name: member.name,
              family_relationship: member.relationship,
              age: member.age,
              birthday_month: member.birthday_month,
              birthday_day: member.birthday_day,
              email: member.email
            };

            console.log(`🔍 DEBUG ONBOARDING MEMORY: Data structure for sync:`, JSON.stringify(memberDataForSync, null, 2));

            // Save to agent memory using the working saveToAgentMemory method
            console.log(`🔍 DEBUG ONBOARDING MEMORY: Saving family member ${member.name} to agent memory`);

            const result = await profileSuggestionsService.saveToAgentMemory(
              userId,
              'family_info',
              memberData,
              'never',
              null,
              null,
              familyId
            );

            console.log(`🔍 DEBUG ONBOARDING MEMORY: saveToAgentMemory result:`, JSON.stringify(result, null, 2));

            if (result && result.success) {
              results.processed.agentMemories++;
              console.log(`✅ Successfully stored family member ${member.name} in agent memory`);
            } else {
              console.error(`❌ Failed to store family member ${member.name}:`, result?.error || 'Unknown error');
              results.errors.push(`Failed to store family member memory: ${member.name}`);
            }
          } catch (memberError) {
            console.error(`❌ Error storing family member ${member.name} in agent memory:`, memberError);
            console.error(`❌ Error stack:`, memberError.stack);
            results.errors.push(`Failed to store family member memory: ${member.name}`);
          }
        }
      } else {
        console.log(`🔍 DEBUG ONBOARDING MEMORY: No family members to process`);
      }

    } catch (error) {
      console.error('❌ Error in storeInAgentMemory:', error);
      console.error('❌ Error stack:', error.stack);
      results.errors.push('Failed to store agent memory data');
    }
  }

  /**
   * Mark onboarding as completed
   */
  async markOnboardingCompleted(publicUserId) {
    try {
      console.log(`🔍 Marking onboarding complete for public user ID: ${publicUserId}`);

      const { error } = await this.supabase
        .from('users')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', publicUserId);

      if (error) throw error;
      console.log('✅ Marked onboarding as completed for user:', publicUserId);
    } catch (error) {
      console.error('❌ Error marking onboarding as completed:', error);
      throw error; // This is critical, so we throw
    }
  }
}

export default OnboardingDataProcessor;