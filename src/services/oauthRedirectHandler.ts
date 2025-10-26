/**
 * Centralized OAuth redirect handling for all integrations
 * Manages return URLs and onboarding context detection
 */

export class OAuthRedirectHandler {
  /**
   * Sets up the return URL for OAuth flow
   * If OAuth is started from onboarding, it will redirect to /dashboard
   * Otherwise, it preserves the current path
   */
  static setupReturnUrl(): void {
    const currentPath = window.location.pathname + window.location.search;
    const fromOnboarding = localStorage.getItem('oauth_from_onboarding');

    console.log('🔍 OAuthRedirectHandler: Setting up return URL');
    console.log('📊 Context:', {
      currentPath,
      fromOnboarding: fromOnboarding ? 'true' : 'false'
    });

    // Add debug info to localStorage
    const debugInfo = {
      timestamp: new Date().toISOString(),
      step: 'OAuthRedirectHandler_setupReturnUrl_called',
      currentPath,
      fromOnboarding: fromOnboarding || 'null',
      allOAuthKeys: Object.keys(localStorage).filter(key => key.includes('oauth'))
    };

    if (fromOnboarding) {
      console.log('✅ DETECTED: OAuth started from onboarding, will return to /dashboard/home?onboardingStep=3');
      localStorage.setItem('oauth_return_url', '/dashboard/home?onboardingStep=3');
      debugInfo.step = 'OAuthRedirectHandler_setupReturnUrl_fromOnboarding';
      debugInfo.returnUrl = '/dashboard/home?onboardingStep=3';
    } else {
      console.log('📍 Normal OAuth flow, storing current path');
      localStorage.setItem('oauth_return_url', currentPath);
      debugInfo.step = 'OAuthRedirectHandler_setupReturnUrl_normalFlow';
      debugInfo.returnUrl = currentPath;
    }

    localStorage.setItem('oauth_redirect_debug', JSON.stringify(debugInfo));
    console.log('💾 Set oauth_return_url to:', localStorage.getItem('oauth_return_url'));

    // IMMEDIATE TEST: Check if localStorage actually worked
    const immediateCheck = localStorage.getItem('oauth_return_url');
    console.log('🔍 IMMEDIATE CHECK - oauth_return_url in localStorage:', immediateCheck);
    if (!immediateCheck) {
      console.error('❌ PROBLEM: localStorage.setItem failed for oauth_return_url!');
    }
  }

  /**
   * Sets the onboarding flag before starting OAuth
   * Should be called by components that want to return to onboarding
   */
  static setOnboardingFlag(): void {
    console.log('🎯 OAuthRedirectHandler: Setting onboarding flag');
    localStorage.setItem('oauth_from_onboarding', 'true');

    // Add debug info to localStorage
    const debugInfo = {
      timestamp: new Date().toISOString(),
      step: 'OAuthRedirectHandler_setOnboardingFlag_called',
      flagValue: 'true',
      currentURL: window.location.href
    };
    localStorage.setItem('oauth_redirect_debug', JSON.stringify(debugInfo));
  }

  /**
   * Clears the onboarding flag after OAuth completion
   * Returns whether the flag was set (indicating OAuth was from onboarding)
   */
  static clearOnboardingFlag(): boolean {
    const wasFromOnboarding = localStorage.getItem('oauth_from_onboarding');
    if (wasFromOnboarding) {
      console.log('🧹 OAuthRedirectHandler: Clearing onboarding flag');
      localStorage.removeItem('oauth_from_onboarding');
      return true;
    }
    return false;
  }

  /**
   * Checks if OAuth was started from onboarding context
   */
  static isFromOnboarding(): boolean {
    return localStorage.getItem('oauth_from_onboarding') === 'true';
  }
}