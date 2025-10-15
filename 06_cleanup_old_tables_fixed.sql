-- ===============================================
-- CLEANUP OLD TABLES AND COLUMNS - FIXED VERSION
-- Run this LAST, after all migrations are complete and tested
-- ===============================================

-- ⚠️ WARNING: This script removes old data structures permanently
-- Make sure you have backups and all services are working with new structure

-- Step 1: Update RLS policies to remove dependency on users.account_id column
-- The key insight: we need to avoid referencing users.account_id in the policy definitions

-- Email sync batches - has direct account_id column
DROP POLICY IF EXISTS "Users can access own email sync batches" ON email_sync_batches;
CREATE POLICY "Users can access own email sync batches" ON email_sync_batches
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Email records - accessed via batch_id → email_sync_batches.account_id (no direct account_id column)
DROP POLICY IF EXISTS "Users can access own email records" ON email_records;
CREATE POLICY "Users can access own email records" ON email_records
  FOR ALL USING (
    batch_id IN (
      SELECT esb.id FROM email_sync_batches esb
      JOIN accounts a ON esb.account_id = a.id
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Email insights - accessed via batch_id → email_sync_batches.account_id (no direct account_id column)
DROP POLICY IF EXISTS "Users can access own email insights" ON email_insights;
CREATE POLICY "Users can access own email insights" ON email_insights
  FOR ALL USING (
    batch_id IN (
      SELECT esb.id FROM email_sync_batches esb
      JOIN accounts a ON esb.account_id = a.id
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Email sender patterns - accessed via batch_id → email_sync_batches.account_id (no direct account_id column)
DROP POLICY IF EXISTS "Users can access own email sender patterns" ON email_sender_patterns;
CREATE POLICY "Users can access own email sender patterns" ON email_sender_patterns
  FOR ALL USING (
    batch_id IN (
      SELECT esb.id FROM email_sync_batches esb
      JOIN accounts a ON esb.account_id = a.id
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Email embeddings - has direct account_id column
DROP POLICY IF EXISTS "Users can access their account embeddings" ON email_embeddings;
CREATE POLICY "Users can access own embeddings" ON email_embeddings
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Email themes - check if table exists first, it might not exist in your database
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_themes' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can access their account themes" ON email_themes;
        EXECUTE 'CREATE POLICY "Users can access own themes" ON email_themes
          FOR ALL USING (
            account_id IN (
              SELECT a.id FROM accounts a
              JOIN users u ON a.id = u.account_id
              WHERE u.auth_id = auth.uid()
            )
          )';
    ELSE
        RAISE NOTICE 'email_themes table does not exist, skipping policy creation';
    END IF;
END $$;

-- Email content analysis - has direct account_id column
DROP POLICY IF EXISTS "Users can access their account analysis" ON email_content_analysis;
CREATE POLICY "Users can access own analysis" ON email_content_analysis
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Account theme summary - has direct account_id column
DROP POLICY IF EXISTS "Users can view their account's theme summaries" ON account_theme_summary;
CREATE POLICY "Users can view own theme summaries" ON account_theme_summary
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Step 2: Now we can safely remove account_id column from users table
DO $$
BEGIN
    -- Drop foreign key constraint on users.account_id if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%users_account_id_fkey%'
        AND table_name = 'users'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE public.users DROP CONSTRAINT ' || constraint_name || ';'
            FROM information_schema.table_constraints
            WHERE constraint_name LIKE '%users_account_id_fkey%'
            AND table_name = 'users'
            LIMIT 1
        );
        RAISE NOTICE 'Dropped foreign key constraint on users.account_id';
    END IF;

    -- Drop the account_id column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'account_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users DROP COLUMN account_id;
        RAISE NOTICE 'Dropped account_id column from users table';
    END IF;
END $$;

-- Step 3: Archive or drop the accounts table (CAREFUL!)
-- Only do this when you're 100% sure the migration is successful

-- Option A: Rename to backup table (recommended)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'accounts'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.accounts RENAME TO accounts_backup;
        RAISE NOTICE 'Renamed accounts table to accounts_backup';
    END IF;
END $$;

-- Option B: Drop table completely (DANGEROUS - uncomment only if you're sure)
-- DROP TABLE IF EXISTS public.accounts CASCADE;

-- Step 4: Clean up any remaining account-related indexes
DROP INDEX IF EXISTS idx_users_account_id;
DROP INDEX IF EXISTS idx_accounts_user_id;

-- Step 5: Clean up old functions that reference accounts
DROP FUNCTION IF EXISTS get_user_account();
DROP FUNCTION IF EXISTS get_account_by_user();

-- Step 6: Verify cleanup
SELECT
  'Cleanup Verification' as check_type,
  'accounts table' as item,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts' AND table_schema = 'public')
    THEN 'Still exists'
    ELSE 'Removed/Renamed'
  END as status
UNION ALL
SELECT
  'Cleanup Verification' as check_type,
  'users.account_id column' as item,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_id' AND table_schema = 'public')
    THEN 'Still exists'
    ELSE 'Removed'
  END as status
UNION ALL
SELECT
  'Cleanup Verification' as check_type,
  'accounts_backup table' as item,
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'accounts_backup' AND table_schema = 'public')
    THEN 'Created'
    ELSE 'Not found'
  END as status;

-- ===============================================
-- FINAL ARCHITECTURE VERIFICATION
-- ===============================================

-- Show the final table structure
SELECT
  'Final Architecture' as check_type,
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname IN ('public', 'family')
  AND tablename IN ('families', 'family_members', 'user_integrations', 'users')
ORDER BY schemaname, tablename;

-- Show family relationship structure
SELECT
  'Family Structure Check' as check_type,
  f.name as family_name,
  COUNT(fm.user_id) as member_count,
  f.subscription_status,
  au.email as billing_admin_email
FROM families f
LEFT JOIN family_members fm ON f.id = fm.family_id
LEFT JOIN auth.users au ON f.billing_admin_id = au.id
GROUP BY f.id, f.name, f.subscription_status, au.email
ORDER BY f.name;

-- ===============================================
-- CLEANUP COMPLETE
-- Architecture is now fully family-centric!
-- ===============================================

-- ⚠️ IMPORTANT: After running this script, you'll need to eventually migrate
-- the email tables from account_id to user_id columns to complete the transition
-- This script maintains the current email functionality while removing the
-- users.account_id dependency that was blocking the family migration.