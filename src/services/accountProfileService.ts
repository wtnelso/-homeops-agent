/**
 * Account Profile Service - Frontend
 *
 * Handles account profile operations including structured family data
 */

interface DataSource {
  type: 'manual' | 'chat' | 'email';
  source_id?: string;
  timestamp?: string;
  confidence?: number;
  updated_at?: string;
  original_text?: string;
  email_subject?: string;
}

interface ProfileData {
  members: Array<{
    name: string;
    type: 'user' | 'partner' | 'child' | 'pet' | 'parent' | 'sibling' | 'grandparent' | 'other';
    user?: boolean; // true if this is the account user
    order?: number; // for display ordering
    age?: number;
    birthday?: { month: string; day: string };
    email?: string;
    pet_type?: string; // Only for pets - dog, cat, etc.
    source?: {
      type: 'manual' | 'chat' | 'email';
      reference_id?: string;
      content?: string;
      email_subject?: string;
      timestamp?: string;
      confidence?: number;
    };
    schools?: Array<{
      name: string;
      type?: string;
      email_domain?: string;
      grade?: string;
      source?: {
        type: 'manual' | 'chat' | 'email';
        source_id?: string;
        timestamp?: string;
        confidence?: number;
        updated_at?: string;
        original_text?: string;
        email_subject?: string;
      };
    }>;
    activities?: Array<{
      name: string;
      type?: string;
      frequency?: string;
      days?: string[];
      end_date?: string;
      source?: {
        type: 'manual' | 'chat' | 'email';
        source_id?: string;
        timestamp?: string;
        confidence?: number;
        updated_at?: string;
        original_text?: string;
        email_subject?: string;
      };
    }>;
  }>;
  activities: {
    recurring_events: Array<{
      name: string;
      frequency: string;
      day_of_week?: string;
      time?: string;
      duration?: string;
      location?: string;
      participants?: string[];
      notes?: string;
    }>;
    hobbies: Array<{
      name: string;
      participants?: string[];
      frequency?: string;
      skill_level?: string;
    }>;
  };
  preferences: any; // Keeping flexible for now
  contacts: {
    healthcare: Array<{
      name: string;
      type: string;
      phone: string;
      address?: string;
      for_family_members?: string[];
      appointment_booking?: string;
    }>;
    schools: Array<{
      name: string;
      child: string;
      grade?: string;
      teacher?: string;
      phone?: string;
      email?: string;
    }>;
    services: Array<{
      name: string;
      service_type: string;
      contact: string;
      schedule?: string;
      cost?: string;
      notes?: string;
    }>;
  };
  metadata?: {
    version: number;
    created_at: string;
    updated_at: string;
    last_ai_update?: string;
    completeness_score: number;
  };
  _sources?: { [fieldPath: string]: DataSource };
}

interface ProfileMetadata {
  created_at: string;
  updated_at: string;
  last_ai_update?: string;
  version: number;
  completeness_score: number;
}

interface ProfileResponse {
  success: boolean;
  profile?: ProfileData;
  metadata?: ProfileMetadata;
  changes?: any;
  error?: string;
}

class AccountProfileService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
  }

  /**
   * Get account profile by account ID
   */
  async getProfile(accountId: string): Promise<ProfileResponse> {
    try {
      console.log('📋 Getting account profile for:', accountId);

      const response = await fetch(`${this.baseUrl}/api/profile/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ account_id: accountId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Profile retrieved successfully');
      return data;

    } catch (error) {
      console.error('❌ Error getting profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update account profile
   */
  async updateProfile(accountId: string, updates: Partial<ProfileData>): Promise<ProfileResponse> {
    try {
      console.log('📝 Updating account profile for:', accountId);

      const response = await fetch(`${this.baseUrl}/api/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: accountId,
          ...updates
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Profile updated successfully');
      return data;

    } catch (error) {
      console.error('❌ Error updating profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get profile statistics
   */
  async getProfileStats(accountId: string): Promise<any> {
    try {
      console.log('📊 Getting profile stats for:', accountId);

      const response = await fetch(`${this.baseUrl}/api/profile/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': accountId,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Profile stats retrieved successfully');
      return data;

    } catch (error) {
      console.error('❌ Error getting profile stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save a single field to the profile
   */
  async saveField(accountId: string, fieldPath: string, value: any): Promise<ProfileResponse> {
    try {
      console.log('💾 Saving field:', fieldPath, value);

      // Create updates object with the single field
      const updates: any = {};
      this.setNestedValue(updates, fieldPath, value);

      // Update profile
      const result = await this.updateProfile(accountId, updates);

      if (result.success) {
        console.log('✅ Field saved successfully');
      } else {
        console.error('❌ Failed to save field:', result.error);
      }

      return result;

    } catch (error) {
      console.error('❌ Error saving field:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Set nested object value by path (e.g., 'members.0.name')
   * @private
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        // Check if next key is numeric (array index)
        const nextKey = keys[i + 1];
        current[key] = /^\d+$/.test(nextKey) ? [] : {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }
}

// Export singleton instance
export const accountProfileService = new AccountProfileService();
export default accountProfileService;
export type { ProfileData, ProfileMetadata, ProfileResponse, DataSource };