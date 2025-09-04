console.log('🚀 Starting minimal test server...');

const express = require('express');
const path = require('path');
console.log('✅ Express loaded');

const CommerceIntelligence = require('./services/commerce-intelligence');
const GmailBrandDatabaseBuilder = require('./services/gmail-commerce-intelligence');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Initialize services
const commerceIntelligence = new CommerceIntelligence();
const gmailBrandBuilder = new GmailBrandDatabaseBuilder();

// Master Brand Database (built from your Gmail)
let masterBrandDatabase = {};

// User-specific brand databases for cross-referencing
let userBrandDatabases = {};

console.log('✅ Commerce Intelligence and Gmail Brand Builder instantiated');

// Simple commerce intelligence endpoint
app.post('/api/commerce-intelligence', async (req, res) => {
  try {
    console.log('Commerce intelligence request received:', req.body.query);
    const result = await commerceIntelligence.process(req.body.query || 'test query');
    console.log('📤 Sending response to frontend:', JSON.stringify({
      success: result.success,
      results: result.results ? result.results.length : 'NO RESULTS',
      strategy: result.strategy
    }, null, 2));
    // Send the result's properties directly, not wrapped in "result" 
    res.json(result);
  } catch (error) {
    console.error('Commerce intelligence error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Build Master DTC Brand Database (Your Gmail)
app.get('/admin/build-master-database', async (req, res) => {
  try {
    console.log('🏗️ Building master DTC brand database from your Gmail...');
    await gmailBrandBuilder.initializeGmail();
    
    masterBrandDatabase = await gmailBrandBuilder.buildMasterDatabase(2000);
    
    // Update Commerce Intelligence with new brands
    commerceIntelligence.updateDTCBrands(masterBrandDatabase);
    
    res.json({
      success: true,
      message: 'Master DTC brand database built successfully!',
      brandCount: Object.keys(masterBrandDatabase).length,
      brands: Object.keys(masterBrandDatabase).slice(0, 10) // Show first 10
    });
  } catch (error) {
    console.error('Master database build error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// User Onboarding: Build Personalized Brand Profile
app.post('/api/onboard-user', async (req, res) => {
  try {
    const { userId, gmailToken } = req.body;
    
    console.log(`👤 Onboarding user ${userId} - building personalized brand profile...`);
    
    // Create new Gmail builder instance for this user
    const userGmailBuilder = new GmailBrandDatabaseBuilder();
    userGmailBuilder.oauth2Client.setCredentials({ access_token: gmailToken });
    
    // Build user's personal brand database
    const userBrands = await userGmailBuilder.buildMasterDatabase(1000);
    
    // Cross-reference with master database
    const personalizedProfile = crossReferenceBrands(userBrands, masterBrandDatabase, userId);
    
    // Store user's brand profile
    userBrandDatabases[userId] = personalizedProfile;
    
    res.json({
      success: true,
      message: `Personalized profile created for user ${userId}`,
      userBrands: Object.keys(userBrands).length,
      sharedBrands: personalizedProfile.sharedBrands.length,
      uniqueBrands: personalizedProfile.uniqueBrands.length,
      recommendationScore: personalizedProfile.recommendationScore
    });
    
  } catch (error) {
    console.error('User onboarding error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cross-reference user brands with master database
function crossReferenceBrands(userBrands, masterBrands, userId) {
  const sharedBrands = [];
  const uniqueBrands = [];
  let totalEngagementScore = 0;
  
  // Find shared brands and boost their scores
  for (const [domain, userBrand] of Object.entries(userBrands)) {
    if (masterBrands[domain]) {
      // Shared brand - boost loyalty score
      const boostedBrand = {
        ...userBrand,
        loyaltyScore: Math.min(0.99, userBrand.loyaltyScore + 0.1),
        crossReferenceBoost: true,
        masterDatabaseMatch: true
      };
      sharedBrands.push(boostedBrand);
      totalEngagementScore += boostedBrand.loyaltyScore;
    } else {
      // Unique brand - add to master database for future users
      uniqueBrands.push(userBrand);
      totalEngagementScore += userBrand.loyaltyScore;
    }
  }
  
  // Add unique brands to master database
  for (const uniqueBrand of uniqueBrands) {
    masterBrands[uniqueBrand.domain] = {
      ...uniqueBrand,
      discoveredByUser: userId,
      needsValidation: true
    };
  }
  
  return {
    userId,
    sharedBrands,
    uniqueBrands,
    recommendationScore: totalEngagementScore / Object.keys(userBrands).length,
    totalBrands: Object.keys(userBrands).length,
    createdAt: new Date()
  };
}

// Gmail OAuth authentication endpoint
app.get('/auth/gmail', async (req, res) => {
  try {
    await gmailBrandBuilder.initializeGmail();
    
    const authUrl = gmailBrandBuilder.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      include_granted_scopes: true
    });
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('Gmail auth error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gmail OAuth callback endpoint
app.get('/auth/gmail/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await gmailBrandBuilder.oauth2Client.getAccessToken(code);
    
    gmailBrandBuilder.oauth2Client.setCredentials(tokens);
    
    console.log('✅ Gmail authenticated! Building master brand database...');
    
    // Build master database in background
    gmailBrandBuilder.buildMasterDatabase(2000)
      .then(brands => {
        masterBrandDatabase = brands;
        // Update Commerce Intelligence with discovered brands
        commerceIntelligence.updateDTCBrands(brands);
        console.log(`🎉 Master database built with ${Object.keys(brands).length} DTC brands!`);
        console.log('Top 10 brands:', Object.keys(brands).slice(0, 10));
      })
      .catch(error => console.error('Master database build failed:', error));
    
    res.send(`
      <h1>🎉 Gmail Connected!</h1>
      <p>Building master DTC brand database from your promotion emails...</p>
      <p>This will power personalized recommendations for all users.</p>
      <p><strong>Database Purpose:</strong> Extract real DTC brands to replace manual curation</p>
      <p><a href="/">← Back to HomeOps</a></p>
      <script>setTimeout(() => window.close(), 5000);</script>
    `);
  } catch (error) {
    console.error('Gmail callback error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get master brand database status
app.get('/api/master-database', async (req, res) => {
  try {
    res.json({
      success: true,
      brandCount: Object.keys(masterBrandDatabase).length,
      sampleBrands: Object.keys(masterBrandDatabase).slice(0, 20),
      categories: [...new Set(Object.values(masterBrandDatabase).flatMap(b => b.categories))],
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Master database error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user-specific brands (for onboarded users)
app.get('/api/user-brands/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userProfile = userBrandDatabases[userId];
    
    if (!userProfile) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not onboarded. Please complete Gmail onboarding first.' 
      });
    }
    
    res.json({
      success: true,
      userProfile: userProfile,
      personalizedRecommendations: true
    });
  } catch (error) {
    console.error('User brands error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve the main web app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎉 Test server running at http://localhost:${PORT}`);
  console.log('✅ Commerce Intelligence ready!');
});
