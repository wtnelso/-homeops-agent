-- BACKUP: Original create_public_user_on_signup() function
-- Created: 2025-10-25
-- This is the backup of the original function before modifications

-- To restore this function, run:
CREATE OR REPLACE FUNCTION create_public_user_on_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_account_id uuid;
  existing_user_count integer;
BEGIN
  RAISE NOTICE 'USER SIGNUP: Processing user % with email %', NEW.id, NEW.email;

  -- Check if user already exists
  SELECT COUNT(*) INTO existing_user_count
  FROM public.users
  WHERE auth_id = NEW.id OR email = NEW.email;

  RAISE NOTICE 'USER SIGNUP: Found % existing users', existing_user_count;

  IF existing_user_count = 0 THEN
    -- Create account first
    INSERT INTO public.accounts (subscription_status, subscription_plan, timezone, is_active, max_users)
    VALUES ('inactive', 'free', 'UTC', true, 1)
    RETURNING id INTO new_account_id;

    RAISE NOTICE 'USER SIGNUP: Created account %', new_account_id;

    -- Create user with account_id
    INSERT INTO public.users (auth_id, email, name_auth_provided, email_verified, account_id, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
            NEW.email_confirmed_at IS NOT NULL, new_account_id, 'owner');

    RAISE NOTICE 'USER SIGNUP: Created user successfully';
  ELSE
    RAISE NOTICE 'USER SIGNUP: Skipping - user already exists';
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'USER SIGNUP ERROR: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BACKUP: Removed trigger (in case you need to restore it)
-- CREATE TRIGGER on_auth_user_created
-- AFTER INSERT ON auth.users
-- FOR EACH ROW
-- EXECUTE FUNCTION handle_new_user();

-- Note: This backup represents the state before:
-- 1. Removing the duplicate trigger on_auth_user_created
-- 2. Updating create_public_user_on_signup to create families and family_members
-- 3. Removing account_id references