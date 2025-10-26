import { supabase } from '../lib/supabase';
import { UserIntegrationsService } from './userIntegrationsService';

// Keep for backward compatibility
export interface AvailableIntegration {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  category: string;
  status: 'available' | 'coming_soon' | 'beta';
  sort_order: number;
}

// Simplified integration status interface
export interface IntegrationWithStatus extends AvailableIntegration {
  // Additional fields from database
  long_description?: string;
  platform_url?: string;
  how_it_works?: string;
  setup_instructions?: string;
  why_setup?: string;
  required_scopes?: string[];
  // Simplified status
  isConnected: boolean; // true if status === 'connected', false otherwise
  // Additional details for settings/debug (optional)
  connectedAt: string | null;
  lastSyncAt: string | null;
  totalSyncs: number;
  lastError: string | null;
  installedByUserId: string | null;
  accountIntegrationId?: string;
  // Config data from user_integrations (includes email_address for gmail-forwarding)
  config?: Record<string, any> | null;
}

export class IntegrationsDataService {
  /**
   * Fetch all available integrations from the database (unchanged)
   */
  static async getAvailableIntegrations(): Promise<AvailableIntegration[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('id, name, description, image_url, category, status, sort_order')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching integrations:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error fetching integrations:', err);
      return [];
    }
  }

  /**
   * Get integrations with user-level status (NEW - preferred method for family architecture)
   */
  static async getIntegrationsForUser(userId: string): Promise<IntegrationWithStatus[]> {
    // Use the updated user-based method
    const integrations = await UserIntegrationsService.getIntegrationsForUser(userId);

    // Convert to simplified format (keeping account_integration naming for now)
    return integrations.map((integration: any) => ({
      ...integration,
      long_description: integration.long_description,
      platform_url: integration.platform_url,
      how_it_works: integration.how_it_works,
      setup_instructions: integration.setup_instructions,
      why_setup: integration.why_setup,
      required_scopes: integration.required_scopes,
      isConnected: integration.isConnected, // Already simplified in AccountIntegrationsService
      connectedAt: integration.user_integration?.connected_at || null,
      lastSyncAt: integration.user_integration?.last_sync_at || null,
      totalSyncs: integration.user_integration?.total_syncs || 0,
      lastError: integration.user_integration?.last_error || null,
      installedByUserId: integration.user_integration?.installed_by_user_id || null,
      accountIntegrationId: integration.user_integration?.id,
      config: integration.user_integration?.config || null
    }));
  }

  /**
   * Legacy method renamed to use user-based approach
   */
  static async getIntegrationsForAccount(userId: string): Promise<IntegrationWithStatus[]> {
    // This method now delegates to getIntegrationsForUser for consistency
    return this.getIntegrationsForUser(userId);
  }

  /**
   * Legacy method - merge available integrations with user's installation status
   * @deprecated Use getIntegrationsForAccount instead
   */
  static mergeWithUserData(
    availableIntegrations: AvailableIntegration[],
    userIntegrations: any[]
  ): IntegrationWithStatus[] {
    return availableIntegrations.map(available => {
      const userIntegration = userIntegrations.find(
        ui => ui.integration_id === available.id
      );

      return {
        ...available,
        isConnected: userIntegration?.status === 'connected' || false,
        connectedAt: userIntegration?.connected_at || null,
        lastSyncAt: userIntegration?.last_sync_at || null,
        totalSyncs: userIntegration?.total_syncs || 0,
        lastError: userIntegration?.last_error || null,
        installedByUserId: userIntegration?.installed_by_user_id || null,
        accountIntegrationId: userIntegration?.id
      };
    });
  }
}