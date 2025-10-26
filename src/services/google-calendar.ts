import { GOOGLE_CALENDAR_CONFIG } from '../config/integrations/google-calendar';
import { UserSessionService } from './userSession';
import { supabase } from '../lib/supabase';
import { OAuthRedirectHandler } from './oauthRedirectHandler';

export class GoogleCalendarService {
  static buildOAuthUrl(returnUrl: string): string {
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

    // Create state parameter with return URL
    const state = btoa(JSON.stringify({ returnUrl }));

    const params = new URLSearchParams({
      client_id: GOOGLE_CALENDAR_CONFIG.clientId || '',
      redirect_uri: GOOGLE_CALENDAR_CONFIG.redirectUri,
      response_type: 'code',
      scope: GOOGLE_CALENDAR_CONFIG.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: state
    });

    const oauthUrl = `${GOOGLE_CALENDAR_CONFIG.authUrl}?${params.toString()}`;
    console.log('🔗 Generated OAuth URL:', oauthUrl);
    return oauthUrl;
  }

  static startOAuthFlow(returnUrl: string): void {
    console.log('🚀 Starting Google Calendar OAuth flow...');

    // Add debug info to localStorage
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      step: 'GoogleCalendarService_startOAuthFlow_called',
      currentURL: window.location.href,
      onboardingFlag: localStorage.getItem('oauth_from_onboarding'),
      allOAuthKeys: Object.keys(localStorage).filter(key => key.includes('oauth'))
    };
    localStorage.setItem('google_calendar_debug', JSON.stringify(debugInfo));

    localStorage.setItem('oauth_integration_pending', 'google-calendar');

    // Update debug info
    debugInfo.step = 'GoogleCalendarService_using_state_parameter';
    debugInfo.returnURL = returnUrl;
    localStorage.setItem('google_calendar_debug', JSON.stringify(debugInfo));

    const oauthUrl = this.buildOAuthUrl(returnUrl);
    console.log('🌐 Redirecting to OAuth URL:', oauthUrl);

    // Final debug info before redirect
    debugInfo.step = 'GoogleCalendarService_about_to_redirect';
    debugInfo.oauthUrl = oauthUrl;
    localStorage.setItem('google_calendar_debug', JSON.stringify(debugInfo));

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

      // Get current user session data and JWT token
      console.log('👤 Getting user session data and auth token...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error('❌ Failed to get auth session:', sessionError);
        return { success: false, error: 'Authentication required' };
      }

      const sessionData = await UserSessionService.getUserSessionData();
      if ('error' in sessionData) {
        console.error('❌ Failed to get user session data:', sessionData.error);
        return { success: false, error: 'Failed to get user session data' };
      }
      console.log('✅ Got user session data:', {
        userId: sessionData.user.id
      });

      // Call the Render server OAuth endpoint to exchange the code for tokens
      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      const exchangeUrl = `${serverUrl}/api/oauth/exchange`;
      console.log('🔄 Calling token exchange endpoint:', exchangeUrl);
      console.log('📤 Exchange payload:', {
        code: code ? `${code.substring(0, 10)}...` : 'NO CODE',
        userId: sessionData.user.id,
        integrationId: 'google-calendar'
      });

      const response = await fetch(exchangeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          code: code,
          integrationId: 'google-calendar',
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

  static async disconnect(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      console.log('Disconnecting Google Calendar');

      // Get current user session data and JWT token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        return { success: false, error: 'Authentication required' };
      }

      const sessionData = await UserSessionService.getUserSessionData();
      if ('error' in sessionData) {
        return { success: false, error: 'Failed to get user session data' };
      }

      // Call the Render server OAuth disconnect endpoint
      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      const response = await fetch(`${serverUrl}/api/oauth/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: sessionData.user.id,
          integrationId: 'google-calendar'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('OAuth disconnect failed:', errorData);
        return { success: false, error: errorData.error || 'Failed to disconnect Google Calendar' };
      }

      return { success: true, message: 'Google Calendar disconnected successfully' };
    } catch (error) {
      console.error('Google Calendar disconnect error:', error);
      return { success: false, error: 'Failed to disconnect Google Calendar' };
    }
  }
}