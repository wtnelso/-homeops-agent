const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

// Initialize Firebase Admin SDK
try {
  const serviceAccountPath = path.join(__dirname, "..", "homeops-sa-key.json");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase initialized successfully.");
  }
} catch (err) {
  console.error("❌ Firebase init failed. Make sure 'homeops-sa-key.json' is in the root directory.", err.message);
  process.exit(1);
}

const db = admin.firestore();
const USER_ID_TO_DELETE = "user_123";
const BATCH_SIZE = 400;

/**
 * Deletes a collection of documents in batches.
 */
async function deleteQueryBatch(db, query, resolve, reject) {
  try {
    const snapshot = await query.get();

    if (snapshot.size === 0) {
      resolve();
      return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
      deleteQueryBatch(db, query, resolve, reject);
    });
  } catch(err) {
    console.error(`Error in batch delete: ${err.message}`);
    reject(err);
  }
}

async function bulkDelete(collectionName, userId) {
  const collectionRef = db.collection(collectionName);
  const query = collectionRef.where('user_id', '==', userId).limit(BATCH_SIZE);

  console.log(`Starting deletion for user '${userId}' in collection '${collectionName}'...`);
  return new Promise((resolve, reject) => deleteQueryBatch(db, query, resolve, reject))
    .then(() => {
      console.log(`✅ Finished deleting documents from '${collectionName}'.`);
    })
    .catch(err => {
      console.error(`❌ Failed to delete documents from ${collectionName}.`, err);
    });
}

async function run() {
  console.log(`This script will delete all 'events' and 'messages' for user_id: ${USER_ID_TO_DELETE}`);
  
  await bulkDelete('events', USER_ID_TO_DELETE);
  await bulkDelete('messages', USER_ID_TO_DELETE);

  console.log('🎉 Bulk deletion complete.');
  process.exit(0);
}

run().catch(error => {
    console.error("❌ An error occurred during bulk deletion:", error);
    process.exit(1);
}); 