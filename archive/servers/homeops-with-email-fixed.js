const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

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

// API endpoint to get calibration data
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

// Compatibility endpoint for /onboard (proper onboarding flow)
app.get('/onboard', (req, res) => {
  console.log('� Starting onboarding flow - redirecting to auth');
  res.redirect('/auth.html');
});

// Serve the main dashboard as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve auth page
app.get('/auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'auth.html'));
});

// Serve scan page  
app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scan.html'));
});

// Serve calibration page
app.get('/calibrate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calibrate.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HomeOps Email Server running on http://localhost:${PORT}`);
  console.log('📧 Using local emails.json for calibration data');
  console.log('🎯 Access calibration at: http://localhost:3000');
});
