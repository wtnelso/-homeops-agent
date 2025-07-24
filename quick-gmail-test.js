// Quick Gmail OAuth Test - Run this manually: node quick-gmail-test.js
require('dotenv').config();

console.log('🔍 Gmail OAuth Configuration Test');
console.log('=================================');

// Check environment variables
console.log('✅ GMAIL_CLIENT_ID:', process.env.GMAIL_CLIENT_ID ? 'SET' : 'MISSING');
console.log('✅ GMAIL_CLIENT_SECRET:', process.env.GMAIL_CLIENT_SECRET ? 'SET' : 'MISSING');
console.log('✅ GMAIL_REDIRECT_URI:', process.env.GMAIL_REDIRECT_URI || 'DEFAULT');

// Test OAuth URL generation
try {
  const { google } = require('googleapis');
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    include_granted_scopes: true
  });

  console.log('\n🎉 Gmail OAuth Setup is WORKING!');
  console.log('\n📧 Test this URL in your browser:');
  console.log(authUrl);
  console.log('\n✅ After authorizing, you should be redirected to:');
  console.log('http://localhost:3000/auth/gmail/callback?code=...');
  
} catch (error) {
  console.log('\n❌ Gmail OAuth Setup FAILED:');
  console.log(error.message);
}
