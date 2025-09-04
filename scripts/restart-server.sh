#!/bin/bash

echo "🔄 Restarting HomeOps Server..."

# Kill any existing node processes
pkill -f "node.*homeops" 2>/dev/null || true
sleep 1

# Start the server
echo "🚀 Starting server..."
cd /Users/oliverbaron/-homeops-agent
nohup node homeops-with-email-WORKING-BACKUP.js > server-restart.log 2>&1 &

# Wait a moment for startup
sleep 3

# Test if server is responding
echo "🧪 Testing server..."
if curl -s "http://localhost:3000/api/calibration-data" > /dev/null; then
    echo "✅ Server is running at http://localhost:3000"
    echo "🔍 Test API: http://localhost:3000/api-test-direct.html"
    echo "🎯 Calibration: http://localhost:3000/calibrate.html"
else
    echo "❌ Server may not be responding yet"
    echo "📋 Check logs: tail -f server-restart.log"
fi
