import { supabase } from '../lib/supabase';
import { AccountIntegrationsService } from './accountIntegrationsService';

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
   * Get integrations with account-level status (NEW - preferred method)
   */
  static async getIntegrationsForAccount(accountId: string): Promise<IntegrationWithStatus[]> {
    const integrations = await AccountIntegrationsService.getIntegrationsForAccount(accountId);
    
    // Convert to simplified format
    return integrations.map(integration => ({
      ...integration,
      long_description: integration.long_description,
      platform_url: integration.platform_url,
      how_it_works: integration.how_it_works,
      required_scopes: integration.required_scopes,
      isConnected: integration.isConnected, // Already simplified in AccountIntegrationsService
      connectedAt: integration.account_integration?.connected_at || null,
      lastSyncAt: integration.account_integration?.last_sync_at || null,
      totalSyncs: integration.account_integration?.total_syncs || 0,
      lastError: integration.account_integration?.last_error || null,
      installedByUserId: integration.account_integration?.installed_by_user_id || null,
      accountIntegrationId: integration.account_integration?.id
    }));
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