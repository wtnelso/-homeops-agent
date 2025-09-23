# Render.com Migration Plan for Email Processing

## Overview
Migrate long-running LangChain/OpenAI email processing from Supabase Edge Functions to Render.com for better performance and no time limits.

## 🏗️ Proposed Architecture
```
Frontend (Vercel) → API Endpoints (Vercel) → Background Server (Render.com)
                                           → Database (Supabase)
```

**Benefits:**
- ✅ Keep fast API endpoints on Vercel
- ✅ Long-running AI processing on Render.com
- ✅ WebSocket support for real-time updates
- ✅ No serverless time limits
- ✅ Better cost control for AI processing

## 📋 Step-by-Step Migration Plan

### Phase 1: Server Setup (1-2 hours)
```bash
# 1. Create server directory
mkdir server
cd server

# 2. Initialize Node.js project
npm init -y

# 3. Install core dependencies
npm install express cors dotenv
npm install @langchain/core @langchain/openai @neondatabase/serverless
npm install @supabase/supabase-js uuid

# 4. Optional: Job queue (can skip initially)
# npm install bull redis
```

### Phase 2: Server Structure
```
server/
├── src/
│   ├── index.js              # Express server entry point
│   ├── routes/
│   │   ├── embeddings.js     # Email embedding routes
│   │   └── health.js         # Health check
│   ├── services/
│   │   ├── emailProcessor.js # LangChain email processing
│   │   ├── gmailService.js   # Gmail API integration
│   │   └── queueService.js   # Job queue (optional initially)
│   ├── workers/
│   │   └── embeddingWorker.js # Background processing worker
│   └── config/
│       └── database.js       # Supabase client
├── package.json
├── Dockerfile               # For Render deployment
└── render.yaml             # Render configuration
```

### Phase 3: Code Migration

#### A. Server Entry Point (`server/src/index.js`):
```javascript
import express from 'express';
import cors from 'cors';
import embeddingRoutes from './routes/embeddings.js';
import healthRoutes from './routes/health.js';

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

app.use('/api/embeddings', embeddingRoutes);
app.use('/health', healthRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Email processing server running on port ${PORT}`);
});
```

#### B. Background Processing (`server/src/workers/embeddingWorker.js`):
```javascript
// Move your LangChain processing logic here
// Long-running email analysis, theme detection, etc.
import { EmailEmbeddingProcessor } from '../services/emailProcessor.js';

export class EmbeddingWorker {
  static async processEmailJob(jobData) {
    const { job_id, account_id, batch_type } = jobData;
    
    try {
      // Update job status to processing
      await this.updateJobStatus(job_id, 'processing');
      
      // Process emails with LangChain
      const processor = new EmailEmbeddingProcessor();
      await processor.processEmails(jobData);
      
      // Update job status to completed
      await this.updateJobStatus(job_id, 'completed');
      
    } catch (error) {
      await this.updateJobStatus(job_id, 'failed', error.message);
    }
  }
}
```

### Phase 4: Render.com Deployment

#### A. Create `render.yaml` (Basic - No Redis):
```yaml
services:
  - type: web
    name: homeops-email-processor
    env: node
    plan: starter  # $7/month
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: SUPABASE_URL
        fromSecret: SUPABASE_URL
      - key: SUPABASE_SERVICE_KEY
        fromSecret: SUPABASE_SERVICE_KEY
      - key: OPENAI_API_KEY
        fromSecret: OPENAI_API_KEY
      - key: NEON_DATABASE_URL
        fromSecret: NEON_DATABASE_URL

# Optional Redis (can add later):
# - type: redis
#   name: homeops-redis
#   plan: starter  # $7/month for job queue
```

#### B. Update Vercel API to call Render:
```javascript
// In api/email-embeddings/start.js
// Replace Supabase Edge Function call with Render server call

// OLD:
// const { data, error } = await supabase.functions.invoke('process-email-embeddings', {...});

// NEW:
const response = await fetch(`${process.env.RENDER_SERVER_URL}/api/embeddings/process`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.RENDER_API_KEY}` // Optional auth
  },
  body: JSON.stringify({ job_id, account_id, batch_type, processing_options })
});

const data = await response.json();
if (!response.ok) {
  throw new Error(`Render server error: ${data.error}`);
}
```

### Phase 5: Environment Variables

#### Add to Vercel:
```bash
RENDER_SERVER_URL=https://homeops-email-processor.onrender.com
RENDER_API_KEY=your-optional-api-key
```

#### Add to Render:
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=your-openai-key
NEON_DATABASE_URL=your-neon-db-url
PORT=10000
```

## 💰 Cost Analysis

### Render.com Pricing:
- **Starter Plan**: $7/month (512MB RAM, 0.1 CPU) - Good for testing
- **Standard Plan**: $25/month (2GB RAM, 1 CPU) - Recommended for production
- **Pro Plan**: $85/month (4GB RAM, 2 CPU) - For heavy processing
- **Redis**: $7/month (25MB cache) - Optional for job queues

**Recommended Start**: Starter Plan ($7/month) and upgrade as needed.

## 🔄 Redis - Do You Need It?

### **You CAN start without Redis:**
- ✅ Simpler setup initially
- ✅ Lower cost ($7/month saved)
- ✅ Direct job processing works fine
- ✅ Database polling for job status updates

### **Add Redis later when you need:**
- 🚀 **Job queues** - Handle multiple concurrent processing jobs
- 🚀 **Retry logic** - Automatic retry of failed jobs
- 🚀 **Priority queues** - Process urgent emails first
- 🚀 **Rate limiting** - Control OpenAI API usage
- 🚀 **Caching** - Store frequently accessed data

### **Without Redis Alternative:**
```javascript
// Simple in-memory job processing (fine for single server)
class SimpleJobProcessor {
  constructor() {
    this.activeJobs = new Map();
  }
  
  async processJob(jobData) {
    this.activeJobs.set(jobData.job_id, jobData);
    try {
      await this.runEmailProcessing(jobData);
    } finally {
      this.activeJobs.delete(jobData.job_id);
    }
  }
}
```

## 📊 Migration Timeline

- **Day 1**: Set up server structure and basic Express app
- **Day 2**: Migrate LangChain processing logic from Edge Function
- **Day 3**: Test Gmail integration and email processing locally
- **Day 4**: Deploy to Render and test integration
- **Day 5**: Update Vercel APIs to call Render server
- **Day 6**: Add Redis/job queue (optional)

## 🎯 Benefits After Migration

✅ **No time limits** - Process thousands of emails without timeout  
✅ **Better debugging** - Full server logs and error handling  
✅ **Scalable** - Easy to upgrade server resources  
✅ **Cost-effective** - Predictable monthly pricing  
✅ **Real-time updates** - WebSocket support possible  
✅ **Better Gmail integration** - No Edge Function limitations  
✅ **Job persistence** - Jobs survive server restarts (with Redis)  

## 🔧 Current Status

- [ ] Phase 1: Server setup
- [ ] Phase 2: Code structure  
- [ ] Phase 3: Migrate processing logic
- [ ] Phase 4: Deploy to Render
- [ ] Phase 5: Update Vercel integration
- [ ] Phase 6: Add Redis (optional)

## 📝 Notes

- Start without Redis for simplicity
- Can add Redis later for job queues and caching
- Keep Vercel for fast API endpoints and frontend
- Render handles all long-running AI processing
- Database stays on Supabase (no migration needed)

---

**Next Steps**: 
1. Create server directory structure
2. Set up basic Express app
3. Test local development setup