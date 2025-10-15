# Family Architecture Migration Plan

## Overview
This document outlines the comprehensive migration from the current account-centric architecture to a family-centric architecture. This is a **major architectural shift** that will affect authentication, billing, data relationships, and user management throughout the application.

## Current vs New Architecture

### Current Architecture
```
auth.users → users → accounts (billing + settings)
           ↓
    organizations → organization_members
           ↓
    family.* (profiles, schools, etc.) [NEWLY CREATED]
```

### New Architecture
```
auth.users → users → family_memberships → families (billing + settings)
                           ↓
                    family.* (profiles, schools, etc.)
```

## Key Changes

### 1. **Billing Consolidation**
- **Before**: Each user gets their own `accounts` record with separate Stripe billing
- **After**: One family = one billing relationship via `families` table
- **Impact**: Eliminates duplicate billing for family members

### 2. **Family Ownership Model**
- **Before**: Organizations owned by individual accounts
- **After**: Families can have multiple billing admins and owners
- **Impact**: More flexible family management and survivability

### 3. **User Signup Flow**
- **Before**: Every signup creates user + account + organization
- **After**: Primary signup creates user + family, invited signups join existing families
- **Impact**: Prevents accidental family duplication

## Critical Code References Requiring Updates

### **HIGHEST PRIORITY - Authentication & Core User Management**

#### 1. **User Session Service** (`/src/services/userSession.ts`)
**Lines 107, 157**: Core authentication flow
```typescript
// CURRENT - Must be updated
const user = await supabase
  .from('users')
  .select('*, account:accounts(*)')
  .eq('auth_id', authId);

// NEW - Will need family relationship
const user = await supabase
  .from('users')
  .select(`
    *,
    family_memberships!inner(
      role, billing_admin,
      families(*)
    )
  `)
  .eq('auth_id', authId);
```

#### 2. **User Onboarding** (`/src/components/onboarding/ReviewStep.tsx`)
**Lines 50, 103, 30, 69, 81, 118**: Complete onboarding flow
```typescript
// CURRENT - Creates separate account + user
const accountResult = await supabase.from('accounts').insert({...});
const userResult = await supabase.from('users').insert({account_id: ...});

// NEW - Needs invitation detection + family creation
const invitation = await checkInvitation(email);
if (invitation) {
  // Join existing family
} else {
  // Create new family + add as owner
}
```

#### 3. **Data Update Service** (`/src/services/dataUpdate.ts`)
**Lines 171, 103, 216, 252**: Account settings and user profile updates
```typescript
// CURRENT - Updates accounts table
await supabase.from('accounts').update({...}).eq('id', accountId);

// NEW - Updates families table
await supabase.from('families').update({...}).eq('id', familyId);
```

### **HIGH PRIORITY - Email Processing & Billing**

#### 4. **Email Processing Billing** (`/api/email-embeddings/start.js`)
**Line 276**: Plan validation for email processing
```typescript
// CURRENT - Gets plan from user.account
const user = await supabase.from('users').select('*, account:accounts(*)');
const limit = user.account.monthly_limit;

// NEW - Gets plan from user.family
const user = await supabase.from('users').select('*, family_memberships(families(*))');
const limit = user.family_memberships.families.monthly_limit;
```

#### 5. **Semantic Search Authorization**
- `/api/semantic-search.js:123`
- `/server/src/routes/semanticSearch.js:72`

Both validate user access via accounts table - **must be updated for families**

### **MEDIUM PRIORITY - Integration & Account Management**

#### 6. **Account Integrations Service** (`/src/services/accountIntegrationsService.ts`)
**Lines 75, 136, 165, 211, 234, 277**: OAuth token management
- All references to `account_id` must be updated to use family relationships

#### 7. **Database Integrations** (`/src/services/database-integrations.ts`)
**Lines 308, 324**: User lookup and preferences
- Account-based user lookups need family-based approach

#### 8. **Admin Service** (`/src/services/adminService.ts`)
**Lines 60, 93, 124, 166, 178, 212, 234**: Admin and beta user management
- May need updates depending on how admin rights work with families

