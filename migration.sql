-- ===============================================
-- FAMILY DATA MIGRATION SCRIPT
-- Import JSON data into Supabase family schema
-- ===============================================

-- Step 0: Temporarily disable foreign key checks and rename tables (if needed)
SET session_replication_role = replica;

-- Rename existing tables to families (only if they still exist with old names)
DO $$
BEGIN
    -- Check if organizations table exists and rename it
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations' AND table_schema = 'public') THEN
        ALTER TABLE organizations RENAME TO families;
    END IF;

    -- Check if organization_members table exists and rename it
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organization_members' AND table_schema = 'public') THEN
        ALTER TABLE organization_members RENAME TO family_members;
    END IF;

    -- Rename column if it exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'family_members' AND column_name = 'organization_id' AND table_schema = 'public') THEN
        ALTER TABLE family_members RENAME COLUMN organization_id TO family_id;
    END IF;
END $$;

-- Update foreign key constraint names after table rename (only if they exist)
DO $$
BEGIN
    -- Rename constraints only if they exist with old names
    IF EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'organization_members_user_id_fkey') THEN
        ALTER TABLE family_members RENAME CONSTRAINT organization_members_user_id_fkey TO family_members_user_id_fkey;
    END IF;

    IF EXISTS (SELECT FROM information_schema.table_constraints WHERE constraint_name = 'organization_members_organization_id_fkey') THEN
        ALTER TABLE family_members RENAME CONSTRAINT organization_members_organization_id_fkey TO family_members_family_id_fkey;
    END IF;
END $$;

-- Rename organization_id to family_id in family schema tables (only if needed)
DO $$
BEGIN
    -- Rename columns in family schema tables only if they exist
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'data_sources' AND column_name = 'organization_id' AND table_schema = 'family') THEN
        ALTER TABLE family.data_sources RENAME COLUMN organization_id TO family_id;
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'family_profiles' AND column_name = 'organization_id' AND table_schema = 'family') THEN
        ALTER TABLE family.family_profiles RENAME COLUMN organization_id TO family_id;
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'schools' AND column_name = 'organization_id' AND table_schema = 'family') THEN
        ALTER TABLE family.schools RENAME COLUMN organization_id TO family_id;
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'keywords' AND column_name = 'organization_id' AND table_schema = 'family') THEN
        ALTER TABLE family.keywords RENAME COLUMN organization_id TO family_id;
    END IF;
END $$;

