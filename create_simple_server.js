#!/usr/bin/env node

// Simple script to replace the Gmail API call with local file reading in a clean way
const fs = require('fs');
const path = require('path');

// First, let's create a completely clean server file that reads from emails.json
const serverTemplate = `
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Simple calibration endpoint that reads from emails.json
app.get('/api/calibration-data', async (req, res) => {
  try {
    console.log('📧 Getting emails from local emails.json file...');
    
    const emailsPath = path.join(__dirname, 'public', 'emails.json');
    const emailsData = JSON.parse(fs.readFileSync(emailsPath, 'utf8'));
    
    console.log(\`✅ Got \${emailsData.length} emails from local file\`);
    
    res.json({
      success: true,
      emails: emailsData,
      totalCount: emailsData.length,
      message: 'Calibration emails loaded successfully'
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

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 HomeOps server running on port \${PORT}\`);
  console.log(\`📧 Calibration endpoint: http://localhost:\${PORT}/api/calibration-data\`);
});
`;

// Write the clean server file
fs.writeFileSync('homeops-with-email.js', serverTemplate.trim(), 'utf8');

console.log('✅ Created clean server file that reads from emails.json');
console.log('📧 The server will now show all 20 emails from your local file');
console.log('🚀 Run ./start-server.sh to test it');