### **NEWLY DISCOVERED CRITICAL SERVICES**

#### 9. **Family Profile Sync Service** (`/server/src/services/familyProfileSyncService.js`)
**Status**: Currently syncs to **Neon DB agent_memory** system
**Impact**: This service will need to **read from** the new Supabase family tables and continue syncing to Neon
**Lines to Update**: All data source logic needs to change from JSON-based to relational family tables

#### 10. **Account Profile Service** (`/server/src/services/accountProfileService.js`)
**Lines 43, 102, 185, 411**: Core profile management system
**Impact**: Currently manages `account_profiles` table - needs to integrate with new family schema

#### 11. **Intelligent Chat Orchestrator** (`/server/src/services/intelligentChatOrchestrator.js`)
**Line 172**: Uses `email_content_analysis` with account context
**Impact**: Chat context retrieval may need family-aware logic

#### 12. **Email Search Service** (`/server/src/services/emailSearchService.js`)
**Lines 296, 525, 605**: Semantic search with account context
**Impact**: Search scope may need to work at family level

#### 13. **Email Processor** (`/server/src/services/emailProcessor.js`)
**Lines 755, 770, 828, 865, 904, 923, 943**: Core email processing pipeline
**Impact**: Account-based email processing needs family-level organization

#### 14. **OAuth Services** (`/server/src/routes/oauth.js`)
**Lines 86, 95, 118, 258, 288**: Gmail integration OAuth flow
**Impact**: OAuth tokens are account-scoped, need family-scoped approach

### **BACKGROUND SERVICES & WORKERS**

#### 15. **Embedding Worker** (`/server/src/workers/embeddingWorker.js`)
**Lines 164, 189, 213**: Background email processing
**Impact**: Account validation in background jobs needs family approach

#### 16. **Onboarding Service** (`/server/src/services/onboardingService.js`)
**Lines 64, 108, 141, 196, 233**: User onboarding automation
**Impact**: Account-centric onboarding needs family-centric approach

#### 17. **Profile Suggestions Service** (`/server/src/services/profileSuggestionsService.js`)
**Lines 61, 265, 338, 858, 916, 1071, 1194**: AI-powered profile suggestions
**Impact**: Account-based suggestions need family context

## Database Schema Changes

### **Tables to Modify**

#### 1. **families** table (renamed from organizations)
```sql
-- Add billing fields from accounts table
ALTER TABLE families ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE families ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE families ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE families ADD COLUMN subscription_plan TEXT DEFAULT 'free';
ALTER TABLE families ADD COLUMN trial_ends_at TIMESTAMPTZ;
ALTER TABLE families ADD COLUMN current_period_start TIMESTAMPTZ;
ALTER TABLE families ADD COLUMN current_period_end TIMESTAMPTZ;
ALTER TABLE families ADD COLUMN max_users INTEGER DEFAULT 5;
ALTER TABLE families ADD COLUMN household_type TEXT;
ALTER TABLE families ADD COLUMN agent_profile JSONB DEFAULT '{}';
ALTER TABLE families ADD COLUMN email_weights JSONB DEFAULT '{"work": 1, "school": 1, "commerce": 1, "personal": 1, "manipulation": -2}';
ALTER TABLE families ADD COLUMN email_policies JSONB DEFAULT '{"surface_shipments": true, "highlight_school_bills": true, "auto_collapse_promotions": true}';
ALTER TABLE families ADD COLUMN account_name TEXT; -- Legacy field for compatibility
ALTER TABLE families ADD COLUMN agent_name TEXT DEFAULT 'HomeOps';
ALTER TABLE families ADD COLUMN timezone TEXT DEFAULT 'UTC';
ALTER TABLE families ADD COLUMN is_active BOOLEAN DEFAULT true;
ALTER TABLE families ADD COLUMN onboarded_at TIMESTAMPTZ;
```

#### 2. **family_members** table (renamed from organization_members)
```sql
-- Add billing admin capability
ALTER TABLE family_members ADD COLUMN billing_admin BOOLEAN DEFAULT false;
ALTER TABLE family_members ADD COLUMN can_invite_members BOOLEAN DEFAULT false;
ALTER TABLE family_members ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
```

