# FAMILY ARCHITECTURE MIGRATION - PHASE 3
## Service Updates Guide

This guide outlines all the code changes needed to transition from account-centric to family-centric architecture.

## ✅ COMPLETED TASKS

### ✅ 1. Database Migration (Phase 1 & 2)
- ✅ Family tables created (families, family_members, data_sources)
- ✅ Users.account_id column dropped successfully
- ✅ Integrations migrated from account_integrations → user_integrations
- ✅ All RLS policies updated and cleaned up
- ✅ Foreign key constraints updated

### ✅ 2. Authentication & Session Management - COMPLETED
- ✅ Updated `/src/services/userSession.ts` to use family-based queries
- ✅ Implemented compatibility mapping layer (family data → account interface)
- ✅ Fixed RLS policy recursion issues with separate queries
- ✅ User integrations now user-scoped instead of account-scoped
- ✅ Team members now fetched from family_members table

### ✅ 3. Integrations Service Updates - COMPLETED
- ✅ Updated `AccountIntegrationsService` methods to use `userId` instead of `accountId`
- ✅ Renamed `getIntegrationsForAccount()` → `getIntegrationsForUser()`
- ✅ Updated all database queries from `account_integrations` → `user_integrations`
- ✅ Updated `IntegrationsDataService.getIntegrationsForUser()` method
- ✅ Fixed `IntegrationsSection.tsx` to use user-based data
- ✅ Integration tiles now load properly with user context
- ✅ Renamed service file: `accountIntegrationsService.ts` → `userIntegrationsService.ts`
- ✅ Updated all imports across frontend components

### ✅ 4. Profile Service Updates - COMPLETED
- ✅ Renamed service file: `accountProfileService.ts` → `familyProfileService.ts`
- ✅ Updated service methods to use `familyId` instead of `accountId`
- ✅ Updated all imports across components and services
- ✅ Frontend components now use `userData?.user?.id` for family profile operations

### ✅ 5. Chat Service Updates - COMPLETED
- ✅ Updated `edgeFunctionChatService.ts` to send both `familyId` and `userId`
- ✅ Chat requests now include family context for family-aware AI processing
- ✅ Conversations use family context for proper data scoping

## 🔧 REMAINING SERVICE UPDATES REQUIRED

### 4. Authentication & Session Management - LEGACY REFERENCE

#### `/src/services/userSessionService.ts`
```typescript
// BEFORE: Account-based session
export const getUserSession = async () => {
  // ... existing account logic
}

// AFTER: Family-based session
export const getUserSession = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // Get family information
  const { data: familyData } = await supabase
    .from('family_members')
    .select(`
      family_id,
      role,
      family_relationship,
      families:family_id (
        id,
        name,
        slug,
        billing_admin_id,
        subscription_status,
        subscription_plan
      )
    `)
    .eq('user_id', user.id)
    .single();

  return {
    user,
    family: familyData?.families,
    userRole: familyData?.role,
    isBillingAdmin: familyData?.families?.billing_admin_id === user.id
  };
};
```

### 2. Profile Service Updates

#### `/src/services/accountProfileService.ts` → `/src/services/familyProfileService.ts`
```typescript
// Rename file and update all functions
export const getFamilyProfile = async (familyId?: string) => {
  // Use existing get_account_profile_for_ai function which now includes family data
  const { data, error } = await supabase.rpc('get_account_profile_for_ai', {
    user_uuid: (await supabase.auth.getUser()).data.user?.id,
    include_source_data: false
  });

  return { data, error };
};

export const updateFamilyProfile = async (profileData: any) => {
  // Update family.family_profiles instead of account_profiles
  // Implement family-specific update logic
};
```

### 3. Chat Service Updates

