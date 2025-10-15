/**
 * Family Profile Service - Frontend
 *
 * Handles family profile operations including structured family data (family architecture)
 */

import { apiService } from './authenticatedApiService';
import { ENDPOINTS } from '../config/apiConfig';

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
      source_id?: string;
      timestamp?: string;
      confidence?: number;
      updated_at?: string;
      original_text?: string;
      email_subject?: string;
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

class FamilyProfileService {

  /**
   * Get family profile by family ID
   */
  async getProfile(familyId: string): Promise<ProfileResponse> {
    try {
      console.log('📋 Getting family profile for:', familyId);

      const response = await apiService.post(`${ENDPOINTS.profile}/get`, {
        family_id: familyId // Updated from account_id for family architecture
      });

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('✅ Family profile retrieved successfully');
      return response.data || { success: false, error: 'No data received' };

    } catch (error) {
      console.error('❌ Error getting family profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update family profile
   */
  async updateProfile(familyId: string, updates: Partial<ProfileData>): Promise<ProfileResponse> {
    try {
      console.log('📝 Updating family profile for:', familyId);

      const response = await apiService.post(`${ENDPOINTS.profile}/update`, {
        family_id: familyId, // Updated from account_id for family architecture
        ...updates
      });

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('✅ Family profile updated successfully');
      return response.data || { success: false, error: 'No data received' };

    } catch (error) {
      console.error('❌ Error updating family profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get family profile statistics
   */
  async getProfileStats(familyId: string): Promise<any> {
    try {
      console.log('📊 Getting family profile stats for:', familyId);

      const response = await apiService.get(`${ENDPOINTS.profile}/stats`);

      if (response.error) {
        throw new Error(response.error);
      }

      console.log('✅ Family profile stats retrieved successfully');
      return response.data || { success: false, error: 'No data received' };

    } catch (error) {
      console.error('❌ Error getting family profile stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Save a single field to the family profile
   */
  async saveField(familyId: string, fieldPath: string, value: any): Promise<ProfileResponse> {
    try {
      console.log('💾 Saving family profile field:', fieldPath, value);

      // Create updates object with the single field
      const updates: any = {};
      this.setNestedValue(updates, fieldPath, value);

      // Update profile
      const result = await this.updateProfile(familyId, updates);

      if (result.success) {
        console.log('✅ Family profile field saved successfully');
      } else {
        console.error('❌ Failed to save family profile field:', result.error);
      }

      return result;

    } catch (error) {
      console.error('❌ Error saving family profile field:', error);
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
export const familyProfileService = new FamilyProfileService();
export default familyProfileService;

// Legacy compatibility exports
export const accountProfileService = familyProfileService;
export type { ProfileData, ProfileMetadata, ProfileResponse, DataSource };