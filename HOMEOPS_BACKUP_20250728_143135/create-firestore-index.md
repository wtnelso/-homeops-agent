# Firestore Index Setup for Email Decoder Engine

## Required Index

The Email Decoder Engine requires a composite index for the `decoded_emails` collection to support queries that filter by `user_id` and order by `created_at`.

## Create the Index

### Option 1: Direct Link (Recommended)
Click this link to create the index directly in Firebase Console:

**🔗 [Create Index Now](https://console.firebase.google.com/v1/r/project/homeops-web/firestore/indexes?create_composite=ClJwcm9qZWN0cy9ob21lb3BzLXdlYi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvZGVjb2RlZF9lbWFpbHMvaW5kZXhlcy9fEAEaCwoHdXNlcl9pZBABGg4KCmNyZWF0ZWRfYXQQAhoMCghfX25hbWVfXxAC)**

### Option 2: Manual Creation

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Select your project: `homeops-web`

2. **Navigate to Firestore**
   - Click "Firestore Database" in the left sidebar
   - Click the "Indexes" tab

3. **Create Composite Index**
   - Click "Create Index"
   - Collection ID: `decoded_emails`
   - Fields to index:
     - `user_id` (Ascending)
     - `created_at` (Descending)
   - Click "Create"

## What This Index Does

This index allows the Email Decoder Engine to efficiently:
- Filter decoded emails by user ID
- Sort them by creation date (newest first)
- Support pagination for large email collections

## After Creating the Index

1. **Wait for Index to Build** (usually 1-5 minutes)
2. **Test the Email Decoder Engine** by:
   - Going to `/homebase` in your app
   - Connecting Gmail
   - Processing emails
   - Viewing decoded emails

## Troubleshooting

If you still see index errors after creating the index:
- Wait a few more minutes for the index to fully build
- Check the Firebase Console to ensure the index status is "Enabled"
- Restart your server: `npm start`

## Index Details

- **Collection**: `decoded_emails`
- **Fields**:
  1. `user_id` (Ascending)
  2. `created_at` (Descending) 
  3. `__name__` (Ascending)

## Wait for Index to Build

After creating the index:
1. The index will show "Building" status
2. This can take 1-5 minutes depending on data size
3. Once it shows "Enabled", the Email Decoder Engine will work properly

## Verify Index is Working

Once the index is built:
1. Start your server: `npm start`
2. Go to the Email Decoder Engine
3. Try to fetch decoded emails
4. You should no longer see the index error

## Troubleshooting

If you still see index errors:

1. **Check Index Status**: Go to Firestore > Indexes and verify the index is "Enabled"
2. **Wait Longer**: Large datasets can take up to 10 minutes to build
3. **Check Query**: Ensure the query matches the index exactly
4. **Clear Cache**: Restart your server after index creation

## Alternative: Modify Query

If you want to avoid the index requirement, you can modify the query in `index.cjs` line 955:

```javascript
// Current query (requires index)
const snapshot = await db.collection('decoded_emails')
  .where('user_id', '==', user_id)
  .orderBy('created_at', 'desc')
  .limit(20)
  .get();

// Alternative query (no index required)
const snapshot = await db.collection('decoded_emails')
  .where('user_id', '==', user_id)
  .limit(20)
  .get();

// Then sort in JavaScript
const emails = snapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .sort((a, b) => b.created_at.toDate() - a.created_at.toDate());
```

However, creating the index is the recommended approach for better performance. 