# ReviewStream Architecture Documentation

## Overview

The ReviewStream system allows users to review AI-generated profile suggestions extracted from emails and other sources. It consists of a React frontend component and backend services that handle suggestion creation, processing, and approval.

## Frontend Component: ReviewStream.tsx

**Location**: `/src/components/ui/ReviewStream.tsx`

### Purpose
Interactive UI component that displays AI suggestions in a card-based interface with swipe navigation, allowing users to review, edit, and approve/reject profile enhancements.

### Key Features
- **Swipe Navigation**: Left/right gestures to navigate between suggestions
- **Editable Forms**: Dynamic forms based on suggestion type (family_info, preference_update, contact_add)
- **Smart Expiration**: Intelligent default expiration dates based on content type
- **Real-time Validation**: Form validation and user feedback
- **Batch Operations**: Bulk approve/reject functionality

### State Management

```tsx
const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
const [currentIndex, setCurrentIndex] = useState(0);
const [reviewData, setReviewData] = useState<any>(null);
const [isProcessing, setIsProcessing] = useState(false);
```

### Key Functions

#### `initializeReviewData(suggestion: ProfileSuggestion)`
Initializes form data when a suggestion is selected:
- Spreads suggestion data into form fields
- Sets smart expiration date from server (`default_expiration`) or fallback
- Determines save type (profile vs context)
- Resets form state

#### `getDefaultExpiration(suggestionType: string, suggestionData?: any)`
**Note**: This function should be moved to server side for consistency.

Determines expiration based on:
- **Critical preferences**: allergy, dietary_restriction, emergency_contact → `'never'`
- **Family info**: school-year cycles → `'school-year'`
- **Contacts**: permanent → `'never'`
- **Other preferences**: annual review → `'1-year'`

#### `determineSaveType(suggestionType: string, data: any)`
Smart logic to determine where data should be saved:
- **Profile**: Permanent data (names, birthdays, medical info)
- **Context**: Temporary data (activities, schedules, preferences)

### Form Sections by Suggestion Type

#### Family Info (`family_info`)
- **Fields**: birthday, school, age, grade, activity, activity_type, schedule
- **Expiration**: Default `'school-year'`
- **Target**: Uses `member_id` for accurate family member identification

#### Preference Update (`preference_update`)
- **Fields**: preference_type, preference_value, preference_text
- **Expiration**: Smart based on type (allergies=never, transportation=1-year)
- **Target**: Account-level or member-specific preferences

#### Contact Add (`contact_add`)
- **Fields**: name, phone, email, role
- **Expiration**: Default `'never'`
- **Target**: Contact database

### API Integration

Uses `profileSuggestionsService` for:
- `getPendingSuggestions()`: Fetch suggestions to review
- `approveSuggestion()`: Basic approval
- `approveSuggestionWithEdits()`: Approval with user modifications
- `rejectSuggestion()`: Rejection
- `bulkApprove()` / `bulkReject()`: Batch operations

## Backend Services

### ProfileSuggestionsService

**Location**: `/server/src/services/profileSuggestionsService.js`

Core service handling suggestion lifecycle from creation to approval.

#### Key Methods

##### `createSuggestion(suggestionData)`
Creates new profile suggestions in database:
- Generates content hash for duplicate prevention
- Categorizes suggestions using existing family members
- Detects activity types for family_info suggestions
- **TODO**: Should add `default_expiration` for all suggestion types

##### `getPendingSuggestions(accountId, options)`
Retrieves suggestions for review:
- Filters by account and status
- Supports pagination and filtering
- Returns suggestions with metadata

##### `approveSuggestion(suggestionId, accountId)`
Basic approval workflow:
- Validates ownership and status
- Routes to appropriate handler based on suggestion type
- Updates profile or context data
- Marks suggestion as approved

##### `approveSuggestionWithEdits(suggestionId, accountId, editData)`
Advanced approval with user modifications:
- Extracts form data (`saveAs`, `expirationDate`, `customExpiration`)
- Applies user edits to suggestion data
- Routes to handler with modified data
- Supports saving to profile or agent memory

##### `handleFamilyInfoUpdate(suggestedData, profileUpdate, selectedMemberId)`
Specialized handler for family information:
- **Priority 1**: Uses AI-determined `member_id` from suggestion
- **Priority 2**: Falls back to `selectedMemberId` from user selection
- **Priority 3**: Name-based matching with fuzzy logic
- Processes activities, school info, and personal details
- Creates structured activity objects with type detection

