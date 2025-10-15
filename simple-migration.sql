-- ===============================================
-- SIMPLE FAMILY DATA MIGRATION
-- Just insert John Smith's family data
-- ===============================================

-- Step 1: Create family for John Smith
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

-- Step 2: Add John as family member
INSERT INTO family_members (
  family_id,
  user_id,
  role,
  family_relationship,
  joined_at
)
VALUES (
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  (SELECT id FROM users WHERE account_id = 'aa7f2fcd-2696-4fa2-abb7-38c4dd0daba0' LIMIT 1),
  'owner',
  'self',
  NOW()
)
ON CONFLICT (family_id, user_id) DO NOTHING;

-- Step 3: Create data sources for tracking
INSERT INTO family.data_sources (
  family_id,
  source_type,
  reference_id,
  original_text,
  confidence,
  created_at
)
VALUES
-- CCES source
(
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  'chat',
  'chat-school-001',
  'John goes to CCES and is in 4th grade',
  0.88,
  '2025-09-17T14:15:00Z'::timestamptz
),
-- Riverside Elementary source
(
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  'ai_suggestion',
  'ai-suggestion-001',
  'Riverside Elementary suggested by AI',
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
);

-- Step 5: Add John's schools
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
VALUES
-- CCES
(
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
),
-- Riverside Elementary
(
  (SELECT id FROM families WHERE slug = 'john-smith-family' LIMIT 1),
  (SELECT id FROM family.family_profiles WHERE name = 'John Smith' LIMIT 1),
  'profile',
  'Riverside Elementary',
  '3rd Grade',
  NULL,
  NULL,
  (SELECT id FROM family.data_sources WHERE reference_id = 'ai-suggestion-001' LIMIT 1)
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
-- CCES keywords
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
  (SELECT id FROM family.data_sources WHERE reference_id = 'ai-suggestion-001' LIMIT 1)
);

-- Step 7: Test the migration
SELECT 'Migration completed successfully!' as status;

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

-- Test JSON generation function (using account_id for the function)
SELECT get_account_profile_for_ai('aa7f2fcd-2696-4fa2-abb7-38c4dd0daba0'::uuid, false) as migrated_profile;