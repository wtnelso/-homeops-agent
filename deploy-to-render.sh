#!/bin/bash

echo "🚀 HomeOps Backend Deployment to Render"
echo "========================================"

echo ""
echo "📋 Prerequisites:"
echo "1. You need a Render account (https://render.com)"
echo "2. Your GitHub repository should be connected to Render"
echo "3. Environment variables should be set in Render"
echo ""

echo "🔧 Environment Variables needed in Render:"
echo "- OPENAI_API_KEY: Your OpenAI API key"
echo "- FIREBASE_CREDENTIALS: Base64 encoded Firebase service account"
echo ""

echo "📝 Steps to deploy:"
echo "1. Go to https://render.com"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repo: oliverbaron/homeops-agent"
echo "4. Configure:"
echo "   - Name: homeops-backend"
echo "   - Environment: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: node index.cjs"
echo "   - Plan: Free"
echo "5. Add environment variables"
echo "6. Click 'Create Web Service'"
echo ""

echo "🌐 After deployment:"
echo "1. Copy the Render URL (e.g., https://homeops-backend.onrender.com)"
echo "2. Update public/config.js with the backend URL"
echo "3. Run: firebase deploy"
echo ""

echo "✅ Your app will be available at: https://homeops-web.web.app"
echo "" 