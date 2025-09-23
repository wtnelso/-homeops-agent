# Profile Suggestion Categorization & Duplicate Prevention

## Overview

This system implements intelligent categorization of AI-generated profile suggestions to help users understand whether a suggestion represents a new family member, an update to existing information, or a potential duplicate.

## Features

### 1. **Visual Categorization Badges**
- **New Family Member** (Blue) - No existing family members match the suggested name
- **Update Info** (Orange) - Strong match with existing family member
- **Possible Duplicate** (Gray) - Weak name match that might be redundant

### 2. **Fuzzy Name Matching**
- Exact name matching (case-insensitive)
- Partial name matching (first/last name components)
- Age proximity verification for additional confidence

### 3. **Duplicate Prevention**
- Content hashing to identify identical suggestions
- Rejection tracking to prevent re-suggesting rejected content
- 30-day cooldown period for rejected suggestions

## Database Schema

### New Columns in `profile_suggestions` table:
```sql
ALTER TABLE profile_suggestions ADD COLUMN IF NOT EXISTS
  content_hash VARCHAR(64),           -- SHA-256 hash for duplicate detection
  rejection_reason VARCHAR(100),      -- Why suggestion was rejected
  rejected_at TIMESTAMP,              -- When suggestion was rejected
  suggestion_category VARCHAR(20) DEFAULT 'new_person'; -- Categorization
```

## Implementation Details

### Backend Logic (`/server/src/services/profileSuggestionsService.js`)

#### Content Hashing
```javascript
generateContentHash(suggestion) {
  const key = `${suggestion.suggestionType}-${suggestion.suggestedData.member_name || ''}-${JSON.stringify(suggestion.suggestedData)}`;
  return createHash('sha256').update(key).digest('hex');
}
```

#### Fuzzy Name Matching
```javascript
fuzzyNameMatch(suggestedName, existingMembers) {
  // 1. Exact match (confidence: 1.0)
  // 2. Partial match - any significant name parts match (confidence: 0.7)
  // 3. No match (confidence: 0.0)
}
```

#### Categorization Logic
```javascript
categorizeSuggestion(suggestion, existingMembers) {
  if (existingMembers.length === 0) return 'new_person';

  const nameMatch = fuzzyNameMatch(suggestedName, existingMembers);

  if (nameMatch.confidence > 0.6) return 'update_info';
  if (nameMatch.confidence > 0.3) return 'possible_duplicate';

  return 'new_person';
}
```

#### Duplicate Prevention Flow
1. Generate content hash for new suggestion
2. Check if hash exists with `status = 'rejected'` in last 30 days
3. If found, skip suggestion creation
4. If not found, proceed with categorization and creation

### Frontend Integration (`/src/components/ui/ReviewStream.tsx`)

#### Badge Display
```typescript
{suggestion.suggestion_category && (() => {
  const categoryBadge = profileSuggestionsService.getCategoryBadge(suggestion.suggestion_category);
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${categoryBadge.bgColor} ${categoryBadge.textColor}`}>
      {categoryBadge.badge}
    </span>
  );
})()}
```

## Configuration

### Matching Thresholds
- **High Confidence Match**: 0.6+ (triggers "Update Info")
- **Low Confidence Match**: 0.3+ (triggers "Possible Duplicate")
- **No Match**: <0.3 (triggers "New Person")

### Rejection Cooldown
- **Duration**: 30 days
- **Scope**: Per account, per content hash
- **Behavior**: Skip identical suggestion creation

## Benefits

1. **Reduced Noise**: Users won't see duplicate suggestions for rejected content
2. **Clear Intent**: Visual badges help users understand suggestion context
3. **Better UX**: Less cognitive load when reviewing suggestions
4. **Data Quality**: Prevents redundant family member creation

## Example Scenarios

### New User (Empty Family)
- **All suggestions** → "New Family Member" badge
- **Behavior**: Encourages initial family setup

### Established User
- **"Emma"** exists in family
- **New suggestion**: "Emma's birthday is March 15"
- **Result**: "Update Info" badge (exact name match)

### Potential Duplicate
- **"Robert Smith"** exists in family
- **New suggestion**: "Rob attended soccer practice"
- **Result**: "Possible Duplicate" badge (partial name match)

### Recently Rejected
- **User rejects**: "Emma's birthday is March 15"
- **Same email processed again**
- **Result**: Suggestion skipped entirely (content hash match)

## Performance Impact

- **Minimal**: All operations use built-in JavaScript functions
- **No AI API calls**: Pure algorithmic matching
- **Database**: Single hash lookup per suggestion creation
- **Memory**: No significant overhead

---

# Family Profile to Agent Memory Sync Integration

## Overview

The suggestion categorization system has been enhanced with a complete **Family Profile → Agent Memory Sync** integration that ensures the chat agent has current family context at all times.

## Architecture Components

### 1. **Family Profile Sync Service** (`/server/src/services/familyProfileSyncService.js`)

**Purpose**: Automatically sync family profile changes to agent memory for chat context.

**Key Features**:
- **Content Hash Tracking**: SHA-256 hashing for change detection
- **Smart Sync Logic**: Only updates when data actually changes
- **Memory Generation**: Converts family data to agent memory format
- **Cleanup Operations**: Handles deleted family members

#### Content Hash Generation
```javascript
generateMemberHash(memberData) {
  const hashString = JSON.stringify({
    id: memberData.id,
    name: memberData.name,
    type: memberData.type,
    age: memberData.age,
    activities: memberData.activities || [],
    schools: memberData.schools || [],
    birthday: memberData.birthday || {}
  }, Object.keys(memberData).sort());

  return createHash('sha256').update(hashString).digest('hex');
}
```

#### Agent Memory Creation
```javascript
// Basic member info
memory_value: `${member.name} is ${member.type} aged ${member.age}`

