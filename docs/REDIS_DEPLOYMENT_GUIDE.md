# Redis Deployment Guide for Email Processing Queue

## Overview

This guide explains how to deploy Redis-based queuing for the email processing system. The current code supports Redis with automatic fallback to in-memory queuing.

**Current Status**: ✅ Code implemented, ⏸️ Redis not deployed (fallback mode active)

---

## 🚀 Quick Start (When Ready to Deploy)

### Step 1: Install Dependencies
```bash
cd server
npm install bullmq ioredis node-cron
```

### Step 2: Choose Redis Hosting Option
Pick one of the options below based on your needs and budget.

### Step 3: Set Environment Variables
```bash
# Add to .env file
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

### Step 4: Restart Server
The system will automatically detect Redis and switch from fallback mode.

---

## 📊 Redis Hosting Options

### 🥉 **Development/Testing ($0-5/month)**

**1. Railway Redis**
- **Cost**: $5/month
- **Memory**: 1GB
- **Setup**: 1-click deployment
- **Good for**: Development, testing, early production

```bash
# Railway setup
railway login
railway create your-app-redis
railway add redis
# Copy connection details to .env
```

**2. Render Redis**
- **Cost**: $7/month
- **Memory**: 1GB
- **Setup**: Simple web interface
- **Good for**: Render ecosystem integration

**3. Local Redis (Free)**
```bash
# For development only
docker run -d -p 6379:6379 redis:alpine
# Or install locally: brew install redis (macOS)
```

### 🥈 **Production Scale ($15-50/month)**

**4. Redis Cloud (Recommended)**
- **Cost**: $15-30/month
- **Memory**: 1-5GB
- **Features**: Automatic backups, monitoring, scaling
- **Good for**: Production workloads
- **Setup**: https://redis.com/redis-enterprise-cloud/

**5. AWS ElastiCache**
- **Cost**: $20-50/month
- **Memory**: 1-5GB
- **Features**: AWS integration, VPC support
- **Good for**: Existing AWS infrastructure

**6. DigitalOcean Managed Redis**
- **Cost**: $15-35/month
- **Memory**: 1-4GB
- **Features**: Simple pricing, good performance
- **Good for**: Straightforward deployments

### 🥇 **Enterprise Scale ($100+/month)**

**7. AWS ElastiCache (Multi-AZ)**
- **Cost**: $100+/month
- **Features**: High availability, automatic failover
- **Good for**: Mission-critical applications

**8. Redis Enterprise**
- **Cost**: Custom pricing
- **Features**: Multi-cloud, advanced security
- **Good for**: Large scale enterprise

---

## 🔧 Implementation Details

### Current Queue Architecture
```javascript
// 3 separate queues with different priorities
const queues = {
  'onboarding-emails': {
    concurrency: 1,        // Only 1 onboarding at a time
    priority: 10,          // Highest priority
    rateLimiter: '1/minute' // Max 1 job per minute
  },
  'daily-emails': {
    concurrency: 3,        // Up to 3 daily jobs
    priority: 5,           // Normal priority
    rateLimiter: '5/minute' // Max 5 jobs per minute
  },
  'priority-emails': {
    concurrency: 2,        // Up to 2 priority jobs
    priority: 20,          // Highest priority
    rateLimiter: '10/minute' // Max 10 jobs per minute
  }
};
```

### Automatic Job Retry Logic
```javascript
const retryConfig = {
  onboarding: {
    attempts: 3,
    backoff: 'exponential', // 5s, 10s, 20s
    removeOnComplete: 10,   // Keep last 10 jobs
    removeOnFail: 20       // Keep last 20 failed jobs
  },
  daily: {
    attempts: 2,           // Fewer retries for daily jobs
    backoff: 'exponential',
    removeOnComplete: 50,   // Keep more history
    removeOnFail: 50
  }
};
```

### Built-in Cron Jobs
```javascript
// Automatically schedules daily processing at 2:00 AM
await dailyQueue.add('daily-cron-job',
  { type: 'daily-processing' },
  {
    repeat: { cron: '0 2 * * *' },
    jobId: 'daily-cron' // Prevents duplicates
  }
);
```

---

## 📈 Performance Benefits vs Current System

### Current In-Memory Queue
```
❌ Jobs lost on server restart
❌ No retry logic for failed emails
❌ Basic priority system
❌ Manual cron job management
❌ No job monitoring/admin UI
❌ Single server limitation
```

### Redis Queue System
```
✅ Persistent jobs (survive restarts)
✅ Automatic retry with exponential backoff
✅ Advanced priority queues
✅ Built-in cron scheduling
✅ BullBoard admin UI for monitoring
✅ Horizontal scaling (multiple workers)
✅ Rate limiting and concurrency control
✅ Job progress tracking
✅ Automatic cleanup of old jobs
```

---

## 🔍 Monitoring & Admin UI

### BullBoard Dashboard (Optional)
```bash
npm install @bull-board/express @bull-board/ui
```

```javascript
// Add to server for job monitoring dashboard
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [
    new BullMQAdapter(onboardingQueue),
    new BullMQAdapter(dailyQueue),
    new BullMQAdapter(priorityQueue)
  ],
  serverAdapter
});

