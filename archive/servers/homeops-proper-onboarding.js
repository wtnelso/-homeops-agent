const express = require('express');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();
const PORT = 3000;

// Gmail OAuth setup (using existing environment variables or defaults for testing)
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || 'your-client-id',
  process.env.GOOGLE_CLIENT_SECRET || 'your-client-secret', 
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/gmail/callback'
);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Helper function to get category icon
function getCategoryIcon(category) {
  const iconMap = {
    'School': '🎓',
    'Medical': '🏥', 
    'Work': '💼',
    'Family': '👨‍👩‍👧‍👦',
    'Shopping': '🛍️',
    'Social': '👥',
    'Newsletter': '📰',
    'Finance': '💰',
    'Travel': '✈️',
    'Other': '📧'
  };
  return iconMap[category] || '📧';
}

// ORIGINAL ONBOARDING FLOW ROUTES

// 1. Landing page (start of flow)
app.get('/landing.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// 2. Gmail OAuth (from landing page) - Development Mode
app.get('/auth/gmail', (req, res) => {
  console.log('🔗 Gmail OAuth requested - Development Mode');
  
  // For development, skip OAuth and go directly to scan
  console.log('⚠️ Using development mode - skipping real Gmail OAuth');
  res.redirect('/scan?gmail_connected=true&dev_mode=true');
});

app.get('/auth/gmail/callback', async (req, res) => {
  console.log('✅ Gmail OAuth callback - Development Mode');
  res.redirect('/scan?gmail_connected=true&dev_mode=true');
});

// 3. Scan page (email scanning animation)
app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

// 4. Calibrate page (final step with 20 emails)
app.get('/calibrate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calibrate.html'));
});

// API endpoint to get calibration data (20 emails)
app.get('/api/calibration-data', (req, res) => {
  try {
    console.log('📧 DEBUG: Reading local emails.json file...');
    const emailsPath = path.join(__dirname, 'public', 'emails.json');
    const emailsData = JSON.parse(fs.readFileSync(emailsPath, 'utf8'));
    console.log(`✅ DEBUG: Got ${emailsData.length} emails from local file`);
    
    res.json({
      success: true,
      emails: emailsData,
      totalCount: emailsData.length,
      message: 'Calibration emails loaded successfully'
    });
  } catch (error) {
    console.error('❌ Calibration data error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load calibration data',
      error: error.message 
    });
  }
});

// API endpoint to submit calibration rating data
app.post('/api/calibration-rating', (req, res) => {
  try {
    const { email_id, rating, feedback } = req.body;
    console.log('📊 Rating submitted:', { email_id, rating, feedback });
    
    // In a real app, you'd save this to a database
    res.json({
      success: true,
      message: 'Rating saved successfully'
    });
  } catch (error) {
    console.error('❌ Rating submission error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save rating',
      error: error.message 
    });
  }
});

// LEGACY SUPPORT

// Support /onboard route (redirect to proper landing page)
app.get('/onboard', (req, res) => {
  console.log('🔄 /onboard called, redirecting to landing page');
  res.redirect('/landing.html');
});

// Serve the main dashboard as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HomeOps Onboarding Server running on http://localhost:${PORT}`);
  console.log('📧 Using local emails.json for calibration data');
  console.log('🎯 Proper Onboarding Flow:');
  console.log('   1. Landing: http://localhost:3000/landing.html');
  console.log('   2. Gmail Connect: http://localhost:3000/auth/gmail');
  console.log('   3. Scan: http://localhost:3000/scan');
  console.log('   4. Calibrate: http://localhost:3000/calibrate');
});