-- Update functions to use new table names
CREATE OR REPLACE FUNCTION get_user_family_id(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT family_id
    FROM family_members
    WHERE user_id = user_uuid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the get_account_profile_for_ai function to use new table/function names
CREATE OR REPLACE FUNCTION public.get_account_profile_for_ai(user_uuid uuid DEFAULT auth.uid(), include_source_data boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  family_id_var uuid;
  result jsonb;
  family_members jsonb;
  family_profiles jsonb;
  activities_data jsonb;
  schools_data jsonb;
  contacts_data jsonb;
  preferences_data jsonb;
  keywords_data jsonb;
BEGIN
  -- Get user's family
  SELECT get_user_family_id(user_uuid) INTO family_id_var;

  IF family_id_var IS NULL THEN
    RETURN jsonb_build_object('error', 'No family found for user');
  END IF;

  -- Get family members (authenticated family members)
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', fm.user_id,
      'role', fm.role,
      'family_relationship', fm.family_relationship,
      'name', COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
      'email', u.email
    )
  ) INTO family_members
  FROM family_members fm
  JOIN auth.users u ON u.id = fm.user_id
  WHERE fm.family_id = family_id_var;

  -- Get family profiles (non-authenticated members) - now in family schema
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', fp.id,
      'name', fp.name,
      'relationship', fp.relationship,
      'age', fp.age,
      'notes', fp.notes,
      'managed_by', fp.managed_by
    )
  ) INTO family_profiles
  FROM family.family_profiles fp
  WHERE fp.family_id = family_id_var;

  -- Get activities - now in family schema
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'family_member_id', a.family_member_id,
      'family_member_type', a.family_member_type,
      'activity_name', a.activity_name,
      'activity_type', a.activity_type,
      'frequency', a.frequency,
      'schedule_details', a.schedule_details,
      'location', a.location,
      'end_date', a.end_date
    )
  ) INTO activities_data
  FROM family.activities a
  WHERE a.family_id = family_id_var;

  -- Get schools - now in family schema
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'family_member_id', s.family_member_id,
      'family_member_type', s.family_member_type,
      'school_name', s.school_name,
      'grade_or_program', s.grade_or_program,
      'teacher_or_contact', s.teacher_or_contact,
      'phone', s.phone,
      'email', s.email,
      'notes', s.notes
    )
  ) INTO schools_data
  FROM family.schools s
  WHERE s.family_id = family_id_var;

  -- Get contacts - now in family schema
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'contact_name', c.contact_name,
      'contact_type', c.contact_type,
      'phone', c.phone,
      'email', c.email,
      'relationship_to_family', c.relationship_to_family,
      'notes', c.notes
    )
  ) INTO contacts_data
  FROM family.contacts c
  WHERE c.family_id = family_id_var;

  -- Get preferences grouped by category - now in family schema
  SELECT jsonb_object_agg(
    p.category,
    jsonb_object_agg(p.preference_key, p.preference_value)
  ) INTO preferences_data
  FROM family.preferences p
  WHERE p.family_id = family_id_var;

  -- Get keywords
  SELECT jsonb_agg(
    jsonb_build_object(
      'keyword', k.keyword,
      'category', k.category,
      'importance', k.importance,
      'auto_generated', k.auto_generated,
      'match_count', k.match_count
    )
  ) INTO keywords_data
  FROM family.keywords k
  WHERE k.family_id = family_id_var;

  -- Build final result
  result := jsonb_build_object(
    'family', jsonb_build_object(
      'id', family_id_var,
      'name', (SELECT name FROM families WHERE id = family_id_var),
      'members', COALESCE(family_members, '[]'::jsonb),
      'profiles', COALESCE(family_profiles, '[]'::jsonb),
      'keywords', COALESCE(keywords_data, '[]'::jsonb)
    ),
    'activities', COALESCE(activities_data, '[]'::jsonb),
    'schools', COALESCE(schools_data, '[]'::jsonb),
    'contacts', COALESCE(contacts_data, '[]'::jsonb),
    'preferences', COALESCE(preferences_data, '{}'::jsonb)
  );

  RETURN result;
END;
$function$;