#### 3. **users** table
```sql
-- Remove account_id dependency (AFTER migration complete)
-- ALTER TABLE users DROP COLUMN account_id;
-- Users will be linked to families via family_members table
```

### **New Tables to Create**

#### 1. **family_invitations**
```sql
CREATE TABLE family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  inviter_user_id UUID REFERENCES users(id),
  email TEXT NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, expired
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ
);

CREATE INDEX idx_family_invitations_email ON family_invitations(email);
CREATE INDEX idx_family_invitations_code ON family_invitations(invitation_code);
CREATE INDEX idx_family_invitations_status ON family_invitations(status);
```

#### 2. **family_merge_requests**
```sql
CREATE TABLE family_merge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_family_id UUID REFERENCES families(id),
  target_family_id UUID REFERENCES families(id),
  requester_user_id UUID REFERENCES users(id),
  approver_user_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, declined, completed
  merge_strategy JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_merge_requests_source ON family_merge_requests(source_family_id);
CREATE INDEX idx_merge_requests_target ON family_merge_requests(target_family_id);
CREATE INDEX idx_merge_requests_status ON family_merge_requests(status);
```

### **Tables to Archive/Remove**

#### 1. **accounts** table
- **Action**: Migrate all data to `families` table, then archive
- **Data Migration**: All account settings, billing info, and preferences move to families
- **Timeline**: After all code updates are complete and fully tested

## MCP Migration Script Strategy

### **Phase 1: Schema Preparation (MCP Supported)**
```javascript
// 1. Add billing columns to families
await mcp__supabase__apply_migration('prep_families_billing', `
  ALTER TABLE families ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
  ALTER TABLE families ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
  ALTER TABLE families ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
  -- ... all other billing fields
`);

// 2. Add family member enhancements
await mcp__supabase__apply_migration('enhance_family_members', `
  ALTER TABLE family_members ADD COLUMN IF NOT EXISTS billing_admin BOOLEAN DEFAULT false;
  ALTER TABLE family_members ADD COLUMN IF NOT EXISTS can_invite_members BOOLEAN DEFAULT false;
  ALTER TABLE family_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT NOW();
`);

// 3. Create invitation system
await mcp__supabase__apply_migration('family_invitations', `
  CREATE TABLE IF NOT EXISTS family_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id),
    -- ... invitation fields
  );
`);

// 4. Create merge system
await mcp__supabase__apply_migration('family_merge_system', `
  CREATE TABLE IF NOT EXISTS family_merge_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_family_id UUID REFERENCES families(id),
    -- ... merge fields
  );
`);
```

### **Phase 2: Data Migration (MCP Supported)**
```javascript
// Migrate accounts data to families in batches
await mcp__supabase__execute_sql(`
  UPDATE families f SET
    stripe_customer_id = a.stripe_customer_id,
    stripe_subscription_id = a.stripe_subscription_id,
    subscription_status = a.subscription_status,
    subscription_plan = a.subscription_plan,
    trial_ends_at = a.trial_ends_at,
    current_period_start = a.current_period_start,
    current_period_end = a.current_period_end,
    max_users = a.max_users,
    household_type = a.household_type,
    agent_profile = a.agent_profile,
    email_weights = a.email_weights,
    email_policies = a.email_policies,
    account_name = a.account_name,
    agent_name = a.agent_name,
    timezone = a.timezone,
    is_active = a.is_active,
    onboarded_at = a.onboarded_at
  FROM accounts a, family_members fm, users u
  WHERE f.id = fm.family_id
    AND fm.user_id = u.id
    AND u.account_id = a.id;
`);

// Set billing admins
await mcp__supabase__execute_sql(`
  UPDATE family_members fm SET
    billing_admin = true,
    joined_at = a.created_at
  FROM users u, accounts a
  WHERE fm.user_id = u.id
    AND u.account_id = a.id
    AND fm.role = 'owner';
`);
```

