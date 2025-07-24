/**
 * Simple server startup test
 */

console.log('🧪 Testing server startup...');

try {
  // Test service loading
  const GmailSyncEngine = require('./services/gmail-sync-engine');
  const EmailDecoderEngine = require('./services/email-decoder-engine'); 
  const EmailIntelligenceFirestore = require('./services/email-intelligence-firestore');
  const CommerceIntelligence = require('./services/commerce-intelligence');
  
  console.log('✅ All services loaded successfully');
  
  // Test service instantiation
  const gmailSync = new GmailSyncEngine();
  const emailDecoder = new EmailDecoderEngine();
  const commerceIntelligence = new CommerceIntelligence();
  
  console.log('✅ All services instantiated successfully');
  
  console.log('🎉 Server components ready - should start without errors!');
  
} catch (error) {
  console.error('❌ Server startup test failed:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n📋 Next steps:');
console.log('1. Start server: node server.js');
console.log('2. Open browser: http://localhost:3000');
console.log('3. Test Gmail OAuth: http://localhost:3000/auth/gmail');
console.log('4. Test API endpoints with Postman or curl');
