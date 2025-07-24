console.log('🚀 HomeOps Server with Email Intelligence Starting...');

try {
  console.log('1. Loading basic dependencies...');
  const express = require('express');
  const path = require('path');
  
  console.log('2. Loading Google APIs...');
  const { google } = require('googleapis');
  
  console.log('3. Loading OpenAI...');
  const OpenAI = require('openai');
  
  console.log('4. Loading environment...');
  require('dotenv').config();
  
  console.log('5. Loading Firebase Admin...');
  const admin = require('firebase-admin');
  let db = null;
  
  console.log('6. Initializing Firebase...');
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
    // Create mock db
    db = {
      collection: () => ({
        doc: () => ({
          set: () => Promise.resolve(),
          get: () => Promise.resolve({ exists: false, data: () => null })
        })
      })
    };
  }
  
  console.log('7. Loading Email Intelligence services...');
  const GmailSyncEngine = require('./services/gmail-sync-engine');
  const EmailDecoderEngine = require('./services/email-decoder-engine');
  const EmailIntelligenceFirestore = require('./services/email-intelligence-firestore');
  
  console.log('8. Loading d2c brands data...');
  const { d2cBrands, amazonAlternatives } = require('./data/d2c-brands');
  
  console.log('9. Creating Express app...');
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  console.log('10. Setting up middleware...');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.static('public'));
  
  console.log('11. Setting up routes...');
  
  // Basic routes
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  // Onboarding Flow Routes
  app.get('/landing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
  });
  
  app.get('/onboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'onboard.html'));
  });
  
  app.get('/scan', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'scan.html'));
  });
  
  app.get('/calibrate', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'calibrate.html'));
  });
  
  // Onboarding-specific Gmail auth route
  app.get('/auth/gmail-onboarding', async (req, res) => {
    try {
      const gmailSync = new GmailSyncEngine();
      await gmailSync.initialize();
      
      let authUrl = await gmailSync.getAuthUrl();
      
      // Add onboarding flag to state
      const urlObj = new URL(authUrl);
      urlObj.searchParams.set('state', JSON.stringify({ isOnboarding: true }));
      authUrl = urlObj.toString();
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('Gmail onboarding auth error:', error);
      res.status(500).json({ error: 'Gmail auth failed', details: error.message });
    }
  });
  
  app.get('/test', (req, res) => {
    res.json({ 
      status: 'HomeOps Server with Email Intelligence',
      features: ['Chat Agent (Coming)', 'Calendar (Coming)', 'Email Intelligence ✅'],
      timestamp: new Date().toISOString()
    });
  });
  
  // Gmail Auth Routes
  app.get('/auth/gmail', async (req, res) => {
    try {
      const isOnboarding = req.query.isOnboarding === 'true';
      
      const gmailSync = new GmailSyncEngine();
      await gmailSync.initialize(); // Initialize the OAuth client first
      
      let authUrl = await gmailSync.getAuthUrl();
      
      // Add onboarding parameter to the state or redirect URL
      if (isOnboarding) {
        const urlObj = new URL(authUrl);
        urlObj.searchParams.set('state', JSON.stringify({ isOnboarding: true }));
        authUrl = urlObj.toString();
      }
      
      res.redirect(authUrl);
    } catch (error) {
      console.error('Gmail auth error:', error);
      res.status(500).json({ error: 'Gmail auth failed', details: error.message });
    }
  });
  
  app.get('/auth/gmail/callback', async (req, res) => {
    try {
      const { code, state } = req.query;
      
      // Check for onboarding in multiple ways
      let isOnboarding = req.query.isOnboarding === 'true';
      
      // Also check the state parameter
      if (state) {
        try {
          const stateObj = JSON.parse(state);
          if (stateObj.isOnboarding) {
            isOnboarding = true;
          }
        } catch (e) {
          // State parsing failed, ignore
        }
      }
      
      if (!code) {
        throw new Error('No authorization code received');
      }
      
      const gmailSync = new GmailSyncEngine();
      await gmailSync.initialize(); // Initialize first
      
      console.log('🔄 Exchanging code for tokens...');
      const tokenResult = await gmailSync.exchangeCodeForTokens(code);
      
      if (!tokenResult.success) {
        throw new Error(`Token exchange failed: ${tokenResult.error}`);
      }
      
      console.log('🔄 Testing Gmail connection...');
      const connectionTest = await gmailSync.testConnection();
      
      if (connectionTest.success) {
        console.log(`✅ Gmail connected for ${connectionTest.email}`);
        
        if (isOnboarding) {
          console.log('🔄 Onboarding flow detected - redirecting to scan page');
          // Redirect to scanning animation page in onboarding flow
          res.redirect('/scan?gmail_connected=true');
        } else {
          console.log('🔄 Regular OAuth flow - showing success page');
          // Regular OAuth completion
          res.send(`
            <h2>✅ Gmail Successfully Connected!</h2>
            <p>Email: ${connectionTest.email}</p>
            <p>Total Messages: ${connectionTest.totalMessages}</p>
            <p><strong>Next steps:</strong></p>
            <ul>
              <li>Your Gmail is now connected for Email Intelligence</li>
              <li>You can now scan emails to build your brand database</li>
              <li><a href="/">Return to Dashboard</a></li>
            </ul>
          `);
        }
      } else {
        throw new Error(`Connection test failed: ${connectionTest.error}`);
      }
    } catch (error) {
      console.error('Gmail callback error:', error);
      res.status(500).send(`
        <h2>❌ Gmail Connection Failed</h2>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><a href="/auth/gmail">Try Again</a></p>
        <p><a href="/">Return to Dashboard</a></p>
      `);
    }
  });
  
  // Email Intelligence API
  app.post('/api/complete-email-intelligence', async (req, res) => {
    try {
      const { maxEmails = 500, userId = 'demo-user' } = req.body;
      
      // Step 1: Gmail Sync
      const gmailSync = new GmailSyncEngine();
      const syncResult = await gmailSync.syncEmails(maxEmails);
      
      // Step 2: Email Decoding
      const decoder = new EmailDecoderEngine();
      const decodingResult = await decoder.processEmailBatch(syncResult.emails);
      
      // Step 3: Firebase Storage
      const firestore = new EmailIntelligenceFirestore();
      const storageResult = await firestore.storeUserEmailSignals(userId, decodingResult);
      
      res.json({
        success: true,
        message: 'Email Intelligence Pipeline completed',
        data: {
          emailsProcessed: syncResult.emails.length,
          brandsFound: decodingResult.brandSignals.length,
          completedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Email intelligence error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoints for onboarding scanning process
  app.post('/api/start-email-scan', async (req, res) => {
    try {
      console.log('🔄 Starting email scan for onboarding...');
      
      const gmailSync = new GmailSyncEngine();
      await gmailSync.initialize();
      
      // Test connection first
      const connectionTest = await gmailSync.testConnection();
      if (!connectionTest.success) {
        throw new Error('Gmail not connected');
      }
      
      res.json({ 
        success: true, 
        message: 'Email scan started',
        totalMessages: connectionTest.totalMessages 
      });
      
      // Start background email decoding (don't await this - let it run async)
      setTimeout(async () => {
        try {
          console.log('🧠 Starting email decoder engine...');
          const decoder = new EmailDecoderEngine();
          await decoder.decodeAllEmails();
          console.log('✅ Email decoding complete!');
        } catch (error) {
          console.error('❌ Email decoding error:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Email scan start error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/scan-progress', async (req, res) => {
    try {
      // In a real implementation, you'd track progress in memory or database
      // For now, simulate progress based on time elapsed
      const mockProgress = {
        tasksCompleted: Math.min(5, Math.floor(Date.now() / 10000) % 6),
        totalTasks: 5,
        currentTask: 'Analyzing email patterns...',
        estimatedTimeRemaining: 120 // seconds
      };
      
      res.json({ success: true, progress: mockProgress });
    } catch (error) {
      console.error('Progress check error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API endpoint for calibration ratings
  app.post('/api/calibration-rating', async (req, res) => {
    try {
      const { cardId, rating, userId = 'demo-user' } = req.body;
      
      console.log(`📊 User rating: Card ${cardId} = ${rating} (${rating === 'up' ? '👍' : '👎'})`);
      
      // In a real implementation, you'd store this in your database
      // For now, just log it
      const ratingData = {
        userId,
        cardId,
        rating,
        timestamp: new Date().toISOString()
      };
      
      // You could store this in Firebase here
      // await db.collection('user_calibrations').doc(userId).collection('ratings').add(ratingData);
      
      res.json({ 
        success: true, 
        message: 'Rating saved',
        data: ratingData
      });
    } catch (error) {
      console.error('Calibration rating error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  console.log('12. Starting server...');
  const server = app.listen(PORT, () => {
    console.log(`✅ HomeOps Server running at http://localhost:${PORT}`);
    console.log('📧 Email Intelligence ready!');
    console.log('🔗 Gmail OAuth: http://localhost:3000/auth/gmail');
  });
  
} catch (error) {
  console.error('❌ Startup error:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}
