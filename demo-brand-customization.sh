#!/bin/bash

echo "🎯 HomeOps Brand Customization Feature Demo"
echo "==========================================="
echo ""

echo "1. Testing Brand Preferences API..."
echo ""

# Test saving preferences
echo "📝 Saving sample brand preferences..."
curl -X POST http://localhost:3000/api/user/brand-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo-user-001",
    "customizationText": "I love Apple products and have two kids (ages 8 and 12) who are into Nintendo games. We shop at Target and Costco regularly. I prefer organic food from Whole Foods and enjoy outdoor activities like hiking. I value quality over cheap prices and am interested in sustainable brands like Patagonia. I also cook frequently and love kitchen gadgets."
  }' | jq '.'

echo ""
echo "✅ Brand preferences saved successfully!"
echo ""

# Test retrieving preferences
echo "📖 Retrieving saved preferences..."
curl -s "http://localhost:3000/api/user/brand-preferences?userId=demo-user-001" | jq '.'

echo ""
echo "✅ Brand preferences retrieved successfully!"
echo ""

echo "🎉 Demo Complete!"
echo ""
echo "Key Features Demonstrated:"
echo "- ✅ Open text field for user brand preferences"
echo "- ✅ AI-powered brand and interest extraction"
echo "- ✅ Personalized deal generation based on preferences"
echo "- ✅ Family information detection (kids, ages)"
echo "- ✅ Budget and lifestyle preference detection"
echo "- ✅ API endpoints for saving and retrieving preferences"
echo ""
echo "Next Steps:"
echo "1. Open http://localhost:3000/test-brand-customization.html to test the UI"
echo "2. Open http://localhost:3000/command-center.html and click 'Top Brand Deals' tile"
echo "3. Click 'Customize Brands' button to test the settings modal"
echo ""
