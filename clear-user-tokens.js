// Clear User Gmail Tokens Script
// This script clears Gmail tokens for a specific user email

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

async function clearUserTokens() {
  try {
    // Get user email from command line argument
    const userEmail = process.argv[2];
    if (!userEmail) {
      console.log('❌ Please provide your email address as an argument:');
      console.log('   node clear-user-tokens.js your-email@example.com');
      return;
    }
    
    console.log('🧹 Clearing Gmail tokens for:', userEmail);
    
    // Delete Gmail tokens for this user
    await db.collection('gmail_tokens').doc(userEmail).delete();
    console.log('✅ Deleted Gmail tokens for:', userEmail);
    
    // Also clear any decoded emails for this user
    const decodedEmailsSnapshot = await db.collection('decoded_emails')
      .where('user_id', '==', userEmail)
      .get();
    
    if (!decodedEmailsSnapshot.empty) {
      const batch = db.batch();
      decodedEmailsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${decodedEmailsSnapshot.size} decoded emails for:`, userEmail);
    } else {
      console.log('ℹ️ No decoded emails found for:', userEmail);
    }
    
    // Check what's left in the database
    const allTokens = await db.collection('gmail_tokens').get();
    console.log(`📊 Total tokens remaining in database: ${allTokens.size}`);
    
    if (allTokens.size > 0) {
      console.log('📋 Remaining token IDs:');
      allTokens.forEach(doc => {
        console.log(`  - ${doc.id}`);
      });
    }
    
    console.log('🎯 You can now go back to https://homeops-agent.onrender.com and reconnect Gmail');
    
  } catch (error) {
    console.error('❌ Error clearing user tokens:', error);
  }
}

clearUserTokens().then(() => {
  console.log('🏁 Token clearing completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Token clearing failed:', error);
  process.exit(1);
}); 