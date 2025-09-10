import { GOOGLE_CALENDAR_CONFIG } from '../config/integrations/google-calendar';
import { UserSessionService } from './userSession';

export class GoogleCalendarService {
  static buildOAuthUrl(): string {
    console.log('🔧 Building Google Calendar OAuth URL...');
    console.log('📋 OAuth Config:', {
      clientId: GOOGLE_CALENDAR_CONFIG.clientId ? `${GOOGLE_CALENDAR_CONFIG.clientId.substring(0, 10)}...` : 'MISSING',
      redirectUri: GOOGLE_CALENDAR_CONFIG.redirectUri,
      scopes: GOOGLE_CALENDAR_CONFIG.scopes,
      authUrl: GOOGLE_CALENDAR_CONFIG.authUrl
    });

    if (!GOOGLE_CALENDAR_CONFIG.clientId) {
      console.error('❌ Google Calendar Client ID is missing!');
    }

    const params = new URLSearchParams({
      client_id: GOOGLE_CALENDAR_CONFIG.clientId || '',
      redirect_uri: GOOGLE_CALENDAR_CONFIG.redirectUri,
      response_type: 'code',
      scope: GOOGLE_CALENDAR_CONFIG.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent'
    });

    const oauthUrl = `${GOOGLE_CALENDAR_CONFIG.authUrl}?${params.toString()}`;
    console.log('🔗 Generated OAuth URL:', oauthUrl);
    return oauthUrl;
  }

  static startOAuthFlow(): void {
    console.log('🚀 Starting Google Calendar OAuth flow...');
    localStorage.setItem('oauth_integration_pending', 'google-calendar');
    localStorage.setItem('oauth_return_url', window.location.href);
    console.log('💾 Set pending integration in localStorage: google-calendar');
    console.log('🔗 Stored return URL:', window.location.href);
    
    const oauthUrl = this.buildOAuthUrl();
    console.log('🌐 Redirecting to OAuth URL:', oauthUrl);
    window.location.href = oauthUrl;
  }

  static async handleOAuthCallback(code: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('📞 Google Calendar OAuth callback started');
      console.log('🔐 Received authorization code:', code ? `${code.substring(0, 10)}...` : 'NO CODE');
      
      if (!code) {
        console.error('❌ No authorization code provided');
        return { success: false, error: 'No authorization code provided' };
      }
      
      // Get current user session data
      console.log('👤 Getting user session data...');
      const sessionData = await UserSessionService.getUserSessionData();
      if ('error' in sessionData) {
        console.error('❌ Failed to get user session data:', sessionData.error);
        return { success: false, error: 'Failed to get user session data' };
      }
      console.log('✅ Got user session data:', {
        accountId: sessionData.account.id,
        userId: sessionData.user.id
      });

      // Call the Supabase Edge Function to exchange the code for tokens
      const exchangeUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-oauth-exchange`;
      console.log('🔄 Calling token exchange endpoint:', exchangeUrl);
      console.log('📤 Exchange payload:', {
        code: code ? `${code.substring(0, 10)}...` : 'NO CODE',
        accountId: sessionData.account.id,
        userId: sessionData.user.id
      });
      
      const response = await fetch(exchangeUrl, {
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
      
      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('❌ OAuth exchange failed!');
        console.error('📊 Response status:', response.status, response.statusText);
        console.error('📄 Response body:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || 'Unknown error' };
        }
        
        return { success: false, error: errorData.error || 'Failed to exchange OAuth code' };
      }

      const result = await response.json();
      console.log('✅ OAuth exchange successful!');
      console.log('📊 Exchange result:', result);
      
      return { 
        success: true, 
        message: result.message || 'Google Calendar connected successfully' 
      };
    } catch (error) {
      console.error('💥 Google Calendar OAuth callback error:', error);
      console.error('📊 Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      return { success: false, error: 'Failed to connect Google Calendar' };
    }
  }

  static async disconnect(): Promise<{ success: boolean; message?: string }> {
    try {
      // TODO: Revoke tokens and cleanup
      console.log('Disconnecting Google Calendar');
      
      return { success: true, message: 'Google Calendar disconnected successfully' };
    } catch (error) {
      console.error('Google Calendar disconnect error:', error);
      return { success: false, message: 'Failed to disconnect Google Calendar' };
    }
  }
}