#!/bin/bash

echo "🚀 HomeOps Email Intelligence Server - Diagnostic Startup"
echo "========================================================"
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo ""

# Check dependencies first
echo "📦 Checking dependencies..."
node -e "
try {
  require('express'); console.log('✅ express');
  require('googleapis'); console.log('✅ googleapis');
  require('openai'); console.log('✅ openai');
  require('firebase-admin'); console.log('✅ firebase-admin');
  console.log('✅ All dependencies OK');
} catch (error) {
  console.log('❌ Missing dependency:', error.message);
  process.exit(1);
}
"

# Check custom services
echo ""
echo "🔧 Checking custom services..."
node -e "
try {
  require('./services/gmail-sync-engine'); console.log('✅ gmail-sync-engine');
  require('./services/email-decoder-engine'); console.log('✅ email-decoder-engine');
  require('./services/email-intelligence-firestore'); console.log('✅ email-intelligence-firestore');
  require('./services/commerce-intelligence'); console.log('✅ commerce-intelligence');
  console.log('✅ All services OK');
} catch (error) {
  console.log('❌ Service error:', error.message);
  process.exit(1);
}
"

# Kill any existing server
echo ""
echo "🧹 Cleaning up any existing servers..."
pkill -f "node homeops-with-email.js" 2>/dev/null || true
sleep 1

# Start the server with error capture
echo ""
echo "🚀 Starting Email Intelligence Server..."
echo "   → Gmail Sync Engine: Ready"
echo "   → Email Decoder Engine: Ready"
echo "   → Firebase Integration: Ready" 
echo "   → Commerce Intelligence: Ready"
echo ""
echo "Starting on port 3000..."

# Start server and capture output
node homeops-with-email.js 2>&1 &
SERVER_PID=$!

# Wait and check if it started successfully
sleep 3
if kill -0 $SERVER_PID 2>/dev/null && lsof -i :3000 >/dev/null 2>&1; then
    echo ""
    echo "🎉 SUCCESS! Email Intelligence Server is running!"
    echo "==============================================="
    echo "🌐 Main App: http://localhost:3000"
    echo "📧 Gmail OAuth: http://localhost:3000/auth/gmail"
    echo "🛍️ Commerce Intelligence: Ready for queries"
    echo "� Complete Pipeline: Ready for email analysis"
    echo ""
    echo "📱 Test Commands:"
    echo "curl http://localhost:3000/api/gmail-status"
    echo "curl -X POST http://localhost:3000/api/commerce-intelligence -H 'Content-Type: application/json' -d '{\"query\":\"gift for brother\"}'"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "Server PID: $SERVER_PID"
    
    # Keep script running
    wait $SERVER_PID
else
    echo ""
    echo "❌ Server failed to start properly"
    echo "Checking for error output..."
    sleep 1
    
    # Try to get error output
    echo ""
    echo "🔍 Attempting direct start for error details:"
    node homeops-with-email.js
fi
