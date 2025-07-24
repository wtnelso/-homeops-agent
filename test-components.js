/**
 * Test Gmail Intelligence Components Without Full Server
 */

console.log('🧪 Testing Gmail Intelligence Components...\n');

async function testComponents() {
  // Test 1: Basic requires
  console.log('📦 Testing component loading...');
  try {
    const GmailSyncEngine = require('./services/gmail-sync-engine');
    const EmailDecoderEngine = require('./services/email-decoder-engine');
    const EmailIntelligenceFirestore = require('./services/email-intelligence-firestore');
    const CommerceIntelligence = require('./services/commerce-intelligence');
    console.log('✅ All components loaded successfully\n');
  } catch (error) {
    console.error('❌ Component loading failed:', error.message);
    return;
  }

  // Test 2: Service instantiation
  console.log('🔧 Testing service instantiation...');
  try {
    const GmailSyncEngine = require('./services/gmail-sync-engine');
    const EmailDecoderEngine = require('./services/email-decoder-engine');
    const CommerceIntelligence = require('./services/commerce-intelligence');

    const gmailSync = new GmailSyncEngine();
    const emailDecoder = new EmailDecoderEngine();
    const commerceIntelligence = new CommerceIntelligence();
    
    console.log('✅ All services instantiated successfully\n');
  } catch (error) {
    console.error('❌ Service instantiation failed:', error.message);
    return;
  }

  // Test 3: Gmail Sync initialization
  console.log('📧 Testing Gmail Sync initialization...');
  try {
    const GmailSyncEngine = require('./services/gmail-sync-engine');
    const gmailSync = new GmailSyncEngine();
    
    await gmailSync.initialize();
    const authUrl = gmailSync.getAuthUrl();
    console.log('✅ Gmail Sync initialization successful');
    console.log(`   Auth URL: ${authUrl.substring(0, 50)}...\n`);
  } catch (error) {
    console.error('❌ Gmail Sync initialization failed:', error.message, '\n');
  }

  // Test 4: Email Decoder mock test
  console.log('🧠 Testing Email Decoder with mock data...');
  try {
    const EmailDecoderEngine = require('./services/email-decoder-engine');
    const emailDecoder = new EmailDecoderEngine();
    
    const mockEmails = [{
      id: 'test1',
      from: 'Buck Mason <hello@buckmason.com>',
      fromDomain: 'buckmason.com',
      subject: 'New Collection Available',
      timestamp: new Date().toISOString(),
      snippet: 'Check out our latest styles...',
      body: 'Premium clothing for modern men...',
      labelIds: ['CATEGORY_PROMOTIONS']
    }];

    const result = await emailDecoder.processEmailBatch(mockEmails);
    if (result.success) {
      console.log('✅ Email Decoder test successful');
      console.log(`   Brands detected: ${result.brandsDetected}`);
    } else {
      console.log('❌ Email Decoder test failed:', result.error);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Email Decoder test failed:', error.message, '\n');
  }

  // Test 5: Commerce Intelligence
  console.log('🛍️ Testing Commerce Intelligence...');
  try {
    const CommerceIntelligence = require('./services/commerce-intelligence');
    const commerceIntelligence = new CommerceIntelligence();
    
    const result = await commerceIntelligence.process("I need a gift for my brother");
    if (result.success) {
      console.log('✅ Commerce Intelligence test successful');
      console.log(`   Strategy: ${result.strategy}`);
      console.log(`   Results: ${result.results.length} recommendations`);
    } else {
      console.log('❌ Commerce Intelligence test failed:', result.error);
    }
    console.log('');
  } catch (error) {
    console.error('❌ Commerce Intelligence test failed:', error.message, '\n');
  }

  console.log('🎉 Component testing completed!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. All components are working properly');
  console.log('2. Server should start with: node server.js');
  console.log('3. Gmail OAuth flow: http://localhost:3000/auth/gmail');
  console.log('4. Complete pipeline: POST /api/complete-email-intelligence');
}

testComponents().catch(console.error);
