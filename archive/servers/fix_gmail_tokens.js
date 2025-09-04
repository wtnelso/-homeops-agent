const fs = require('fs');
let content = fs.readFileSync('homeops-with-email.js', 'utf8');

// Find and replace the calibration function
const newFunction = `
app.get('/api/calibration-data', async (req, res) => {
  try {
    console.log('📧 Getting real email data for calibration...');
    
    // Load tokens directly from Firebase
    const tokenDoc = await db.collection('gmail_tokens').doc('current_user').get();
    if (!tokenDoc.exists) {
      throw new Error('No Gmail tokens found in Firebase');
    }
    
    const tokens = tokenDoc.data();
    console.log('✅ Tokens loaded from Firebase');
    
    // Set up Gmail API client directly
    const { google } = require('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    console.log('📧 Fetching emails from Gmail API...');
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 25,
      q: 'is:unread OR has:attachment OR from:noreply'
    });
    
    const messages = response.data.messages || [];
    console.log(\`✅ Found \${messages.length} emails\`);
    
    // Get email details
    const emailPromises = messages.slice(0, 5).map(async (message) => {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });
      
      const headers = email.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
      const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
      
      // Extract brand name from sender
      const brandName = from.split('@')[0].replace(/[^a-zA-Z]/g, '') || 'Unknown';
      
      return {
        id: message.id,
        brandName: brandName.charAt(0).toUpperCase() + brandName.slice(1),
        category: 'Email Marketing',
        logo: '<i data-lucide="mail" style="width: 20px; height: 20px; color: #4a90e2;"></i>',
        emailSubject: subject,
        emailSnippet: email.data.snippet || 'No preview available',
        insight: '<i data-lucide="check-circle" style="width: 14px; height: 14px; margin-right: 6px;"></i>Real Gmail data'
      };
    });
    
    const calibrationCards = await Promise.all(emailPromises);
    
    res.json({
      success: true,
      calibrationCards,
      usingMockData: false,
      totalEmails: messages.length
    });
    
  } catch (error) {
    console.error('❌ Gmail calibration error:', error.message);
    
    // Fallback to mock data
    res.json({
      success: true,
      calibrationCards: [{
        id: 1,
        brandName: "Target",
        category: "Retail & Shopping",
        logo: '<i data-lucide="target" style="width: 20px; height: 20px; color: #e53e3e;"></i>',
        emailSubject: "Weekly Ad: Save on back-to-school essentials",
        emailSnippet: "Find everything your family needs for the new school year. Save 20% on supplies, clothes, and more.",
        insight: '<i data-lucide="bar-chart-3" style="width: 14px; height: 14px; margin-right: 6px;"></i>Mock data - Gmail error: ' + error.message
      }],
      usingMockData: true,
      error: error.message
    });
  }
});`;

// Replace the existing calibration endpoint
content = content.replace(/app\.get\('\/api\/calibration-data'[^}]+}\);/s, newFunction);

fs.writeFileSync('homeops-with-email.js', content);
console.log('✅ Gmail calibration function replaced');
