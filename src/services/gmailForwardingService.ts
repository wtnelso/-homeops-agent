/**
 * Gmail Forwarding Service
 * Handles gmail-forwarding integration specific logic
 */

import { supabase } from '../lib/supabase';

export class GmailForwardingService {
  /**
   * Install gmail-forwarding integration for a user
   * Generates email address based on user's email: user.name@domain.com -> username-123456@inbound.homeops.ai
   */
  static async installGmailForwarding(params: {
    userId: string;
    installedByUserId: string;
  }): Promise<{ success: boolean; integration?: any; error?: string }> {
    try {
      // Get user's email from Supabase auth to create forwarding address
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        return { success: false, error: 'Unable to get user email for forwarding address' };
      }

      // Generate forwarding email address from user's email
      // Strip special characters and add random suffix for uniqueness
      const localPart = user.email.split('@')[0];
      const cleanedLocalPart = localPart.replace(/[.\-_]/g, ''); // Remove dots, dashes, underscores
      const randomSuffix = Math.random().toString().slice(2, 8); // 6 digit random number
      const forwardingEmail = `${cleanedLocalPart}-${randomSuffix}@inbound.homeops.ai`;

      const config = { email_address: forwardingEmail };

      const upsertData = {
        user_id: params.userId,
        integration_id: 'gmail-forwarding',
        status: 'connected' as const,
        enabled: true,
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        scopes: null,
        config: config,
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
      console.error('Error installing gmail-forwarding integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Installation failed'
      };
    }
  }

  /**
   * Uninstall gmail-forwarding integration for a user
   */
  static async uninstallGmailForwarding(params: {
    userId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_integrations')
        .update({
          status: 'disconnected',
          enabled: false,
          connected_at: null,
          last_error: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', params.userId)
        .eq('integration_id', 'gmail-forwarding');

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error uninstalling gmail-forwarding integration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Uninstall failed'
      };
    }
  }
}