# Agent Memory - Standardized Data Formats

## Overview

All agent memory data types now use a consistent, simplified format optimized for LangChain reasoning and semantic search. This eliminates the previous inconsistent nested structures and focuses on essential data that helps the agent answer family-related questions.

## Standardized Format Principles

1. **Flat Structure**: No nested `data` objects - all fields at top level
2. **Consistent Fields**: Every type includes `context_type` and `category`
3. **Conditional Fields**: Optional fields only included when data exists
4. **Semantic Focus**: Field names optimized for agent understanding
5. **Simple Categories**: Use existing field values for categorization

## Contact Information

```javascript
{
  name: "Dr. Jennifer Smith",
  role: "Pediatrician",
  phone: "555-0123",
  email: "jsmith@healthcenter.com",
  notes: "Emma's doctor since age 2, very patient with kids",
  context_type: "contact_info",
  category: "medical"  // medical, education, emergency, services, general
}
```

**Agent Benefits:**
- **"Who is Emma's doctor?"** → `category: "medical"` + search notes for "Emma"
- **"Contact someone about school issues"** → `category: "education"`
- **"Find medical contacts"** → `category: "medical"`

## Family Activities

```javascript
{
  name: "Soccer Practice",
  type: "Sports",
  frequency: "weekly",
  days: ["Monday", "Wednesday"],
  end_date: "2024-06-15",
  context_type: "activity_info",
  category: "sports",  // uses activity_type.toLowerCase()
  member_name: "Emma"  // Only if activity is for specific family member
}
```

**Agent Benefits:**
- **"What activities does Emma have?"** → `member_name: "Emma"`
- **"What sports activities are there?"** → `category: "sports"`
- **"What happens on Mondays?"** → search `days` array

## School Information

```javascript
{
  name: "Lincoln Elementary School",
  type: "Elementary",
  grade: "3rd Grade",
  email_domain: "lincoln.edu",
  end_date: "2024-06-15",
  context_type: "education_info",
  category: "elementary",  // uses school_type.toLowerCase()
  member_name: "Emma"  // Only if school is for specific family member
}
```

**Agent Benefits:**
- **"What school does Emma attend?"** → `member_name: "Emma"`
- **"What's the school email domain?"** → `email_domain: "lincoln.edu"`
- **"When does school end?"** → `end_date`

## Family Members

```javascript
{
  name: "Emma Rodriguez",
  relationship: "Child",
  age: 8,
  birthday_month: "May",
  birthday_day: 15,
  context_type: "family_info",
  category: "child"  // uses family_relationship.toLowerCase()
}
```

**Agent Benefits:**
- **"How old is Emma?"** → `age: 8`
- **"When is Emma's birthday?"** → `birthday_month` + `birthday_day`
- **"Who are the children in the family?"** → `category: "child"`

## Preferences

```javascript
{
  name: "Family Allergies",
  type: "dietary",
  items: ["peanuts", "shellfish", "dairy"],
  context_type: "preference_info",
  category: "dietary"
}

{
  name: "Favorite Cuisines",
  type: "dietary",
  items: ["Mexican", "Thai", "Japanese"],
  context_type: "preference_info",
  category: "dietary"
}
```

**Agent Benefits:**
- **"What foods should we avoid?"** → `context_type: "preference_info"` + `name: "Family Allergies"`
- **"What cuisines do we like?"** → `context_type: "preference_info"` + `name: "Favorite Cuisines"`
- **"Plan a meal"** → Consider both allergies and preferences

## Context Types for Agent Filtering

| Context Type | Purpose | Example Queries |
|-------------|---------|-----------------|
| `contact_info` | People to communicate with | "Who should I call about...", "Contact information for..." |
| `activity_info` | Family schedules and activities | "What activities...", "When is practice...", "Schedule for..." |
| `education_info` | School-related information | "What school...", "School schedule...", "Education contacts..." |
| `family_info` | Family member details | "How old is...", "Birthday info...", "Family relationships..." |
| `preference_info` | Family preferences and restrictions | "Food allergies...", "Favorite...", "Avoid..." |

## Category Examples

### Contacts
- `medical`: Doctor, Pediatrician, Dentist, Therapist
- `education`: Teacher, Principal, School, Coach
- `emergency`: Emergency, Babysitter, Nanny
- `services`: Plumber, Electrician, Mechanic
- `general`: Default for unspecified types

### Activities
- Uses existing `activity_type` field converted to lowercase
- Examples: `sports`, `music`, `academic`, `social`

### Schools
- Uses existing `school_type` field converted to lowercase
- Examples: `elementary`, `middle`, `high`, `private`

### Family Members
- Uses existing `family_relationship` field converted to lowercase
- Examples: `child`, `parent`, `spouse`, `sibling`

### Preferences
- `dietary`: Food allergies, favorite cuisines, dietary restrictions
- `lifestyle`: Activity preferences, schedule preferences
- `communication`: Preferred contact methods

## Benefits for Agent Performance

1. **Faster Retrieval**: Consistent structure enables better semantic search
2. **Better Context**: `context_type` helps agent understand information relevance
3. **Smart Filtering**: Categories enable intelligent data filtering
4. **Conditional Logic**: Only relevant fields included (e.g., `member_name` when applicable)
5. **Human-Readable**: Field names match natural language queries

## Migration Impact

- **Contacts**: ✅ Updated to new format
- **Activities**: ✅ Updated to new format
- **Schools**: ✅ Updated to new format
- **Family Members**: ✅ Updated to new format
- **Preferences**: ✅ Updated to new format

All existing agent memory entries will be updated to the new format during the next sync operation.