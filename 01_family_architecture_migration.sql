-- ===============================================
-- FAMILY ARCHITECTURE MIGRATION - PHASE 1
-- Database Schema Preparation
-- ===============================================

-- Step 1: Add billing columns to families table
ALTER TABLE public.families
ADD COLUMN IF NOT EXISTS billing_admin_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Step 2: Create invitation system tables
CREATE TABLE IF NOT EXISTS public.family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  family_relationship TEXT,
  invitation_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, expired, cancelled
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, email)
);

-- Step 3: Create merge system tables
CREATE TABLE IF NOT EXISTS public.family_merge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  target_family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, completed
  merge_data JSONB, -- Store what will be merged
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(source_family_id, target_family_id)
);

-- Step 4: Update family_members table to support invitation flow
ALTER TABLE public.family_members
ADD COLUMN IF NOT EXISTS invitation_id UUID REFERENCES public.family_invitations(id),
ADD COLUMN IF NOT EXISTS joined_via TEXT DEFAULT 'signup'; -- signup, invitation, merge

-- Step 5: Update data_sources table to support all entity types
-- This table tracks the source of ANY data entry (schools, activities, contacts, profiles, etc.)
ALTER TABLE family.data_sources
ADD COLUMN IF NOT EXISTS entity_type TEXT, -- 'school', 'activity', 'contact', 'profile', 'keyword', etc.
ADD COLUMN IF NOT EXISTS entity_id UUID; -- ID of the related entity

-- Add indexes for data_sources
CREATE INDEX IF NOT EXISTS idx_data_sources_entity ON family.data_sources(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_family_id ON family.data_sources(family_id);

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_invitations_email ON public.family_invitations(email);
CREATE INDEX IF NOT EXISTS idx_family_invitations_token ON public.family_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_family_invitations_family_id ON public.family_invitations(family_id);
CREATE INDEX IF NOT EXISTS idx_family_merge_requests_families ON public.family_merge_requests(source_family_id, target_family_id);
CREATE INDEX IF NOT EXISTS idx_families_billing_admin ON public.families(billing_admin_id);

-- Step 7: Create helper functions
CREATE OR REPLACE FUNCTION public.get_user_family_with_billing(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  family_id UUID,
  family_name TEXT,
  family_slug TEXT,
  user_role TEXT,
  is_billing_admin BOOLEAN,
  subscription_status TEXT,
  subscription_plan TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id as family_id,
    f.name as family_name,
    f.slug as family_slug,
    fm.role as user_role,
    (f.billing_admin_id = user_uuid) as is_billing_admin,
    f.subscription_status,
    f.subscription_plan
  FROM families f
  JOIN family_members fm ON f.id = fm.family_id
  WHERE fm.user_id = user_uuid
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to create data source records
CREATE OR REPLACE FUNCTION family.create_data_source(
  p_family_id UUID,
  p_source_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_original_text TEXT DEFAULT '',
  p_confidence DECIMAL DEFAULT 1.0,
  p_reference_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  source_id UUID;
BEGIN
  INSERT INTO family.data_sources (
    family_id,
    source_type,
    entity_type,
    entity_id,
    reference_id,
    original_text,
    confidence,
    created_at
  ) VALUES (
    p_family_id,
    p_source_type,
    p_entity_type,
    p_entity_id,
    p_reference_id,
    p_original_text,
    p_confidence,
    NOW()
  ) RETURNING id INTO source_id;

  RETURN source_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Update the existing get_account_profile_for_ai function to include billing info
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
  billing_data jsonb;
BEGIN
  -- Get user's family
  SELECT get_user_family_id(user_uuid) INTO family_id_var;

  IF family_id_var IS NULL THEN
    RETURN jsonb_build_object('error', 'No family found for user');
  END IF;

  -- Get billing information
  SELECT jsonb_build_object(
    'billing_admin_id', f.billing_admin_id,
    'subscription_status', f.subscription_status,
    'subscription_plan', f.subscription_plan,
    'subscription_ends_at', f.subscription_ends_at,
    'is_billing_admin', f.billing_admin_id = user_uuid
  ) INTO billing_data
  FROM families f
  WHERE f.id = family_id_var;

  -- Get family members (authenticated family members)
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', fm.user_id,
      'role', fm.role,
      'family_relationship', fm.family_relationship,
      'joined_via', fm.joined_via,
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

  -- Build final result with billing information
  result := jsonb_build_object(
    'family', jsonb_build_object(
      'id', family_id_var,
      'name', (SELECT name FROM families WHERE id = family_id_var),
      'members', COALESCE(family_members, '[]'::jsonb),
      'profiles', COALESCE(family_profiles, '[]'::jsonb),
      'keywords', COALESCE(keywords_data, '[]'::jsonb),
      'billing', COALESCE(billing_data, '{}'::jsonb)
    ),
    'activities', COALESCE(activities_data, '[]'::jsonb),
    'schools', COALESCE(schools_data, '[]'::jsonb),
    'contacts', COALESCE(contacts_data, '[]'::jsonb),
    'preferences', COALESCE(preferences_data, '{}'::jsonb)
  );

  RETURN result;
END;
$function$;

-- Step 9: Create RLS policies for new tables
ALTER TABLE public.family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_merge_requests ENABLE ROW LEVEL SECURITY;

-- Family invitations policies
CREATE POLICY "Users can view invitations for their family" ON public.family_invitations
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create invitations for their family" ON public.family_invitations
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update invitations they sent" ON public.family_invitations
  FOR UPDATE USING (invited_by = auth.uid());

-- Family merge policies
CREATE POLICY "Users can view merge requests for their families" ON public.family_merge_requests
  FOR SELECT USING (
    source_family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()) OR
    target_family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Family owners can create merge requests" ON public.family_merge_requests
  FOR INSERT WITH CHECK (
    requested_by = auth.uid() AND
    source_family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Step 10: Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_family_invitations_updated_at
  BEFORE UPDATE ON public.family_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_merge_requests_updated_at
  BEFORE UPDATE ON public.family_merge_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- PHASE 1 COMPLETE
-- Ready for data migration and testing
-- ===============================================