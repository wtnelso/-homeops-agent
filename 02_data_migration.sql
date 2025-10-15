-- ===============================================
-- FAMILY ARCHITECTURE MIGRATION - PHASE 2
-- Data Migration from Account-Centric to Family-Centric
-- ===============================================

-- Step 1: Create families for existing users who don't have one
-- This handles the case where users exist but aren't linked to families yet
INSERT INTO public.families (
  id,
  name,
  slug,
  billing_admin_id,
  subscription_status,
  subscription_plan,
  billing_email,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid() as id,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) || ' Family' as name,
  LOWER(REPLACE(COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)), ' ', '-')) || '-family' as slug,
  u.id as billing_admin_id,
  CASE
    WHEN a.subscription_status IS NOT NULL THEN a.subscription_status
    ELSE 'trial'
  END as subscription_status,
  CASE
    WHEN a.subscription_plan IS NOT NULL THEN a.subscription_plan
    ELSE 'free'
  END as subscription_plan,
  u.email as billing_email,
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN users usr ON usr.auth_id = u.id
LEFT JOIN accounts a ON a.id = usr.account_id
LEFT JOIN family_members fm ON fm.user_id = u.id
WHERE fm.user_id IS NULL -- Only create families for users not already in a family
  AND u.email IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Create family_members records for existing users
INSERT INTO public.family_members (
  family_id,
  user_id,
  role,
  family_relationship,
  joined_via,
  joined_at
)
SELECT
  f.id as family_id,
  usr.id as user_id,  -- Use public.users.id, not auth.users.id
  'owner' as role,
  'self' as family_relationship,
  'migration' as joined_via,
  u.created_at as joined_at
FROM auth.users u
JOIN users usr ON usr.auth_id = u.id  -- Get the public.users record
JOIN families f ON f.billing_admin_id = u.id
LEFT JOIN family_members fm ON fm.user_id = usr.id  -- Check against public.users.id
WHERE fm.user_id IS NULL -- Only add if not already a family member
ON CONFLICT (family_id, user_id) DO NOTHING;

-- Step 3: Migrate existing account_profiles data from Neon to family schema
-- NOTE: This assumes you have the account_profiles data available
-- You'll need to adapt this based on your actual Neon data structure

-- Step 4: Create data sources for migrated data
INSERT INTO family.data_sources (
  family_id,
  source_type,
  reference_id,
  original_text,
  confidence,
  created_at
)
SELECT
  fm.family_id,
  'migration' as source_type,
  'account-migration-' || a.id::text as reference_id,
  'Migrated from accounts table' as original_text,
  1.0 as confidence,
  a.created_at
FROM accounts a
JOIN users usr ON a.id = usr.account_id
JOIN auth.users u ON usr.auth_id = u.id
JOIN family_members fm ON fm.user_id = usr.id  -- Use public.users.id
WHERE NOT EXISTS (
  SELECT 1 FROM family.data_sources ds
  WHERE ds.reference_id = 'account-migration-' || a.id::text
);

-- Step 5: Set up billing data from accounts table
UPDATE families f
SET
  subscription_status = COALESCE(a.subscription_status, f.subscription_status),
  subscription_plan = COALESCE(a.subscription_plan, f.subscription_plan),
  subscription_ends_at = a.trial_ends_at,
  stripe_customer_id = a.stripe_customer_id
FROM accounts a
JOIN users usr ON a.id = usr.account_id
JOIN auth.users u ON usr.auth_id = u.id
WHERE f.billing_admin_id = u.id;

-- Step 6: Verify migration results
SELECT
  'Migration Summary' as check_type,
  COUNT(DISTINCT f.id) as families_created,
  COUNT(DISTINCT fm.user_id) as users_migrated,
  COUNT(DISTINCT a.id) as accounts_processed
FROM families f
LEFT JOIN family_members fm ON f.id = fm.family_id
LEFT JOIN users usr ON fm.user_id = usr.id  -- family_members references public.users
LEFT JOIN auth.users u ON usr.auth_id = u.id
LEFT JOIN accounts a ON a.id = usr.account_id;

-- Step 7: Show family structure after migration
SELECT
  'Family Structure' as check_type,
  f.name as family_name,
  f.slug,
  u.email as billing_admin_email,
  f.subscription_status,
  f.subscription_plan,
  COUNT(fm.user_id) as member_count
FROM families f
JOIN auth.users u ON f.billing_admin_id = u.id
LEFT JOIN family_members fm ON f.id = fm.family_id
GROUP BY f.id, f.name, f.slug, u.email, f.subscription_status, f.subscription_plan
ORDER BY f.created_at;

-- ===============================================
-- PHASE 2 COMPLETE
-- Data successfully migrated to family structure
-- ===============================================