#### `/src/services/edgeFunctionChatService.ts`
```typescript
// Update to use family context instead of account context
export const sendChatMessage = async (message: string, conversationId?: string) => {
  try {
    // Get family profile instead of account profile
    const familyProfile = await getFamilyProfile();

    const response = await fetch(`${RENDER_SERVER_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message,
        conversationId,
        familyProfile: familyProfile.data, // Send family data instead of account data
        userId: user.id
      })
    });

    return response.json();
  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  }
};
```

### 4. Server-Side Updates

#### `/server/src/services/agentMemoryService.js`
```javascript
// Update to use family-centric memory storage
const extractAndStoreMemories = async (conversationData, familyProfile) => {
  // Change from account-based to family-based memory extraction
  // Update database calls to use family_id instead of account_id

  const familyId = familyProfile?.family?.id;
  if (!familyId) {
    throw new Error('No family ID found for memory storage');
  }

  // Update all Neon DB queries to include family context
  // Change table references from account_* to family_*
};
```

#### `/server/src/routes/chat.js`
```javascript
// Update chat endpoint to handle family profiles
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { message, conversationId, familyProfile, userId } = req.body;

    // Validate family profile instead of account profile
    if (!familyProfile?.family?.id) {
      return res.status(400).json({ error: 'Family profile required' });
    }

    // Use family context in AI prompts
    const aiResponse = await processWithAI(message, familyProfile, conversationId);

    res.json(aiResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 5. Component Updates

#### `/src/components/dashboard/settings/FamilyProfileSection.tsx`
```tsx
// Update to use family-centric data structure
const FamilyProfileSection: React.FC = () => {
  const [familyProfile, setFamilyProfile] = useState(null);

  useEffect(() => {
    const loadFamilyProfile = async () => {
      const profile = await getFamilyProfile();
      setFamilyProfile(profile.data);
    };

    loadFamilyProfile();
  }, []);

  // Update UI to show family members, not just account profile
  return (
    <div>
      <h3>Family Profile</h3>
      {familyProfile?.family?.members?.map(member => (
        <div key={member.user_id}>
          {member.name} - {member.family_relationship}
        </div>
      ))}
      {familyProfile?.family?.profiles?.map(profile => (
        <div key={profile.id}>
          {profile.name} - {profile.relationship}
        </div>
      ))}
    </div>
  );
};
```

### 6. Memory Service Updates

#### `/src/components/ui/AgentMemoryManager.tsx`
```tsx
// Update to use family-based memory management
const AgentMemoryManager: React.FC = () => {
  // Change from account-based to family-based memory queries
  const loadFamilyMemories = async () => {
    // Update API calls to use family context
    const response = await fetch(`${RENDER_SERVER_URL}/api/agent-memory/family/${familyId}`);
    // ... rest of implementation
  };
};
```

### 7. Integrations Service Updates

#### `/src/services/accountIntegrationsService.ts` → `/src/services/userIntegrationsService.ts`
```typescript
// Rename file and update all references
export const getUserIntegrations = async () => {
  const session = await getUserSession();
  if (!session?.user) return null;

  // BEFORE: Query account_integrations with account_id
  // AFTER: Query user_integrations with user_id
  const { data, error } = await supabase
    .from('user_integrations')  // Renamed table
    .select('*')
    .eq('user_id', session.user.id);  // Use public.users.id

  return { data, error };
};

export const updateIntegrationStatus = async (integrationId: string, status: string) => {
  const session = await getUserSession();
  if (!session?.user) throw new Error('User not authenticated');

  // Update using user_id instead of account_id
  const { data, error } = await supabase
    .from('user_integrations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', session.user.id)
    .eq('integration_id', integrationId);

  return { data, error };
};
```

### 8. Billing & Admin Updates

#### Create new `/src/services/billingService.ts`
```typescript
export const getBillingInfo = async () => {
  const session = await getUserSession();
  if (!session?.family) return null;

  // Return billing info from family record
  return {
    isAdmin: session.isBillingAdmin,
    status: session.family.subscription_status,
    plan: session.family.subscription_plan
  };
};

export const updateBillingPlan = async (planData: any) => {
  // Update family billing, not account billing
  const session = await getUserSession();
  if (!session?.isBillingAdmin) {
    throw new Error('Only billing admin can update plan');
  }

  // Update families table billing columns
};
```

### 8. Database Trigger Updates

Execute these in Supabase dashboard:

```sql
-- Update existing triggers to work with family structure
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create family and family_member record for new user
  INSERT INTO public.families (id, name, slug, billing_admin_id, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)) || ' Family',
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), ' ', '-')) || '-family-' || LEFT(NEW.id::text, 8),
    NEW.id,
    NOW(),
    NOW()
  );

  INSERT INTO public.family_members (family_id, user_id, role, family_relationship, joined_via, joined_at)
  VALUES (
    (SELECT id FROM families WHERE billing_admin_id = NEW.id LIMIT 1),
    NEW.id,
    'owner',
    'self',
    'signup',
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 🧪 Testing Checklist

### ✅ Phase 3A: Service Integration Tests - PARTIALLY COMPLETE
- ✅ Test user authentication flow (gradual migration working)
- ✅ Verify family profile loading (compatibility layer working)
- ✅ Test integrations service with user context (working)
- [ ] Test chat service with family context
- [ ] Verify memory extraction with family data
- [ ] Test billing admin permissions
- [ ] Verify family member management

### Phase 3B: Component Integration Tests - PARTIALLY COMPLETE
- ✅ Test dashboard family section (integrations working)
- [ ] Verify settings family profile section
- [ ] Test agent memory manager
- [ ] Verify user dropdown family info
- [ ] Test admin panel family context

### Phase 3C: API Integration Tests - PENDING
- [ ] Test all chat endpoints
- [ ] Verify profile endpoints
- [ ] Test memory endpoints
- [ ] Verify admin endpoints
- [ ] Test billing endpoints

## 🚨 Critical Migration Notes

1. **Service File Renames Required:**
   - `accountProfileService.ts` → `familyProfileService.ts`
   - Update all imports across the codebase

2. **Database Context Changes:**
   - All Neon DB queries need family_id context
   - Supabase queries switch from accounts to families
   - Memory storage becomes family-scoped

3. **Authentication Flow Changes:**
   - Session now includes family information
   - Billing admin permissions replace account admin
   - Family membership drives access control

4. **API Contract Changes:**
   - Chat API expects familyProfile not accountProfile
   - Memory API uses family context
   - All endpoints need family-aware authentication

## 📋 Implementation Order

1. Execute Phase 1 & 2 SQL scripts
2. Update authentication/session services
3. Update profile services
4. Update chat services
5. Update server-side services
6. Update React components
7. Update database triggers
8. Run comprehensive testing
9. Deploy with monitoring

This completes the service updates guide. Each service needs careful attention to ensure family-centric operation while maintaining existing functionality.