// Access dashboard at: /admin/queues
serverAdapter.setBasePath('/admin/queues');
app.use('/admin/queues', serverAdapter.getRouter());
```

**Dashboard Features**:
- Real-time job monitoring
- View failed jobs and retry them
- See job progress and logs
- Monitor queue health and performance
- Manual job management

---

## 💰 Cost Analysis

### Redis Memory Usage Estimates
```
Job data per email: ~1KB (metadata, status, progress)
1000 email onboarding job: ~1MB
Daily jobs (50 emails avg): ~50KB each
Job retention (last 50 jobs): ~5MB total

Recommended Redis size:
- Development: 256MB-512MB ($5-10/month)
- Production: 1GB-2GB ($15-30/month)
- High volume: 4GB+ ($50+/month)
```

### Monthly Cost Breakdown
| User Count | Redis Size | Monthly Cost | Benefits |
|------------|------------|--------------|----------|
| 1-10 | 512MB | $5-10 | Job persistence, retry logic |
| 10-50 | 1GB | $15-25 | + Cron jobs, monitoring |
| 50-200 | 2GB | $25-40 | + Multiple workers, scaling |
| 200+ | 4GB+ | $50+ | + High availability, enterprise features |

---

## 🚨 Migration Plan (When Ready)

### Phase 1: Setup Redis (1 hour)
1. Choose Redis hosting provider
2. Create Redis instance
3. Add environment variables
4. Test connection

### Phase 2: Deploy Code (15 minutes)
1. `npm install bullmq ioredis`
2. Deploy updated server code
3. Verify automatic Redis detection

### Phase 3: Monitor & Validate (1 week)
1. Monitor job processing
2. Verify retry logic works
3. Test daily cron jobs
4. Check dashboard metrics

### Phase 4: Optimize (ongoing)
1. Tune concurrency settings
2. Adjust retry policies
3. Monitor Redis memory usage
4. Scale as needed

---

## 🔧 Environment Variables Reference

```bash
# Redis Connection (required)
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
REDIS_DB=0

# Redis URL Format (alternative)
REDIS_URL=redis://user:password@host:port/db

# Optional Redis Settings
REDIS_TLS=true                    # For secure connections
REDIS_MAX_RETRIES_PER_REQUEST=3   # Connection retry limit
REDIS_CONNECT_TIMEOUT=5000        # Connection timeout (ms)
REDIS_LAZY_CONNECT=true           # Connect only when needed

# Queue Configuration (optional)
QUEUE_ONBOARDING_CONCURRENCY=1    # Max concurrent onboarding jobs
QUEUE_DAILY_CONCURRENCY=3         # Max concurrent daily jobs
QUEUE_PRIORITY_CONCURRENCY=2      # Max concurrent priority jobs
```

---

## 🐛 Troubleshooting

### Common Issues

**1. "Redis connection failed"**
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Check environment variables
echo $REDIS_HOST
echo $REDIS_PASSWORD
```

**2. "BullMQ not found"**
```bash
# Install dependencies
npm install bullmq ioredis
# Restart server
```

**3. "Jobs not processing"**
```bash
# Check worker status in logs
# Look for: "Created BullMQ workers with concurrency limits"

# Check Redis memory usage
redis-cli info memory
```

**4. "Cron jobs not running"**
```bash
# Check scheduler in logs
# Look for: "Setup daily cron job scheduler (2:00 AM)"

# Manually trigger cron job for testing
redis-cli EVAL "return redis.call('ZADD', 'bull:daily-emails:repeat', 0, 'daily-cron')" 0
```

---

## 🎯 Summary

**Current State**:
- ✅ Redis queue code implemented
- ✅ Automatic fallback to in-memory queue
- ✅ Ready for Redis deployment when needed

**Next Steps**:
1. Choose Redis hosting option based on budget
2. Set environment variables
3. Install `bullmq` and `ioredis` packages
4. System automatically switches to Redis mode

**Benefits When Deployed**:
- Jobs survive server restarts
- Automatic retry of failed email processing
- Built-in daily processing cron jobs
- Better monitoring and debugging
- Horizontal scaling capability

The system is production-ready for Redis deployment whenever you're ready to make the investment!