##### `saveToAgentMemory(accountId, suggestionType, editData, expirationDate, customExpiration, suggestionId)`
Saves approved suggestions to agent memory system:
- Creates semantic memory keys using `MEMORY_CONFIG.MEMORY_KEY_UTILS`
- Calculates expiration dates based on UI selection
- Maps suggestion types to memory types
- Stores structured JSONB data for AI context

### Email Processing Integration

**Location**: `/server/src/services/emailProcessor.js`

Email processor creates suggestions using intelligent type mapping:

```javascript
const mappingResult = enhancedMapPreferenceType(
  decision.original_text || '',
  decision.preference_value || decision.original_text || '',
  email.subject || ''
);

await profileSuggestionsService.createSuggestion({
  suggestionType: 'preference_update',
  suggestedData: {
    preference_text: decision.original_text,
    preference_type: mappingResult.type,  // 'allergies', 'transportation', etc.
    preference_value: decision.preference_value,
    default_expiration: mappingResult.expiration  // Smart expiration from server
  }
});
```

### PreferenceTypeMapper Utility

**Location**: `/server/src/utils/preferenceTypeMapper.js`

Intelligent mapping of natural language to structured preference types:

#### `enhancedMapPreferenceType(preferenceText, preferenceValue, emailSubject)`
Returns:
```javascript
{
  type: 'allergies',           // Mapped preference type
  confidence: 0.85,            // Confidence score
  expiration: 'never'          // Smart expiration
}
```

#### `getPreferenceExpiration(preferenceType)`
Maps preference types to appropriate expiration periods:
- **Permanent**: `allergies`, `dietary_restrictions`, `communication_preference` → `'never'`
- **School cycles**: `bedtime`, `homework_schedule`, `extracurricular` → `'school-year'`
- **Annual review**: `screen_time`, `transportation` → `'1-year'`

## Data Flow Mapping

### 1. Email Processing → Suggestion Creation

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Email Ingestion   │    │  AI Content Analysis │    │   Type Mapping      │
│                     │───▶│                      │───▶│                     │
│ - Raw email content │    │ - Extract preferences│    │ - enhancedMapPrefer │
│ - Subject parsing   │    │ - Family info detect │    │ - Smart expiration  │
│ - Metadata extract  │    │ - Contact discovery  │    │ - Confidence score  │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                                                    │
                                                                    ▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Database Storage  │    │  Content Validation  │    │ Suggestion Creation │
│                     │◀───│                      │◀───│                     │
│ - profile_suggestions│    │ - Duplicate check   │    │ - createSuggestion()│
│ - JSONB suggested_data│   │ - Hash generation   │    │ - Category detect   │
│ - Status: pending   │    │ - Rejection filter   │    │ - Activity typing   │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

### 2. Frontend Review Flow

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Component Mount   │    │   Fetch Suggestions  │    │   Initialize Form   │
│                     │───▶│                      │───▶│                     │
│ - useEffect trigger │    │ - getPendingSugg()   │    │ - initializeReview()│
│ - User auth check   │    │ - Pagination logic   │    │ - Expiration logic  │
│ - State initialization│  │ - Account filtering  │    │ - Save type detect  │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                                                    │
                                                                    ▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   User Interaction  │    │   Form Validation    │    │   Data Display      │
│                     │◀───│                      │◀───│                     │
│ - Edit form fields  │    │ - Field validation   │    │ - Dynamic forms     │
│ - Swipe navigation  │    │ - Expiration rules   │    │ - Context icons     │
│ - Approve/Reject    │    │ - Required fields    │    │ - Confidence badges │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

### 3. Approval Processing Flow

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Frontend Submit   │    │   Data Extraction    │    │   Server Validation │
│                     │───▶│                      │───▶│                     │
│ - Form data collect │    │ - UI field separation│    │ - approveSuggWith() │
│ - Expiration select │    │ - Edit data compile  │    │ - Ownership check   │
│ - Save type choice  │    │ - Custom exp handle  │    │ - Status validation │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
                                                                    │
                                                                    ▼
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Data Persistence  │    │   Memory Integration │    │  Handler Routing    │
│                     │◀───│                      │◀───│                     │
│ - Profile updates   │    │ - saveToAgentMemory()│    │ - handleFamilyInfo()│
│ - Status: approved  │    │ - Semantic keys      │    │ - Member ID priority│
│ - Audit logging     │    │ - Expiration calc    │    │ - Activity creation │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

## Function Interaction Mapping

### Core Data Transformations

