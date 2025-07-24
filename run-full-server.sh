#!/bin/bash

echo "🚀 Starting Full HomeOps Server (Chat + Calendar + Email Intelligence)"
echo "====================================================================="

# Wrap the server in error handling
node -e "
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('Loading server.js...');
require('./server.js');
"
