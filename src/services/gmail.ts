import { GMAIL_CONFIG } from '../config/integrations/gmail';
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
    const oauthUrl = this.buildOAuthUrl();
    console.log('🚀 Gmail OAuth URL:', oauthUrl);
    console.log('📋 Redirect URI:', GMAIL_CONFIG.redirectUri);
    console.log('🔑 Client ID:', GMAIL_CONFIG.clientId);

    localStorage.setItem('oauth_integration_pending', 'gmail');

    // Store the current URL for return, with special handling for onboarding
    const currentUrl = window.location.href;
    console.log('💾 Storing return URL:', currentUrl);

    // If we're in onboarding, store additional context
    if (currentUrl.includes('/onboarding') || currentUrl.includes('step=')) {
      console.log('📋 Detected onboarding flow, storing onboarding context');
      localStorage.setItem('oauth_from_onboarding', 'true');
    }

    localStorage.setItem('oauth_return_url', currentUrl);
    window.location.href = oauthUrl;
  }

  static async handleOAuthCallback(code: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('Gmail OAuth callback with code:', code);
      
      // Get current user session data
      const sessionData = await UserSessionService.getUserSessionData();
      if ('error' in sessionData) {
        return { success: false, error: 'Failed to get user session data' };
      }

      // Call the Render server OAuth endpoint to exchange the code for tokens
      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      const response = await fetch(`${serverUrl}/api/oauth/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code,
          integrationId: 'gmail',
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

      // Call the Render server OAuth disconnect endpoint
      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      const response = await fetch(`${serverUrl}/api/oauth/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountId: sessionData.account.id,
          integrationId: 'gmail'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('OAuth disconnect failed:', errorData);
        return { success: false, error: errorData.error || 'Failed to disconnect Gmail' };
      }
      
      return { success: true, message: 'Gmail disconnected successfully' };
    } catch (error) {
      console.error('Gmail disconnect error:', error);
      return { success: false, error: 'Failed to disconnect Gmail' };
    }
  }
}