```
Email Text → AI Analysis → Structured Data → Form Fields → User Edits → Database
     │              │              │             │             │           │
     ▼              ▼              ▼             ▼             ▼           ▼
"Sophie has      preference:    {preference_    [Dropdown    {preference_  agent_memory:
piano lessons"   transportation type:"transport  selections]  type:"trans   expires_at:
                 confidence:0.8  preference_     validation   preference_   2025-06-30
                 expiration:     value:"piano"}  checks       value:"edit"}
                 "1-year"
```

### Expiration Logic Chain

```
preferenceTypeMapper.js               ReviewStream.tsx              profileSuggestionsService.js
       │                                     │                               │
getPreferenceExpiration()                    │                               │
       │                              getDefaultExpiration()                 │
       ▼                                     │                               │
'allergies' → 'never' ──────────────▶ default_expiration ─────────────▶ saveToAgentMemory()
'transportation' → '1-year'                  │                               │
'bedtime' → 'school-year'                    ▼                               ▼
                                     UI Dropdown Selection              Date Calculation
                                           │                               │
                                           ▼                               ▼
                                   User Choice Override              Database Storage
```

### Member Identification Priority

```
AI Suggestion Data           User Interface              Handler Logic
       │                           │                          │
   member_id: "sophie-001"         │                    Priority 1: member_id
       │                           │                          │
   member_name: "Sophie"     User Selection                   │
       │                           │                    Priority 2: selectedMemberId
       ▼                           ▼                          │
                             selectedMemberId                 │
                                   │                    Priority 3: name matching
                                   ▼                          │
                            findExistingMember()              ▼
                                   │                    Family Member Resolution
                                   ▼                          │
                             Fuzzy Name Match                 ▼
                                                       Profile Update
```

## Current Issues & Future Improvements

### 🔧 Current Issues

#### 1. Expiration Logic Inconsistency
- **Problem**: Only email-extracted suggestions have `default_expiration`
- **Impact**: Frontend fallback logic duplicates server logic
- **Solution**: Ensure `createSuggestion()` adds `default_expiration` for ALL suggestions

#### 2. Dummy Data Testing Gap
- **Problem**: Test data lacks `default_expiration` field
- **Impact**: Testing doesn't reflect production behavior
- **Solution**: Update test data generation to include server-provided fields

#### 3. Manual Suggestion Creation
- **Problem**: Non-email suggestions bypass intelligent type mapping
- **Impact**: Inconsistent expiration and categorization
- **Solution**: Apply `enhancedMapPreferenceType()` to all preference suggestions

### 🚀 Future Improvements

#### 1. Enhanced AI Integration
```
Current: Email → AI Analysis → Static Suggestions
Future:  Email → AI Analysis → Dynamic Learning → Personalized Suggestions
```
- **Adaptive Confidence**: Learn from user approval patterns
- **Context Awareness**: Consider user's historical preferences
- **Predictive Suggestions**: Suggest before explicit mention in emails

#### 2. Real-time Validation & Suggestions
```
Current: Create → Review → Approve
Future:  Create → Live Validation → Smart Suggestions → Streamlined Approval
```
- **Live Duplicate Detection**: Real-time checking during form entry
- **Smart Field Completion**: Auto-complete based on existing data
- **Conflict Resolution**: Handle overlapping/contradictory suggestions

#### 3. Batch Processing Optimization
```
Current: Individual suggestion processing
Future:  Intelligent batch operations
```
- **Related Suggestion Grouping**: Bundle family member updates
- **Dependency-Aware Processing**: Handle order-dependent updates
- **Rollback Mechanisms**: Atomic transaction support for batch operations

#### 4. Advanced Expiration Management
```
Current: Static expiration rules
Future:  Dynamic, context-aware expiration
```
- **Seasonal Adjustment**: School schedules adapt to academic calendar
- **Usage-Based Expiration**: Extend expiration for frequently accessed data
- **Smart Renewal**: Proactive expiration warnings and renewal suggestions

#### 5. Enhanced Member Resolution
```
Current: member_id → selectedMemberId → name matching
Future:  Multi-dimensional identity resolution
```
- **Photo Recognition**: Visual confirmation of family members
- **Behavioral Patterns**: Activity-based member identification
- **Relationship Mapping**: Understand family dynamics and relationships

#### 6. Performance & Scalability
```
Current: Synchronous processing
Future:  Asynchronous, distributed processing
```
- **Background Processing**: Move heavy operations off main thread
- **Caching Strategy**: Redis integration for frequently accessed suggestions
- **Database Optimization**: Indexed queries and materialized views

#### 7. User Experience Enhancements
```
Current: Card-based review interface
Future:  Intelligent, adaptive interface
```
- **Smart Defaults**: Learn user preferences for form pre-population
- **Gesture Recognition**: Advanced swipe patterns and shortcuts
- **Voice Integration**: Voice-activated approval/rejection
- **Mobile Optimization**: Native mobile app with offline capabilities