// Birthday info
memory_value: `${member.name}'s birthday is ${member.birthday.month}/${member.birthday.day}`

// Activities
memory_value: `${member.name} participates in ${activity.name} on ${activity.days.join(', ')}`

// Schools
memory_value: `${member.name} attends ${school.name} in ${school.grade}`
```

### 2. **Database Schema Enhancement**

**New Fields Added to `agent_memory` Table**:
```sql
ALTER TABLE agent_memory
ADD COLUMN family_member_id VARCHAR(255),    -- Links to family member
ADD COLUMN content_hash VARCHAR(64),         -- SHA-256 for change detection
ADD COLUMN status VARCHAR(20) DEFAULT 'active',  -- Memory lifecycle
ADD COLUMN outdated_at TIMESTAMP,           -- When marked as outdated
ADD COLUMN outdated_reason VARCHAR(100);    -- Why outdated
```

**Performance Indexes**:
```sql
CREATE INDEX idx_agent_memory_family_sync
ON agent_memory (account_id, family_member_id, status);

CREATE INDEX idx_agent_memory_content_hash
ON agent_memory (content_hash);
```

### 3. **Account Profile Service Integration**

**Auto-Sync Trigger**: Added to `AccountProfileService.updateProfile()`:
```javascript
// After successful profile update
if (updatedData.members && Array.isArray(updatedData.members)) {
  const syncResult = await familyProfileSyncService.syncFamilyToAgentMemory(
    accountId,
    updatedData.members
  );
  console.log(`🔄 Family sync: ${syncResult.results.created} created, ${syncResult.results.updated} updated`);
}
```

## Sync Process Flow

### When Family Data Changes:

1. **User Updates Family Profile** (via UI)
2. **Profile Service Saves** to `account_profiles` table
3. **Auto-Sync Triggers** `familyProfileSyncService.syncFamilyToAgentMemory()`
4. **Change Detection**:
   - Generate new content hash for each family member
   - Compare with existing `content_hash` in agent memory
5. **Memory Updates**:
   - If **unchanged**: Skip (performance optimization)
   - If **changed**: Mark old memories as `status = 'outdated'`, create new ones
6. **Chat Agent** now has current family context

### Memory Types Generated:

| Type | Example Memory Value | Source Data |
|------|---------------------|-------------|
| **Family Member** | "Sarah is partner aged 25" | `member.name`, `member.type`, `member.age` |
| **Birthday** | "Sarah's birthday is 2/2" | `member.birthday.month/day` |
| **Activity** | "Sarah participates in Yoga on Monday, Wednesday (weekly)" | `member.activities[].name/days/frequency` |
| **Education** | "John attends CCES in 5th grade (elementary)" | `member.schools[].name/grade/type` |

## Benefits

✅ **Rich Chat Context**: Agent knows "Sarah has yoga today"
✅ **Always Current**: Updates automatically when profile changes
✅ **Performance Optimized**: Content hashing prevents unnecessary updates
✅ **Data Integrity**: Family profile remains single source of truth
✅ **Cleanup Handled**: Deleted members properly removed from memory
✅ **Non-Blocking**: Sync failures don't break profile updates

## Configuration

### Sync Behavior
- **Trigger**: Any family profile update via `AccountProfileService.updateProfile()`
- **Memory Status**: `active` for current data, `outdated` for superseded
- **Error Handling**: Non-blocking (profile updates succeed even if sync fails)
- **Performance**: Only syncs when `content_hash` actually changes

### Memory Lifecycle
```javascript
// Active memories (used by chat agent)
status = 'active'

// Superseded by newer data
status = 'outdated'
outdated_reason = 'family_data_changed'

// Member deleted from family
status = 'outdated'
outdated_reason = 'family_member_deleted'
```

## Integration with Suggestion System

The family sync system **complements** the suggestion categorization:

1. **Suggestions**: Users review and approve AI-generated family updates
2. **Profile Updates**: Approved suggestions update the family profile
3. **Auto-Sync**: Profile changes automatically sync to agent memory
4. **Chat Context**: Agent uses both profile data AND conversation memories

This creates a complete feedback loop where approved suggestions enhance both the structured family profile and the agent's conversational context.

---

## Future Enhancements

1. **Machine Learning**: Train model on user approval patterns
2. **Confidence Tuning**: Adjust thresholds based on user feedback
3. **Temporal Decay**: Gradually re-allow rejected suggestions after longer periods
4. **Smart Grouping**: Batch related suggestions for easier review
5. **Bi-directional Sync**: Allow agent memories to suggest profile updates
6. **Conflict Resolution**: Handle simultaneous profile and memory updates