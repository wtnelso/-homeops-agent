# HomeOps Deployment Guide

## Backend Deployment (Render)

Your frontend is already deployed to Firebase Hosting at: https://homeops-web.web.app

Now you need to deploy the backend to Render:

### Step 1: Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account
3. Connect your GitHub repository

### Step 2: Deploy Backend Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `oliverbaron/homeops-agent`
3. Configure the service:
   - **Name**: `homeops-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.cjs`
   - **Plan**: Free

### Step 3: Add Environment Variables
Add these environment variables in Render:
- `OPENAI_API_KEY`: Your OpenAI API key
- `FIREBASE_CREDENTIALS`: The base64 encoded Firebase service account (already in your .env file)

### Step 4: Deploy
Click "Create Web Service" and wait for deployment.

### Step 5: Update Frontend Configuration
Once deployed, Render will give you a URL like: `https://homeops-backend.onrender.com`

Update `public/config.js` with the correct backend URL.

### Step 6: Redeploy Frontend
Run `firebase deploy` to update the frontend with the correct backend URL.

## Current Status
- ✅ Frontend: Deployed to Firebase Hosting
- ❌ Backend: Needs deployment to Render
- ❌ API Calls: Currently failing because backend is not deployed

## Testing
After deployment, visit: https://homeops-web.web.app 