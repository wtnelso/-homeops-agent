import { SimplifiedOnboardingData } from '../components/onboarding/SimplifiedOnboarding';

interface OnboardingMemoryEntry {
  memoryType: string;
  key: string;
  value: Record<string, any>;
  priority?: number;
  confidenceScore?: number;
}

/**
 * Save simplified onboarding data to agent memory system
 */
export async function saveOnboardingToMemory(
  accountId: string,
  data: SimplifiedOnboardingData
): Promise<{ success: boolean; error?: string }> {
  try {
    const apiUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';

    // Transform onboarding data into memory entries
    const memoryEntries: OnboardingMemoryEntry[] = [];

    // 1. Save family members as family_info entries
    data.familyMembers.forEach((member) => {
      const memberKey = `family_member_${member.name.toLowerCase().replace(/\s+/g, '_')}`;

      memoryEntries.push({
        memoryType: 'family_info',
        key: memberKey,
        value: {
          name: member.name,
          relationship: member.relationship,
          ...(member.age && { age: member.age }),
          ...(member.grade && { grade: member.grade }),
          context_type: 'profile_info'
        },
        priority: 2, // Important family info
        confidenceScore: 0.95 // High confidence from direct user input
      });
    });

    // 2. Save schools as school entries
    data.schools.forEach((school, index) => {
      memoryEntries.push({
        memoryType: 'school',
        key: `school_${index + 1}`,
        value: {
          name: school,
          context_type: 'institution_info'
        },
        priority: 2,
        confidenceScore: 0.9
      });
    });

    // 3. Save activities as preferences entries
    data.activities.forEach((activity) => {
      memoryEntries.push({
        memoryType: 'preferences',
        key: `family_activity_${activity.toLowerCase().replace(/\s+/g, '_')}`,
        value: {
          preference: activity,
          type: 'participates_in',
          category: 'activities',
          context_type: 'preference_setting'
        },
        priority: 3,
        confidenceScore: 0.85
      });
    });

    // 4. Save email domains as contacts entries
    data.emailDomains.forEach((domain, index) => {
      memoryEntries.push({
        memoryType: 'contacts',
        key: `email_domain_${index + 1}`,
        value: {
          domain: domain,
          type: 'important_domain',
          context_type: 'contact_info'
        },
        priority: 3,
        confidenceScore: 0.8
      });
    });

    // 5. Save important places as general info
    data.importantPlaces.forEach((place) => {
      memoryEntries.push({
        memoryType: 'preferences',
        key: `important_place_${place.toLowerCase().replace(/\s+/g, '_')}`,
        value: {
          preference: place,
          type: 'frequent_location',
          category: 'places',
          context_type: 'preference_setting'
        },
        priority: 3,
        confidenceScore: 0.8
      });
    });

    // 6. Save user preferences (name and timezone)
    memoryEntries.push({
      memoryType: 'preferences',
      key: 'user_timezone',
      value: {
        preference: data.timezone,
        type: 'timezone_setting',
        category: 'system',
        context_type: 'preference_setting'
      },
      priority: 2,
      confidenceScore: 0.95
    });

    memoryEntries.push({
      memoryType: 'family_info',
      key: 'primary_user',
      value: {
        name: data.userName,
        relationship: 'self',
        context_type: 'profile_info'
      },
      priority: 1,
      confidenceScore: 1.0
    });

    console.log('💾 Saving onboarding data as memory entries:', memoryEntries.length, 'entries');

    // Save all memory entries to the backend
    const savePromises = memoryEntries.map(async (entry) => {
      const response = await fetch(`${apiUrl}/api/agent-memory/store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: accountId,
          memory_type: entry.memoryType,
          key: entry.key,
          value: entry.value,
          source_type: 'manual',
          source_id: `onboarding_${new Date().toISOString()}`,
          confidence_score: entry.confidenceScore,
          priority: entry.priority,
          expires_at: null // Onboarding data doesn't expire
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to save memory entry ${entry.key}: ${error}`);
      }

      return response.json();
    });

    // Wait for all saves to complete
    await Promise.all(savePromises);
    console.log('✅ Successfully saved all onboarding memory entries');

    return { success: true };

  } catch (error) {
    console.error('❌ Error saving onboarding data to memory:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save onboarding data'
    };
  }
}

/**
 * Mark user onboarding as complete
 */
export async function completeOnboarding(accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const apiUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';

    const response = await fetch(`${apiUrl}/api/profile/complete-onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account_id: accountId }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to complete onboarding: ${error}`);
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error completing onboarding:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete onboarding'
    };
  }
}