// Simple server test with error catching
console.log('🧪 Testing server startup with detailed error reporting...');

try {
  console.log('1. Loading Express...');
  const express = require('express');
  console.log('✅ Express loaded');

  console.log('2. Loading path...');
  const path = require('path');
  console.log('✅ Path loaded');

  console.log('3. Loading dotenv...');
  require('dotenv').config();
  console.log('✅ Dotenv loaded');

  console.log('4. Loading Google APIs...');
  const { google } = require('googleapis');
  console.log('✅ Google APIs loaded');

  console.log('5. Loading OpenAI...');
  const OpenAI = require('openai');
  console.log('✅ OpenAI loaded');

  console.log('6. Loading Firebase Admin...');
  const admin = require('firebase-admin');
  console.log('✅ Firebase Admin loaded');

  console.log('7. Loading custom services...');
  const CommerceIntelligence = require('./services/commerce-intelligence');
  console.log('✅ Commerce Intelligence loaded');

  const GmailSyncEngine = require('./services/gmail-sync-engine');
  console.log('✅ Gmail Sync Engine loaded');

  const EmailDecoderEngine = require('./services/email-decoder-engine');
  console.log('✅ Email Decoder Engine loaded');

  const EmailIntelligenceFirestore = require('./services/email-intelligence-firestore');
  console.log('✅ Email Intelligence Firestore loaded');

  console.log('8. Creating Express app...');
  const app = express();
  console.log('✅ Express app created');

  console.log('9. Initializing services...');
  const commerceIntelligence = new CommerceIntelligence();
  console.log('✅ Commerce Intelligence initialized');

  const gmailSyncEngine = new GmailSyncEngine();
  console.log('✅ Gmail Sync Engine initialized');

  const emailDecoder = new EmailDecoderEngine();
  console.log('✅ Email Decoder initialized');

  console.log('10. Setting up middleware...');
  app.use(express.json());
  app.use(express.static('public'));
  console.log('✅ Middleware set up');

  console.log('11. Starting server...');
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🎉 Test server running at http://localhost:${PORT}`);
    console.log('✅ All components loaded successfully!');
  });

} catch (error) {
  console.error('❌ Server startup failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
