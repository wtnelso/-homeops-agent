-- ===============================================
-- FOREIGN KEY CONSTRAINT FIX
-- Ensure family_members.user_id references public.users, not auth.users
-- ===============================================

-- Step 1: Check if family_members table exists and has the wrong constraint
DO $$
BEGIN
    -- Drop the incorrect foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name LIKE '%family_members_user_id_fkey%'
        AND table_name = 'family_members'
    ) THEN
        -- Get the exact constraint name and drop it
        EXECUTE (
            SELECT 'ALTER TABLE public.family_members DROP CONSTRAINT ' || constraint_name || ';'
            FROM information_schema.table_constraints
            WHERE constraint_name LIKE '%family_members_user_id_fkey%'
            AND table_name = 'family_members'
            LIMIT 1
        );

        RAISE NOTICE 'Dropped existing foreign key constraint on family_members.user_id';
    END IF;
END $$;

-- Step 2: Add the correct foreign key constraint
ALTER TABLE public.family_members
ADD CONSTRAINT family_members_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Step 3: Similarly fix families.billing_admin_id if needed
DO $$
BEGIN
    -- Check if billing_admin_id exists and has wrong constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'families'
        AND column_name = 'billing_admin_id'
    ) THEN
        -- Drop any existing constraint on billing_admin_id
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name LIKE '%families_billing_admin_id_fkey%'
            AND table_name = 'families'
        ) THEN
            EXECUTE (
                SELECT 'ALTER TABLE public.families DROP CONSTRAINT ' || constraint_name || ';'
                FROM information_schema.table_constraints
                WHERE constraint_name LIKE '%families_billing_admin_id_fkey%'
                AND table_name = 'families'
                LIMIT 1
            );
        END IF;

        -- Add correct constraint - billing_admin should reference auth.users
        ALTER TABLE public.families
        ADD CONSTRAINT families_billing_admin_id_fkey
        FOREIGN KEY (billing_admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

        RAISE NOTICE 'Fixed billing_admin_id foreign key constraint';
    END IF;
END $$;

-- Step 4: Verify the constraints are correct
SELECT
    'Foreign Key Check' as check_type,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('family_members', 'families')
    AND (kcu.column_name = 'user_id' OR kcu.column_name = 'billing_admin_id');

-- ===============================================
-- CONSTRAINT FIX COMPLETE
-- Now you can run 01_family_architecture_migration.sql
-- ===============================================