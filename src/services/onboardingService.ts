import { SimplifiedOnboardingData } from '../components/onboarding/SimplifiedOnboarding';

export interface OnboardingCompletionResult {
  success: boolean;
  message?: string;
  warnings?: string[];
  processed?: {
    familyMembers: number;
    activities: number;
    schools: number;
    emailDomains: number;
    importantPlaces: number;
    agentMemories: number;
  };
  error?: string;
  details?: string[];
}

interface OnboardingMemoryEntry {
  memoryType: string;
  key: string;
  value: Record<string, any>;
  priority?: number;
  confidenceScore?: number;
}

export class OnboardingService {
  private static baseUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';

  /**
   * Complete onboarding by processing localStorage data and storing in databases
   */
  static async completeOnboarding(
    data: SimplifiedOnboardingData,
    familyId: string,
    publicUserId: string
  ): Promise<OnboardingCompletionResult> {
    try {
      console.log('🎯 OnboardingService: Starting onboarding completion');
      console.log('📊 Data summary:', {
        familyMembers: data.familyMembers?.length || 0,
        activities: data.activities?.length || 0,
        schools: data.schools?.length || 0,
        emailDomains: data.emailDomains?.length || 0,
        importantPlaces: data.importantPlaces?.length || 0
      });

      // Get the current session token
      const { data: { session } } = await import('../lib/supabase').then(({ supabase }) => supabase.auth.getSession());

      if (!session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(`${this.baseUrl}/api/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          onboardingData: data,
          familyId: familyId,
          publicUserId: publicUserId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API request failed:', response.status, errorData);

        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: Failed to complete onboarding`,
          details: errorData.details || []
        };
      }

      const result = await response.json();
      console.log('✅ Onboarding completion result:', result);

      return result;

    } catch (error) {
      console.error('💥 Error completing onboarding:', error);

      return {
        success: false,
        error: 'Network error: Could not connect to server',
        details: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Clean up localStorage after successful onboarding completion
   */
  static cleanupOnboardingData(): void {
    try {
      console.log('🧹 Cleaning up onboarding localStorage data');

      // Remove onboarding-specific data
      localStorage.removeItem('onboarding_data');
      localStorage.removeItem('onboarding_debug');
      localStorage.removeItem('oauth_from_onboarding');
      localStorage.removeItem('oauth_return_url');
      localStorage.removeItem('oauth_integration_pending');
      localStorage.removeItem('oauth_redirect_debug');

      console.log('✅ Onboarding localStorage cleanup completed');
    } catch (error) {
      console.error('❌ Error cleaning up localStorage:', error);
    }
  }

  /**
   * Generate user-friendly message based on completion result
   */
  static getCompletionMessage(result: OnboardingCompletionResult): {
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
  } {
    if (!result.success) {
      return {
        type: 'error',
        title: 'Onboarding Failed',
        message: result.error || 'Failed to complete onboarding. Please try again.'
      };
    }

    if (result.warnings && result.warnings.length > 0) {
      const savedCount = Object.values(result.processed || {}).reduce((sum, count) => sum + count, 0);
      return {
        type: 'warning',
        title: 'Onboarding Completed',
        message: `Welcome to HomeOps! Some of your information was saved (${savedCount} items), but some couldn't be processed. You can add missing details later in Settings.`
      };
    }

    const savedCount = Object.values(result.processed || {}).reduce((sum, count) => sum + count, 0);
    return {
      type: 'success',
      title: 'Welcome to HomeOps!',
      message: `Your onboarding is complete! We've saved ${savedCount} pieces of information about your family to help personalize your experience.`
    };
  }
}

/**
 * LEGACY: Save simplified onboarding data to agent memory system
 * @deprecated Use OnboardingService.completeOnboarding() instead
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