# Database Schemas Documentation

This document defines the database schemas for the HomeOps Agent project, including table structures and data relationships.

## 1. Profile Suggestions Table (`profile_suggestions`)

The profile suggestions table stores AI-generated suggestions that are presented to users for review and approval before being stored in permanent profile data.

### Table Structure

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key, unique identifier for suggestion | PRIMARY KEY |
| `suggestion_type` | VARCHAR | Type of suggestion being made | NOT NULL, ENUM: 'family_info', 'contact_add', 'preference_update' |
| `suggested_data` | JSONB | Structured data containing the suggestion details | NOT NULL |
| `confidence_score` | DECIMAL(3,2) | AI confidence score (0.00-1.00) | NOT NULL |
| `source_email_id` | VARCHAR | ID of the source email that generated this suggestion | NULLABLE |
| `source_email_subject` | VARCHAR | Subject of the source email | NULLABLE |
| `status` | VARCHAR | Current processing status | NOT NULL, ENUM: 'pending', 'accepted', 'rejected' |
| `created_at` | TIMESTAMP | When the suggestion was created | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | When the suggestion was last modified | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `account_id` | UUID | Foreign key to user account | NOT NULL, REFERENCES accounts(id) |

### Suggestion Types and Data Structures

#### 1. Family Information (`family_info`)

Contains information about family members, activities, schools, and schedules.

```json
{
  "member_name": "string",      // Name of family member
  "birthday": "YYYY-MM-DD",     // Birth date (optional)
  "age": number,                // Age in years (optional)
  "activity": "string",         // Activity name (optional)
  "schedule": "string",         // Schedule details (optional)
  "school": "string",           // School name (optional)
  "grade": "string"             // Grade level (optional)
}
```

**Examples:**
```json
// Complete member profile
{
  "member_name": "Emma",
  "birthday": "2015-08-12",
  "age": 9,
  "school": "Lincoln Elementary",
  "grade": "3rd Grade"
}

// Activity-focused suggestion
{
  "member_name": "Alex",
  "activity": "Soccer practice",
  "schedule": "Tuesdays and Thursdays 4-5pm"
}
```

#### 2. Contact Addition (`contact_add`)

Contains contact information for teachers, coaches, doctors, and other service providers.

```json
{
  "name": "string",             // Contact's full name
  "role": "string",             // Their role/title
  "phone": "string",            // Phone number (optional)
  "email": "string",            // Email address (optional)
  "address": "string"           // Physical address (optional)
}
```

**Examples:**
```json
// Medical professional
{
  "name": "Dr. Sarah Johnson",
  "role": "pediatrician",
  "phone": "(555) 123-4567",
  "email": "sarah.johnson@childrensclinic.com",
  "address": "456 Medical Center Dr, Suite 200"
}

// School staff
{
  "name": "Ms. Thompson",
  "role": "teacher",
  "email": "e.thompson@lincoln.edu",
  "phone": "(555) 234-5678"
}
```

#### 3. Preference Update (`preference_update`)

Contains user preference updates like emergency contacts, dietary restrictions, etc.

```json
{
  "preference_type": "string",  // Type of preference being updated
  "preference_value": "string"  // The new preference value
}
```

**Examples:**
```json
{
  "preference_type": "emergency_contact",
  "preference_value": "Grandma Sarah - (555) 987-6543 - Available weekdays"
}

{
  "preference_type": "dietary_restrictions",
  "preference_value": "Nut allergy - severe"
}
```

### Data Flow

1. **Creation**: AI email analysis generates suggestions and inserts them with `status='pending'`
2. **Review**: User reviews suggestions via UI (ReviewStream component)
3. **Action**: User can:
   - Approve → Data flows to `account_profiles` or `agent_memory`
   - Reject → Suggestion marked as `status='rejected'`
   - Edit → User modifies data before approval
4. **Routing Decision**: Based on suggestion type and data permanence:
   - **Profile Data**: Permanent info (birthdays, names, core contacts) → `account_profiles`
   - **Temporary Data**: Time-sensitive info (schedules, activities) → `agent_memory`

---

## 2. Account Profiles Table (`account_profiles`)

The account profiles table stores permanent family profile data in a structured JSON format.

### Table Structure

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `account_id` | UUID | Foreign key to user account | PRIMARY KEY, REFERENCES accounts(id) |
| `profile_data` | JSONB | Structured family profile information | NOT NULL |
| `created_at` | TIMESTAMP | When the profile was created | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | When the profile was last modified | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Profile Data Schema

The `profile_data` JSONB field follows a structured schema defined in `/server/src/config/userProfileSchema.json`.

#### Root Structure

```json
{
  "members": [Member],          // Array of family members
  "contacts": {                 // Organized contact lists
    "schools": [Contact],
    "services": [Contact],
    "healthcare": [Contact]
  },
  "activities": [Activity],     // Family-wide activities
  "schedule": "string",         // General schedule notes
  "metadata": Metadata          // Profile metadata
}
```

#### Member Object

```json
{
  "id": "string (UUID)",        // Unique member identifier
  "name": "string",             // Member's name
  "type": "string",             // user|partner|child|other
  "age": number,                // Age in years (optional)
  "email": "string",            // Email address (optional)
  "user": boolean,              // Is this the primary user (optional)
  "birthday": {                 // Birthday information (optional)
    "day": "string",
    "month": "string"
  },
  "schools": [School],          // Schools attended
  "activities": [Activity]      // Individual activities
}
```

#### School Object

