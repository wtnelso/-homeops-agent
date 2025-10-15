import { supabase } from '../lib/supabase';

export interface FamilyContact {
  id?: string;
  contact_name: string;
  contact_type: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  source?: {
    type: 'email' | 'manual' | 'chat';
    confidence?: number;
    timestamp: string;
    updated_at?: string;
    email_subject?: string;
    source_id?: string;
    original_text?: string;
  };
}

export interface FamilyActivity {
  id?: string;
  activity_name: string;
  activity_type: string;
  frequency?: string;
  days?: string[];
  end_date?: string;
  source?: {
    type: 'email' | 'manual' | 'chat';
    confidence?: number;
    timestamp: string;
    updated_at?: string;
    email_subject?: string;
    source_id?: string;
    original_text?: string;
  };
}

export interface FamilySchool {
  id?: string;
  school_name: string;
  school_type: string;
  grade?: string;
  email_domain?: string;
  source?: {
    type: 'email' | 'manual' | 'chat';
    confidence?: number;
    timestamp: string;
    updated_at?: string;
    email_subject?: string;
    source_id?: string;
    original_text?: string;
  };
}

export interface UserIntegration {
  id: string;
  integration_id: string;
  status: string;
}

export interface FamilyMember {
  family_member_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  role?: 'owner' | 'admin' | 'member' | 'readonly';
  is_active?: boolean;
  family_relationship: string;
  age: number | null;
  birthday_month: string | null;
  birthday_day: number | null;
  created_at: string;
  activities?: FamilyActivity[];
  schools?: FamilySchool[];
  // For legacy compatibility and user member identification
  type?: string;
  isCurrentUser?: boolean;
}

export interface Family {
  id: string;
  name: string;
  family_type: string | null;
  contacts: FamilyContact[];
  keywords: any[];
  members: FamilyMember[];
  activities?: FamilyActivity[];
}

export interface UserSessionData {
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    avatar_user_provided: string | null;
    role: 'owner' | 'admin' | 'member' | 'readonly';
    is_active: boolean;
    email_verified: boolean;
    last_login_at: string | null;
    created_at: string;
    family_id: string | null;
    family_relationship: string | null;
    activities: FamilyActivity[];
    schools: FamilySchool[];
    agent_name: string | null;
    account_name: string | null;
    timezone: string | null;
  };
  family: Family | null;
  integrations: UserIntegration[];
}

export interface UserSessionError {
  error: string;
  user: null;
  family: null;
  integrations: [];
}

export class UserSessionService {
  /**
   * Fetches comprehensive user session data including account, integrations, and team members
   * This should be called on login and when user data needs to be refreshed
   */
  static async getUserSessionData(): Promise<UserSessionData | UserSessionError> {
    if (!supabase) {
      return {
        error: 'Supabase not configured',
        user: null,
        family: null,
        integrations: []
      };
    }

    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('No authenticated user:', authError);
        return {
          error: 'No authenticated user',
          user: null,
          family: null,
          integrations: []
        };
      }
      
      // Use the new RPC to get all user session data in one call
      const { data: sessionData, error: sessionError } = await supabase
        .rpc('get_user_session_data', { auth_user_id: user.id });

      if (sessionError) {
        console.error('Error fetching user session data:', sessionError);
        return {
          error: sessionError.message,
          user: null,
          family: null,
          integrations: []
        };
      }

      if (sessionData?.error) {
        console.error('User session RPC error:', sessionData.error);
        if (sessionData.error === 'User not found') {
          return {
            error: 'User not found - needs onboarding',
            user: null,
            family: null,
            integrations: []
          };
        }
        return {
          error: sessionData.error,
          user: null,
          family: null,
          integrations: []
        };
      }

      const userData = sessionData.user;
      const familyData = sessionData.family;
      const integrationsData = sessionData.user_integrations;

