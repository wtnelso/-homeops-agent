import { supabase } from '../lib/supabase';

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
  };
  account: {
    id: string;
    account_name: string | null;
    subscription_status: 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | 'unpaid';
    subscription_plan: 'free' | 'pro' | 'enterprise';
    trial_ends_at: string | null;
    max_users: number;
    created_at: string;
    onboarded_at: string | null;
    household_type: string | null;
    timezone: string | null;
    agent_profile: any;
    email_weights: any;
    email_policies: any;
  };
  integrations: Array<{
    id: string;
    integration_id: string;
    status: 'connected' | 'disconnected' | 'error' | 'syncing';
    enabled: boolean;
    connected_at: string | null;
    last_sync_at: string | null;
    total_syncs: number;
    last_error: string | null;
    installed_by_user_id: string | null;
    integration: {
      name: string;
      description: string;
      category: 'email' | 'communication' | 'productivity' | 'video' | 'project-management' | 'calendar';
    };
  }>;
  team_members: Array<{
    id: string;
    email: string;
    name: string | null;
    role: 'owner' | 'admin' | 'member' | 'readonly';
    is_active: boolean;
    email_verified: boolean;
    created_at: string;
  }>;
}

export interface UserSessionError {
  error: string;
  user: null;
  account: null;
  integrations: [];
  team_members: [];
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
        account: null,
        integrations: [],
        team_members: []
      };
    }

    try {
      console.log('Attempting to fetch user session data...');
      
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('No authenticated user:', authError);
        return {
          error: 'No authenticated user',
          user: null,
          account: null,
          integrations: [],
          team_members: []
        };
      }
      
      // Get user by auth_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          accounts (*)
        `)
        .eq('auth_id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        // If user not found, they probably need to complete onboarding
        if (userError.code === 'PGRST116') {
          return {
            error: 'User not found - needs onboarding',
            user: null,
            account: null,
            integrations: [],
            team_members: []
          };
        }
        return {
          error: userError.message,
          user: null,
          account: null,
          integrations: [],
          team_members: []
        };
      }

      console.log('Found user data:', userData);

      // Get account integrations
      const { data: integrationsData, error: integrationsError } = await supabase
        .from('account_integrations')
        .select(`
          *,
          integrations (*)
        `)
        .eq('account_id', userData.account_id);

      if (integrationsError) {
        console.error('Error fetching integrations:', integrationsError);
      } else {
        console.log('Found integrations data:', integrationsData);
      }

      // Get team members
      const { data: teamData, error: teamError } = await supabase
        .from('users')
        .select('*')
        .eq('account_id', userData.account_id)
        .eq('is_active', true);

      if (teamError) {
        console.error('Error fetching team members:', teamError);
      }

      return {
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
        },
        account: userData.accounts ? {
          id: userData.accounts.id,
          account_name: userData.accounts.account_name,
          subscription_status: userData.accounts.subscription_status,
          subscription_plan: userData.accounts.subscription_plan,
          trial_ends_at: userData.accounts.trial_ends_at,
          max_users: userData.accounts.max_users,
          created_at: userData.accounts.created_at,
          onboarded_at: userData.accounts.onboarded_at,
          household_type: userData.accounts.household_type,
          timezone: userData.accounts.timezone,
          agent_profile: userData.accounts.agent_profile,
          email_weights: userData.accounts.email_weights,
          email_policies: userData.accounts.email_policies,
        } : {
          id: '',
          account_name: null,
          subscription_status: 'inactive' as const,
          subscription_plan: 'free' as const,
          trial_ends_at: null,
          max_users: 1,
          created_at: '',
          onboarded_at: null,
          household_type: null,
          timezone: 'UTC',
          agent_profile: {},
          email_weights: {},
          email_policies: {},
        },
        integrations: integrationsData?.map(ai => ({
          id: ai.id,
          integration_id: ai.integration_id,
          status: ai.status,
          enabled: ai.enabled,
          connected_at: ai.connected_at,
          last_sync_at: ai.last_sync_at,
          total_syncs: ai.total_syncs,
          last_error: ai.last_error,
          installed_by_user_id: ai.installed_by_user_id,
          integration: {
            name: ai.integrations.name,
            description: ai.integrations.description,
            category: ai.integrations.category
          }
        })) || [],
        team_members: teamData?.map(tm => ({
          id: tm.id,
          email: tm.email,
          name: tm.name,
          role: tm.role,
          is_active: tm.is_active,
          email_verified: tm.email_verified,
          created_at: tm.created_at,
        })) || []
      };
    } catch (err) {
      console.error('Unexpected error fetching user session data:', err);
      return {
        error: 'Unexpected error occurred',
        user: null,
        account: null,
        integrations: [],
        team_members: []
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
   * Checks if account needs onboarding (hasn't completed setup)
   */
  static isOnboardingRequired(userData: UserSessionData): boolean {
    return !userData.account.onboarded_at || !userData.account.id;
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
      integration.enabled && integration.status === 'connected'
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
}