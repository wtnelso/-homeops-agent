import { GmailService } from '../services/gmail';
import { GoogleCalendarService } from '../services/google-calendar';

export interface IntegrationService {
  startOAuthFlow(): void;
  handleOAuthCallback(code: string): Promise<{ success: boolean; message?: string; error?: string }>;
  disconnect(): Promise<{ success: boolean; message?: string; error?: string }>;
}

export const integrationServices: Record<string, IntegrationService> = {
  gmail: GmailService,
  'google-calendar': GoogleCalendarService
};

export class OAuthCoordinator {
  static startFlow(integrationId: string): void {
    console.log(`🎯 OAuthCoordinator: Starting flow for ${integrationId}`);
    const service = integrationServices[integrationId];
    if (!service) {
      console.error(`❌ No service found for integration: ${integrationId}`);
      console.error('📋 Available services:', Object.keys(integrationServices));
      return;
    }
    
    console.log('✅ Found service, calling startOAuthFlow()');
    service.startOAuthFlow();
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