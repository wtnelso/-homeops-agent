#!/bin/bash

echo "🔧 HomeOps Environment Variables for Render"
echo "==========================================="
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "📄 Found .env file"
    echo ""
    echo "🔑 Environment Variables for Render:"
    echo ""
    
    # Extract Firebase config variables
    echo "FIREBASE_API_KEY=$(grep 'FIREBASE_API_KEY=' .env | cut -d'=' -f2-)"
    echo "FIREBASE_AUTH_DOMAIN=$(grep 'FIREBASE_AUTH_DOMAIN=' .env | cut -d'=' -f2-)"
    echo "FIREBASE_PROJECT_ID=$(grep 'FIREBASE_PROJECT_ID=' .env | cut -d'=' -f2-)"
    echo "FIREBASE_STORAGE_BUCKET=$(grep 'FIREBASE_STORAGE_BUCKET=' .env | cut -d'=' -f2-)"
    echo "FIREBASE_MESSAGING_SENDER_ID=$(grep 'FIREBASE_MESSAGING_SENDER_ID=' .env | cut -d'=' -f2-)"
    echo "FIREBASE_APP_ID=$(grep 'FIREBASE_APP_ID=' .env | cut -d'=' -f2-)"
    echo "FIREBASE_MEASUREMENT_ID=$(grep 'FIREBASE_MEASUREMENT_ID=' .env | cut -d'=' -f2-)"
    echo ""
    echo "OPENAI_API_KEY=$(grep 'OPENAI_API_KEY=' .env | cut -d'=' -f2-)"
    echo ""
    echo "FIREBASE_CREDENTIALS=$(grep 'FIREBASE_CREDENTIALS=' .env | cut -d'=' -f2-)"
    echo ""
else
    echo "❌ No .env file found"
    echo ""
    echo "📝 You need to create a .env file with these variables:"
    echo "FIREBASE_API_KEY=your_firebase_api_key"
    echo "FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com"
    echo "FIREBASE_PROJECT_ID=your_project_id"
    echo "FIREBASE_STORAGE_BUCKET=your_project.appspot.com"
    echo "FIREBASE_MESSAGING_SENDER_ID=your_sender_id"
    echo "FIREBASE_APP_ID=your_app_id"
    echo "FIREBASE_MEASUREMENT_ID=your_measurement_id"
    echo "OPENAI_API_KEY=your_openai_key"
    echo "FIREBASE_CREDENTIALS=your_base64_encoded_credentials"
fi

echo ""
echo "📋 Steps to fix:"
echo "1. Copy the environment variables above"
echo "2. Go to your Render dashboard"
echo "3. Select your homeops-backend service"
echo "4. Go to Environment tab"
echo "5. Add each variable with its value"
echo "6. Redeploy the service"
echo ""
echo "🔗 Render Dashboard: https://dashboard.render.com" 