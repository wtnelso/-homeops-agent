console.log('🚀 Starting Email Intelligence Server...');

try {
  console.log('1. Loading Express...');
  const express = require('express');
  
  console.log('2. Loading path...');
  const path = require('path');
  
  console.log('3. Loading fetch...');
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
  console.log('4. Loading googleapis...');
  const { google } = require('googleapis');
  
  console.log('5. Loading OpenAI...');
  const OpenAI = require('openai');
  
  console.log('6. Loading d2c-brands...');
  const { d2cBrands, amazonAlternatives } = require('./data/d2c-brands');
  
  console.log('7. Loading dotenv...');
  require('dotenv').config();
  
  console.log('8. Loading Firebase Admin...');
  const admin = require('firebase-admin');
  let db = null;
  
  console.log('9. Initializing Firebase...');
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert('./homeops-web-firebase-adminsdk-fbsvc-0a737a8eee.json'),
        databaseURL: "https://homeops-web-default-rtdb.firebaseio.com/"
      });
    }
    db = admin.firestore();
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.log('⚠️ Firebase Admin initialization failed:', error.message);
    db = {
      collection: () => ({
        doc: () => ({
          set: () => Promise.resolve(),
          get: () => Promise.resolve({ exists: false, data: () => null }),
          delete: () => Promise.resolve()
        }),
        where: () => ({
          get: () => Promise.resolve({ docs: [] })
        }),
        get: () => Promise.resolve({ docs: [] }),
        add: () => Promise.resolve({ id: 'mock-id' })
      })
    };
  }
  
  console.log('10. Loading services...');
  const CommerceIntelligence = require('./services/commerce-intelligence');
  const GmailSyncEngine = require('./services/gmail-sync-engine');
  const EmailDecoderEngine = require('./services/email-decoder-engine');
  const EmailIntelligenceFirestore = require('./services/email-intelligence-firestore');
  
  console.log('11. Creating Express app...');
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  console.log('12. Setting up middleware...');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.static('public'));
  
  console.log('13. Setting up basic route...');
  app.get('/test', (req, res) => {
    res.json({ status: 'Email Intelligence Server is running!' });
  });
  
  console.log('14. Starting server...');
  app.listen(PORT, () => {
    console.log(`✅ Email Intelligence Server running at http://localhost:${PORT}`);
    console.log('📊 All systems ready!');
  });
  
} catch (error) {
  console.error('❌ Server startup failed:', error);
  console.error('Stack trace:', error.stack);
}
