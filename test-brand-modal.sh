#!/bin/bash

echo "🧪 Testing Brand Customization Modal..."

# Test the brand preferences API
echo "📡 Testing brand preferences API..."
curl -X POST http://localhost:3000/api/user/brand-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-modal-user",
    "customizationText": "I love Apple, Nike, Target, and Starbucks. I have two kids ages 6 and 9. I am interested in fitness, tech, and cooking. I prefer quality items but am budget-conscious.",
    "updatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")'"
  }' | jq '.'

echo -e "\n📥 Retrieving saved preferences..."
curl -s "http://localhost:3000/api/user/brand-preferences?userId=test-modal-user" | jq '.'

echo -e "\n✅ Brand customization modal API tests complete!"
echo "🌐 Now test the modal in the browser at: http://localhost:3000/app"
echo "   1. Click the Commerce tile"
echo "   2. Click 'Customize Brands' button"  
echo "   3. The modal should open with:"
echo "      - Open text field for preferences"
echo "      - Brand suggestions from emails (if available)"
echo "      - Save/Cancel buttons"
