# Firebase Index Fix for Email Decoder

## Issue
Your app is getting Firebase index errors when trying to query decoded emails:

```
The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/homeops-web/firestore/indexes?create_composite=...
```

## Solution

### Option 1: Create the Index (Recommended)
1. Click the link in the error message to go directly to Firebase Console
2. Or manually create the index:

**Firebase Console Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `homeops-web`
3. Go to Firestore Database → Indexes
4. Click "Create Index"
5. Set up the composite index:

**Index Configuration:**
- Collection ID: `decoded_emails`
- Fields to index:
  - `user_id` (Ascending)
  - `created_at` (Descending)
- Query scope: Collection

### Option 2: Modify the Query (Quick Fix)
If you want to avoid creating the index, modify the query in `index.cjs`:

```javascript
// Current query (requires index):
const snapshot = await db.collection('decoded_emails')
  .where('user_id', '==', user_id)
  .orderBy('created_at', 'desc')
  .limit(20)
  .get();

// Modified query (no index required):
const snapshot = await db.collection('decoded_emails')
  .where('user_id', '==', user_id)
  .limit(20)
  .get();

// Then sort in JavaScript:
const emails = snapshot.docs
  .map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  .sort((a, b) => b.created_at.toDate() - a.created_at.toDate());
```

### Option 3: Use a Different Field
If you don't need exact timestamp ordering, you could use a different field or remove the ordering entirely.

## Recommended Action
I recommend **Option 1** (creating the index) as it's the most efficient and will improve query performance. The index creation takes a few minutes but will resolve the error permanently.

## Testing
After creating the index:
1. Wait 2-3 minutes for the index to build
2. Test the email decoder functionality
3. Verify no more index errors in the logs 