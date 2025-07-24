// Test Gmail OAuth Setup
const GmailSyncEngine = require('./services/gmail-sync-engine');

async function testGmailSetup() {
  console.log('🔍 Testing Gmail OAuth Setup...');
  
  try {
    const gmailSync = new GmailSyncEngine();
    console.log('1. Creating Gmail Sync Engine... ✅');
    
    const initialized = await gmailSync.initialize();
    console.log('2. Initializing Gmail OAuth... ✅');
    
    const authUrl = gmailSync.getAuthUrl();
    console.log('3. Generating OAuth URL... ✅');
    console.log('📧 Gmail OAuth URL:', authUrl);
    
    console.log('\n🎉 Gmail OAuth setup is working!');
    console.log('🔗 Visit this URL to authorize HomeOps:');
    console.log(authUrl);
    
  } catch (error) {
    console.error('❌ Gmail OAuth setup failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testGmailSetup();