      const result = {
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name_user_provided || userData.name_auth_provided,
          avatar_url: userData.avatar_url,
          avatar_user_provided: userData.avatar_user_provided,
          role: userData.role,
          is_active: userData.is_active,
          email_verified: userData.email_verified,
          last_login_at: userData.last_login_at,
          created_at: userData.created_at,
          family_id: userData.family_id,
          family_relationship: userData.family_relationship,
          activities: userData.activities || [],
          schools: userData.schools || [],
          agent_name: userData.agent_name,
          account_name: userData.account_name,
          timezone: userData.timezone,
        },
        family: familyData,
        integrations: integrationsData || []
      };

      console.log('📋 UserSession data:');
      console.log(result);
      return result;
    } catch (err) {
      console.error('Unexpected error fetching user session data:', err);
      return {
        error: 'Unexpected error occurred',
        user: null,
        family: null,
        integrations: []
      };
    }
  }

  /**
   * Updates the user's last login timestamp
   * Should be called immediately after successful authentication
   */
  static async updateLastLogin(): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.rpc('update_user_last_login');
      
      if (error) {
        console.error('Error updating last login:', error);
        return { success: false, error: error.message };
      }

      return { success: data?.success || false, error: data?.error };
    } catch (err) {
      console.error('Unexpected error updating last login:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Checks if user needs onboarding (hasn't completed setup)
   */
  static isOnboardingRequired(userData: UserSessionData): boolean {
    return !userData.user.is_active;
  }

  /**
   * Checks if user's email is verified
   */
  static isEmailVerified(userData: UserSessionData): boolean {
    return userData.user.email_verified;
  }

  /**
   * Gets active integrations for the account
   */
  static getActiveIntegrations(userData: UserSessionData) {
    return userData.integrations.filter(integration =>
      integration.status === 'connected'
    );
  }

  /**
   * Gets integration by ID
   */
  static getIntegrationById(userData: UserSessionData, integrationId: string) {
    return userData.integrations.find(integration =>
      integration.integration_id === integrationId
    );
  }

  /**
   * Save family contact to Supabase family_contacts table
   * @param contactData - Contact information to save
   * @returns Promise with success/error result
   */
  static async saveFamilyContact(contactData: {
    name: string;
    type: string;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; contact?: FamilyContact }> {
    if (!supabase) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'No authenticated user' };
      }

      // Get user's family_id
      const { data: userData, error: userError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .single();

      if (userError || !userData?.family_id) {
        return { success: false, error: 'Family not found for user' };
      }

      const familyId = userData.family_id;

      // Prepare contact record
      const contactRecord = {
        family_id: familyId,
        contact_name: contactData.name,
        contact_type: contactData.type,
        phone: contactData.phone || null,
        email: contactData.email || null,
        address: contactData.address || null,
        notes: contactData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if contact already exists
      const { data: existingContact, error: checkError } = await supabase
        .from('family_contacts')
        .select('id')
        .eq('family_id', familyId)
        .eq('contact_name', contactRecord.contact_name)
        .eq('contact_type', contactRecord.contact_type)
        .maybeSingle();

      if (checkError) {
        return { success: false, error: `Error checking existing contact: ${checkError.message}` };
      }

      if (existingContact) {
        // Update existing contact
        const { data: updatedContact, error: updateError } = await supabase
          .from('family_contacts')
          .update({
            phone: contactRecord.phone,
            email: contactRecord.email,
            address: contactRecord.address,
            notes: contactRecord.notes,
            updated_at: contactRecord.updated_at
          })
          .eq('id', existingContact.id)
          .select()
          .single();

        if (updateError) {
          return { success: false, error: `Error updating contact: ${updateError.message}` };
        }

        return {
          success: true,
          contact: {
            id: updatedContact.id,
            contact_name: updatedContact.contact_name,
            contact_type: updatedContact.contact_type,
            phone: updatedContact.phone,
            email: updatedContact.email,
            notes: updatedContact.notes
          }
        };
      } else {
        // Insert new contact
        const { data: newContact, error: insertError } = await supabase
          .from('family_contacts')
          .insert(contactRecord)
          .select()
          .single();

        if (insertError) {
          return { success: false, error: `Error creating contact: ${insertError.message}` };
        }

        return {
          success: true,
          contact: {
            id: newContact.id,
            contact_name: newContact.contact_name,
            contact_type: newContact.contact_type,
            phone: newContact.phone,
            email: newContact.email,
            notes: newContact.notes
          }
        };
      }
    } catch (err) {
      console.error('Unexpected error saving family contact:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
}