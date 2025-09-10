-- HomeOps Database Schema Backup
-- Generated on: 2025-01-08
-- Supabase Project ID: qagpjgxgksqknbanhfbq

-- =============================================================================
-- PUBLIC SCHEMA TABLES
-- =============================================================================

-- Table: public.integrations
CREATE TABLE public.integrations (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,
    image_url text,
    category text NOT NULL CHECK (category = ANY (ARRAY['email'::text, 'communication'::text, 'productivity'::text, 'video'::text, 'project-management'::text, 'calendar'::text])),
    status text DEFAULT 'available'::text CHECK (status = ANY (ARRAY['available'::text, 'coming_soon'::text, 'beta'::text])),
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    long_description text,
    platform_url text,
    how_it_works text,
    required_scopes text[]
);

-- Table: public.accounts
CREATE TABLE public.accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    stripe_customer_id text UNIQUE,
    stripe_subscription_id text,
    subscription_status text DEFAULT 'inactive'::text CHECK (subscription_status = ANY (ARRAY['active'::text, 'inactive'::text, 'trialing'::text, 'past_due'::text, 'canceled'::text, 'unpaid'::text])),
    subscription_plan text DEFAULT 'free'::text CHECK (subscription_plan = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text])),
    trial_ends_at timestamp with time zone,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    timezone text DEFAULT 'UTC'::text,
    is_active boolean DEFAULT true,
    max_users integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create custom enum for user_role if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member', 'readonly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: public.users  
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES public.accounts(id),
    email text UNIQUE NOT NULL,
    email_verified boolean DEFAULT false,
    name text,
    avatar_url text,
    auth_id uuid UNIQUE,
    role user_role DEFAULT 'member'::user_role,
    is_active boolean DEFAULT true,
    timezone text DEFAULT 'UTC'::text,
    theme text DEFAULT 'system'::text CHECK (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
    email_notifications boolean DEFAULT true,
    onboarded_at timestamp with time zone,
    last_login_at timestamp with time zone,
    last_active_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table: public.account_integrations
CREATE TABLE public.account_integrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id uuid NOT NULL REFERENCES public.accounts(id),
    integration_id text NOT NULL REFERENCES public.integrations(id),
    status text DEFAULT 'disconnected'::text CHECK (status = ANY (ARRAY['connected'::text, 'disconnected'::text, 'error'::text, 'syncing'::text])),
    enabled boolean DEFAULT false,
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,
    scopes text[],
    config jsonb DEFAULT '{}'::jsonb,
    last_sync_at timestamp with time zone,
    installed_by_user_id uuid REFERENCES public.users(id),
    connected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =============================================================================
-- CURRENT DATA (for reference)
-- =============================================================================

-- Note: The following data was present at backup time
-- integrations: 2 rows
-- accounts: 2 rows  
-- users: 2 rows
-- account_integrations: 2 rows

-- =============================================================================
-- FUNCTIONS & TRIGGERS (Referenced in security advisor)
-- =============================================================================

-- Note: These functions were referenced in the security scan:
-- - update_user_last_login()
-- - update_updated_at_column()
-- - set_connected_at()
-- - get_user_account_id()
-- - get_user_role()
-- - handle_new_user() -- This was likely causing the auth issues
-- - handle_user_delete()
-- - get_current_user()
-- - get_current_account()
-- - user_has_role()
-- - user_has_min_role()
-- - get_user_account_integrations()
-- - invite_user_to_account()
-- - get_user_session_data()

-- =============================================================================
-- NOTES
-- =============================================================================

-- Issues found:
-- 1. "Database error saving new user" - affecting both email and OAuth signup
-- 2. RLS policies exist but were disabled for testing
-- 3. Custom triggers were disabled for testing
-- 4. All authentication methods failing at Supabase service level

-- Configuration:
-- - Google OAuth configured in Supabase dashboard
-- - Site URL: http://localhost:3000
-- - Redirect URLs: http://localhost:3000/auth/callback
-- - Environment variables properly set