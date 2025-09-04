#!/bin/bash

echo "🔑 HomeOps Deployment Keys"
echo "=========================="
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "📄 Found .env file"
    echo ""
    echo "🔑 OPENAI_API_KEY:"
    grep "OPENAI_API_KEY=" .env | cut -d'=' -f2-
    echo ""
    echo "🔑 FIREBASE_CREDENTIALS (base64):"
    grep "FIREBASE_CREDENTIALS=" .env | cut -d'=' -f2-
    echo ""
else
    echo "❌ No .env file found"
    echo ""
    echo "📝 You need to create a .env file with:"
    echo "OPENAI_API_KEY=your_openai_key_here"
    echo "FIREBASE_CREDENTIALS=your_base64_encoded_firebase_credentials"
    echo ""
fi

# Check if Firebase service account file exists
if [ -f "homeops-sa-key.json" ]; then
    echo "📄 Found Firebase service account file"
    echo ""
    echo "🔑 To get FIREBASE_CREDENTIALS, run this command:"
    echo "base64 -i homeops-sa-key.json"
    echo ""
    echo "📋 Or use this one-liner to copy to clipboard:"
    echo "base64 -i homeops-sa-key.json | pbcopy"
    echo ""
else
    echo "❌ No Firebase service account file found"
fi

echo "🌐 For Render deployment, you need:"
echo "1. OPENAI_API_KEY - from your OpenAI account"
echo "2. FIREBASE_CREDENTIALS - base64 encoded service account"
echo ""
echo "💡 If you don't have the OpenAI key, get it from:"
echo "https://platform.openai.com/api-keys"
echo "" 