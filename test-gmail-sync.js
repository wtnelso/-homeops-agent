/**
 * Test Gmail Sync Engine functionality
 */

const GmailSyncEngine = require('./services/gmail-sync-engine');

async function testGmailSync() {
  console.log('🧪 Testing Gmail Sync Engine...');
  
  const gmailSync = new GmailSyncEngine();
  
  // Test initialization
  const initialized = await gmailSync.initialize();
  console.log('Initialization:', initialized ? '✅ Success' : '❌ Failed');
  
  // Test auth URL generation
  try {
    const authUrl = gmailSync.getAuthUrl();
    console.log('Auth URL generation: ✅ Success');
    console.log('Sample URL:', authUrl.substring(0, 50) + '...');
  } catch (error) {
    console.log('Auth URL generation: ❌ Failed -', error.message);
  }
  
  console.log('🎉 Gmail Sync Engine test completed!');
}

testGmailSync().catch(console.error);