### **Phase 3: Function Updates (MCP Supported)**
```javascript
// Update the profile generation function
await mcp__supabase__apply_migration('update_profile_functions', `
  CREATE OR REPLACE FUNCTION get_family_profile_for_ai(user_uuid UUID DEFAULT auth.uid())
  RETURNS JSONB AS $$
  DECLARE
    family_data JSONB;
    user_family_id UUID;
  BEGIN
    -- Get user's family
    SELECT family_id INTO user_family_id
    FROM family_members
    WHERE user_id = user_uuid
    LIMIT 1;

    IF user_family_id IS NULL THEN
      RETURN jsonb_build_object('error', 'No family found for user');
    END IF;

    -- Build comprehensive family profile
    SELECT jsonb_build_object(
      'family', jsonb_build_object(
        'id', f.id,
        'name', f.name,
        'household_type', f.household_type,
        'agent_name', f.agent_name
      ),
      'members', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'user_id', fm.user_id,
            'role', fm.role,
            'relationship', fm.family_relationship,
            'name', COALESCE(u.name_user_provided, u.name_auth_provided),
            'email', u.email
          )
        )
        FROM family_members fm
        LEFT JOIN users u ON u.id = fm.user_id
        WHERE fm.family_id = user_family_id
      ),
      'profiles', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', fp.name,
            'relationship', fp.relationship,
            'age', fp.age,
            'notes', fp.notes
          )
        )
        FROM family.family_profiles fp
        WHERE fp.family_id = user_family_id
      ),
      'schools', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'school_name', s.school_name,
            'grade', s.grade_or_program,
            'student', s.family_member_id
          )
        )
        FROM family.schools s
        WHERE s.family_id = user_family_id
      ),
      'preferences', f.email_policies,
      'keywords', (
        SELECT jsonb_agg(k.keyword)
        FROM family.keywords k
        WHERE k.family_id = user_family_id
      )
    ) INTO family_data
    FROM families f
    WHERE f.id = user_family_id;

    RETURN family_data;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;
