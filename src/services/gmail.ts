import { GMAIL_CONFIG } from '../config/integrations/gmail';
import { AccountIntegrationsService } from './accountIntegrationsService';
import { UserSessionService } from './userSession';

export class GmailService {
  static buildOAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: GMAIL_CONFIG.clientId || '',
      redirect_uri: GMAIL_CONFIG.redirectUri,
      response_type: 'code',
      scope: GMAIL_CONFIG.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${GMAIL_CONFIG.authUrl}?${params.toString()}`;
  }

  static startOAuthFlow(): void {
    localStorage.setItem('oauth_integration_pending', 'gmail');
    localStorage.setItem('oauth_return_url', window.location.href);
    window.location.href = this.buildOAuthUrl();
  }

  static async handleOAuthCallback(code: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('Gmail OAuth callback with code:', code);
      
      // Get current user session data
      const sessionData = await UserSessionService.getUserSessionData();
      if ('error' in sessionData) {
        return { success: false, error: 'Failed to get user session data' };
      }

      // Call the Supabase Edge Function to exchange the code for tokens
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gmail-oauth-exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          code: code,
          accountId: sessionData.account.id,
          userId: sessionData.user.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('OAuth exchange failed:', errorData);
        return { success: false, error: errorData.error || 'Failed to exchange OAuth code' };
      }

      const result = await response.json();
      
      return { 
        success: true, 
        message: result.message || 'Gmail connected successfully' 
      };
    } catch (error) {
      console.error('Gmail OAuth callback error:', error);
      return { success: false, error: 'Failed to connect Gmail' };
    }
  }

  static async disconnect(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('Disconnecting Gmail');
      
      // Get current user session data
      const sessionData = await UserSessionService.getUserSessionData();
      if ('error' in sessionData) {
        return { success: false, error: 'Failed to get user session data' };
      }

      // TODO: Revoke tokens with Google API
      // This is where you'd make a request to revoke the OAuth tokens
      
      // Update the integration status in database
      const result = await AccountIntegrationsService.uninstallIntegration({
        accountId: sessionData.account.id,
        integrationId: 'gmail'
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Failed to disconnect Gmail in database' };
      }
      
      return { success: true, message: 'Gmail disconnected successfully' };
    } catch (error) {
      console.error('Gmail disconnect error:', error);
      return { success: false, error: 'Failed to disconnect Gmail' };
    }
  }
}