// Clear Gmail Tokens Script
// This script clears Gmail tokens so you can go through the first-time onboarding flow again

const admin = require('firebase-admin');

// Initialize Firebase Admin (same as in index.cjs)
let db;

try {
  // Try to initialize with service account file first
  const serviceAccount = require('./homeops-sa-key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase initialized with service account file');
} catch (error) {
  console.log('ℹ️ Service account file not found, trying environment variables...');
  
  // Initialize with environment variables
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || 'homeops-web',
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    })
  });
  console.log('✅ Firebase initialized with environment variables');
}

db = admin.firestore();

async function clearGmailTokens() {
  try {
    const userId = 'test_user'; // The user ID used in development
    
    console.log(`🗑️ Clearing Gmail tokens for user: ${userId}`);
    
    // 1. Delete Gmail tokens
    const tokenDocRef = db.collection('gmail_tokens').doc(userId);
    await tokenDocRef.delete();
    console.log('✅ Gmail tokens deleted');
    
    // 2. Delete decoded emails for this user
    const decodedEmailsSnapshot = await db.collection('decoded_emails')
      .where('user_id', '==', userId)
      .get();
    
    if (!decodedEmailsSnapshot.empty) {
      const batch = db.batch();
      decodedEmailsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`✅ Deleted ${decodedEmailsSnapshot.size} decoded emails`);
    } else {
      console.log('ℹ️ No decoded emails found to delete');
    }
    
    console.log('🎉 Successfully cleared all Gmail data!');
    console.log('📝 You can now go through the first-time onboarding flow again.');
    console.log('🔗 Visit your app and click "Connect Gmail" to start fresh.');
    
  } catch (error) {
    console.error('❌ Error clearing Gmail tokens:', error);
    process.exit(1);
  }
}

// Run the script
clearGmailTokens(); 