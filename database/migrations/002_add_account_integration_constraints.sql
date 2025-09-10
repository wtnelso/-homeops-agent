-- Add unique constraint for account_integrations to ensure one integration per account
-- This migration ensures the upsert logic works properly

-- Add unique constraint on (account_id, integration_id)
-- This prevents duplicate integrations per account
DO $$ 
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_account_integration' 
        AND table_name = 'account_integrations'
    ) THEN
        ALTER TABLE account_integrations 
        ADD CONSTRAINT unique_account_integration 
        UNIQUE (account_id, integration_id);
    END IF;
END $$;

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_account_integrations_status 
ON account_integrations(account_id, status);

-- Add index for better performance on enabled queries  
CREATE INDEX IF NOT EXISTS idx_account_integrations_enabled
ON account_integrations(account_id, enabled);

-- Add index for sync operations
CREATE INDEX IF NOT EXISTS idx_account_integrations_sync
ON account_integrations(account_id, last_sync_at, sync_frequency_minutes);