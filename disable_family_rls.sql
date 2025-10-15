-- Completely disable RLS on family-related tables to fix recursion
-- This is a temporary fix to resolve the infinite recursion issue

-- Disable RLS entirely on families table
ALTER TABLE families DISABLE ROW LEVEL SECURITY;

-- Disable RLS entirely on family_members table
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;

-- Optional: Also disable on related tables if they exist
-- ALTER TABLE family_contacts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE family_activities DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE family_schools DISABLE ROW LEVEL SECURITY;