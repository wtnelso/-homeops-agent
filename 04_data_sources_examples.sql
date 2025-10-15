-- ===============================================
-- DATA SOURCES TABLE USAGE EXAMPLES
-- How to properly track sources for all entity types
-- ===============================================

-- Example 1: Adding a school with data source tracking
DO $$
DECLARE
  family_id_var UUID;
  student_id UUID;
  school_id UUID;
  source_id UUID;
BEGIN
  -- Get family ID (replace with actual family)
  SELECT id INTO family_id_var FROM families WHERE slug = 'demo-family' LIMIT 1;

  -- Get student ID
  SELECT id INTO student_id FROM family.family_profiles
  WHERE family_id = family_id_var AND name = 'Sam Demo' LIMIT 1;

  -- Create the school record
  INSERT INTO family.schools (
    family_id,
    family_member_id,
    family_member_type,
    school_name,
    grade_or_program
  ) VALUES (
    family_id_var,
    student_id,
    'profile',
    'Oak Ridge Elementary',
    '4th Grade'
  ) RETURNING id INTO school_id;

  -- Create the data source record using the helper function
  SELECT family.create_data_source(
    family_id_var,
    'chat',           -- source_type: how it was detected
    'school',         -- entity_type: what kind of entity
    school_id,        -- entity_id: the actual school record ID
    'User mentioned Oak Ridge Elementary in chat', -- original_text
    0.9,              -- confidence score
    'chat-msg-12345'  -- reference_id: original chat message ID
  ) INTO source_id;

  RAISE NOTICE 'Created school % with source %', school_id, source_id;
END $$;

-- Example 2: Adding an activity with data source tracking
DO $$
DECLARE
  family_id_var UUID;
  child_id UUID;
  activity_id UUID;
  source_id UUID;
BEGIN
  -- Get family and child
  SELECT id INTO family_id_var FROM families WHERE slug = 'demo-family' LIMIT 1;
  SELECT id INTO child_id FROM family.family_profiles
  WHERE family_id = family_id_var AND relationship = 'child' LIMIT 1;

  -- Create activity record
  INSERT INTO family.activities (
    family_id,
    family_member_id,
    family_member_type,
    activity_name,
    activity_type,
    frequency,
    location
  ) VALUES (
    family_id_var,
    child_id,
    'profile',
    'Soccer Practice',
    'sports',
    'weekly',
    'Community Center'
  ) RETURNING id INTO activity_id;

  -- Track the source
  SELECT family.create_data_source(
    family_id_var,
    'ai_suggestion',
    'activity',
    activity_id,
    'AI suggested soccer practice based on email patterns',
    0.75,
    'ai-suggestion-67890'
  ) INTO source_id;

  RAISE NOTICE 'Created activity % with source %', activity_id, source_id;
END $$;

-- Example 3: Adding a contact with data source tracking
DO $$
DECLARE
  family_id_var UUID;
  contact_id UUID;
  source_id UUID;
BEGIN
  -- Get family
  SELECT id INTO family_id_var FROM families WHERE slug = 'demo-family' LIMIT 1;

  -- Create contact record
  INSERT INTO family.contacts (
    family_id,
    contact_name,
    contact_type,
    email,
    phone,
    relationship_to_family
  ) VALUES (
    family_id_var,
    'Mrs. Johnson',
    'teacher',
    'mjohnson@school.edu',
    '555-0199',
    'Teacher'
  ) RETURNING id INTO contact_id;

  -- Track the source
  SELECT family.create_data_source(
    family_id_var,
    'email',
    'contact',
    contact_id,
    'Contact extracted from school email about parent-teacher conference',
    0.95,
    'email-thread-abc123'
  ) INTO source_id;

  RAISE NOTICE 'Created contact % with source %', contact_id, source_id;
END $$;

-- Example 4: Adding keywords with data source tracking
DO $$
DECLARE
  family_id_var UUID;
  keyword_id UUID;
  source_id UUID;
