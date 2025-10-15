/**
 * Profile Suggestions Service
 *
 * Handles fetching and managing AI-generated profile suggestions
 */

import { apiService } from './authenticatedApiService';

export interface ProfileSuggestion {
  id: string;
  suggestion_type: 'family_info' | 'contact_add' | 'preference_update';
  suggested_data: any;
  confidence_score: number;
  source_email_id?: string;
  source_email_subject?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  account_id: string;
  suggestion_category?: 'new_person' | 'update_info' | 'possible_duplicate' | 'new_contact';
}

export interface SuggestionsResponse {
  success: boolean;
  suggestions: ProfileSuggestion[];
  total_count: number;
  error?: string;
}

export interface ActionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

class ProfileSuggestionsService {
  /**
   * Fetch pending profile suggestions for the current user
   */
  async getPendingSuggestions(userId: string, limit = 10): Promise<SuggestionsResponse> {
    try {
      console.log('🔍 SERVICE DEBUG: getPendingSuggestions called with userId:', userId);

      const response = await apiService.get(`/api/profile-suggestions?status=pending&limit=${limit}&userId=${userId}`);

      console.log('🔍 SERVICE DEBUG: API service response:', response);

      if (response.error) {
        console.log('🔍 SERVICE DEBUG: Request failed:', response.error);
        return {
          success: false,
          suggestions: [],
          total_count: 0,
          error: response.error
        };
      }

      console.log('🔍 SERVICE DEBUG: Returning successful response');
      return response.data || {
        success: false,
        suggestions: [],
        total_count: 0,
        error: 'No data received'
      };
    } catch (error) {
      console.error('Error fetching profile suggestions:', error);
      return {
        success: false,
        suggestions: [],
        total_count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Approve a profile suggestion
   */
  async approveSuggestion(suggestionId: string, userId: string): Promise<ActionResponse> {
    try {
      // Get JWT token from Supabase session
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return {
          success: false,
          error: 'No authentication token available'
        };
      }

      const response = await fetch(`${this.baseUrl}/api/profile-suggestions/${suggestionId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve suggestion');
      }

      return data;
    } catch (error) {
      console.error('Error approving suggestion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Reject a profile suggestion
   */
  async rejectSuggestion(suggestionId: string, userId: string): Promise<ActionResponse> {
    try {
      // Get JWT token from Supabase session
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return {
          success: false,
          error: 'No authentication token available'
        };
      }

      const response = await fetch(`${this.baseUrl}/api/profile-suggestions/${suggestionId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': userId,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject suggestion');
      }

      return data;
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Bulk approve multiple suggestions
   */
  async bulkApprove(suggestionIds: string[], userId: string): Promise<ActionResponse> {
    try {
      // Get JWT token from Supabase session
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return {
          success: false,
          error: 'No authentication token available'
        };
      }

      const response = await fetch(`${this.baseUrl}/api/profile-suggestions/bulk-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify({ suggestion_ids: suggestionIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to bulk approve suggestions');
      }

      return data;
    } catch (error) {
      console.error('Error bulk approving suggestions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Bulk reject multiple suggestions
   */
  async bulkReject(suggestionIds: string[], userId: string): Promise<ActionResponse> {
    try {
      // Get JWT token from Supabase session
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return {
          success: false,
          error: 'No authentication token available'
        };
      }

      const response = await fetch(`${this.baseUrl}/api/profile-suggestions/bulk-reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'x-user-id': userId,
        },
        body: JSON.stringify({ suggestion_ids: suggestionIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to bulk reject suggestions');
      }

      return data;
    } catch (error) {
      console.error('Error bulk rejecting suggestions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Approve a suggestion with user edits
   */
  async approveSuggestionWithEdits(suggestionId: string, userId: string, editData: any, suggestionType: string, familyId: string): Promise<ActionResponse> {
    try {
      // Get JWT token from Supabase session
      const { supabase } = await import('../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        return {
          success: false,
          error: 'No authentication token available'
        };
      }

      const response = await fetch(`${this.baseUrl}/api/profile-suggestions/${suggestionId}/approve-with-edits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          edit_data: editData,
          userId: userId,
          suggestionType: suggestionType,
          familyId: familyId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve edited suggestion');
      }

      return data;
    } catch (error) {
      console.error('Error approving edited suggestion:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get suggestion type display name
   */
  getSuggestionTypeDisplay(type: string): string {
    const displayMap = {
      'family_info': 'Family Information',
      'contact_add': 'New Contact',
      'preference_update': 'Preference Update'
    };
    return displayMap[type as keyof typeof displayMap] || type;
  }

  /**
   * Get confidence level display
   */
  getConfidenceLevel(score: number): { level: string; color: string; bgColor: string } {
    if (score >= 0.8) {
      return { level: 'High', color: 'text-green-700', bgColor: 'bg-green-100' };
    } else if (score >= 0.6) {
      return { level: 'Medium', color: 'text-yellow-700', bgColor: 'bg-yellow-100' };
    } else {
      return { level: 'Low', color: 'text-red-700', bgColor: 'bg-red-100' };
    }
  }

  /**
   * Get category badge styling
   */
  getCategoryBadge(category: string): { badge: string; bgColor: string; textColor: string } {
    switch (category) {
      case 'new_person':
        return {
          badge: 'New Family Member',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-300'
        };
      case 'new_contact':
        return {
          badge: 'New Contact',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          textColor: 'text-green-700 dark:text-green-300'
        };
      case 'update_info':
        return {
          badge: 'Update Info',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          textColor: 'text-orange-700 dark:text-orange-300'
        };
      case 'possible_duplicate':
        return {
          badge: 'Possible Duplicate',
          bgColor: 'bg-gray-100 dark:bg-gray-700',
          textColor: 'text-gray-700 dark:text-gray-300'
        };
      default:
        return {
          badge: 'New Person',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-300'
        };
    }
  }
}

export const profileSuggestionsService = new ProfileSuggestionsService();
export default profileSuggestionsService;