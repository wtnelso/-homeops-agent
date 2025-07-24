#!/bin/bash

# HomeOps Email Intelligence API Test Script
# Run after starting server: node server.js

echo "🧪 HomeOps Email Intelligence API Tests"
echo "======================================="

BASE_URL="http://localhost:3000"

echo ""
echo "📊 1. Test Gmail Status"
curl -s "$BASE_URL/api/gmail-status" | jq '.' || echo "Response: $(curl -s $BASE_URL/api/gmail-status)"

echo ""
echo "🛍️ 2. Test Commerce Intelligence (Basic)"
curl -s -X POST "$BASE_URL/api/commerce-intelligence" \
  -H "Content-Type: application/json" \
  -d '{"query":"I need a gift for my brother"}' | jq '.success, .strategy' || echo "Request sent"

echo ""
echo "📧 3. Test Gmail Sync (requires Gmail OAuth first)"
echo "   → First visit: $BASE_URL/auth/gmail"
echo "   → Then run: curl -X POST $BASE_URL/api/gmail-sync -H 'Content-Type: application/json' -d '{\"maxEmails\":100}'"

echo ""
echo "💾 4. Test Complete Pipeline (requires Gmail OAuth + userId)"
echo "   → curl -X POST $BASE_URL/api/complete-email-intelligence -H 'Content-Type: application/json' -d '{\"userId\":\"test-user\",\"maxEmails\":500}'"

echo ""
echo "📱 5. Test User Dashboard (after pipeline completion)"
echo "   → curl $BASE_URL/api/email-intelligence-dashboard/test-user"

echo ""
echo "🎯 Quick Start:"
echo "1. node server.js"
echo "2. Open: $BASE_URL/auth/gmail"
echo "3. Complete OAuth flow"
echo "4. Run: curl -X POST $BASE_URL/api/complete-email-intelligence -H 'Content-Type: application/json' -d '{\"userId\":\"test-user\",\"maxEmails\":500}'"
echo ""
