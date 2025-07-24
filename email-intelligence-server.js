const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const OpenAI = require('openai');
const { d2cBrands, amazonAlternatives } = require('./data/d2c-brands');
require('dotenv').config();

// Firebase Admin Setup
const admin = require('firebase-admin');
let db = null;

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
  // Continue without Firebase - create mock db object
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

// Load Email Intelligence Services
const GmailSyncEngine = require('./services/gmail-sync-engine');
const EmailDecoderEngine = require('./services/email-decoder-engine');
const EmailIntelligenceFirestore = require('./services/email-intelligence-firestore');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Basic routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/test', (req, res) => {
  res.json({ 
    status: 'Email Intelligence Server Running!',
    timestamp: new Date().toISOString(),
    services: ['Gmail Sync', 'Email Decoder', 'Firebase Storage']
  });
});

// Gmail Auth Routes
app.get('/auth/gmail', async (req, res) => {
  try {
    const gmailSync = new GmailSyncEngine();
    const authUrl = await gmailSync.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Gmail auth initialization error:', error);
    res.status(500).json({ error: 'Gmail auth failed', details: error.message });
  }
});

app.get('/auth/gmail/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const gmailSync = new GmailSyncEngine();
    const tokens = await gmailSync.exchangeCodeForTokens(code);
    
    // Test connection
    const connectionTest = await gmailSync.testConnection();
    if (connectionTest.success) {
      console.log(`✅ Gmail connected for ${connectionTest.email}`);
      console.log(`📧 Total messages available: ${connectionTest.totalMessages}`);
      
      res.send(`
        <h2>✅ Gmail Successfully Connected!</h2>
        <p>Email: ${connectionTest.email}</p>
        <p>Total Messages: ${connectionTest.totalMessages}</p>
        <p><a href="/">Return to Dashboard</a></p>
      `);
    } else {
      throw new Error('Connection test failed');
    }
  } catch (error) {
    console.error('Gmail auth callback error:', error);
    res.status(500).send(`<h2>❌ Gmail Connection Failed</h2><p>${error.message}</p>`);
  }
});

// Email Intelligence API Routes
app.post('/api/gmail-sync', async (req, res) => {
  try {
    const { maxEmails = 500 } = req.body;
    console.log(`🔄 Starting Gmail sync for ${maxEmails} emails...`);
    
    const gmailSync = new GmailSyncEngine();
    const result = await gmailSync.syncEmails(maxEmails);
    
    res.json({
      success: true,
      message: `Successfully synced ${result.emails.length} emails`,
      data: {
        totalEmails: result.emails.length,
        promotions: result.emails.filter(e => e.labels?.includes('CATEGORY_PROMOTIONS')).length,
        primary: result.emails.filter(e => e.labels?.includes('CATEGORY_PRIMARY')).length,
        syncedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Gmail sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Gmail sync failed', 
      details: error.message 
    });
  }
});

app.post('/api/decode-emails', async (req, res) => {
  try {
    const { emails } = req.body;
    console.log(`🧠 Decoding ${emails.length} emails for brand signals...`);
    
    const decoder = new EmailDecoderEngine();
    const result = await decoder.processEmailBatch(emails);
    
    res.json({
      success: true,
      message: `Successfully decoded ${result.processedEmails.length} emails`,
      data: {
        totalProcessed: result.processedEmails.length,
        brandsFound: result.brandSignals.length,
        categories: result.categoryBreakdown,
        topBrands: result.brandSignals.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Email decoding error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Email decoding failed', 
      details: error.message 
    });
  }
});

app.post('/api/complete-email-intelligence', async (req, res) => {
  try {
    const { maxEmails = 500, userId = 'demo-user' } = req.body;
    console.log(`🔄 Step 1: Syncing ${maxEmails} emails from Gmail...`);
    
    // Step 1: Gmail Sync
    const gmailSync = new GmailSyncEngine();
    const syncResult = await gmailSync.syncEmails(maxEmails);
    
    // Step 2: Email Decoding
    console.log(`🧠 Step 2: Decoding ${syncResult.emails.length} emails...`);
    const decoder = new EmailDecoderEngine();
    const decodingResult = await decoder.processEmailBatch(syncResult.emails);
    
    // Step 3: Firebase Storage
    console.log(`💾 Step 3: Storing brand intelligence in Firebase...`);
    const firestore = new EmailIntelligenceFirestore();
    const storageResult = await firestore.storeUserEmailSignals(userId, decodingResult);
    
    res.json({
      success: true,
      message: 'Complete Email Intelligence Pipeline executed successfully',
      data: {
        step1_sync: {
          totalEmails: syncResult.emails.length,
          promotions: syncResult.emails.filter(e => e.labels?.includes('CATEGORY_PROMOTIONS')).length
        },
        step2_decode: {
          brandsFound: decodingResult.brandSignals.length,
          categories: decodingResult.categoryBreakdown
        },
        step3_store: {
          userProfileUpdated: storageResult.userProfileUpdated,
          globalBrandsUpdated: storageResult.globalBrandsUpdated
        },
        completedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Complete email intelligence error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Email Intelligence Pipeline failed', 
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Email Intelligence Server running at http://localhost:${PORT}`);
  console.log('📊 Available endpoints:');
  console.log('   GET  /auth/gmail - Start Gmail OAuth');
  console.log('   POST /api/gmail-sync - Sync emails from Gmail');
  console.log('   POST /api/decode-emails - Decode emails for brand signals');
  console.log('   POST /api/complete-email-intelligence - Full pipeline');
  console.log('   GET  /test - Server status check');
});
