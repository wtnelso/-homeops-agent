// Database-backed integrations service
// This service handles CRUD operations for integrations using Supabase

import { supabase } from './supabase';
import { 
  AvailableIntegration, 
  UserIntegration, 
  AvailableIntegrationWithStatus,
  CreateUserIntegrationRequest,
  UpdateUserIntegrationRequest,
  IntegrationConnectionRequest,
  IntegrationConnectionResponse,
  IntegrationSyncRequest,
  IntegrationSyncResponse,
  IntegrationUsage
} from '../types/database';

export class DatabaseIntegrationsService {
  // Available Integrations (Catalog)
  async getAvailableIntegrations(): Promise<AvailableIntegration[]> {
    const { data, error } = await supabase
      .from('available_integrations')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  }

  async getAvailableIntegrationById(id: string): Promise<AvailableIntegration | null> {
    const { data, error } = await supabase
      .from('available_integrations')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  }

  async getAvailableIntegrationsByCategory(category: string): Promise<AvailableIntegration[]> {
    const { data, error } = await supabase
      .from('available_integrations')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  }

  // User Integrations
  async getUserIntegrations(userId: string): Promise<UserIntegration[]> {
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getUserIntegrationById(userId: string, integrationId: string): Promise<UserIntegration | null> {
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async getAvailableIntegrationsWithUserStatus(userId: string): Promise<AvailableIntegrationWithStatus[]> {
    // Get available integrations and user integrations in parallel
    const [availableResult, userIntegrationsResult] = await Promise.all([
      supabase.from('available_integrations').select('*').eq('is_active', true),
      supabase.from('user_integrations').select('*').eq('user_id', userId)
    ]);

    if (availableResult.error) throw availableResult.error;
    if (userIntegrationsResult.error) throw userIntegrationsResult.error;

    const available = availableResult.data;
    const userIntegrations = userIntegrationsResult.data;

    // Create a map of user integrations by integration_id
    const userIntegrationMap = new Map(
      userIntegrations.map(ui => [ui.integration_id, ui])
    );

    // Combine available integrations with user status
    return available.map(integration => {
      const userIntegration = userIntegrationMap.get(integration.id);
      return {
        ...integration,
        user_integration: userIntegration,
        is_installed: !!userIntegration,
        is_connected: userIntegration?.status === 'connected' && userIntegration?.enabled
      };
    });
  }

  async createUserIntegration(userId: string, request: CreateUserIntegrationRequest): Promise<UserIntegration> {
    const { data, error } = await supabase
      .from('user_integrations')
      .insert({
        user_id: userId,
        integration_id: request.integration_id,
        settings: request.settings || {},
        status: 'disconnected',
        enabled: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserIntegration(
    userId: string, 
    integrationId: string, 
    updates: UpdateUserIntegrationRequest
  ): Promise<UserIntegration> {
    const { data, error } = await supabase
      .from('user_integrations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUserIntegration(userId: string, integrationId: string): Promise<void> {
    const { error } = await supabase
      .from('user_integrations')
      .delete()
      .eq('user_id', userId)
      .eq('integration_id', integrationId);

    if (error) throw error;
  }

  // Integration Connection Management
  async connectIntegration(
    userId: string, 
    request: IntegrationConnectionRequest
  ): Promise<IntegrationConnectionResponse> {
    try {
      // First, get or create the user integration
      let userIntegration = await this.getUserIntegrationById(userId, request.integration_id);
      
      if (!userIntegration) {
        userIntegration = await this.createUserIntegration(userId, {
          integration_id: request.integration_id
        });
      }

      // Here you would typically:
      // 1. Exchange auth_code for tokens using the integration's OAuth config
      // 2. Store encrypted tokens in the user_integration record
      // 3. Test the connection
      // 4. Update the status to 'connected'

      // For now, we'll simulate a successful connection
      const updatedIntegration = await this.updateUserIntegration(userId, request.integration_id, {
        status: 'connected',
        connected_at: new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        last_error: null
      });

      return {
        success: true,
        user_integration_id: updatedIntegration.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  async disconnectIntegration(userId: string, integrationId: string): Promise<void> {
    // Clear tokens and update status
    await this.updateUserIntegration(userId, integrationId, {
      status: 'disconnected',
      last_error: null
    });
  }

  // Integration Sync Operations
  async syncIntegration(
    userId: string, 
    request: IntegrationSyncRequest
  ): Promise<IntegrationSyncResponse> {
    try {
      const { data: userIntegration, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('id', request.user_integration_id)
        .single();

      if (error) throw error;
      if (userIntegration.status !== 'connected') {
        throw new Error('Integration is not connected');
      }

      // Here you would implement the actual sync logic
      // For now, we'll simulate a successful sync
      
      const { data: updated, error: updateError } = await supabase
        .from('user_integrations')
        .update({
          last_sync_at: new Date().toISOString(),
          last_error: null
        })
        .eq('id', request.user_integration_id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        last_sync_at: updated.last_sync_at || undefined,
        items_synced: 0 // This would be the actual count from sync operation
      };
    } catch (error) {
      // Log the error but don't update the integration record with error details here
      // That should be handled by the specific integration sync logic
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }

  // Usage Tracking
  async logIntegrationUsage(usage: Omit<IntegrationUsage, 'id' | 'occurred_at'>): Promise<void> {
    const { error } = await supabase
      .from('integration_usage')
      .insert({
        ...usage,
        occurred_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async getIntegrationUsageStats(userId: string, integrationId?: string, days = 30): Promise<{
    total_api_calls: number;
    total_data_transferred: number;
    average_response_time: number;
  }> {
    let query = supabase
      .from('integration_usage')
      .select('api_calls_count, data_transferred_bytes, response_time_ms')
      .eq('user_id', userId)
      .gte('occurred_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (integrationId) {
      query = query.eq('integration_id', integrationId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    if (!data || data.length === 0) {
      return { total_api_calls: 0, total_data_transferred: 0, average_response_time: 0 };
    }

    const totals = data.reduce(
      (acc, curr) => ({
        api_calls: acc.api_calls + (curr.api_calls_count || 0),
        data_transferred: acc.data_transferred + (curr.data_transferred_bytes || 0),
        response_times: [...acc.response_times, curr.response_time_ms || 0].filter(t => t > 0)
      }),
      { api_calls: 0, data_transferred: 0, response_times: [] as number[] }
    );

    return {
      total_api_calls: totals.api_calls,
      total_data_transferred: totals.data_transferred,
      average_response_time: totals.response_times.length > 0 
        ? totals.response_times.reduce((a, b) => a + b, 0) / totals.response_times.length 
        : 0
    };
  }

  // Helper method to check if user can install premium integrations
  async canUserInstallPremiumIntegrations(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.plan === 'pro' || data.plan === 'enterprise';
  }

  // Helper method to get integration limits based on user plan
  async getUserIntegrationLimits(userId: string): Promise<{
    max_integrations: number;
    can_use_premium: boolean;
    monthly_api_calls: number;
  }> {
    const { data, error } = await supabase
      .from('users')
      .select('plan')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const limits: Record<string, {
      max_integrations: number;
      can_use_premium: boolean;
      monthly_api_calls: number;
    }> = {
      free: { max_integrations: 3, can_use_premium: false, monthly_api_calls: 1000 },
      pro: { max_integrations: 10, can_use_premium: true, monthly_api_calls: 10000 },
      enterprise: { max_integrations: -1, can_use_premium: true, monthly_api_calls: 100000 }
    };

    return limits[data.plan] || limits.free;
  }
}

export const databaseIntegrationsService = new DatabaseIntegrationsService();