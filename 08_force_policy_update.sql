-- ===============================================
-- FORCE POLICY UPDATE - Complete Policy Replacement
-- Drop all problematic policies first, then recreate them properly
-- ===============================================

-- Step 1: DROP ALL existing policies that depend on users.account_id
-- This ensures we completely remove the old dependency

DROP POLICY IF EXISTS "Users can access own email sync batches" ON email_sync_batches;
DROP POLICY IF EXISTS "Users can access own email records" ON email_records;
DROP POLICY IF EXISTS "Users can access own email insights" ON email_insights;
DROP POLICY IF EXISTS "Users can access own email sender patterns" ON email_sender_patterns;
DROP POLICY IF EXISTS "Users can access their account embeddings" ON email_embeddings;
DROP POLICY IF EXISTS "Users can access own embeddings" ON email_embeddings;
DROP POLICY IF EXISTS "Users can access their account themes" ON email_themes;
DROP POLICY IF EXISTS "Users can access own themes" ON email_themes;
DROP POLICY IF EXISTS "Users can access their account analysis" ON email_content_analysis;
DROP POLICY IF EXISTS "Users can access own analysis" ON email_content_analysis;
DROP POLICY IF EXISTS "Users can view their account's theme summaries" ON account_theme_summary;
DROP POLICY IF EXISTS "Users can view own theme summaries" ON account_theme_summary;

-- Step 2: Verify all policies are dropped
SELECT
  'Remaining Policies Check' as check_type,
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN (
  'email_sync_batches',
  'email_records',
  'email_insights',
  'email_sender_patterns',
  'email_embeddings',
  'email_themes',
  'email_content_analysis',
  'account_theme_summary'
)
AND policyname LIKE '%Users can%';

-- Step 3: Try to drop the users.account_id column now (should work if no policies depend on it)
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
        RAISE NOTICE 'SUCCESS: Dropped account_id column from users table';
    ELSE
        RAISE NOTICE 'Column account_id does not exist in users table';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR dropping column: %', SQLERRM;
        -- Show what's still depending on it
        RAISE NOTICE 'Check dependencies with: SELECT * FROM pg_depend WHERE refobjid = (SELECT oid FROM pg_class WHERE relname = ''users'');';
END $$;

-- Step 4: Recreate policies WITHOUT dependency on users.account_id (only if column drop succeeded)
-- These will only run if the users.account_id column was successfully dropped

DO $$
BEGIN
    -- Check if users.account_id column still exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'account_id' AND table_schema = 'public'
    ) THEN
        -- Column is gone, safe to create new policies

        -- Email sync batches (has account_id column)
        EXECUTE 'CREATE POLICY "Users can access own email sync batches" ON email_sync_batches
          FOR ALL USING (
            account_id IN (
              SELECT a.id FROM accounts a
              JOIN users u ON a.id = u.account_id
              WHERE u.auth_id = auth.uid()
            )
          )';

        -- Email records (uses batch_id)
        EXECUTE 'CREATE POLICY "Users can access own email records" ON email_records
          FOR ALL USING (
            batch_id IN (
              SELECT esb.id FROM email_sync_batches esb
              JOIN accounts a ON esb.account_id = a.id
              JOIN users u ON a.id = u.account_id
              WHERE u.auth_id = auth.uid()
            )
          )';

        -- Email insights (uses batch_id)
        EXECUTE 'CREATE POLICY "Users can access own email insights" ON email_insights
          FOR ALL USING (
            batch_id IN (
              SELECT esb.id FROM email_sync_batches esb
              JOIN accounts a ON esb.account_id = a.id
              JOIN users u ON a.id = u.account_id
              WHERE u.auth_id = auth.uid()
            )
          )';

        -- Email sender patterns (uses batch_id)
        EXECUTE 'CREATE POLICY "Users can access own email sender patterns" ON email_sender_patterns
          FOR ALL USING (
            batch_id IN (
              SELECT esb.id FROM email_sync_batches esb
              JOIN accounts a ON esb.account_id = a.id
              JOIN users u ON a.id = u.account_id
              WHERE u.auth_id = auth.uid()
            )
          )';

        -- Email embeddings (has account_id)
        EXECUTE 'CREATE POLICY "Users can access own embeddings" ON email_embeddings
          FOR ALL USING (
            account_id IN (
              SELECT a.id FROM accounts a
              JOIN users u ON a.id = u.account_id
              WHERE u.auth_id = auth.uid()
            )
          )';

        -- Email themes (has account_id) - only if table exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_themes' AND table_schema = 'public') THEN
            EXECUTE 'CREATE POLICY "Users can access own themes" ON email_themes
              FOR ALL USING (
                account_id IN (
                  SELECT a.id FROM accounts a
                  JOIN users u ON a.id = u.account_id
                  WHERE u.auth_id = auth.uid()
                )
              )';
        END IF;

        -- Email content analysis (has account_id)
        EXECUTE 'CREATE POLICY "Users can access own analysis" ON email_content_analysis
          FOR ALL USING (
            account_id IN (
              SELECT a.id FROM accounts a
              JOIN users u ON a.id = u.account_id
              WHERE u.auth_id = auth.uid()
            )
          )';

        -- Account theme summary (has account_id)
        EXECUTE 'CREATE POLICY "Users can view own theme summaries" ON account_theme_summary
          FOR ALL USING (
            account_id IN (
              SELECT a.id FROM accounts a
              JOIN users u ON a.id = u.account_id
              WHERE u.auth_id = auth.uid()
            )
          )';

        RAISE NOTICE 'SUCCESS: All policies recreated without users.account_id dependency';
    ELSE
        RAISE NOTICE 'users.account_id column still exists, cannot create new policies';
    END IF;
END $$;

-- Step 5: Final verification
SELECT 'Cleanup complete!' as status;

SELECT
  'New Policies Check' as check_type,
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN (
  'email_sync_batches',
  'email_records',
  'email_insights',
  'email_sender_patterns',
  'email_embeddings',
  'email_themes',
  'email_content_analysis',
  'account_theme_summary'
)
ORDER BY tablename;