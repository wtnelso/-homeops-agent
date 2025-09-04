# HomeOps Deployment to Render

## 🚀 Quick Deploy

1. **Set up Render account** (if not already done):
   - Go to [render.com](https://render.com)
   - Sign up with your GitHub account

2. **Connect your repository**:
   - In Render dashboard, click "New +" → "Web Service"
   - Connect to GitHub repository: `oliverbaron/homeops-agent`
   - Select branch: `email-decoder-onboarding`

3. **Configure the service**:
   - **Name**: `homeops-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid for better performance)

4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   PORT=10000
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   FIREBASE_APP_ID=your_firebase_app_id
   FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   OPENAI_API_KEY=your_openai_api_key
   GMAIL_CLIENT_ID=your_gmail_client_id
   GMAIL_CLIENT_SECRET=your_gmail_client_secret
   GMAIL_REDIRECT_URI=https://homeops-backend.onrender.com/auth/google/callback
   ```

5. **Deploy**:
   ```bash
   ./deploy-to-render.sh
   ```

## 🔧 Manual Deployment

If you prefer to deploy manually:

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin email-decoder-onboarding
   ```

2. **Monitor deployment**:
   - Go to [Render Dashboard](https://dashboard.render.com/web/homeops-backend)
   - Watch the build and deployment logs

## 🌐 After Deployment

Your app will be available at:
- **Backend API**: `https://homeops-backend.onrender.com`
- **Frontend**: `https://homeops-web.web.app` (Firebase Hosting)

## 🔄 Continuous Deployment

Render will automatically deploy when you push to the `email-decoder-onboarding` branch.

## 🛠️ Troubleshooting

### Common Issues:

1. **Build fails**:
   - Check the build logs in Render dashboard
   - Ensure all dependencies are in `package.json`

2. **Environment variables missing**:
   - Verify all required env vars are set in Render dashboard
   - Check the deployment logs for missing variable errors

3. **App crashes on startup**:
   - Check the runtime logs in Render dashboard
   - Verify Firebase credentials are correct

4. **Gmail OAuth issues**:
   - Update Gmail OAuth redirect URI to: `https://homeops-backend.onrender.com/auth/google/callback`
   - Ensure Gmail API is enabled in Google Cloud Console

### Performance Tips:

1. **Upgrade to paid plan** for better performance
2. **Enable auto-scaling** for high traffic
3. **Use CDN** for static assets

## 📊 Monitoring

- **Logs**: Available in Render dashboard
- **Metrics**: CPU, memory, and response time monitoring
- **Health checks**: Automatic health check at `/` endpoint

## 🔒 Security

- All environment variables are encrypted
- HTTPS is automatically enabled
- No sensitive data in code repository

## 🎯 Benefits of Render Deployment

✅ **No more local server crashes**  
✅ **24/7 availability**  
✅ **Automatic scaling**  
✅ **SSL certificates included**  
✅ **Easy environment variable management**  
✅ **Continuous deployment**  
✅ **Built-in monitoring**  

## Current Status
- ✅ Frontend: Deployed to Firebase Hosting
- ❌ Backend: Needs deployment to Render
- ❌ API Calls: Currently failing because backend is not deployed

## Testing
After deployment, visit: https://homeops-web.web.app 