#### 8. Advanced Analytics & Insights
```
Current: Basic suggestion tracking
Future:  Comprehensive analytics dashboard
```
- **Approval Rate Analysis**: Track suggestion quality over time
- **Content Source Analytics**: Identify most valuable email sources
- **Family Activity Insights**: Trend analysis and recommendations
- **Predictive Modeling**: Forecast family schedule changes

#### 9. Integration Expansions
```
Current: Email processing
Future:  Multi-source data integration
```
- **Calendar Integration**: Sync with Google Calendar, Outlook
- **School Portal Integration**: Direct school system connections
- **Health Record Integration**: Medical appointment and allergy tracking
- **Activity App Integration**: Sports teams, music lessons, clubs

#### 10. Security & Privacy Enhancements
```
Current: Basic authentication and validation
Future:  Advanced security and privacy controls
```
- **Granular Permissions**: Family member-specific access controls
- **Data Encryption**: End-to-end encryption for sensitive family data
- **Audit Trails**: Comprehensive change tracking and rollback
- **Privacy Controls**: GDPR compliance and data retention policies

## Database Schema

### profile_suggestions Table
```sql
CREATE TABLE profile_suggestions (
  id UUID PRIMARY KEY,
  account_id UUID NOT NULL,
  suggestion_type TEXT NOT NULL,  -- 'family_info', 'preference_update', 'contact_add'
  suggested_data JSONB NOT NULL,  -- Contains actual suggestion data + default_expiration
  confidence_score DECIMAL,
  source_email_id UUID,
  suggestion_category TEXT,       -- 'new_person', 'update_info', etc.
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Key JSONB Fields in suggested_data
- **All types**: `default_expiration` (from server logic)
- **Family info**: `member_id`, `member_name`, `activity`, `school`, `age`, `grade`
- **Preferences**: `preference_type`, `preference_value`, `preference_text`
- **Contacts**: `name`, `phone`, `email`, `role`

## Memory Integration

Approved suggestions flow into the Agent Memory system:

### Memory Types
- `family_info` → `family_info` memory type
- `preference_update` → `preferences` memory type
- `contact_add` → `contacts` memory type

### Expiration Handling
UI selections map to database dates:
- `'never'` → NULL (no expiration)
- `'1-year'` → Date + 365 days
- `'school-year'` → Next June 30th
- `'custom'` → User-provided date

## Frontend-Backend Interface

### Suggestion Object Structure
```typescript
interface ProfileSuggestion {
  id: string;
  suggestion_type: 'family_info' | 'contact_add' | 'preference_update';
  suggested_data: {
    // Type-specific fields
    default_expiration?: string;  // Server-provided smart expiration
    [key: string]: any;
  };
  confidence_score: number;
  source_email_subject?: string;
  suggestion_category?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
```

### API Endpoints
- `GET /api/profile-suggestions` → Get pending suggestions
- `POST /api/profile-suggestions/:id/approve` → Basic approval
- `POST /api/profile-suggestions/:id/approve-with-edits` → Approval with edits
- `POST /api/profile-suggestions/:id/reject` → Rejection
- `POST /api/profile-suggestions/bulk-approve` → Batch approval
- `POST /api/profile-suggestions/bulk-reject` → Batch rejection

## Configuration Dependencies

### Agent Memory Config
**Location**: `/server/src/config/agentMemoryConfig.js`
- Memory type definitions and defaults
- Expiration policies and cleanup schedules
- Pattern extraction for memory key generation

### Activity Types Config
**Location**: `/server/src/config/activityTypes.js`
- Activity categorization logic
- Used by `detectActivityType()` for family_info suggestions

## Testing Considerations

### Dummy Data Requirements
For testing, ensure dummy suggestions include:
```json
{
  "suggested_data": {
    "preference_type": "allergies",
    "default_expiration": "never",  // Include this field!
    // ... other fields
  }
}
```

### Edge Cases
- Missing `member_id` → falls back to name matching
- Invalid expiration keys → frontend validation
- Orphaned suggestions → cleanup procedures
- Concurrent modifications → optimistic locking

## Performance Notes

- Suggestions are loaded with pagination (default 10)
- Content hashing prevents duplicate suggestions
- Bulk operations reduce API calls
- Memory cleanup runs on scheduled basis

## Security Considerations

- Account ID validation on all operations
- JSONB injection prevention in suggestion data
- Rate limiting on suggestion creation
- User permission validation for approval actions