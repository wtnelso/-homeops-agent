#!/bin/bash

echo "🚀 Deploying HomeOps to Render..."

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "email-decoder-onboarding" ]; then
    echo "❌ You're not on the email-decoder-onboarding branch. Please switch to it first."
    echo "   git checkout email-decoder-onboarding"
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ You have uncommitted changes. Please commit them first."
    echo "   git add . && git commit -m 'Your commit message'"
    exit 1
fi

# Push to GitHub (this will trigger Render deployment)
echo "📤 Pushing to GitHub..."
git push origin email-decoder-onboarding

echo "✅ Deployment triggered!"
echo "🌐 Your app will be available at: https://homeops-backend.onrender.com"
echo "📊 Monitor deployment at: https://dashboard.render.com/web/homeops-backend"
echo ""
echo "⚠️  Don't forget to set up your environment variables in Render dashboard:"
echo "   - FIREBASE_API_KEY"
echo "   - FIREBASE_AUTH_DOMAIN" 
echo "   - FIREBASE_PROJECT_ID"
echo "   - FIREBASE_STORAGE_BUCKET"
echo "   - FIREBASE_MESSAGING_SENDER_ID"
echo "   - FIREBASE_APP_ID"
echo "   - FIREBASE_MEASUREMENT_ID"
echo "   - FIREBASE_PRIVATE_KEY"
echo "   - FIREBASE_CLIENT_EMAIL"
echo "   - OPENAI_API_KEY"
echo "   - GMAIL_CLIENT_ID"
echo "   - GMAIL_CLIENT_SECRET" 