`);

// Update user creation trigger
await mcp__supabase__apply_migration('update_user_trigger', `
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $$
  DECLARE
    invitation_record family_invitations%ROWTYPE;
    new_family_id UUID;
  BEGIN
    -- Check for pending invitation
    SELECT * INTO invitation_record
    FROM family_invitations
    WHERE email = NEW.email
      AND status = 'pending'
      AND expires_at > NOW()
    LIMIT 1;

    IF invitation_record.id IS NOT NULL THEN
      -- Join existing family
      INSERT INTO family_members (family_id, user_id, role, joined_at)
      VALUES (invitation_record.family_id, NEW.id, 'member', NOW());

      -- Mark invitation as accepted
      UPDATE family_invitations
      SET status = 'accepted', accepted_at = NOW()
      WHERE id = invitation_record.id;

    ELSE
      -- Create new family
      INSERT INTO families (name, slug, created_at)
      VALUES (NEW.name_user_provided || '''s Family', generate_slug(NEW.name_user_provided), NOW())
      RETURNING id INTO new_family_id;

      -- Add user as family owner and billing admin
      INSERT INTO family_members (family_id, user_id, role, billing_admin, joined_at)
      VALUES (new_family_id, NEW.id, 'owner', true, NOW());
    END IF;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
`);
```

### **Phase 4: Validation (MCP Supported)**
```javascript
// Verify migration success
const migrationCheck = await mcp__supabase__execute_sql(`
  SELECT
    'Migration Status' as check_type,
    (SELECT COUNT(*) FROM families) as family_count,
    (SELECT COUNT(*) FROM family_members) as member_count,
    (SELECT COUNT(*) FROM accounts) as old_account_count,
    (SELECT COUNT(*) FROM families WHERE stripe_customer_id IS NOT NULL) as billing_families
`);

console.log('Migration validation:', migrationCheck);
```

## Migration Timeline

### **Day 1: Database Schema (MCP)**
- **Morning**: Add columns to families, create new tables
- **Afternoon**: Migrate data from accounts to families
- **Evening**: Update functions and triggers

### **Day 2: Application Code**
- **Morning**: Update all authentication flows
- **Afternoon**: Update email processing and integrations
- **Evening**: Test all critical paths

### **Day 3: Testing & Validation**
- **Morning**: Comprehensive testing
- **Afternoon**: Performance validation
- **Evening**: Cleanup and archiving

## Critical Testing Checklist

### **Before Migration**
- [ ] All authentication flows work
- [ ] Email processing respects plan limits
- [ ] Billing/subscriptions work
- [ ] OAuth integrations work
- [ ] Family data displays correctly

### **After Migration**
- [ ] Existing users can log in
- [ ] New users create families correctly
- [ ] Invitation system works
- [ ] Family profiles sync to Neon agent_memory
- [ ] Email processing uses family limits
- [ ] All integrations maintain access

## Risk Mitigation

### **Rollback Plan**
If migration fails:
1. Restore `accounts` table from backup
2. Revert all code to previous commits
3. Restore original database functions
4. Re-enable account-based authentication

### **Data Safety**
- Keep `accounts` table for 30 days after migration
- Test extensively in staging environment
- Have database backups at each migration step

## Complete Migration Checklist

### **PRE-MIGRATION PREPARATION**
- [ ] **Backup Production Database** - Full Supabase backup created
- [ ] **Test Environment Setup** - Staging database ready for testing
- [ ] **Code Branch Creation** - Create `family-migration` branch
- [ ] **MCP Tools Verification** - Confirm Supabase MCP access works
- [ ] **Dependencies Check** - All npm packages up to date

### **PHASE 1: DATABASE SCHEMA PREPARATION (Day 1 Morning)**

#### **Schema Modifications (MCP)**
- [ ] **Add Billing Columns to Families Table**
  ```sql
  ALTER TABLE families ADD COLUMN stripe_customer_id TEXT;
  ALTER TABLE families ADD COLUMN stripe_subscription_id TEXT;
  ALTER TABLE families ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
  ALTER TABLE families ADD COLUMN subscription_plan TEXT DEFAULT 'free';
  ALTER TABLE families ADD COLUMN trial_ends_at TIMESTAMPTZ;
  ALTER TABLE families ADD COLUMN current_period_start TIMESTAMPTZ;
  ALTER TABLE families ADD COLUMN current_period_end TIMESTAMPTZ;
  ALTER TABLE families ADD COLUMN max_users INTEGER DEFAULT 5;
  ALTER TABLE families ADD COLUMN household_type TEXT;
  ALTER TABLE families ADD COLUMN agent_profile JSONB DEFAULT '{}';
  ALTER TABLE families ADD COLUMN email_weights JSONB;
  ALTER TABLE families ADD COLUMN email_policies JSONB;
  ALTER TABLE families ADD COLUMN account_name TEXT;
  ALTER TABLE families ADD COLUMN agent_name TEXT DEFAULT 'HomeOps';
  ALTER TABLE families ADD COLUMN timezone TEXT DEFAULT 'UTC';
  ALTER TABLE families ADD COLUMN is_active BOOLEAN DEFAULT true;
  ALTER TABLE families ADD COLUMN onboarded_at TIMESTAMPTZ;
  ```

- [ ] **Enhance Family Members Table**
  ```sql
  ALTER TABLE family_members ADD COLUMN billing_admin BOOLEAN DEFAULT false;
  ALTER TABLE family_members ADD COLUMN can_invite_members BOOLEAN DEFAULT false;
  ALTER TABLE family_members ADD COLUMN joined_at TIMESTAMPTZ DEFAULT NOW();
  ```

- [ ] **Create Family Invitations Table**
  ```sql
  CREATE TABLE family_invitations (...);
  CREATE INDEX idx_family_invitations_email ON family_invitations(email);
  CREATE INDEX idx_family_invitations_code ON family_invitations(invitation_code);
  CREATE INDEX idx_family_invitations_status ON family_invitations(status);
  ```

- [ ] **Create Family Merge Requests Table**
  ```sql
  CREATE TABLE family_merge_requests (...);
  CREATE INDEX idx_merge_requests_source ON family_merge_requests(source_family_id);
  CREATE INDEX idx_merge_requests_target ON family_merge_requests(target_family_id);
  CREATE INDEX idx_merge_requests_status ON family_merge_requests(status);
  ```

#### **Validation**
- [ ] **Verify Schema Changes** - Run `DESCRIBE` queries on all modified tables
- [ ] **Test Constraints** - Verify foreign keys work correctly

### **PHASE 2: DATA MIGRATION (Day 1 Afternoon)**

#### **Core Data Migration (MCP)**
- [ ] **Migrate Accounts to Families**
  ```sql
  UPDATE families f SET
    stripe_customer_id = a.stripe_customer_id,
    -- ... all other account fields
  FROM accounts a, family_members fm, users u
  WHERE f.id = fm.family_id AND fm.user_id = u.id AND u.account_id = a.id;
  ```

- [ ] **Set Billing Administrators**
  ```sql
  UPDATE family_members fm SET billing_admin = true, joined_at = a.created_at
  FROM users u, accounts a
  WHERE fm.user_id = u.id AND u.account_id = a.id AND fm.role = 'owner';
  ```

- [ ] **Update Account Integrations References**
  ```sql
  -- Update integration ownership to family-based
  -- (Details depend on final integration strategy)
  ```

#### **Data Validation**
- [ ] **Verify Data Migration** - Check row counts match
- [ ] **Validate Billing Data** - Confirm Stripe IDs transferred correctly
- [ ] **Check Family Relationships** - Verify user-family links intact

### **PHASE 3: DATABASE FUNCTIONS UPDATE (Day 1 Evening)**

#### **Function Updates (MCP)**
- [ ] **Update Profile Generation Function**
  ```sql
  CREATE OR REPLACE FUNCTION get_family_profile_for_ai(user_uuid UUID)
  ```

- [ ] **Update User Creation Trigger**
  ```sql
  CREATE OR REPLACE FUNCTION handle_new_user()
  -- Includes invitation detection logic
  ```

- [ ] **Create Invitation System Functions**
  ```sql
  CREATE FUNCTION create_family_invitation(...);
  CREATE FUNCTION accept_family_invitation(...);
  CREATE FUNCTION check_invitation_validity(...);
  ```

- [ ] **Create Family Merge Functions**
  ```sql
  CREATE FUNCTION request_family_merge(...);
  CREATE FUNCTION approve_family_merge(...);
  CREATE FUNCTION execute_family_merge(...);
  ```

#### **Helper Functions**
- [ ] **Create getUserFamily() Helper Function**
- [ ] **Create Family Utility Functions**
- [ ] **Update RLS Policies** for new tables

### **PHASE 4: APPLICATION CODE UPDATES (Day 2)**

#### **Critical Authentication Updates**
- [ ] **Update User Session Service** (`/src/services/userSession.ts`)
  - [ ] Line 107: Update user lookup query
  - [ ] Line 157: Update user profile fetching
  - [ ] Test: User can log in successfully

- [ ] **Update User Onboarding** (`/src/components/onboarding/ReviewStep.tsx`)
  - [ ] Lines 50, 103: Replace account creation with family creation
  - [ ] Lines 30, 69, 81, 118: Update user creation flow
  - [ ] Add invitation detection logic
  - [ ] Test: New user signup creates family correctly
  - [ ] Test: Invited user joins existing family

- [ ] **Update Data Update Service** (`/src/services/dataUpdate.ts`)
  - [ ] Lines 171, 103: Update account settings to family settings
  - [ ] Lines 216, 252: Update user profile logic
  - [ ] Test: Settings updates work correctly

#### **Email Processing & Billing Updates**
- [ ] **Update Email Processing Billing** (`/api/email-embeddings/start.js`)
  - [ ] Line 276: Update plan validation from account to family
  - [ ] Test: Email processing respects family plan limits

- [ ] **Update Semantic Search**
  - [ ] `/api/semantic-search.js:123` - Family-based authorization
  - [ ] `/server/src/routes/semanticSearch.js:72` - Family-based user validation
  - [ ] Test: Search authorization works with families

#### **Integration System Updates**
- [ ] **Update Account Integrations Service** (`/src/services/accountIntegrationsService.ts`)
  - [ ] Lines 75, 136, 165, 211, 234, 277: Update to family-based approach
  - [ ] Test: Gmail OAuth still works

- [ ] **Update Database Integrations** (`/src/services/database-integrations.ts`)
  - [ ] Lines 308, 324: Update user lookup logic
  - [ ] Test: Integration catalog loads correctly

- [ ] **Update OAuth Routes** (`/server/src/routes/oauth.js`)
  - [ ] Lines 86, 95, 118, 258, 288: Update token management
  - [ ] Test: OAuth flow completes successfully

#### **Background Services Updates**
- [ ] **Update Family Profile Sync Service** (`/server/src/services/familyProfileSyncService.js`)
  - [ ] Update to read from Supabase family tables instead of account_profiles
  - [ ] Continue syncing to Neon DB agent_memory system
  - [ ] Test: Family data syncs to AI system correctly

- [ ] **Update Account Profile Service** (`/server/src/services/accountProfileService.js`)
  - [ ] Lines 43, 102, 185, 411: Integrate with family schema
  - [ ] Test: Profile data retrieval works

- [ ] **Update Email Services**
  - [ ] **Email Search Service** (`/server/src/services/emailSearchService.js`)
    - [ ] Lines 296, 525, 605: Update context to family-based
  - [ ] **Email Processor** (`/server/src/services/emailProcessor.js`)
    - [ ] Lines 755, 770, 828, 865, 904, 923, 943: Update account context
  - [ ] **Intelligence Chat Orchestrator** (`/server/src/services/intelligentChatOrchestrator.js`)
    - [ ] Line 172: Update chat context retrieval
  - [ ] Test: Email analysis and chat work correctly

- [ ] **Update Worker Services**
  - [ ] **Embedding Worker** (`/server/src/workers/embeddingWorker.js`)
    - [ ] Lines 164, 189, 213: Update account validation
  - [ ] **Onboarding Service** (`/server/src/services/onboardingService.js`)
    - [ ] Lines 64, 108, 141, 196, 233: Update to family-centric
  - [ ] Test: Background processing continues working

#### **Additional Services**
- [ ] **Update Profile Suggestions Service** (`/server/src/services/profileSuggestionsService.js`)
  - [ ] Lines 61, 265, 338, 858, 916, 1071, 1194: Add family context
  - [ ] Test: AI suggestions work with family data

- [ ] **Update Admin Service** (`/src/services/adminService.ts`)
  - [ ] Lines 60, 93, 124, 166, 178, 212, 234: Verify admin rights with families
  - [ ] Test: Admin functions still work

### **PHASE 5: NEW FEATURE IMPLEMENTATION (Day 2 Evening)**

#### **Invitation System (Frontend)**
- [ ] **Create Invitation Components**
  - [ ] Family invitation form
  - [ ] Invitation acceptance flow
  - [ ] Invitation management UI

- [ ] **Create Invitation API Routes**
  - [ ] POST /api/family/invite
  - [ ] GET /api/family/invitations
  - [ ] POST /api/family/accept-invitation

- [ ] **Test Invitation Flow**
  - [ ] User can send invitations
  - [ ] Invitee receives email
  - [ ] Invitation acceptance works

#### **Family Merge System (Backend)**
- [ ] **Create Merge API Routes**
  - [ ] POST /api/family/request-merge
  - [ ] POST /api/family/approve-merge
  - [ ] GET /api/family/merge-requests

- [ ] **Test Merge Flow**
  - [ ] Merge request creation
  - [ ] Merge approval process
  - [ ] Data migration during merge

### **PHASE 6: COMPREHENSIVE TESTING (Day 3 Morning)**

#### **Authentication Testing**
- [ ] **Existing User Login** - All existing users can log in
- [ ] **New User Signup** - Creates family correctly
- [ ] **Session Management** - User sessions persist correctly
- [ ] **Password Reset** - Password reset flow works
- [ ] **Profile Updates** - User profile changes save correctly

#### **Billing & Subscription Testing**
- [ ] **Plan Limits** - Email processing respects family plan limits
- [ ] **Subscription Status** - Billing status displays correctly
- [ ] **Stripe Integration** - Webhooks still work
- [ ] **Plan Upgrades** - Subscription changes work

#### **Email Processing Testing**
- [ ] **Gmail OAuth** - OAuth flow completes successfully
- [ ] **Email Analysis** - Email processing pipeline works
- [ ] **Semantic Search** - Email search returns correct results
- [ ] **Theme Analysis** - Email themes generate correctly

#### **Family Features Testing**
- [ ] **Family Data Display** - Family profiles show correctly
- [ ] **Member Management** - Can add/remove family members
- [ ] **Invitation System** - Full invitation flow works
- [ ] **Merge System** - Family merge process works

#### **AI & Chat Testing**
- [ ] **Profile Sync** - Family data syncs to agent memory
- [ ] **Chat Context** - AI has correct family context
- [ ] **Profile Suggestions** - AI suggestions use family data
- [ ] **Memory System** - Agent memory functions correctly

#### **Integration Testing**
- [ ] **OAuth Services** - All integrations maintain access
- [ ] **Background Jobs** - Workers process correctly
- [ ] **API Routes** - All endpoints return correct data
- [ ] **Admin Functions** - Admin panel works

### **PHASE 7: PERFORMANCE & CLEANUP (Day 3 Afternoon)**

#### **Performance Validation**
- [ ] **Query Performance** - Database queries perform well
- [ ] **Page Load Times** - Frontend performance maintained
- [ ] **Background Jobs** - Workers complete in reasonable time
- [ ] **Memory Usage** - No memory leaks introduced

#### **Data Cleanup**
- [ ] **Remove users.account_id Column**
  ```sql
  ALTER TABLE users DROP COLUMN account_id;
  ```

- [ ] **Archive Accounts Table**
  ```sql
  ALTER TABLE accounts RENAME TO accounts_archived;
  ```

- [ ] **Update Remaining References** - Any missed hardcoded table names

#### **Final Validation**
- [ ] **Data Integrity Check** - No orphaned records
- [ ] **Foreign Key Verification** - All relationships intact
- [ ] **RLS Policy Testing** - Security policies work correctly

### **PHASE 8: PRODUCTION DEPLOYMENT & MONITORING**

#### **Deployment Checklist**
- [ ] **Staging Validation Complete** - All tests pass in staging
- [ ] **Production Backup** - Current production backup taken
- [ ] **Maintenance Mode** - Application in maintenance during migration
- [ ] **Database Migration** - Run all MCP scripts in production
- [ ] **Code Deployment** - Deploy updated application code
- [ ] **Service Restart** - Restart all services

#### **Post-Deployment Monitoring**
- [ ] **Authentication Success Rate** - Monitor login success rate (>99%)
- [ ] **Email Processing** - Verify email analysis continues
- [ ] **Error Rates** - Watch for increased error rates
- [ ] **Performance Metrics** - Database and app performance
- [ ] **User Activity** - Monitor normal user behavior

#### **User Communication**
- [ ] **Migration Announcement** - Notify users of new family features
- [ ] **Help Documentation** - Update docs with family management
- [ ] **Support Preparation** - Brief support team on changes

### **PHASE 9: POST-MIGRATION TASKS**

#### **30-Day Follow-up**
- [ ] **Archive Old Tables** - Remove accounts_archived after 30 days
- [ ] **Performance Review** - Analyze performance impact
- [ ] **User Feedback** - Collect feedback on family features
- [ ] **Bug Fixes** - Address any post-migration issues

#### **Future Enhancements**
- [ ] **Family Billing Controls** - Enhanced billing admin features
- [ ] **Advanced Merge Options** - More sophisticated family merging
- [ ] **Family Analytics** - Usage analytics at family level
- [ ] **Multi-Family Support** - Users in multiple families (future)

---

## Migration Progress Tracking

**Total Tasks**: 143
**Completed**: ___/143

**Current Phase**: ________________
**Estimated Completion**: ________________
**Blockers**: ________________

---

**This migration touches nearly every core system in your application. Budget 2-3 full days and test extensively in staging before production deployment.**