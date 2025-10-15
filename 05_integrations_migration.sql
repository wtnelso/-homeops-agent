-- ===============================================
-- INTEGRATIONS MIGRATION
-- Migrate from account-scoped to user-scoped integrations
-- Maintains privacy: each family member has their own integrations
-- ===============================================

-- Step 1: Add user_id column to account_integrations
ALTER TABLE public.account_integrations
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Step 2: Populate user_id from existing account_id relationships
UPDATE public.account_integrations ai
SET user_id = u.id
FROM accounts a
JOIN users u ON a.id = u.account_id
WHERE ai.account_id = a.id;

-- Step 3: Make user_id NOT NULL (after populating)
ALTER TABLE public.account_integrations
ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Add foreign key constraint for user_id (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'account_integrations_user_id_fkey'
        AND table_name = 'account_integrations'
    ) THEN
        ALTER TABLE public.account_integrations
        ADD CONSTRAINT account_integrations_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Step 5: Drop the old account_id constraint and column (if they exist)
DO $$
BEGIN
    -- Drop constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'account_integrations_account_id_fkey'
        AND table_name = 'account_integrations'
    ) THEN
        ALTER TABLE public.account_integrations DROP CONSTRAINT account_integrations_account_id_fkey;
    END IF;

    -- Drop column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'account_integrations'
        AND column_name = 'account_id'
    ) THEN
        ALTER TABLE public.account_integrations DROP COLUMN account_id;
    END IF;
END $$;

-- Step 6: Rename table to reflect user-scoped nature (if not already renamed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'account_integrations'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.account_integrations RENAME TO user_integrations;
    END IF;
END $$;

-- Step 7: Update indexes (after rename)
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id
ON user_integrations(user_id);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user_status
ON user_integrations(user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_integrations_status
ON user_integrations(status);

-- Step 8: Verify the migration
SELECT
  'Integration Migration Check' as check_type,
  ui.id,
  ui.integration_id,
  ui.status,
  u.id as user_id,
  au.email as user_email,
  ui.enabled,
  ui.connected_at
FROM user_integrations ui
JOIN users u ON ui.user_id = u.id
JOIN auth.users au ON u.auth_id = au.id
ORDER BY au.email;

-- ===============================================
-- INTEGRATION ACCESS PATTERNS
-- ===============================================

/*
With this design:

PRIVACY MAINTAINED:
- John's Gmail integration → Only John can access his emails
- Jane's Calendar integration → Only Jane can see her calendar
- Each family member has private data access

FAMILY DATA SHARED:
- Both can add to family.schools, family.activities, etc.
- Family-level information is accessible to all family members
- AI can use both users' data to build family context (with permissions)

ARCHITECTURE:
┌─────────────────┐    ┌─────────────────┐
│   John's Data   │    │   Jane's Data   │
│ - Gmail         │    │ - Outlook       │
│ - Google Cal    │    │ - Apple Cal     │
│ - Personal docs │    │ - Personal docs │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌─────────────┐
              │ Family Data │
              │ - Schools   │
              │ - Activities│
              │ - Contacts  │
              └─────────────┘

QUERIES BECOME:
- Get MY integrations: WHERE user_id = current_user_id
- Get FAMILY data: WHERE family_id = my_family_id
- AI context: Combine my integrations + family data (with permission)
*/

-- ===============================================
-- NEXT STEPS FOR CODE UPDATES
-- ===============================================

/*
1. Update accountIntegrationsService.ts:
   - Change queries from account_id to user_id
   - Use current user's ID instead of account ID

2. Update integration flows:
   - OAuth callbacks store user_id instead of account_id
   - Integration management is per-user

3. Update AI processing:
   - Fetch integrations by user_id
   - Combine with family data for full context
   - Respect privacy boundaries

4. Consider role-based access:
   - Family admins might see integration status (not data)
   - Billing admins manage family subscription
   - Each user manages their own integrations
*/