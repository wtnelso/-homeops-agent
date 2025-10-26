// User Integrations Service
// Handles user-level integration management with upsert logic (family architecture)

import { supabase } from '../lib/supabase';
import { GmailForwardingService } from './gmailForwardingService';

export interface UserIntegration {
  id: string;
  user_id: string;
  integration_id: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  enabled: boolean;
  access_token?: string | null;
  refresh_token?: string | null;
  token_expires_at?: string | null;
  scopes?: string[] | null;
  config?: Record<string, any>;
  last_sync_at?: string | null;
  sync_frequency_minutes?: number;
  total_syncs?: number;
  last_error?: string | null;
  last_error_at?: string | null;
  installed_by_user_id?: string | null;
  connected_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IntegrationWithUserStatus {
  // From integrations table
  id: string;
  name: string;
  description: string;
  long_description?: string;
  platform_url?: string;
  how_it_works?: string;
  setup_instructions?: string;
  why_setup?: string;
  image_url: string | null;
  category: string;
  status: 'available' | 'coming_soon' | 'beta';
  sort_order: number;
  required_scopes?: string[];

  // Simplified user integration status
  isConnected: boolean; // true if status === 'connected', false otherwise
  user_integration?: UserIntegration;
}

export class UserIntegrationsService {
  /**
   * Get all available integrations with user installation status
   */
  static async getIntegrationsForUser(userId: string): Promise<IntegrationWithUserStatus[]> {
    try {
      // Get all available integrations (only show those with status 'available')
      const { data: availableIntegrations, error: integrationsError } = await supabase
        .from('integrations')
        .select(`
          id,
          name,
          description,
          long_description,
          platform_url,
          how_it_works,
          setup_instructions,
          why_setup,
          image_url,
          category,
          status,
          sort_order,
          required_scopes
        `)
        .eq('status', 'available')
        .order('sort_order');

      if (integrationsError) throw integrationsError;

      // Get user's installed integrations
      const { data: userIntegrations, error: userError } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId);

      if (userError) throw userError;

      // Create a map of user integrations by integration_id
      const userIntegrationMap = new Map<string, UserIntegration>();
      userIntegrations?.forEach(ui => {
        userIntegrationMap.set(ui.integration_id, ui);
      });

      // Merge data
      return availableIntegrations?.map(integration => {
        const userIntegration = userIntegrationMap.get(integration.id);

        return {
          ...integration,
          user_integration: userIntegration,
          isConnected: userIntegration?.status === 'connected'
        };
      }) || [];

    } catch (error) {
      console.error('Error fetching integrations for user:', error);
      return [];
    }
  }

  /**
   * Install/Connect an integration for a user (UPSERT)
   */
  static async installIntegration(params: {
    userId: string;
    integrationId: string;
    installedByUserId: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: string;
    scopes?: string[];
    config?: Record<string, any>;
  }): Promise<{ success: boolean; integration?: UserIntegration; error?: string }> {
    try {
      // Special handling for gmail-forwarding - use dedicated service
      if (params.integrationId === 'gmail-forwarding') {
        return await GmailForwardingService.installGmailForwarding({
          userId: params.userId,
          installedByUserId: params.installedByUserId
        });
      }

      const upsertData = {
        user_id: params.userId,
        integration_id: params.integrationId,
        status: 'connected' as const,
        enabled: true,
        access_token: params.accessToken || null,
        refresh_token: params.refreshToken || null,
        token_expires_at: params.tokenExpiresAt || null,
        scopes: params.scopes || null,
        config: params.config || {},
        installed_by_user_id: params.installedByUserId,
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        last_error: null,
        last_error_at: null
      };

      const { data, error } = await supabase
        .from('user_integrations')
        .upsert(upsertData, {
          onConflict: 'user_id,integration_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, integration: data };
    } catch (error) {
      console.error('Error installing integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Installation failed'
      };
    }
  }

  /**
   * Uninstall/Disconnect an integration (UPDATE status to disconnected)
   */
  static async uninstallIntegration(params: {
    userId: string;
    integrationId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({
          status: 'disconnected',
          enabled: false,
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
          connected_at: null,
          last_error: null,
          config: {}, // Clear config data including generated email addresses
          updated_at: new Date().toISOString()
        })
        .eq('user_id', params.userId)
        .eq('integration_id', params.integrationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error uninstalling integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Uninstall failed'
      };
    }
  }

  /**
   * Update integration configuration
   */
  static async updateIntegrationConfig(params: {
    userId: string;
    integrationId: string;
    config: Record<string, any>;
    enabled?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        config: params.config,
        updated_at: new Date().toISOString()
      };

      if (params.enabled !== undefined) {
        updateData.enabled = params.enabled;
      }

      const { error } = await supabase
        .from('user_integrations')
        .update(updateData)
        .eq('user_id', params.userId)
        .eq('integration_id', params.integrationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating integration config:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Get specific user integration by UUID
   */
  static async getUserIntegrationById(integrationUuid: string): Promise<UserIntegration | null> {
    try {
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('id', integrationUuid)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return data;
    } catch (error) {
      console.error('Error fetching user integration:', error);
      return null;
    }
  }

  /**
   * Update integration status (for sync operations)
   */
  static async updateIntegrationStatus(params: {
    integrationUuid: string;
    status: 'connected' | 'disconnected' | 'error' | 'syncing';
    lastSyncAt?: string;
    lastError?: string | null;
    incrementSyncCount?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        status: params.status,
        updated_at: new Date().toISOString()
      };

      if (params.lastSyncAt) {
        updateData.last_sync_at = params.lastSyncAt;
      }

      if (params.lastError !== undefined) {
        updateData.last_error = params.lastError;
        updateData.last_error_at = params.lastError ? new Date().toISOString() : null;
      }

      if (params.incrementSyncCount) {
        updateData.total_syncs = supabase.rpc('increment', { value: 1 });
      }

      const { error } = await supabase
        .from('user_integrations')
        .update(updateData)
        .eq('id', params.integrationUuid);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating integration status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Status update failed'
      };
    }
  }
}

// Legacy compatibility exports
export const AccountIntegrationsService = UserIntegrationsService;
export type AccountIntegration = UserIntegration;
export type IntegrationWithAccountStatus = IntegrationWithUserStatus;