-- ===============================================
-- CLEANUP OLD TABLES AND COLUMNS
-- Run this LAST, after all migrations are complete and tested
-- ===============================================

-- ⚠️ WARNING: This script removes old data structures permanently
-- Make sure you have backups and all services are working with new structure

-- Step 1: Update RLS policies - convert from account_id to user_id based access
-- These tables still use account_id, so we need to join through users table

-- Email sync batches - convert account_id access to user-based
DROP POLICY IF EXISTS "Users can access own email sync batches" ON email_sync_batches;
CREATE POLICY "Users can access own email sync batches" ON email_sync_batches
  FOR ALL USING (
    account_id IN (
      SELECT u.account_id FROM users u WHERE u.auth_id = auth.uid()
    )
  );

-- Email records - convert account_id access to user-based
DROP POLICY IF EXISTS "Users can access own email records" ON email_records;
CREATE POLICY "Users can access own email records" ON email_records
  FOR ALL USING (
    account_id IN (
      SELECT u.account_id FROM users u WHERE u.auth_id = auth.uid()
    )
  );

-- Email insights - convert account_id access to user-based
DROP POLICY IF EXISTS "Users can access own email insights" ON email_insights;
CREATE POLICY "Users can access own email insights" ON email_insights
  FOR ALL USING (
    account_id IN (
      SELECT u.account_id FROM users u WHERE u.auth_id = auth.uid()
    )
  );

-- Email sender patterns - convert account_id access to user-based
DROP POLICY IF EXISTS "Users can access own email sender patterns" ON email_sender_patterns;
CREATE POLICY "Users can access own email sender patterns" ON email_sender_patterns
  FOR ALL USING (
    account_id IN (
      SELECT u.account_id FROM users u WHERE u.auth_id = auth.uid()
    )
  );

-- Email embeddings - convert account_id access to user-based
DROP POLICY IF EXISTS "Users can access their account embeddings" ON email_embeddings;
CREATE POLICY "Users can access own embeddings" ON email_embeddings
  FOR ALL USING (
    account_id IN (
      SELECT u.account_id FROM users u WHERE u.auth_id = auth.uid()
    )
  );

-- Email themes - convert account_id access to user-based
DROP POLICY IF EXISTS "Users can access their account themes" ON email_themes;
CREATE POLICY "Users can access own themes" ON email_themes
  FOR ALL USING (
    account_id IN (
      SELECT u.account_id FROM users u WHERE u.auth_id = auth.uid()
    )
  );

-- Email content analysis - convert account_id access to user-based
DROP POLICY IF EXISTS "Users can access their account analysis" ON email_content_analysis;
CREATE POLICY "Users can access own analysis" ON email_content_analysis
  FOR ALL USING (
    account_id IN (
      SELECT u.account_id FROM users u WHERE u.auth_id = auth.uid()
    )
  );

-- Account theme summary - convert account_id access to user-based
DROP POLICY IF EXISTS "Users can view their account's theme summaries" ON account_theme_summary;
CREATE POLICY "Users can view own theme summaries" ON account_theme_summary
  FOR ALL USING (
    account_id IN (
      SELECT u.account_id FROM users u WHERE u.auth_id = auth.uid()
    )
  );

-- Step 2: Remove account_id column from users table
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