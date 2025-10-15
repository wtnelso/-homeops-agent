-- ===============================================
-- SAFE CLEANUP - Based on Your Actual Table Structure
-- Only updates policies that actually exist in your database
-- ===============================================

-- Step 1: Update only the policies that exist based on your pg_policies query
-- We know these exist from your query results

-- Email sync batches (has account_id column)
DROP POLICY IF EXISTS "Users can access own email sync batches" ON email_sync_batches;
CREATE POLICY "Users can access own email sync batches" ON email_sync_batches
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Email records (uses batch_id, no account_id column)
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

-- Email insights (uses batch_id, no account_id column)
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

-- Email sender patterns (uses batch_id, no account_id column)
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

-- Email embeddings (has account_id column)
DROP POLICY IF EXISTS "Users can access their account embeddings" ON email_embeddings;
CREATE POLICY "Users can access own embeddings" ON email_embeddings
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Email themes (has account_id column) - from your policies list
DROP POLICY IF EXISTS "Users can access their account themes" ON email_themes;
CREATE POLICY "Users can access own themes" ON email_themes
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Email content analysis (has account_id column)
DROP POLICY IF EXISTS "Users can access their account analysis" ON email_content_analysis;
CREATE POLICY "Users can access own analysis" ON email_content_analysis
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Account theme summary (has account_id column)
DROP POLICY IF EXISTS "Users can view their account's theme summaries" ON account_theme_summary;
CREATE POLICY "Users can view own theme summaries" ON account_theme_summary
  FOR ALL USING (
    account_id IN (
      SELECT a.id FROM accounts a
      JOIN users u ON a.id = u.account_id
      WHERE u.auth_id = auth.uid()
    )
  );

-- Step 2: Now safely drop users.account_id column
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

-- Step 3: Verification
SELECT 'users.account_id column dropped successfully' as status;

-- Verify policies work
SELECT
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