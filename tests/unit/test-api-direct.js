const http = require('http');

// Start the server in the background
require('./homeops-with-email-WORKING-BACKUP.js');

// Wait a moment for server to start, then test the API
setTimeout(async () => {
  try {
    console.log('🧪 Testing calibration API...');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/calibration',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ API Response Status:', res.statusCode);
          
          if (response.emails && response.emails.length > 0) {
            const firstEmail = response.emails[0];
            console.log('📧 First Email Structure:');
            console.log('  brandIcon:', firstEmail.brandIcon);
            console.log('  score:', firstEmail.score);
            console.log('  emailType:', firstEmail.emailType);
            console.log('  subject:', firstEmail.subject);
            console.log('  insight preview:', firstEmail.insight ? firstEmail.insight.substring(0, 50) + '...' : 'N/A');
          } else {
            console.log('❌ No emails found in response');
          }
        } catch (parseError) {
          console.error('❌ JSON Parse Error:', parseError.message);
          console.log('Raw response:', data.substring(0, 200));
        }
        
        process.exit(0);
      });
    });

    req.on('error', (e) => {
      console.error('❌ Request Error:', e.message);
      process.exit(1);
    });

    req.end();
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
    process.exit(1);
  }
}, 2000);
