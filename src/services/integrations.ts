export interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  enabled: boolean;
  settings?: Record<string, any>;
  lastSync?: Date;
}

export interface GmailIntegration extends Integration {
  id: 'gmail';
  name: 'Gmail';
  settings: {
    accessToken?: string;
    refreshToken?: string;
    accountEmail?: string;
    syncFrequency: 'realtime' | 'hourly' | 'daily';
    enableIntelligence: boolean;
    filterImportant: boolean;
  };
}

export interface CalendarIntegration extends Integration {
  id: 'google_calendar';
  name: 'Google Calendar';
  settings: {
    accessToken?: string;
    refreshToken?: string;
    calendarIds: string[];
    syncEvents: boolean;
    createReminders: boolean;
    conflictDetection: boolean;
  };
}

export class IntegrationsService {
  private integrations: Map<string, Integration> = new Map();
  private baseUrl = '/api/integrations';

  constructor() {
    this.initializeDefaultIntegrations();
  }

  private initializeDefaultIntegrations() {
    const gmailIntegration: GmailIntegration = {
      id: 'gmail',
      name: 'Gmail',
      description: 'Email intelligence and processing',
      icon: 'Mail',
      status: 'disconnected',
      enabled: false,
      settings: {
        syncFrequency: 'hourly',
        enableIntelligence: true,
        filterImportant: true
      }
    };

    const calendarIntegration: CalendarIntegration = {
      id: 'google_calendar',
      name: 'Google Calendar',
      description: 'Calendar events and scheduling',
      icon: 'Calendar',
      status: 'disconnected',
      enabled: false,
      settings: {
        calendarIds: [],
        syncEvents: true,
        createReminders: true,
        conflictDetection: true
      }
    };

    this.integrations.set('gmail', gmailIntegration);
    this.integrations.set('google_calendar', calendarIntegration);
  }

  async connectGmail(): Promise<{ success: boolean; error?: string }> {
    try {
      // Direct redirect to existing OAuth endpoint
      window.location.href = '/auth/gmail';
      return { success: true };
    } catch (error) {
      console.error('Gmail connection failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async connectCalendar(): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, redirect to Gmail OAuth (calendar OAuth needs to be implemented)
      // TODO: Implement dedicated calendar OAuth endpoint
      window.location.href = '/auth/gmail';
      return { success: true };
    } catch (error) {
      console.error('Calendar connection failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // OAuth methods now use direct redirects to existing endpoints
  // Removed initiateGmailOAuth and initiateCalendarOAuth methods as they're no longer needed

  async disconnectIntegration(integrationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/${integrationId}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Failed to disconnect ${integrationId}`);
      }

      const integration = this.integrations.get(integrationId);
      if (integration) {
        integration.status = 'disconnected';
        integration.enabled = false;
        integration.settings = {};
      }

      return { success: true };
    } catch (error) {
      console.error(`Disconnection failed for ${integrationId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async updateIntegrationSettings(
    integrationId: string, 
    settings: Partial<Integration['settings']>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration) {
        throw new Error(`Integration ${integrationId} not found`);
      }

      const response = await fetch(`${this.baseUrl}/${integrationId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error(`Failed to update settings for ${integrationId}`);
      }

      integration.settings = { ...integration.settings, ...settings };
      return { success: true };
    } catch (error) {
      console.error(`Settings update failed for ${integrationId}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id);
  }

  getAllIntegrations(): Integration[] {
    return Array.from(this.integrations.values());
  }

  async checkIntegrationStatus(integrationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${integrationId}/status`);
      if (response.ok) {
        const statusData = await response.json();
        const integration = this.integrations.get(integrationId);
        if (integration) {
          integration.status = statusData.status;
          integration.lastSync = statusData.lastSync ? new Date(statusData.lastSync) : undefined;
        }
      }
    } catch (error) {
      console.error(`Status check failed for ${integrationId}:`, error);
    }
  }
}

export const integrationsService = new IntegrationsService();