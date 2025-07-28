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

  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Load HomeOps tone prompt
  const fs = require('fs');
  const homeOpsTone = fs.readFileSync('./prompts/tone-homeops.txt', 'utf8');
  
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
  
  // Create OAuth2 client for token operations
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'http://localhost:3000/auth/gmail/callback'
  );
  
  // Helper function to store OAuth tokens consistently
  async function storeOAuthTokens(tokens, userEmail) {
    try {
      console.log('💾 Storing OAuth tokens for user:', userEmail);
      console.log('🔑 Token details:', {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        expiry_date: tokens.expiry_date
      });
      
      await db.collection('gmail_tokens').doc(userEmail).set({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        token_type: tokens.token_type || 'Bearer',
        stored_at: new Date().toISOString(),
        user_email: userEmail
      });
      console.log('✅ OAuth tokens stored successfully for:', userEmail);
      return true;
    } catch (error) {
      console.error('❌ Error storing OAuth tokens:', error);
      return false;
    }
  }
  
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
  
  // Calibration page route
  app.get('/calibrate', (req, res) => {
    // Prevent caching of HTML files during development
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.sendFile(path.join(__dirname, 'public', 'calibrate.html'));
  });

  // Fixed calibration page route (bypasses browser cache)
  app.get('/calibrate-fixed', (req, res) => {
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.sendFile(path.join(__dirname, 'public', 'calibrate-fixed.html'));
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
      
      // ALWAYS force consent screen to ensure fresh OAuth tokens
      let authUrl = await gmailSync.getAuthUrl(true); // Force consent = true
      
      // Add onboarding parameter to the state or redirect URL
      if (isOnboarding) {
        const urlObj = new URL(authUrl);
        urlObj.searchParams.set('state', JSON.stringify({ isOnboarding: true }));
        authUrl = urlObj.toString();
      }
      
      console.log('🔄 Redirecting to Gmail auth with FORCED consent screen...');
      console.log('🔗 Auth URL:', authUrl);
      console.log('📱 Onboarding mode:', isOnboarding);
      
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
      
      console.log('🔄 Exchanging authorization code for tokens...');
      
      // Create OAuth2 client for token exchange
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        'http://localhost:3000/auth/gmail/callback'
      );
      
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      console.log('✅ Tokens received, setting credentials...');
      
      oauth2Client.setCredentials(tokens);
      console.log('✅ Gmail tokens exchanged and client updated');
      
      // Test Gmail connection
      console.log('🔄 Testing Gmail connection...');
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      const userEmail = profile.data.emailAddress;
      console.log(`✅ Gmail connected for ${userEmail}`);
      
      // Store tokens using our consistent storage function
      const tokenStored = await storeOAuthTokens(tokens, userEmail);
      if (!tokenStored) {
        throw new Error('Failed to store OAuth tokens');
      }
      
      if (isOnboarding) {
        console.log('🔄 Onboarding flow detected - redirecting to scan page');
        // Redirect to scanning animation page in onboarding flow
        res.redirect('/scan?gmail_connected=true');
      } else {
        console.log('🔄 Regular OAuth flow - showing success page');
        // Regular OAuth completion
        res.send(`
          <h2>✅ Gmail Successfully Connected!</h2>
          <p>Email: ${userEmail}</p>
          <p>Total Messages: ${profile.data.messagesTotal || 'Unknown'}</p>
          <p><strong>Next steps:</strong></p>
          <ul>
            <li>Your Gmail is now connected for Email Intelligence</li>
            <li>You can now scan emails to build your brand database</li>
            <li><a href="/">Return to Dashboard</a></li>
          </ul>
        `);
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
      const userId = 'oliverhbaron@gmail.com'; // Use your email as consistent ID
      const tokenDoc = await db.collection('gmail_tokens').doc(userId).get();
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

  // Enhanced email category detection for mixed calibration
  function detectEmailCategory(subject, fromEmail, snippet) {
    const subjectLower = subject.toLowerCase();
    const fromLower = fromEmail.toLowerCase();
    const snippetLower = (snippet || '').toLowerCase();
    const content = `${subjectLower} ${fromLower} ${snippetLower}`;
    
    // Family/School - highest priority
    if (content.match(/(school|teacher|parent|homework|pta|tuition|report card|grade|class|student|education|daycare|camp|swim team|soccer|basketball|piano|lesson|teamsnap|sports team|team practice|game schedule|tournament)/)) {
      return 'family';
    }
    
    // Work - high priority
    if (content.match(/(meeting|project|deadline|report|colleague|manager|team|office|work|business|client|proposal|contract)/)) {
      return 'work';
    }
    
    // Club/Community - medium-high priority  
    if (content.match(/(club|community|neighborhood|volunteer|donation|church|temple|mosque|golf|tennis|gym|fitness)/)) {
      return 'social';
    }
    
    // Commerce - varies by engagement
    if (content.match(/(order|shipped|delivery|purchase|payment|receipt|sale|discount|offer|deal|coupon|cart)/)) {
      return 'commerce';
    }
    
    // Default to general
    return 'general';
  }

  // Generate AI-driven email summary using HomeOps tone
  async function generateEmailSummary(subject, fromEmail, snippet, category) {
    try {
      const prompt = `${homeOpsTone}

You are analyzing an email for a busy parent. Provide a 1-2 sentence AI-driven summary explaining why this email surfaced for calibration. Focus on the mental load implications and practical importance.

Email Details:
- From: ${fromEmail}
- Subject: ${subject}
- Category: ${category}
- Preview: ${snippet}

Write in the HomeOps tone (direct, emotionally intelligent, no fluff). Explain why this email matters for their mental load and household management.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 100,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI summary generation failed:', error);
      // Provide category-specific fallback messages
      const fallbackMessages = {
        family: `This ${category} email contains scheduling or logistics that could impact your family's routine and mental load.`,
        work: `This ${category} email may contain deadlines, meetings, or tasks that require your attention and planning.`,
        social: `This ${category} email involves community or social commitments that may affect your schedule.`,
        commerce: `This ${category} email contains purchase or delivery information that may require tracking or action.`,
        general: `This email surfaced because it may contain information relevant to your household management.`
      };
      return fallbackMessages[category] || fallbackMessages.general;
    }
  }

  function getCategoryIcon(category) {
    const icons = {
      family: '👨‍👩‍👧‍👦',
      work: '💼', 
      social: '🏛️',
      commerce: '🛍️',
      general: '📧'
    };
    return icons[category] || '📧';
  }

  // Lucide icon mapping for better UI
  function getLucideIcon(category) {
    const lucideIcons = {
      'School': 'users', // School is family-related
      'Medical': 'heart-pulse', 
      'Shopping': 'shopping-cart',
      'Work': 'briefcase',
      'Professional': 'briefcase',
      'Family': 'users',
      'Sports': 'users', // Sports is family-related
      'Entertainment': 'users', // Entertainment can be family-related
      'family': 'users',
      'work': 'briefcase',
      'social': 'heart-pulse', // Medical/social support
      'commerce': 'shopping-cart',
      'general': 'mail'
    };
    return lucideIcons[category] || 'mail';
  }

  // Generate contextual Mental Load insights (without score prefix)
  function generateMentalLoadInsight(category, priority, summary) {
    const insightTemplates = {
      'School': [
        'Educational priority identified - immediate action prevents your child from falling behind.',
        'School-home connection detected - this may require scheduling adjustments and preparation.',
        'Family coordination required - this impacts your child\'s education and requires follow-up planning.'
      ],
      'Medical': [
        'Health management critical - delayed action could impact your family\'s wellbeing and create complications.',
        'Medical coordination needed - this requires appointment scheduling and potential childcare planning.',
        'Healthcare priority - missing this creates downstream scheduling conflicts and health risks.'
      ],
      'Shopping': [
        'Household logistics detected - this order affects your family\'s daily operations and routines.',
        'Family supply management - this delivery requires coordination and may impact meal planning.',
        'Household maintenance identified - this purchase supports your family\'s ongoing needs.'
      ],
      'Work': [
        'Professional obligation - this impacts your work-life balance and may require childcare coordination.',
        'Career priority detected - missing this affects your professional standing and family financial security.',
        'Work-family boundary management needed - this requires scheduling around family commitments.'
      ],
      'Professional': [
        'Career priority detected - missing this affects your professional standing and family financial security.',
        'Professional obligation - this impacts your work-life balance and may require childcare coordination.',
        'Work-family boundary management needed - this requires scheduling around family commitments.'
      ],
      'Family': [
        'Family relationship maintenance - this strengthens bonds and requires coordination with other commitments.',
        'Household social calendar impact - this may require meal planning and schedule adjustments.',
        'Family priority identified - this supports relationships but needs integration with other obligations.'
      ]
    };

    const templates = insightTemplates[category] || [
      'Household management task identified - this requires attention and may impact your daily routine.'
    ];
    
    // Select insight based on priority
    if (priority === 'High') {
      return templates[0] || templates[0]; // Use first (most urgent) template
    } else if (priority === 'Medium') {
      return templates[1] || templates[0];
    } else {
      return templates[2] || templates[1] || templates[0];
    }
  }

  // Calculate realistic Mental Load scores based on category and content
  function calculateMentalLoadScore(category, priority, summary) {
    let baseScore = 0;
    
    // Base score by category
    switch(category.toLowerCase()) {
      case 'school': baseScore = 75; break;
      case 'medical': baseScore = 85; break;
      case 'family': baseScore = 70; break;
      case 'work': baseScore = 80; break;
      case 'professional': baseScore = 80; break;
      case 'shopping': baseScore = 60; break;
      case 'sports': baseScore = 65; break;
      case 'entertainment': baseScore = 45; break;
      default: baseScore = 50;
    }
    
    // Priority multiplier
    const priorityMultiplier = {
      'high': 1.2,
      'medium': 1.0,
      'low': 0.8
    };
    
    // Content complexity indicators
    const complexityKeywords = [
      'deadline', 'urgent', 'tomorrow', 'today', 'required', 'must',
      'schedule', 'appointment', 'conflict', 'coordination', 'planning'
    ];
    
    const summaryLower = summary.toLowerCase();
    const complexityBonus = complexityKeywords.filter(keyword => 
      summaryLower.includes(keyword)
    ).length * 5;
    
    const finalScore = Math.round(
      (baseScore * (priorityMultiplier[priority.toLowerCase()] || 1.0)) + complexityBonus
    );
    
    // Ensure score is between 1-100
    return Math.max(1, Math.min(100, finalScore));
  }

  // Category-based bonus scoring for intelligent ranking
  function getCategoryBonus(category) {
    const bonuses = {
      family: 8,    // Highest priority - family/school matters most
      work: 6,      // High priority - work is important  
      social: 4,    // Medium-high - community engagement
      commerce: 2,  // Variable - depends on engagement history
      general: 0    // Baseline
    };
    return bonuses[category] || 0;
  }

  // Recency bonus to balance new vs important emails
  function getRecencyBonus(emailDate) {
    if (!emailDate) return 0;
    
    const now = new Date();
    const daysDiff = (now - emailDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff <= 1) return 3;      // Very recent - last 24 hours
    if (daysDiff <= 7) return 2;      // Recent - last week  
    if (daysDiff <= 30) return 1;     // Somewhat recent - last month
    return 0;                         // Older emails
  }

  // API endpoint to get real calibration data from emails - Updated for 1000 email scan
  app.get('/api/calibration-data', async (req, res) => {
    // Prevent all caching of this endpoint
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
      'ETag': `"${Date.now()}"` // Force unique ETag each time
    });
    
    try {
      console.log('📧 Using mock email data for cost-free calibration testing...');
      console.log('� Request timestamp:', new Date().toISOString());
      
      // Load mock emails instead of making expensive API calls
      const fs = require('fs');
      const mockDataPath = path.join(__dirname, 'mock', 'emails.json');
      const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
      
      console.log(`📋 Loaded ${mockData.emails.length} mock emails with enhanced features...`);
      
      // Process mock emails to match the expected format
      const processedEmails = mockData.emails.map(email => {
        // Map mock categories to system categories
        let systemCategory = 'general';
        switch(email.category.toLowerCase()) {
          case 'school':
          case 'family':
          case 'sports':
          case 'entertainment': // Entertainment can be family-related
            systemCategory = 'family';
            break;
          case 'work':
          case 'professional':
            systemCategory = 'work';
            break;
          case 'medical':
            systemCategory = 'social'; // Medical is community/social support
            break;
          case 'shopping':
            systemCategory = 'commerce';
            break;
          default:
            systemCategory = 'general';
        }
        
        return {
          id: email.id,
          from: email.source,
          subject: email.subject,
          snippet: email.summary,
          timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Random time within last week
          category: systemCategory,
          originalCategory: email.category, // Keep original for display
          priority: email.priority.toLowerCase(),
          mental_load_score: calculateMentalLoadScore(email.category, email.priority, email.summary),
          action_required: email.actions && email.actions.length > 0,
          ai_summary: email.summary,
          mental_load_insight: generateMentalLoadInsight(email.category, email.priority, email.summary),
          actionable_tasks: email.actions || [],
          enhanced_category: systemCategory
        };
      });
      
      // Apply intelligent mixed-category selection for comprehensive calibration
      console.log(`� Selecting diverse emails for calibration from ${processedEmails.length} mock emails...`);
      
      // Mixed category selection for comprehensive calibration
      const categoryDistribution = {
        family: 5,    // Family/School emails - highest priority
        work: 4,      // Work emails
        social: 4,    // Club/Community  
        commerce: 4,  // Commerce emails
        general: 3    // General emails
      };
      
      const selectedEmails = [];
      
      // Select emails from each category
      for (const [category, count] of Object.entries(categoryDistribution)) {
        const categoryEmails = processedEmails
          .filter(email => email.category === category)
          .sort((a, b) => b.mental_load_score - a.mental_load_score)
          .slice(0, count);
        
        selectedEmails.push(...categoryEmails);
        console.log(`📂 Selected ${categoryEmails.length} ${category} emails (wanted: ${count})`);
      }
      
      // Sort final selection by priority and take top 20
      const finalSelection = selectedEmails
        .sort((a, b) => b.mental_load_score - a.mental_load_score)
        .slice(0, 20);
      
      console.log(`🎯 Final calibration set: ${finalSelection.length} enhanced mock emails (NO API COSTS)`);
      
      // Format emails for calibration cards with enhanced features
      const calibrationCards = finalSelection.map((email, index) => {
        const lucideIcon = getLucideIcon(email.originalCategory || email.category);
        console.log(`📧 Email ${index + 1}: ${email.originalCategory} -> ${lucideIcon} icon`);
        
        return {
          id: email.id || `mock_${index + 1}`,
          brandName: email.from.split(' ')[0] || email.from.split('-')[0]?.trim() || 'Unknown',
          brandIcon: lucideIcon,
          emailType: email.originalCategory || email.category, // Use original category for display
          subject: email.subject,
          snippet: email.snippet,
          insight: email.mental_load_insight,
          aiSummary: email.ai_summary,
          score: email.mental_load_score,
          category: email.category, // System category for filtering
          originalCategory: email.originalCategory, // Original category for display
          from: email.from,
          date: new Date(email.timestamp).toLocaleDateString(),
          gmailUrl: '#',
          actionableTasks: email.actionable_tasks,
          priority: email.priority,
          action_required: email.action_required
        };
      });
      
      res.json({ 
        success: true, 
        emails: calibrationCards,
        calibrationCards: calibrationCards,
        totalScanned: processedEmails.length,
        highValueFiltered: finalSelection.length,
        intelligentFiltering: true,
        mockDataMode: true, // Flag to indicate we're using mock data
        categoryDistribution: {
          family: finalSelection.filter(e => e.category === 'family').length,
          work: finalSelection.filter(e => e.category === 'work').length,
          social: finalSelection.filter(e => e.category === 'social').length,
          commerce: finalSelection.filter(e => e.category === 'commerce').length,
          general: finalSelection.filter(e => e.category === 'general').length
        },
        scoringStats: {
          averageScore: Math.round(finalSelection.reduce((sum, e) => sum + e.mental_load_score, 0) / finalSelection.length),
          highPriority: finalSelection.filter(e => e.priority === 'High').length,
          mediumPriority: finalSelection.filter(e => e.priority === 'Medium').length,
          lowPriority: finalSelection.filter(e => e.priority === 'Low').length
        }
      });
      
    } catch (error) {
      console.error('Mock calibration data error:', error);
      
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to load mock calibration data',
        message: 'Unable to load mock emails for calibration. Please check server logs.'
      });
    }
  });

  // API endpoint for calibration ratings - LEARNING ENGINE INTEGRATED
  app.post('/api/calibration-rating', async (req, res) => {
    try {
      const { cardId, rating, userId = 'oliverhbaron@gmail.com', brandName, emailData } = req.body;
      
      console.log(`📊 User rating: Card ${cardId} = ${rating} (${rating === 'up' ? '👍' : '👎'})`);
      
      // Privacy-safe metadata storage - NO full email content
      const privacySafeData = {
        userId,
        cardId,
        rating,
        brandName: brandName || 'unknown',
        subject: emailData?.subject || '',  // Subject line only
        category: emailData?.category || 'general',
        signalScore: emailData?.score || 0,
        timestamp: new Date().toISOString(),
        feedbackType: 'calibration'
        // NOTE: No email snippet, full content, or personal details stored
      };
      
      // LEARNING ENGINE: Store privacy-safe feedback in Firebase
      try {
        // Store only metadata for learning patterns
        await db.collection('calibration_feedback').add(privacySafeData);
        console.log('✅ Privacy-safe calibration feedback stored');
        
        // Initialize learning engine with privacy-safe data
        const learningEngine = new EmailLearningEngine();
        
        // Update learning model with user feedback (metadata only)
        const learningResult = await learningEngine.updateBrandQualityWithFeedback(
          brandName || 'unknown',
          userId,
          rating,
          {
            subject: privacySafeData.subject,
            category: privacySafeData.category,
            signalScore: privacySafeData.signalScore,
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