BEGIN
  -- Get family
  SELECT id INTO family_id_var FROM families WHERE slug = 'demo-family' LIMIT 1;

  -- Create keyword record
  INSERT INTO family.keywords (
    family_id,
    keyword,
    category,
    importance,
    auto_generated
  ) VALUES (
    family_id_var,
    'parent-teacher conference',
    'school',
    4,
    true
  ) RETURNING id INTO keyword_id;

  -- Track the source
  SELECT family.create_data_source(
    family_id_var,
    'email',
    'keyword',
    keyword_id,
    'Keyword extracted from email subject line',
    0.88,
    'email-subject-def456'
  ) INTO source_id;

  RAISE NOTICE 'Created keyword % with source %', keyword_id, source_id;
END $$;

-- ===============================================
-- QUERYING DATA WITH SOURCES
-- How to retrieve entities with their source information
-- ===============================================

-- Query 1: Get all schools with their sources
SELECT
  s.school_name,
  s.grade_or_program,
  fp.name as student_name,
  ds.source_type,
  ds.original_text,
  ds.confidence,
  ds.created_at as detected_at
FROM family.schools s
JOIN family.family_profiles fp ON s.family_member_id = fp.id
LEFT JOIN family.data_sources ds ON ds.entity_type = 'school' AND ds.entity_id = s.id
WHERE s.family_id = (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1)
ORDER BY ds.confidence DESC;

-- Query 2: Get all activities detected by AI
SELECT
  a.activity_name,
  a.activity_type,
  a.frequency,
  fp.name as participant,
  ds.confidence,
  ds.created_at as suggested_at
FROM family.activities a
JOIN family.family_profiles fp ON a.family_member_id = fp.id
JOIN family.data_sources ds ON ds.entity_type = 'activity' AND ds.entity_id = a.id
WHERE a.family_id = (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1)
  AND ds.source_type = 'ai_suggestion'
ORDER BY ds.confidence DESC;

-- Query 3: Get source summary by type
SELECT
  ds.source_type,
  ds.entity_type,
  COUNT(*) as count,
  AVG(ds.confidence) as avg_confidence,
  MIN(ds.created_at) as first_detected,
  MAX(ds.created_at) as last_detected
FROM family.data_sources ds
WHERE ds.family_id = (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1)
GROUP BY ds.source_type, ds.entity_type
ORDER BY count DESC;

-- ===============================================
-- AUDIT TRAIL QUERIES
-- Track how family data was discovered over time
-- ===============================================

-- Timeline of all data discoveries
SELECT
  ds.created_at,
  ds.source_type,
  ds.entity_type,
  ds.original_text,
  ds.confidence,
  CASE
    WHEN ds.entity_type = 'school' THEN (SELECT school_name FROM family.schools WHERE id = ds.entity_id)
    WHEN ds.entity_type = 'activity' THEN (SELECT activity_name FROM family.activities WHERE id = ds.entity_id)
    WHEN ds.entity_type = 'contact' THEN (SELECT contact_name FROM family.contacts WHERE id = ds.entity_id)
    WHEN ds.entity_type = 'keyword' THEN (SELECT keyword FROM family.keywords WHERE id = ds.entity_id)
    WHEN ds.entity_type = 'profile' THEN (SELECT name FROM family.family_profiles WHERE id = ds.entity_id)
    ELSE 'Unknown'
  END as entity_name
FROM family.data_sources ds
WHERE ds.family_id = (SELECT id FROM families WHERE slug = 'demo-family' LIMIT 1)
ORDER BY ds.created_at DESC;

-- ===============================================
-- DATA SOURCES BEST PRACTICES
-- ===============================================

/*
1. ALWAYS create a data source record when adding any family data
2. Use descriptive source_type values:
   - 'chat': From user chat/conversation
   - 'email': Extracted from email content
   - 'ai_suggestion': Generated by AI analysis
   - 'manual': User manually entered
   - 'migration': Data migrated from old system
   - 'import': Bulk import from external source

3. Use clear entity_type values that match your table names:
   - 'school', 'activity', 'contact', 'profile', 'keyword', 'preference'

4. Include meaningful original_text to understand detection context

5. Set confidence scores appropriately:
   - 1.0: User manually entered or confirmed
   - 0.9+: High confidence automated detection
   - 0.7-0.9: Medium confidence
   - 0.5-0.7: Low confidence, needs verification
   - <0.5: Very uncertain, flag for review

6. Use reference_id to link back to original source (email ID, chat message ID, etc.)
*/