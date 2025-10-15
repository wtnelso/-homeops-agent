-- ===============================================
-- FRESH FAMILY DATA MIGRATION
-- Create completely new family data
-- ===============================================

-- Step 1: Create a new family
INSERT INTO families (
  id,
  name,
  slug,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'Demo Family',
  'demo-family',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- Step 2: Create data sources for tracking
INSERT INTO family.data_sources (
  family_id,
  source_type,
  reference_id,
  original_text,
  confidence,
  created_at
)
VALUES
-- School source
(
  (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1),
  'chat',
  'demo-school-001',
  'Child attends Maple Elementary and is in 3rd grade',
  0.85,
  NOW()
),
-- Activity source
(
  (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1),
  'ai_suggestion',
  'demo-activity-001',
  'Soccer practice suggested by AI',
  0.75,
  NOW()
);

-- Step 3: Add family profiles (no managed_by to avoid foreign key issues)
INSERT INTO family.family_profiles (
  family_id,
  name,
  relationship,
  age,
  notes,
  source_id
)
VALUES
-- Parent
(
  (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1),
  'Alex Demo',
  'parent',
  35,
  jsonb_build_object(
    'type', 'parent',
    'email', 'alex@demo.com',
    'order', 0
  ),
  (SELECT id FROM family.data_sources WHERE reference_id = 'demo-school-001' LIMIT 1)
),
-- Child
(
  (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1),
  'Sam Demo',
  'child',
  8,
  jsonb_build_object(
    'type', 'child',
    'grade', '3rd',
    'order', 1
  ),
  (SELECT id FROM family.data_sources WHERE reference_id = 'demo-school-001' LIMIT 1)
);

-- Step 4: Add schools
INSERT INTO family.schools (
  family_id,
  family_member_id,
  family_member_type,
  school_name,
  grade_or_program,
  source_id
)
VALUES
(
  (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1),
  (SELECT id FROM family.family_profiles WHERE name = 'Sam Demo' LIMIT 1),
  'profile',
  'Maple Elementary',
  '3rd Grade',
  (SELECT id FROM family.data_sources WHERE reference_id = 'demo-school-001' LIMIT 1)
);

-- Step 5: Add keywords for AI detection
INSERT INTO family.keywords (
  family_id,
  keyword,
  category,
  importance,
  auto_generated
)
VALUES
-- School keywords
(
  (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1),
  'Maple Elementary',
  'school',
  5,
  false
),
(
  (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1),
  '3rd grade',
  'school',
  4,
  true
),
-- Family keywords
(
  (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1),
  'Demo Family',
  'family',
  3,
  true
);

-- Step 6: Test the migration
SELECT 'Fresh migration completed successfully!' as status;

-- Verify family setup
SELECT
  'Family Data' as check_type,
  f.name as family_name,
  f.slug,
  COUNT(fp.id) as profiles_count,
  COUNT(s.id) as schools_count,
  COUNT(k.id) as keywords_count
FROM families f
LEFT JOIN family.family_profiles fp ON f.id = fp.family_id
LEFT JOIN family.schools s ON f.id = s.family_id
LEFT JOIN family.keywords k ON f.id = k.family_id
WHERE f.slug = 'demo-family'
GROUP BY f.id, f.name, f.slug;

-- Show family profiles
SELECT
  'Family Profiles' as check_type,
  fp.name,
  fp.relationship,
  fp.age,
  fp.notes
FROM families f
JOIN family.family_profiles fp ON f.id = fp.family_id
WHERE f.slug = 'demo-family';

-- Show schools
SELECT
  'Schools' as check_type,
  s.school_name,
  s.grade_or_program,
  fp.name as student_name
FROM families f
JOIN family.schools s ON f.id = s.family_id
JOIN family.family_profiles fp ON s.family_member_id = fp.id
WHERE f.slug = 'demo-family';

-- Show keywords
SELECT
  'Keywords' as check_type,
  k.keyword,
  k.category,
  k.importance
FROM families f
JOIN family.keywords k ON f.id = k.family_id
WHERE f.slug = 'demo-family'
ORDER BY k.importance DESC;