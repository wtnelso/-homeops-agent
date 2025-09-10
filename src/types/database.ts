// TypeScript types for Supabase database schema
// Generated from database schema for HomeOps Agent

export type UserPlan = 'free' | 'pro' | 'enterprise';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending';
export type IntegrationCategory = 'email' | 'communication' | 'productivity' | 'video' | 'project-management' | 'calendar' | 'storage' | 'crm' | 'finance';

// Database table interfaces
export interface AvailableIntegration {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  icon_type: string;
  icon_name: string | null;
  icon_color: string;
  bg_color: string;
  category: IntegrationCategory;
  is_premium: boolean;
  is_new: boolean;
  is_featured: boolean;
  oauth_config: Record<string, any> | null;
  required_scopes: string[] | null;
  settings_schema: Record<string, any> | null;
  webhook_config: Record<string, any> | null;
  api_endpoints: Record<string, any> | null;
  documentation_url: string | null;
  support_url: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: UserPlan;
  plan_expires_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  is_active: boolean;
  preferences: Record<string, any>;
  timezone: string;
  monthly_api_calls: number;
  monthly_limit: number;
}

export interface UserIntegration {
  id: string;
  user_id: string;
  integration_id: string;
  status: IntegrationStatus;
  enabled: boolean;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  settings: Record<string, any>;
  connected_account_id: string | null;
  connected_account_email: string | null;
  connected_account_name: string | null;
  last_sync_at: string | null;
  sync_frequency: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  connected_at: string | null;
}

export interface IntegrationUsage {
  id: string;
  user_id: string;
  integration_id: string;
  user_integration_id: string | null;
  action_type: string;
  api_calls_count: number;
  data_transferred_bytes: number;
  endpoint: string | null;
  method: string | null;
  status_code: number | null;
  response_time_ms: number | null;
  occurred_at: string;
  metadata: Record<string, any>;
}

export interface IntegrationWebhook {
  id: string;
  user_id: string;
  user_integration_id: string;
  webhook_url: string;
  webhook_secret: string | null;
  event_types: string[];
  is_active: boolean;
  last_delivery_at: string | null;
  delivery_success_count: number;
  delivery_failure_count: number;
  created_at: string;
  updated_at: string;
}

// Extended interfaces for client-side use
export interface AvailableIntegrationWithStatus extends AvailableIntegration {
  user_integration?: UserIntegration;
  is_installed: boolean;
  is_connected: boolean;
}

export interface UserProfile extends User {
  integrations: UserIntegration[];
  usage_stats?: {
    total_api_calls: number;
    integrations_count: number;
    last_activity: string | null;
  };
}

// Integration-specific setting interfaces
export interface GmailSettings {
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  enableIntelligence: boolean;
  filterImportant: boolean;
  autoRespond: boolean;
}

export interface CalendarSettings {
  calendarIds: string[];
  syncEvents: boolean;
  createReminders: boolean;
  conflictDetection: boolean;
  syncTimeRange: '7days' | '30days' | '90days';
}

export interface SlackSettings {
  defaultChannel: string;
  enableNotifications: boolean;
  notificationTypes: string[];
}

export interface NotionSettings {
  defaultDatabase: string;
  autoCreatePages: boolean;
  syncTasks: boolean;
}

export interface ZoomSettings {
  autoRecord: boolean;
  defaultMeetingSettings: {
    join_before_host: boolean;
    mute_upon_entry: boolean;
    waiting_room: boolean;
  };
  meetingReminders: boolean;
}

// API request/response types
export interface CreateUserIntegrationRequest {
  integration_id: string;
  settings?: Record<string, any>;
}

export interface UpdateUserIntegrationRequest {
  settings?: Record<string, any>;
  enabled?: boolean;
  sync_frequency?: string;
}

export interface IntegrationConnectionRequest {
  integration_id: string;
  auth_code: string;
  redirect_uri: string;
}

export interface IntegrationConnectionResponse {
  success: boolean;
  user_integration_id?: string;
  error?: string;
}

export interface IntegrationSyncRequest {
  user_integration_id: string;
  force_sync?: boolean;
}

export interface IntegrationSyncResponse {
  success: boolean;
  last_sync_at?: string;
  items_synced?: number;
  error?: string;
}

// Supabase database types
export interface Database {
  public: {
    Tables: {
      available_integrations: {
        Row: AvailableIntegration;
        Insert: Omit<AvailableIntegration, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AvailableIntegration, 'id' | 'created_at' | 'updated_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_integrations: {
        Row: UserIntegration;
        Insert: Omit<UserIntegration, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserIntegration, 'id' | 'created_at' | 'updated_at'>>;
      };
      integration_usage: {
        Row: IntegrationUsage;
        Insert: Omit<IntegrationUsage, 'id'>;
        Update: Partial<Omit<IntegrationUsage, 'id'>>;
      };
      integration_webhooks: {
        Row: IntegrationWebhook;
        Insert: Omit<IntegrationWebhook, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<IntegrationWebhook, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_plan: UserPlan;
      integration_status: IntegrationStatus;
      integration_category: IntegrationCategory;
    };
  };
}

// Helper types for form data
export type IntegrationFormData<T = Record<string, any>> = {
  integration_id: string;
  settings: T;
  enabled?: boolean;
};