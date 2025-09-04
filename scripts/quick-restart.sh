#!/bin/bash
echo "🔄 Stopping any existing servers..."
pkill -f "node.*homeops" || true
sleep 2

echo "🚀 Starting enhanced HomeOps server..."
cd /Users/oliverbaron/-homeops-agent
node homeops-with-email-WORKING-BACKUP.js &

echo "⏳ Waiting for server to start..."
sleep 3

echo "🧪 Testing API..."
curl -s "http://localhost:3000/api/calibration-data" | head -c 500

echo ""
echo "📱 Server should now be running at http://localhost:3000"
echo "🔍 Debug page: http://localhost:3000/api-debug-test.html"
echo "🎯 Calibration page: http://localhost:3000/calibrate.html"
