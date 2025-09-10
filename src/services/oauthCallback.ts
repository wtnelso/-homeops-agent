
// OAuth callback handler
// Handles OAuth callbacks and completes integration installation

import { OAuthCoordinator } from '../config/oauth';

export class OAuthCallbackHandler {
  /**
   * Handle OAuth callback from URL parameters
   */
  static async handleCallback(): Promise<{
    success: boolean;
    integrationId?: string;
    message?: string;
    error?: string;
  }> {
    try {
      console.log('📞 OAuth Callback Handler started');
      console.log('🌐 Current URL:', window.location.href);
      
      // Get OAuth parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');
      const integrationId = localStorage.getItem('oauth_integration_pending');
      
      console.log('📋 OAuth parameters:', {
        code: code ? `${code.substring(0, 10)}...` : 'NO CODE',
        error: error || 'NO ERROR',
        integrationId: integrationId || 'NO INTEGRATION ID',
        allParams: Object.fromEntries(urlParams.entries())
      });

      if (error) {
        console.error('❌ OAuth error received:', error);
        return { 
          success: false, 
          error: `OAuth authorization failed: ${error}` 
        };
      }

      if (!code) {
        console.error('❌ No authorization code in URL parameters');
        return { 
          success: false, 
          error: 'No authorization code received' 
        };
      }

      if (!integrationId) {
        console.error('❌ No pending integration found in localStorage');
        console.error('📊 All localStorage keys:', Object.keys(localStorage));
        return { 
          success: false, 
          error: 'No pending integration found' 
        };
      }

      console.log(`🚀 Handling OAuth callback for ${integrationId}`);
      console.log(`🔐 Using code: ${code.substring(0, 10)}...`);

      // Use OAuth coordinator to handle the callback
      console.log('📋 Calling OAuthCoordinator.handleCallback...');
      const result = await OAuthCoordinator.handleCallback(integrationId, code);
      console.log('📊 OAuth coordinator result:', result);

      // Clear pending integration after successful processing
      localStorage.removeItem('oauth_integration_pending');
      console.log('🧽 Cleared pending integration from localStorage');

      return {
        success: result.success,
        integrationId,
        message: result.message,
        error: result.error
      };

    } catch (error) {
      console.error('💥 OAuth callback handler error:', error);
      console.error('📊 Error details:', {
        name: (error as any)?.name,
        message: (error as any)?.message,
        stack: (error as any)?.stack
      });
      return { 
        success: false, 
        error: 'Failed to handle OAuth callback' 
      };
    }
  }

  /**
   * Check if current URL contains OAuth callback parameters
   */
  static isOAuthCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') || urlParams.has('error');
  }

  /**
   * Clean OAuth parameters from URL after handling
   */
  static cleanUrl(): void {
    if (window.history.replaceState) {
      const url = window.location.href.split('?')[0];
      window.history.replaceState({}, document.title, url);
    }
  }

  /**
   * Get the stored return URL and clean it up
   */
  static getReturnUrl(): string {
    const returnUrl = localStorage.getItem('oauth_return_url');
    localStorage.removeItem('oauth_return_url');
    
    if (!returnUrl) {
      return '/dashboard/home';
    }
    
    // If it's a full URL, extract just the pathname
    try {
      const url = new URL(returnUrl);
      return url.pathname;
    } catch {
      // If it's not a valid URL, assume it's already a pathname
      return returnUrl.startsWith('/') ? returnUrl : '/dashboard/home';
    }
  }
}