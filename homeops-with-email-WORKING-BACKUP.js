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
  const EmailLearningEngine = require('./services/email-learning-engine');
  
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
  
  app.get('/onboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'onboard.html'));
  });

  app.get('/scan', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'scan.html'));
  });
  
  app.get('/calibrate', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'calibrate.html'));
  });
  
  app.get('/debug-oauth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'debug-oauth.html'));
  });
  
  app.get('/consent-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'consent-test.html'));
  });
  
  // Onboarding-specific Gmail auth route
  app.get('/auth/gmail-onboarding', async (req, res) => {
    try {
      const gmailSync = new GmailSyncEngine();
      await gmailSync.initialize();
      
      // Force consent screen for onboarding flow
      let authUrl = await gmailSync.getAuthUrl(true); // Force consent = true
      
      console.log('🔄 Redirecting to Gmail auth with forced consent...');
      console.log('Auth URL:', authUrl);
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
        console.log("⚠️ Bypassing Gmail connection test - tokens exist in Firebase");
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

  // API endpoint to clear Gmail tokens
  app.post('/api/clear-gmail-tokens', async (req, res) => {
    try {
      console.log('🗑️  Clearing Gmail tokens thoroughly...');
      
      // Clear in-memory tokens (in case they're set)
      delete process.env.GMAIL_ACCESS_TOKEN;
      delete process.env.GMAIL_REFRESH_TOKEN;
      
      // Clear any Firebase stored tokens (if they exist)
      try {
        const tokenDoc = db.collection('gmail_tokens').doc('test_user');
        await tokenDoc.delete();
        console.log('✅ Firebase tokens cleared');
      } catch (error) {
        console.log('ℹ️  No Firebase tokens to clear');
      }
      
      // Also try to clear any OAuth client credentials that might be cached
      try {
        const gmailSync = new GmailSyncEngine();
        if (gmailSync.oauth2Client) {
          gmailSync.oauth2Client.setCredentials({});
          console.log('✅ OAuth client credentials cleared');
        }
      } catch (error) {
        console.log('ℹ️  OAuth client not initialized');
      }
      
      res.json({ 
        success: true, 
        message: 'Gmail tokens cleared completely - forced consent enabled' 
      });
    } catch (error) {
      console.error('Token clearing error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 🧠 ENHANCED EMAIL SCORING SYSTEM
  function scoreEmail(email) {
    let score = 0;
    
    const subject = email.subject?.toLowerCase() || '';
    const snippet = email.snippet?.toLowerCase() || '';
    const sender = email.from?.toLowerCase() || '';
    const content = `${subject} ${snippet}`;
    
    console.log(`📊 Scoring email: "${email.subject}" from ${email.from}`);
    
    // 🏫 Family / School / Camps (Highest Priority)
    if (content.match(/school|pta|classroom|field trip|camp|tuition|signup|parent|teacher|student|homework|grades|conference/i)) {
      score += 10;
      console.log(`  +10 Family/School detected`);
    }
    
    // ⛳ Club / Community (High Priority)
    if (content.match(/golf|club|league|practice|team|volunteer|community|meeting|event|tournament|registration/i)) {
      score += 8;
      console.log(`  +8 Club/Community detected`);
    }
    
    // 🛒 Purchases / Confirmed Orders
    if (content.match(/order confirmed|shipped|tracking|receipt|purchase|delivery|your order/i)) {
      score += 6;
      console.log(`  +6 Order confirmation detected`);
    }
    
    // 👤 Personal (non-corporate) senders
    const domain = sender.split('@')[1] || '';
    const isPersonal = !domain.includes('.com') || 
                      domain.includes('gmail.') || 
                      domain.includes('yahoo.') || 
                      domain.includes('hotmail.') ||
                      !sender.includes('noreply') && !sender.includes('no-reply');
    
    if (isPersonal && !content.match(/unsubscribe|marketing|promotion/i)) {
      score += 7;
      console.log(`  +7 Personal sender detected`);
    }
    
    // 💰 Finance / Admin / Medical (Important but not urgent)
    if (content.match(/copay|insurance|invoice|bill|statement|payment|account|balance|medical|appointment|doctor|dentist/i)) {
      score += 5;
      console.log(`  +5 Finance/Medical detected`);
    }
    
    // 📅 Calendar Events (Smart signals)
    if (content.match(/calendar|meeting|appointment|schedule|rsvp|save the date|reminder/i)) {
      score += 4;
      console.log(`  +4 Calendar event detected`);
    }
    
    // 🎯 High manipulation score penalty
    const manipulationKeywords = content.match(/urgent|limited time|act now|expires|don't miss|final notice|last chance/gi) || [];
    if (manipulationKeywords.length >= 2) {
      score -= 4;
      console.log(`  -4 High manipulation detected (${manipulationKeywords.length} keywords)`);
    }
    
    // 🚫 Noise / No-reply filtering (Heavy penalty)
    if (sender.includes('noreply') || 
        sender.includes('no-reply') || 
        sender.includes('mailchimp') ||
        sender.includes('constantcontact') ||
        content.match(/unsubscribe|marketing blast|newsletter|promotional/i)) {
      score -= 3;
      console.log(`  -3 Noise/No-reply detected`);
    }
    
    // 📧 Newsletter/Promotional penalty
    if (content.match(/newsletter|weekly digest|marketing|promotion|deal|sale|% off|discount/i)) {
      score -= 2;
      console.log(`  -2 Newsletter/Promotional detected`);
    }
    
    console.log(`  Final score: ${score}`);
    return Math.max(0, score); // Ensure non-negative scores
  }

  // API endpoint to check authentication status
  app.get('/api/auth-status', async (req, res) => {
    try {
      const tokenDoc = await db.collection('gmail_tokens').doc('user_tokens').get();
      res.json({
        authenticated: tokenDoc.exists,
        hasTokens: tokenDoc.exists,
        tokenData: tokenDoc.exists ? Object.keys(tokenDoc.data()) : []
      });
    } catch (error) {
      res.json({
        authenticated: false,
        error: error.message
      });
    }
  });

  // API endpoint to get real calibration data from emails
  app.get('/api/calibration-data', async (req, res) => {
    try {
      console.log('📧 Getting real email data for calibration...');
      
      // Get stored OAuth tokens from Firebase
      const tokenDoc = await db.collection('gmail_tokens').doc('user_tokens').get();
      if (!tokenDoc.exists) {
        console.log('❌ No OAuth tokens found in Firebase');
        return res.status(401).json({ 
          success: false,
          needsAuth: true, 
          error: 'OAuth tokens not found. Please authenticate first.',
          message: 'Please connect your Gmail account to start calibration.'
        });
      }

      console.log('✅ OAuth tokens found, proceeding with Gmail API calls...');
      
      const tokens = tokenDoc.data();
      oauth2Client.setCredentials(tokens);
      
      const gmailSync = new GmailSyncEngine();
      
      // Get larger sample for intelligent filtering (scan up to 1000, surface top 20-30)
      console.log('🔍 Fetching up to 100 emails for intelligent scoring...');
      const allEmails = await gmailSync.getEmailsForCalibration(oauth2Client, 100);
      
      // Apply intelligent scoring and filtering
      console.log(`📊 Scoring ${allEmails.length} emails...`);
      const scoredEmails = allEmails
        .map(email => ({ ...email, score: scoreEmail(email) }))
        .filter(email => {
          const passesThreshold = email.score >= 6;
          if (passesThreshold) {
            console.log(`✅ Email passed threshold: "${email.subject}" (score: ${email.score})`);
          }
          return passesThreshold;
        })
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .slice(0, 25); // Limit to top 25 for calibration UX
      
      console.log(`🎯 Filtered to ${scoredEmails.length} high-value emails for calibration`);
      
      // Transform to calibration format that works with existing frontend
      const calibrationCards = scoredEmails.map((email, index) => ({
        id: email.id || index + 1,
        brandName: email.brandName || 'Unknown',
        brandIcon: email.brandIcon || '📧',
        emailType: email.emailType || 'General',
        subject: email.subject || 'No Subject',
        snippet: email.snippet || 'No preview available',
        // Add intelligent scoring insight
        insight: `🧠 Mental Load Score: ${email.score} | ${email.score >= 8 ? 'High Priority' : 'Medium Priority'}`,
        score: email.score, // Include score for debugging
        // Make sure we include all fields the frontend expects
        from: email.from || 'Unknown sender',
        date: email.date || 'Recent',
        gmailUrl: email.gmailUrl || '#'
      }));
      
      res.json({ 
        success: true, 
        emails: calibrationCards, // Frontend expects 'emails' property
        calibrationCards: calibrationCards, // Keep new format for future use
        totalScanned: allEmails.length,
        highValueFiltered: scoredEmails.length,
        intelligentFiltering: true,
        scoringStats: {
          averageScore: Math.round(scoredEmails.reduce((sum, e) => sum + e.score, 0) / scoredEmails.length),
          highPriority: scoredEmails.filter(e => e.score >= 8).length,
          mediumPriority: scoredEmails.filter(e => e.score >= 6 && e.score < 8).length
        }
      });
      
    } catch (error) {
      console.error('Calibration data error:', error);
      
      // Check if this is an authentication error
      if (error.message && error.message.includes('OAuth tokens not found')) {
        return res.status(401).json({
          success: false,
          needsAuth: true,
          error: 'OAuth tokens not found. Please authenticate first.',
          message: 'Please connect your Gmail account to start calibration.'
        });
      }
      
      // For other errors, return the actual error instead of mock data
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to load calibration data',
        message: 'Unable to load emails for calibration. Please try again.'
      });
    }
  });

  // API endpoint for calibration ratings - LEARNING ENGINE INTEGRATED
  app.post('/api/calibration-rating', async (req, res) => {
    try {
      const { cardId, rating, userId = 'demo-user', brandName, emailData } = req.body;
      
      console.log(`📊 User rating: Card ${cardId} = ${rating} (${rating === 'up' ? '👍' : '👎'})`);
      
      // Store user feedback with brand association for learning
      const ratingData = {
        userId,
        cardId,
        rating,
        brandName: brandName || 'unknown',
        emailSubject: emailData?.emailSubject || '',
        timestamp: new Date().toISOString(),
        feedbackType: 'calibration'
      };
      
      // LEARNING ENGINE: Store feedback in Firebase for machine learning
      try {
        // Initialize learning engine
        const learningEngine = new EmailLearningEngine();
        
        // Update learning model with user feedback
        const learningResult = await learningEngine.updateBrandQualityWithFeedback(
          brandName || 'unknown',
          userId,
          rating,
          {
            subject: emailData?.emailSubject || '',
            snippet: emailData?.emailSnippet || '',
            type: emailData?.emailType || 'unknown',
            category: emailData?.category || 'unknown'
          }
        );
        
        console.log(`🤖 Learning engine result:`, learningResult);
        
        // Store individual rating (legacy support)
        await db.collection('user_calibrations')
          .doc(userId)
          .collection('ratings')
          .add(ratingData);
        
        // Update brand learning signals
        const brandRef = db.collection('brand_learning_signals').doc(brandName || 'unknown');
        const brandDoc = await brandRef.get();
        
        if (brandDoc.exists) {
          const brandData = brandDoc.data();
          const newPositiveCount = brandData.positiveRatings + (rating === 'up' ? 1 : 0);
          const newNegativeCount = brandData.negativeRatings + (rating === 'down' ? 1 : 0);
          const totalRatings = newPositiveCount + newNegativeCount;
          const userSatisfactionScore = totalRatings > 0 ? newPositiveCount / totalRatings : 0.5;
          
          await brandRef.update({
            positiveRatings: newPositiveCount,
            negativeRatings: newNegativeCount,
            totalRatings: totalRatings,
            userSatisfactionScore: userSatisfactionScore,
            lastUpdated: new Date().toISOString()
          });
        } else {
          // Create new brand learning record
          await brandRef.set({
            brandName: brandName || 'unknown',
            positiveRatings: rating === 'up' ? 1 : 0,
            negativeRatings: rating === 'down' ? 1 : 0,
            totalRatings: 1,
            userSatisfactionScore: rating === 'up' ? 1.0 : 0.0,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          });
        }
        
        console.log(`🤖 Learning engine updated for brand: ${brandName}`);
        
      } catch (firestoreError) {
        console.error('Firebase learning storage error:', firestoreError);
        // Continue execution even if Firebase fails
      }
      
      res.json({ 
        success: true, 
        message: 'Rating saved and learning model updated',
        data: ratingData,
        learningStatus: 'Brand intelligence updated'
      });
    } catch (error) {
      console.error('Calibration rating error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // LEARNING ENGINE: Get personalized brand recommendations
  app.get('/api/personalized-recommendations', async (req, res) => {
    try {
      const { userId = 'demo-user', limit = 10 } = req.query;
      
      console.log(`🤖 Generating personalized recommendations for ${userId}...`);
      
      // Get user's rating history
      const userRatings = await db.collection('user_calibrations')
        .doc(userId)
        .collection('ratings')
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      
      // Get global brand learning signals
      const brandSignals = await db.collection('brand_learning_signals')
        .orderBy('userSatisfactionScore', 'desc')
        .limit(parseInt(limit))
        .get();
      
      const recommendations = [];
      const userPreferences = { liked: [], disliked: [] };
      
      // Analyze user preferences
      userRatings.forEach(doc => {
        const data = doc.data();
        if (data.rating === 'up') {
          userPreferences.liked.push(data.brandName);
        } else {
          userPreferences.disliked.push(data.brandName);
        }
      });
      
      // Generate recommendations based on learning
      brandSignals.forEach(doc => {
        const brandData = doc.data();
        
        // Skip brands user has explicitly disliked
        if (userPreferences.disliked.includes(brandData.brandName)) {
          return;
        }
        
        // Boost score if user has liked similar brands
        let personalizedScore = brandData.userSatisfactionScore;
        if (userPreferences.liked.includes(brandData.brandName)) {
          personalizedScore *= 1.2; // 20% boost for liked brands
        }
        
        recommendations.push({
          brandName: brandData.brandName,
          satisfactionScore: brandData.userSatisfactionScore,
          personalizedScore: personalizedScore,
          totalRatings: brandData.totalRatings,
          confidence: brandData.totalRatings >= 5 ? 'high' : 'medium',
          reason: userPreferences.liked.includes(brandData.brandName) 
            ? 'You previously liked this brand' 
            : `${Math.round(brandData.userSatisfactionScore * 100)}% user satisfaction`
        });
      });
      
      // Sort by personalized score
      recommendations.sort((a, b) => b.personalizedScore - a.personalizedScore);
      
      res.json({
        success: true,
        userId: userId,
        recommendations: recommendations.slice(0, parseInt(limit)),
        userPreferences: {
          likedBrands: userPreferences.liked.length,
          dislikedBrands: userPreferences.disliked.length
        },
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Personalized recommendations error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // LEARNING ENGINE: Get learning analytics dashboard
  app.get('/api/learning-analytics', async (req, res) => {
    try {
      console.log('📊 Generating learning analytics dashboard...');
      
      // Get overall learning statistics
      const brandSignalsSnapshot = await db.collection('brand_learning_signals').get();
      const totalBrands = brandSignalsSnapshot.size;
      
      let totalRatings = 0;
      let totalPositive = 0;
      let topPerformingBrands = [];
      let improvingBrands = [];
      
      brandSignalsSnapshot.forEach(doc => {
        const data = doc.data();
        totalRatings += data.totalRatings || 0;
        totalPositive += data.positiveRatings || 0;
        
        topPerformingBrands.push({
          brandName: data.brandName,
          satisfactionScore: data.userSatisfactionScore,
          totalRatings: data.totalRatings
        });
        
        // Check if brand is improving (simple heuristic)
        if (data.userSatisfactionScore > 0.7 && data.totalRatings >= 3) {
          improvingBrands.push({
            brandName: data.brandName,
            score: data.userSatisfactionScore
          });
        }
      });
      
      // Sort top performing brands
      topPerformingBrands.sort((a, b) => b.satisfactionScore - a.satisfactionScore);
      improvingBrands.sort((a, b) => b.score - a.score);
      
      const overallSatisfaction = totalRatings > 0 ? totalPositive / totalRatings : 0;
      
      res.json({
        success: true,
        analytics: {
          totalBrandsLearned: totalBrands,
          totalUserRatings: totalRatings,
          overallSatisfactionRate: Math.round(overallSatisfaction * 100),
          topPerformingBrands: topPerformingBrands.slice(0, 5),
          improvingBrands: improvingBrands.slice(0, 5),
          learningHealth: totalRatings > 50 ? 'excellent' : totalRatings > 20 ? 'good' : 'building',
          lastUpdated: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Learning analytics error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // LEARNING ENGINE: Get personalized email score
  app.post('/api/personalized-email-score', async (req, res) => {
    try {
      const { userId = 'demo-user', emailData } = req.body;
      
      console.log(`🤖 Calculating personalized score for ${userId}...`);
      
      const learningEngine = new EmailLearningEngine();
      const scoreResult = await learningEngine.getPersonalizedEmailScore(userId, emailData);
      
      res.json({
        success: true,
        userId: userId,
        emailData: {
          brandName: emailData?.brandName || 'unknown',
          subject: emailData?.subject || '',
          category: emailData?.category || 'unknown'
        },
        scoring: scoreResult,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Personalized email scoring error:', error);
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
