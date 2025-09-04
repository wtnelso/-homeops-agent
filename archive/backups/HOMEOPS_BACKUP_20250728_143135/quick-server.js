require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();
const PORT = 3000;

// Gmail OAuth setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/gmail/callback'
);

// Serve static files with no-cache for HTML
app.use(express.static('public', {
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Calibrate route - serve the mobile-optimized calibrate file
app.get('/calibrate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calibrate-mobile-fixed.html'));
});

// Onboarding flow routes
app.get('/onboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'onboard.html'));
});

app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

// Gmail OAuth authentication
app.get('/auth/gmail', (req, res) => {
  // Clear any existing credentials to force fresh OAuth
  oauth2Client.setCredentials({});
  
  const isOnboarding = req.query.isOnboarding === 'true';
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    state: isOnboarding ? 'onboarding' : 'normal',
    prompt: 'consent' // Force consent screen to get fresh tokens
  });
  console.log('🔗 Redirecting to Gmail OAuth (fresh tokens):', authUrl);
  res.redirect(authUrl);
});

// OAuth callback - handle both routes for compatibility
app.get('/oauth2callback', async (req, res) => {
  await handleOAuthCallback(req, res);
});

app.get('/auth/gmail/callback', async (req, res) => {
  await handleOAuthCallback(req, res);
});

async function handleOAuthCallback(req, res) {
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('❌ OAuth error:', error);
    return res.redirect(`/scan?error=oauth_error&details=${error}`);
  }

  if (!code) {
    console.error('❌ No authorization code received');
    return res.redirect('/scan?error=no_code');
  }

  try {
    // Clear any existing credentials first
    oauth2Client.setCredentials({});
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    console.log('✅ Received tokens:', Object.keys(tokens));
    
    // Store tokens
    oauth2Client.setCredentials(tokens);
    
    // Redirect based on state
    if (state === 'onboarding') {
      console.log('🎯 Redirecting to scan (onboarding flow)');
      res.redirect('/scan');
    } else {
      console.log('🎯 Redirecting to calibrate (normal flow)');
      res.redirect('/calibrate');
    }
  } catch (error) {
    console.error('❌ Token exchange failed:', error.message);
    res.redirect(`/scan?error=token_exchange_failed&details=${encodeURIComponent(error.message)}`);
  }
}

// Enhanced Lucide icon mapping with comprehensive category support
function getLucideIcon(category, brandName = '') {
  // Brand-specific overrides for better context
  const brandSpecific = {
    // Sports & Activities
    'teamsnap': 'trophy',
    'headfirst': 'graduation-cap',
    'nike': 'zap',
    'adidas': 'zap',
    'reebok': 'zap',
    'allbirds': 'zap',
    
    // Commerce
    'amazon': 'package',
    'target': 'shopping-cart',
    'costco': 'shopping-cart',
    'wayfair': 'home',
    'pottery': 'home',
    'williams': 'home',
    
    // Finance
    'chase': 'credit-card',
    'venmo': 'dollar-sign',
    'paypal': 'dollar-sign',
    
    // Health
    'cvs': 'heart',
    'walgreens': 'heart',
    'ro': 'stethoscope',
    
    // Travel
    'uber': 'car',
    'lyft': 'car',
    'airbnb': 'map-pin',
    'hotels': 'bed',
    
    // Food
    'starbucks': 'coffee',
    'mcdonalds': 'utensils',
    'doordash': 'utensils',
    'ubereats': 'utensils'
  };

  // Check for brand-specific icon first
  const brandKey = brandName.toLowerCase();
  for (const [brand, icon] of Object.entries(brandSpecific)) {
    if (brandKey.includes(brand)) {
      return icon;
    }
  }

  // Enhanced category mapping
  const lucideIcons = {
    'School': 'graduation-cap',
    'Medical': 'heart-pulse', 
    'Shopping': 'shopping-cart',
    'Work': 'briefcase',
    'Professional': 'briefcase',
    'Family': 'users',
    'Sports': 'trophy',
    'Entertainment': 'tv',
    'Travel': 'plane',
    'Finance': 'credit-card',
    'Health': 'stethoscope',
    'Food': 'utensils',
    'Home': 'home',
    'Education': 'book-open',
    'Technology': 'smartphone',
    // Lowercase versions
    'school': 'graduation-cap',
    'medical': 'heart-pulse',
    'shopping': 'shopping-cart',
    'work': 'briefcase',
    'professional': 'briefcase',
    'family': 'users',
    'sports': 'trophy',
    'entertainment': 'tv',
    'travel': 'plane',
    'finance': 'credit-card',
    'health': 'stethoscope',
    'food': 'utensils',
    'home': 'home',
    'education': 'book-open',
    'technology': 'smartphone',
    // System categories
    'social': 'heart-pulse',
    'commerce': 'shopping-cart',
    'general': 'mail'
  };
  
  return lucideIcons[category] || 'mail';
}

