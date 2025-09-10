-- HomeOps Agent Database Schema for Supabase
-- This schema supports user management, integration catalog, and user integration instances

-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- User Plans Enum
CREATE TYPE user_plan AS ENUM ('free', 'pro', 'enterprise');

-- Integration Status Enum  
CREATE TYPE integration_status AS ENUM ('connected', 'disconnected', 'error', 'pending');

-- Integration Categories Enum
CREATE TYPE integration_category AS ENUM ('email', 'communication', 'productivity', 'video', 'project-management', 'calendar', 'storage', 'crm', 'finance');

-- 1. Available Integrations Catalog
-- This table stores all available integrations that users can install
CREATE TABLE available_integrations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    logo_url TEXT,
    icon_type TEXT NOT NULL DEFAULT 'lucide', -- 'lucide', 'custom', 'svg'
    icon_name TEXT,
    icon_color TEXT NOT NULL DEFAULT 'text-gray-600',
    bg_color TEXT NOT NULL DEFAULT 'bg-gray-50',
    category integration_category NOT NULL,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    oauth_config JSONB, -- Store OAuth configuration
    required_scopes TEXT[], -- Array of required OAuth scopes
    settings_schema JSONB, -- JSON schema for integration settings
    webhook_config JSONB, -- Webhook configuration if needed
    api_endpoints JSONB, -- API endpoints this integration supports
    documentation_url TEXT,
    support_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 2. Users Table
-- Core user information and plan details
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    plan user_plan NOT NULL DEFAULT 'free',
    plan_expires_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- User preferences
    preferences JSONB DEFAULT '{}',
    timezone TEXT DEFAULT 'UTC',
    
    -- Usage tracking
    monthly_api_calls INTEGER DEFAULT 0,
    monthly_limit INTEGER DEFAULT 1000, -- Based on plan
    
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

-- 3. User Integration Instances
-- Stores user's installed integrations with their specific configuration and tokens
CREATE TABLE user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_id TEXT NOT NULL REFERENCES available_integrations(id) ON DELETE CASCADE,
    
    -- Integration state
    status integration_status NOT NULL DEFAULT 'disconnected',
    enabled BOOLEAN NOT NULL DEFAULT true,
    
    -- OAuth and authentication data (encrypted)
    access_token TEXT, -- Should be encrypted at application level
    refresh_token TEXT, -- Should be encrypted at application level
    token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Integration-specific settings
    settings JSONB DEFAULT '{}',
    
    -- Connected account information
    connected_account_id TEXT, -- External account ID (e.g., Gmail user ID)
    connected_account_email TEXT,
    connected_account_name TEXT,
    
    -- Sync and usage tracking
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency TEXT DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily'
    last_error TEXT,
    error_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    connected_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure unique integration per user
    UNIQUE(user_id, integration_id)
);

-- 4. Integration Usage Logs
-- Track API usage and sync activities for billing and monitoring
CREATE TABLE integration_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_id TEXT NOT NULL REFERENCES available_integrations(id) ON DELETE CASCADE,
    user_integration_id UUID REFERENCES user_integrations(id) ON DELETE CASCADE,
    
    -- Usage details
    action_type TEXT NOT NULL, -- 'sync', 'api_call', 'webhook', 'oauth_refresh'
    api_calls_count INTEGER DEFAULT 1,
    data_transferred_bytes BIGINT DEFAULT 0,
    
    -- Request details
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    response_time_ms INTEGER,
    
    -- Timestamps
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- 5. Integration Webhooks
-- Store webhook configurations and received webhook data
CREATE TABLE integration_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_integration_id UUID NOT NULL REFERENCES user_integrations(id) ON DELETE CASCADE,
    
    -- Webhook details
    webhook_url TEXT NOT NULL,
    webhook_secret TEXT, -- For webhook verification
    event_types TEXT[] NOT NULL, -- Array of event types to listen for
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_delivery_at TIMESTAMP WITH TIME ZONE,
    delivery_success_count INTEGER DEFAULT 0,
    delivery_failure_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_available_integrations_category ON available_integrations(category);
CREATE INDEX idx_available_integrations_active ON available_integrations(is_active);
CREATE INDEX idx_available_integrations_premium ON available_integrations(is_premium);

CREATE INDEX idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_status ON user_integrations(status);
CREATE INDEX idx_user_integrations_user_status ON user_integrations(user_id, status);
CREATE INDEX idx_user_integrations_sync ON user_integrations(last_sync_at, sync_frequency);

CREATE INDEX idx_integration_usage_user_id ON integration_usage(user_id);
CREATE INDEX idx_integration_usage_occurred_at ON integration_usage(occurred_at);
CREATE INDEX idx_integration_usage_user_date ON integration_usage(user_id, occurred_at);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_webhooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_integrations table
CREATE POLICY "Users can view own integrations" ON user_integrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own integrations" ON user_integrations FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for integration_usage table
CREATE POLICY "Users can view own usage" ON integration_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert usage" ON integration_usage FOR INSERT WITH CHECK (true);

-- RLS Policies for integration_webhooks table
CREATE POLICY "Users can manage own webhooks" ON integration_webhooks FOR ALL USING (auth.uid() = user_id);

-- Available integrations is public (read-only for authenticated users)
ALTER TABLE available_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Available integrations are viewable by authenticated users" ON available_integrations FOR SELECT TO authenticated USING (is_active = true);

-- Functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_available_integrations_updated_at BEFORE UPDATE ON available_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_integrations_updated_at BEFORE UPDATE ON user_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_integration_webhooks_updated_at BEFORE UPDATE ON integration_webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at();