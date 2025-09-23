# Render.com Deployment Guide

## Quick Deployment Steps

1. **Connect GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `server` directory as root directory

2. **Configure Service**
   - **Name**: `homeops-email-processor`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Starter ($7/month)

3. **Environment Variables**
   Create a new Environment Group called `homeops-secrets` with:
   ```
   FRONTEND_URL=https://dev.homeops.ai
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_KEY=your-supabase-service-key  
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Test health check: `https://your-app.onrender.com/health`

## Service URLs After Deployment
- **Health Check**: `https://your-app.onrender.com/health`
- **Email Processing**: `https://your-app.onrender.com/api/embeddings/process`
- **Job Status**: `https://your-app.onrender.com/api/embeddings/status`

## Update Vercel API Endpoints
After deployment, update these Vercel API files to call Render instead of Edge Functions:

1. **`/api/email-embeddings/start.js`**
   ```javascript
   // Replace Supabase Edge Function call with:
   const renderResponse = await fetch(`${process.env.RENDER_SERVER_URL}/api/embeddings/process`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(jobData)
   });
   ```

2. **Add Environment Variable to Vercel**
   ```
   RENDER_SERVER_URL=https://your-app.onrender.com
   ```

## Monitoring & Logs
- **Render Dashboard**: Real-time logs and metrics
- **Health Endpoint**: Automated uptime monitoring
- **Error Handling**: Structured error responses with timestamps

## Auto-Deploy Setup
- Render auto-deploys on git push to main branch
- Manual deploys available via dashboard
- Rollback available for previous deployments