// Enhanced Mental Load Score calculation with more categories
function calculateMentalLoadScore(category, priority, summary) {
  const categoryScores = {
    'school': 75,
    'medical': 85,
    'shopping': 60,
    'work': 70,
    'family': 80,
    'sports': 65,
    'entertainment': 45,
    'travel': 75,
    'finance': 80,
    'health': 85,
    'food': 50,
    'home': 70,
    'education': 75,
    'technology': 55
  };
  
  const priorityMultiplier = {
    'high': 1.3,
    'medium': 1.0,
    'low': 0.7
  };
  
  const baseScore = categoryScores[category.toLowerCase()] || 50;
  const multiplier = priorityMultiplier[priority.toLowerCase()] || 1.0;
  
  // Add some variation based on content keywords
  let contentBonus = 0;
  const urgentKeywords = ['urgent', 'deadline', 'tomorrow', 'today', 'asap', 'immediately'];
  const stressKeywords = ['conflict', 'problem', 'issue', 'failure', 'error', 'missing'];
  
  if (urgentKeywords.some(keyword => summary.toLowerCase().includes(keyword))) {
    contentBonus += 10;
  }
  if (stressKeywords.some(keyword => summary.toLowerCase().includes(keyword))) {
    contentBonus += 5;
  }
  
  const finalScore = Math.min(100, Math.round(baseScore * multiplier + contentBonus));
  return finalScore;
}

// Calibration data endpoint
app.get('/api/calibration-data', (req, res) => {
  try {
    console.log('📧 Loading calibration data...');
    
    // Load mock emails
    const mockDataPath = path.join(__dirname, 'mock', 'emails.json');
    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    
    // Process first 17 emails for enhanced calibration experience
    const emails = mockData.emails.slice(0, 17).map((email, index) => {
      // Better brand name extraction
      const brandName = email.source.split(' ')[0] || email.source.split('@')[0] || 'Unknown';
      const lucideIcon = getLucideIcon(email.category, brandName);
      const mentalLoadScore = calculateMentalLoadScore(email.category, email.priority, email.summary);
      
      console.log(`📧 Email ${index + 1}: ${email.category} -> ${lucideIcon} icon, score: ${mentalLoadScore}`);
      
      return {
        id: email.id || `mock_${index + 1}`,
        brandName: brandName,
        brandIcon: lucideIcon,
        emailType: email.category,
        subject: email.subject,
        snippet: email.summary,
        insight: `Mental load assessment for ${email.category} priority email`,
        aiSummary: email.summary,
        score: mentalLoadScore,
        category: email.category.toLowerCase(),
        originalCategory: email.category,
        from: email.source,
        date: new Date().toLocaleDateString(),
        priority: email.priority
      };
    });
    
    console.log(`✅ Returning ${emails.length} processed emails`);
    
    res.json({
      success: true,
      emails: emails,
      totalEmails: emails.length
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 HomeOps server running at http://localhost:${PORT}`);
  console.log(`🔍 Test API: http://localhost:${PORT}/api/test`);
  console.log(`📧 Calibration: http://localhost:${PORT}/api/calibration-data`);
  console.log(`🎯 Direct test: http://localhost:${PORT}/api-test-direct.html`);
});
