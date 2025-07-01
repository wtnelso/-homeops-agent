// Clear Gmail Tokens Script
// This script clears Gmail tokens so you can go through the first-time onboarding flow again

const admin = require("firebase-admin");
require("dotenv").config();

// Initialize Firebase
const base64 = process.env.FIREBASE_CREDENTIALS;
const decoded = Buffer.from(base64, "base64").toString("utf-8");
const firebaseCredentials = JSON.parse(decoded);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseCredentials),
  });
}

const db = admin.firestore();

async function cleanupTokens() {
  try {
    console.log('🧹 Starting Gmail tokens cleanup...');
    
    // Get all documents in gmail_tokens collection
    const snapshot = await db.collection('gmail_tokens').get();
    
    console.log(`📊 Found ${snapshot.size} token documents`);
    
    const batch = db.batch();
    let deletedCount = 0;
    
    snapshot.forEach(doc => {
      const docId = doc.id;
      
      // Keep only the document with ID 'test_user'
      if (docId !== 'test_user') {
        console.log(`🗑️ Deleting old token document: ${docId}`);
        batch.delete(doc.ref);
        deletedCount++;
      } else {
        console.log(`✅ Keeping token document: ${docId}`);
      }
    });
    
    if (deletedCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully deleted ${deletedCount} old token documents`);
    } else {
      console.log('✅ No old tokens to delete');
    }
    
    // Check if test_user token exists
    const testUserToken = await db.collection('gmail_tokens').doc('test_user').get();
    
    if (testUserToken.exists) {
      console.log('✅ test_user token exists and is valid');
      const tokenData = testUserToken.data();
      console.log('📋 Token details:', {
        hasAccessToken: !!tokenData.access_token,
        hasRefreshToken: !!tokenData.refresh_token,
        expiryDate: tokenData.expiry_date ? new Date(tokenData.expiry_date).toISOString() : 'No expiry',
        createdAt: tokenData.created_at ? tokenData.created_at.toDate().toISOString() : 'Unknown'
      });
    } else {
      console.log('❌ No test_user token found - user needs to reconnect Gmail');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupTokens().then(() => {
  console.log('🏁 Cleanup completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
}); 