```json
{
  "name": "string",             // School name
  "type": "string",             // School type (elementary, middle, etc.)
  "grade": "string",            // Current grade level
  "email_domain": "string",     // School's email domain (optional)
  "source": Source              // Data source metadata
}
```

#### Activity Object

```json
{
  "name": "string",             // Activity name
  "type": "string",             // Activity type/category
  "days": ["string"],           // Days of week
  "frequency": "string",        // How often it occurs
  "end_date": "string",         // When activity ends (optional)
  "source": Source              // Data source metadata
}
```

#### Contact Object

```json
{
  "name": "string",             // Contact's full name
  "role": "string",             // Their role/relationship
  "email": "string",            // Email address (optional)
  "phone": "string",            // Phone number (optional)
  "address": "string",          // Physical address (optional)
  "relationship": "string",     // Relationship to family (optional)
  "source": Source              // Data source metadata
}
```

#### Source Object (Data Provenance)

```json
{
  "type": "string",             // Source type (email, manual, etc.)
  "source_id": "string|null",   // ID of source record
  "timestamp": "ISO string",    // When data was extracted
  "confidence": number,         // Confidence score
  "updated_at": "ISO string",   // Last update time
  "original_text": "string",   // Original text (optional)
  "email_subject": "string"     // Source email subject (optional)
}
```

#### Metadata Object

```json
{
  "version": number,            // Schema version
  "created_at": "ISO string",   // Profile creation time
  "updated_at": "ISO string",   // Last update time
  "last_ai_update": "ISO string|null",  // Last AI update
  "completeness_score": number  // Profile completeness (0.0-1.0)
}
```

### Complete Example

```json
{
  "members": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Emma",
      "type": "child",
      "age": 9,
      "birthday": {
        "day": "12",
        "month": "8"
      },
      "schools": [
        {
          "name": "Lincoln Elementary",
          "type": "elementary",
          "grade": "3rd Grade",
          "source": {
            "type": "email",
            "timestamp": "2025-09-20T10:00:00Z",
            "confidence": 0.95,
            "email_subject": "School enrollment confirmation"
          }
        }
      ],
      "activities": [
        {
          "name": "Soccer practice",
          "type": "sports",
          "days": ["Tuesday", "Thursday"],
          "frequency": "weekly",
          "source": {
            "type": "email",
            "timestamp": "2025-09-19T16:15:00Z",
            "confidence": 0.88,
            "email_subject": "Fall soccer schedule"
          }
        }
      ]
    }
  ],
  "contacts": {
    "healthcare": [
      {
        "name": "Dr. Sarah Johnson",
        "role": "pediatrician",
        "phone": "(555) 123-4567",
        "email": "sarah.johnson@childrensclinic.com",
        "address": "456 Medical Center Dr, Suite 200",
        "source": {
          "type": "email",
          "timestamp": "2025-09-17T11:30:00Z",
          "confidence": 0.96,
          "email_subject": "Appointment confirmation"
        }
      }
    ],
    "schools": [
      {
        "name": "Ms. Thompson",
        "role": "teacher",
        "email": "e.thompson@lincoln.edu",
        "phone": "(555) 234-5678",
        "relationship": "Emma's 3rd grade teacher",
        "source": {
          "type": "email",
          "timestamp": "2025-09-15T13:10:00Z",
          "confidence": 0.91,
          "email_subject": "Welcome to 3rd Grade"
        }
      }
    ],
    "services": []
  },
  "activities": [],
  "schedule": "",
  "metadata": {
    "version": 1,
    "created_at": "2025-09-20T10:00:00Z",
    "updated_at": "2025-09-20T10:00:00Z",
    "last_ai_update": "2025-09-20T10:00:00Z",
    "completeness_score": 0.75
  }
}
```

---

## 3. Agent Memory Table (`agent_memory`)

The agent memory table stores temporary, time-sensitive information that has expiration dates.

### Table Structure

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | PRIMARY KEY |
| `account_id` | UUID | Foreign key to user account | NOT NULL, REFERENCES accounts(id) |
| `memory_type` | VARCHAR | Type of memory (schedule, activity, etc.) | NOT NULL |
| `key` | VARCHAR | Memory key/identifier | NOT NULL |
| `value` | TEXT | Memory value/content | NOT NULL |
| `confidence_score` | DECIMAL(3,2) | Confidence in the information | DEFAULT 0.8 |
| `expires_at` | TIMESTAMP | When this memory expires | NULLABLE |
| `priority` | VARCHAR | Memory priority level | DEFAULT 'medium', ENUM: 'low', 'medium', 'high' |
| `source_type` | VARCHAR | How this memory was created | DEFAULT 'ai_extraction' |
| `source_id` | VARCHAR | Source identifier | NULLABLE |
| `created_at` | TIMESTAMP | When created | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TIMESTAMP | When last updated | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

### Memory Types

- `schedule`: Temporary scheduling information
- `activity`: Time-bound activities and events
- `preference`: Temporary preferences with expiration
- `contact`: Temporary contact information
- `reminder`: Time-sensitive reminders

---

## Data Relationships

```
accounts
├── profile_suggestions (1:many)
├── account_profiles (1:1)
└── agent_memory (1:many)

profile_suggestions → (approval) → account_profiles OR agent_memory
```

## Data Validation

- All JSONB fields validate against their respective schemas
- UUIDs are generated using Node.js `crypto.randomUUID()`
- Confidence scores must be between 0.00 and 1.00
- Enum fields are strictly validated
- Source metadata tracks data provenance for audit trails