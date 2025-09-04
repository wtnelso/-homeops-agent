// HomeOps Agent - Main Server Entry Point
// This file loads the appropriate server based on environment

const fs = require('fs');
const path = require('path');

// Check if we should use simple server
const useSimple = process.argv.includes('--simple') || 
                  process.env.NODE_ENV === 'development' ||
                  !fs.existsSync('.env');

console.log(`🚀 Starting HomeOps in ${useSimple ? 'SIMPLE' : 'FULL'} mode...`);

if (useSimple) {
  // Load simple server for quick development (no external dependencies)
  console.log('📝 Using simple-server.js (no API keys required)');
  require('./simple-server.js');
} else {
  // Load full-featured server
  console.log('🔧 Using quick-server.js (requires API configuration)');
  try {
    require('./quick-server.js');
  } catch (error) {
    console.error('❌ Full server failed to start:', error.message);
    console.log('🔄 Falling back to simple server...');
    require('./simple-server.js');
  }
}