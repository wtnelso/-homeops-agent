#!/usr/bin/env node

// Simple script to replace Gmail API call with local file reading
const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'homeops-with-email-WORKING-BACKUP.js');
let content = fs.readFileSync(serverFile, 'utf8');

// Find and replace the Gmail Sync Engine call with local file reading
const oldCode = `      // Get 25 emails for calibration using optimized Gmail Sync Engine
      console.log('🔍 DEBUG: Calling Gmail Sync Engine...');
      const emails = await gmailSyncEngine.getEmailsForCalibration(oauth2Client, 25);
      console.log(\`✅ DEBUG: Got \${emails.length} emails from Gmail\`);
      
      res.json({
        success: true,
        emails: emails,
        totalCount: emails.length,
        message: 'Calibration emails loaded successfully'
      });`;

const newCode = `      // Get all emails from local mock data for calibration
      console.log('📧 DEBUG: Reading local emails.json file...');
      const fs = require('fs');
      const emailsPath = path.join(__dirname, 'public', 'emails.json');
      const emailsData = JSON.parse(fs.readFileSync(emailsPath, 'utf8'));
      console.log(\`✅ DEBUG: Got \${emailsData.length} emails from local file\`);
      
      res.json({
        success: true,
        emails: emailsData,
        totalCount: emailsData.length,
        message: 'Calibration emails loaded successfully'
      });`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(serverFile, content, 'utf8');
  console.log('✅ Successfully updated calibration endpoint to use local emails.json');
  console.log('📧 Server will now show all 20 emails instead of 5 from Gmail API');
} else {
  console.log('❌ Could not find the expected code pattern to replace');
  console.log('📋 The server file may have already been modified or has different formatting');
}
