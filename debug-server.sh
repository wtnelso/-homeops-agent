#!/bin/bash

echo "🔍 Debugging server startup..."

# Test each service file individually
echo "Testing service files..."

echo "1. Testing commerce-intelligence..."
node -e "try { require('./services/commerce-intelligence'); console.log('✅ commerce-intelligence OK'); } catch(e) { console.log('❌ commerce-intelligence ERROR:', e.message); }"

echo "2. Testing gmail-sync-engine..."
node -e "try { require('./services/gmail-sync-engine'); console.log('✅ gmail-sync-engine OK'); } catch(e) { console.log('❌ gmail-sync-engine ERROR:', e.message); }"

echo "3. Testing email-decoder-engine..."
node -e "try { require('./services/email-decoder-engine'); console.log('✅ email-decoder-engine OK'); } catch(e) { console.log('❌ email-decoder-engine ERROR:', e.message); }"

echo "4. Testing email-intelligence-firestore..."
node -e "try { require('./services/email-intelligence-firestore'); console.log('✅ email-intelligence-firestore OK'); } catch(e) { console.log('❌ email-intelligence-firestore ERROR:', e.message); }"

echo "5. Testing d2c-brands data..."
node -e "try { require('./data/d2c-brands'); console.log('✅ d2c-brands OK'); } catch(e) { console.log('❌ d2c-brands ERROR:', e.message); }"

echo ""
echo "Now testing server.js startup..."
node server.js