-- Step 1: Create family for John Smith (using existing account)
INSERT INTO families (
  id,
  name,
  slug,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'John Smith Family',
  'john-smith-family',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Add John as family member (using existing user record)
INSERT INTO family_members (
  family_id,
  user_id,
  role,
  family_relationship,
  joined_at
)
VALUES (
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  (SELECT id FROM users WHERE account_id = 'aa7f2fcd-2696-4fa2-abb7-38c4dd0daba0'),
  'owner',
  'self',
  NOW()
)
ON CONFLICT (family_id, user_id) DO NOTHING;

-- Step 3: Create data sources for tracking
-- Source for CCES (from chat)
INSERT INTO family.data_sources (
  family_id,
  source_type,
  reference_id,
  original_text,
  confidence,
  created_at
)
VALUES (
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  'chat',
  'chat-school-001',
  'John goes to CCES and is in 4th grade',
  0.88,
  '2025-09-17T14:15:00Z'::timestamptz
)
ON CONFLICT (reference_id) DO NOTHING;

-- Source for Riverside Elementary (AI suggestion)
INSERT INTO family.data_sources (
  family_id,
  source_type,
  reference_id,
  original_text,
  confidence,
  created_at
)
VALUES (
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  'ai_suggestion',
  NULL,
  '',
  0.9,
  '2025-09-21T00:23:21.078Z'::timestamptz
);

-- Step 4: Add John as family profile
INSERT INTO family.family_profiles (
  family_id,
  name,
  relationship,
  age,
  managed_by,
  notes,
  source_id
)
VALUES (
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  'John Smith',
  'self',
  32,
  (SELECT id FROM users WHERE account_id = 'aa7f2fcd-2696-4fa2-abb7-38c4dd0daba0' LIMIT 1),
  jsonb_build_object(
    'original_id', 'a37ba9c3-ed4b-4dc6-b0f9-ea8746996364',
    'type', 'user',
    'email', 'john1@example.com',
    'order', 0
  ),
  (SELECT id FROM family.data_sources WHERE reference_id = 'chat-school-001' LIMIT 1)
)
ON CONFLICT (family_id, name) DO NOTHING;

-- Step 5: Add John's schools
-- CCES
INSERT INTO family.schools (
  family_id,
  family_member_id,
  family_member_type,
  school_name,
  grade_or_program,
  email,
  notes,
  source_id
)
VALUES (
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  (SELECT id FROM family.family_profiles WHERE name = 'John Smith' LIMIT 1),
  'profile',
  'CCES',
  '5th Grade',
  NULL,
  jsonb_build_object(
    'type', 'high',
    'email_domain', 'cces.edu'
  ),
  (SELECT id FROM family.data_sources WHERE reference_id = 'chat-school-001' LIMIT 1)
);

-- Riverside Elementary
INSERT INTO family.schools (
  family_id,
  family_member_id,
  family_member_type,
  school_name,
  grade_or_program,
  source_id
)
VALUES (
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  (SELECT id FROM family.family_profiles WHERE name = 'John Smith' LIMIT 1),
  'profile',
  'Riverside Elementary',
  '3rd Grade',
  (SELECT id FROM family.data_sources WHERE source_type = 'ai_suggestion' LIMIT 1)
);

-- Step 6: Add keywords for AI detection
INSERT INTO family.keywords (
  family_id,
  keyword,
  category,
  importance,
  auto_generated,
  source_id
)
VALUES
-- CCES related keywords
(
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  'CCES',
  'school',
  5,
  false,
  (SELECT id FROM family.data_sources WHERE reference_id = 'chat-school-001' LIMIT 1)
),
(
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  'cces.edu',
  'school',
  4,
  true,
  (SELECT id FROM family.data_sources WHERE reference_id = 'chat-school-001' LIMIT 1)
),
-- Riverside Elementary keywords
(
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  'Riverside Elementary',
  'school',
  5,
  true,
  (SELECT id FROM family.data_sources WHERE source_type = 'ai_suggestion' LIMIT 1)
);

-- Step 7: Test the migration
-- Verify family setup
SELECT
  'Family Setup' as check_type,
  f.name,
  f.slug,
  fm.role,
  fm.family_relationship
FROM families f
JOIN family_members fm ON f.id = fm.family_id
WHERE f.slug = 'john-smith-family';

-- Verify family data
SELECT
  'Family Data' as check_type,
  fp.name,
  fp.age,
  fp.relationship,
  COUNT(s.id) as schools_count,
  COUNT(k.id) as keywords_count
FROM families f
JOIN family.family_profiles fp ON f.id = fp.family_id
LEFT JOIN family.schools s ON fp.id = s.family_member_id
LEFT JOIN family.keywords k ON f.id = k.family_id
WHERE f.slug = 'john-smith-family'
GROUP BY fp.id, fp.name, fp.age, fp.relationship;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Test JSON generation function (using account_id for the function)
SELECT get_account_profile_for_ai('aa7f2fcd-2696-4fa2-abb7-38c4dd0daba0'::uuid, false) as migrated_profile;

-- ===============================================
-- MIGRATION COMPLETE
-- ===============================================