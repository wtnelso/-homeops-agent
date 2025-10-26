-- Fix User Signup Triggers and Family Creation
-- This script removes duplicate triggers and ensures proper family/family_member creation

-- Step 1: Remove duplicate trigger (already done)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Update create_public_user_on_signup() function to create families and family_members
CREATE OR REPLACE FUNCTION create_public_user_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id uuid;
  existing_user_count integer;
BEGIN
  RAISE NOTICE 'USER SIGNUP: Processing user % with email %', NEW.id, NEW.email;

  -- Check if user already exists
  SELECT COUNT(*) INTO existing_user_count
  FROM public.users
  WHERE auth_id = NEW.id OR email = NEW.email;

  RAISE NOTICE 'USER SIGNUP: Found % existing users', existing_user_count;

  IF existing_user_count = 0 THEN
    -- Create family record first
    INSERT INTO families (
      name,
      billing_admin_id
    ) VALUES (
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Family',
      NEW.id
    ) RETURNING id INTO new_family_id;

    RAISE NOTICE 'USER SIGNUP: Created family %', new_family_id;

    -- Create user (no account_id)
    INSERT INTO public.users (auth_id, email, name_auth_provided, email_verified, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            NEW.email_confirmed_at IS NOT NULL, 'owner');

    -- Create family member record
    INSERT INTO family_members (
      family_id,
      user_id,
      family_relationship,
      name,
      email,
      created_by
    ) VALUES (
      new_family_id,
      NEW.id,
      'user',
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email,
      NEW.id
    );

    RAISE NOTICE 'USER SIGNUP: Created user and family member successfully';
  ELSE
    RAISE NOTICE 'USER SIGNUP: Skipping - user already exists';
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'USER SIGNUP ERROR: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Fix existing users without family records
-- Create families and family_members for existing users
WITH new_families AS (
  INSERT INTO families (
    name,
    billing_admin_id
  )
  SELECT
    u.name_auth_provided || '''s Family',
    u.auth_id
  FROM public.users u
  LEFT JOIN family_members fm ON fm.user_id = u.auth_id
  WHERE fm.id IS NULL
  RETURNING id as family_id, billing_admin_id as user_id
)
INSERT INTO family_members (
  family_id,
  user_id,
  family_relationship,
  name,
  email,
  created_by
)
SELECT
  nf.family_id,
  nf.user_id,
  'user',
  u.name_auth_provided,
  u.email,
  nf.user_id
FROM new_families nf
JOIN public.users u ON u.auth_id = nf.user_id;

-- Verification queries (optional - run after the above)
-- Check that all users now have family_members records
SELECT
  'Users without family members:' as check_type,
  COUNT(*) as count
FROM public.users u
LEFT JOIN family_members fm ON fm.user_id = u.auth_id
WHERE fm.id IS NULL;

-- Show recent family and family_member records
SELECT
  'Recent families created:' as info,
  f.id as family_id,
  f.name as family_name,
  fm.name as member_name,
  fm.email as member_email
FROM families f
JOIN family_members fm ON fm.family_id = f.id
ORDER BY f.created_at DESC
LIMIT 10;