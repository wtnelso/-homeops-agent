import { GmailService } from '../services/gmail';
import { GoogleCalendarService } from '../services/google-calendar';

export interface IntegrationService {
  startOAuthFlow(returnUrl: string): void;
  handleOAuthCallback(code: string): Promise<{ success: boolean; message?: string; error?: string }>;
  disconnect(): Promise<{ success: boolean; message?: string; error?: string }>;
}

export const integrationServices: Record<string, IntegrationService> = {
  gmail: GmailService,
  'google-calendar': GoogleCalendarService
};

export class OAuthCoordinator {
  static startFlow(integrationId: string, returnUrl: string): void {
    console.log(`🎯 OAuthCoordinator: Starting flow for ${integrationId}`);

    // Add debug info to localStorage
    const debugInfo = {
      timestamp: new Date().toISOString(),
      integrationId,
      step: 'OAuthCoordinator_startFlow_called',
      availableServices: Object.keys(integrationServices)
    };
    localStorage.setItem('oauth_debug', JSON.stringify(debugInfo));

    const service = integrationServices[integrationId];
    if (!service) {
      console.error(`❌ No service found for integration: ${integrationId}`);
      console.error('📋 Available services:', Object.keys(integrationServices));

      // Update debug info with error
      debugInfo.step = 'OAuthCoordinator_service_not_found';
      localStorage.setItem('oauth_debug', JSON.stringify(debugInfo));
      return;
    }

    console.log('✅ Found service, calling startOAuthFlow()');

    // Update debug info before calling startOAuthFlow
    debugInfo.step = 'OAuthCoordinator_calling_startOAuthFlow';
    localStorage.setItem('oauth_debug', JSON.stringify(debugInfo));

    service.startOAuthFlow(returnUrl);
  }

  static async handleCallback(integrationId: string, code: string): Promise<{ success: boolean; message?: string; error?: string }> {
    console.log(`🎯 OAuthCoordinator: Handling callback for ${integrationId}`);
    const service = integrationServices[integrationId];
    if (!service) {
      console.error(`❌ No service found for integration: ${integrationId}`);
      console.error('📋 Available services:', Object.keys(integrationServices));
      return { success: false, error: `No service found for integration: ${integrationId}` };
    }
    
    console.log('✅ Found service, calling handleOAuthCallback()');
    return service.handleOAuthCallback(code);
  }

  static async disconnect(integrationId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const service = integrationServices[integrationId];
    if (!service) {
      return { success: false, error: `No service found for integration: ${integrationId}` };
    }
    
    return service.disconnect();
  }

  static requiresOAuth(integrationId: string): boolean {
    return integrationId in integrationServices;
  }
}