console.log('🚀 HomeOps Server Starting...');

// Test basic Node.js functionality first
console.log('✅ Node.js is working');

try {
  console.log('1. Loading Express...');
  const express = require('express');
  
  console.log('2. Creating app...');
  const app = express();
  const PORT = process.env.PORT || 3000;
  
  console.log('3. Setting up basic route...');
  app.get('/', (req, res) => {
    res.send(`
      <h1>🏠 HomeOps Server</h1>
      <p>✅ Server is running!</p>
      <p>🕐 Started at: ${new Date().toISOString()}</p>
      <ul>
        <li><a href="/test">Test endpoint</a></li>
        <li><a href="/auth/gmail">Gmail OAuth (Email Intelligence)</a></li>
      </ul>
    `);
  });
  
  app.get('/test', (req, res) => {
    res.json({ 
      status: 'HomeOps Server Running',
      features: ['Chat Agent', 'Calendar', 'Email Intelligence'],
      timestamp: new Date().toISOString()
    });
  });
  
  console.log('4. Starting server...');
  const server = app.listen(PORT, () => {
    console.log(`✅ HomeOps Server running at http://localhost:${PORT}`);
    console.log('🎉 Server successfully started!');
    console.log('📝 Next: Visit http://localhost:3000 to test');
  });
  
  // Keep the process alive
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
  });
  
} catch (error) {
  console.error('❌ Startup error:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
}

// Prevent process from exiting
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});
