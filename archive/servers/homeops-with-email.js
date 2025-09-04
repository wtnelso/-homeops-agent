const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Root route - redirect to calibrate page
app.get('/', (req, res) => {
  res.redirect('/calibrate.html');
});

// Calibrate page route
app.get('/calibrate', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'calibrate.html'));
});

// Helper function to get category icons
function getCategoryIcon(category) {
  const icons = {
    'School': '🎓',
    'Medical': '🏥',
    'Family': '👨‍👩‍👧‍👦',
    'Work': '💼',
    'Shopping': '🛒'
  };
  return icons[category] || '📧';
}

// Calibration endpoint that returns emails in the expected format
app.get('/api/calibration-data', async (req, res) => {
  try {
    console.log('📧 Getting emails from local emails.json file...');
    
    const emailsPath = path.join(__dirname, 'public', 'emails.json');
    const emailsData = JSON.parse(fs.readFileSync(emailsPath, 'utf8'));
    
    console.log(`✅ Got ${emailsData.length} emails from local file`);
    
    // Transform the data to match frontend expectations
    const transformedEmails = emailsData.map((email, index) => ({
      id: email.email_id || index + 1,
      subject: email.subject || 'No Subject',
      snippet: email.summary || 'No summary available',
      brandName: email.sender || 'Unknown Sender',
      emailType: email.category?.toLowerCase() || 'general',
      brandIcon: getCategoryIcon(email.category),
      // Keep original data for compatibility
      ...email
    }));
    
    res.json({
      success: true,
      emails: transformedEmails,
      totalCount: transformedEmails.length,
      message: 'Calibration emails loaded successfully',
      isCurator: true // Set user as curator for expert rating weight
    });
  } catch (error) {
    console.error('❌ Error loading emails:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to load calibration data',
      error: error.message 
    });
  }
});

// Calibration rating endpoint
app.post('/api/calibration-rating', async (req, res) => {
  try {
    const { emailId, rating, brandName, emailType } = req.body;
    
    console.log(`⭐ Rating received: Email ${emailId} rated as ${rating}`);
    console.log(`📧 Brand: ${brandName}, Type: ${emailType}`);
    
    // In a real app, you'd save this to a database
    // For now, we'll just acknowledge the rating
    
    res.json({
      success: true,
      message: 'Rating saved successfully',
      emailId: emailId,
      rating: rating
    });
  } catch (error) {
    console.error('❌ Error saving rating:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save rating',
      error: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HomeOps server running on port ${PORT}`);
  console.log(`📧 Calibration page: http://localhost:${PORT}/calibrate`);
  console.log(`🎯 Ready for 20-email calibration with rating system!`);
});
