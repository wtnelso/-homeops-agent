// Check Gmail Status Script
// This script checks the current Gmail token status in Firebase

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

async function checkGmailStatus() {
  try {
    console.log('🔍 Checking Gmail token status...');
    
    // Get user email from command line argument or prompt
    const userEmail = process.argv[2];
    if (!userEmail) {
      console.log('❌ Please provide your email address as an argument:');
      console.log('   node check-gmail-status.js your-email@example.com');
      return;
    }
    
    console.log('🔍 Checking tokens for email:', userEmail);
    
    // Check for user's email token
    const userToken = await db.collection('gmail_tokens').doc(userEmail).get();
    
    if (userToken.exists) {
      const tokenData = userToken.data();
      const now = new Date();
      const expiryDate = tokenData.expiry_date ? new Date(tokenData.expiry_date) : null;
      const isExpired = expiryDate ? now > expiryDate : true;
      
      console.log('✅ Token found for your email');
      console.log('📋 Token details:');
      console.log('  - Has Access Token:', !!tokenData.access_token);
      console.log('  - Has Refresh Token:', !!tokenData.refresh_token);
      console.log('  - Expiry Date:', expiryDate ? expiryDate.toISOString() : 'No expiry date');
      console.log('  - Is Expired:', isExpired);
      console.log('  - Created At:', tokenData.created_at ? tokenData.created_at.toDate().toISOString() : 'Unknown');
      console.log('  - Scopes:', tokenData.scopes || 'Unknown');
      
      if (isExpired) {
        console.log('❌ Token is expired - you need to reconnect Gmail');
        console.log('💡 Solution: Visit https://homeops-agent.onrender.com and click "Reconnect Gmail"');
      } else {
        console.log('✅ Token is valid and not expired');
        console.log('💡 If you\'re still having issues, try reconnecting anyway');
      }
    } else {
      console.log('❌ No token found for your email');
      console.log('💡 Solution: Visit https://homeops-agent.onrender.com and connect Gmail');
    }
    
    // Also check test_user for comparison
    const testUserToken = await db.collection('gmail_tokens').doc('test_user').get();
    if (testUserToken.exists) {
      console.log('⚠️ Found test_user token (this should be cleaned up)');
    }
    
    // Check total tokens in database
    const allTokens = await db.collection('gmail_tokens').get();
    console.log(`📊 Total tokens in database: ${allTokens.size}`);
    
    if (allTokens.size > 0) {
      console.log('📋 All token IDs:');
      allTokens.forEach(doc => {
        console.log(`  - ${doc.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking Gmail status:', error);
  }
}

checkGmailStatus().then(() => {
  console.log('🏁 Status check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Status check failed:', error);
  process.exit(1);
}); 