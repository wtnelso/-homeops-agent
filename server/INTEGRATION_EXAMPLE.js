/**
 * INTEGRATION EXAMPLE
 *
 * This file shows how to integrate the Redis queue system into your main server.
 * Copy the relevant parts into your existing server file.
 */

import express from 'express';
import { initializeServer, getQueueSystemStatus, triggerDailyProcessingManually } from './src/serverInit.js';
import { QueueManager } from './src/services/queueManager.js';
import { OnboardingService } from './src/services/onboardingService.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

/**
 * STEP 1: Initialize server with queue system
 */
async function startServer() {
  console.log('🚀 Starting HomeOps Email Processing Server...');

  try {
    // Initialize queue system (Redis or fallback)
    const initResult = await initializeServer();

    if (!initResult.success) {
      console.error('❌ Server initialization failed:', initResult.error);
      process.exit(1);
    }

    console.log(`✅ Server initialized with ${initResult.queueSystem.queueType} queue system`);

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🌐 Server running on port ${PORT}`);
      console.log(`📊 Queue status: /api/queue/status`);
      console.log(`🔧 Admin trigger: /api/admin/trigger-daily`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * STEP 2: API Routes for Queue Management
 */

// Start onboarding for a user
app.post('/api/onboarding/start', async (req, res) => {
  try {
    const { account_id, user_id } = req.body;

    console.log(`📋 Starting onboarding for account ${account_id}`);

    const result = await OnboardingService.startOnboardingAnalysis(account_id, user_id);

    res.json({
      success: true,
      job_id: result.job_id,
      status: result.status,
      estimated_cost: result.estimated_cost,
      estimated_time_minutes: result.estimated_time_minutes,
      queue_info: result.queue_info
    });

  } catch (error) {
    console.error('❌ Onboarding start failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get onboarding progress
app.get('/api/onboarding/progress/:account_id', async (req, res) => {
  try {
    const { account_id } = req.params;

    const progress = await OnboardingService.getOnboardingProgress(account_id);

    res.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('❌ Get progress failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Add daily processing job for an account
app.post('/api/daily/add', async (req, res) => {
  try {
    const { account_id } = req.body;

    const result = await QueueManager.addDailyJob({
      account_id,
      job_type: 'daily',
      batch_type: 'daily',
      email_limit: 200
    });

    res.json({
      success: true,
      job_id: result.job_id,
      queue_name: result.queue_name,
      position: result.position
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get queue system status (for monitoring)
app.get('/api/queue/status', async (req, res) => {
  try {
    const status = await getQueueSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin endpoint to manually trigger daily processing
app.post('/api/admin/trigger-daily', async (req, res) => {
  try {
    console.log('🔧 Admin triggered daily processing');
    const result = await triggerDailyProcessingManually();

    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const systemInfo = QueueManager.getSystemInfo();
  res.json({
    status: 'healthy',
    queue_system: systemInfo.queueType,
    redis_available: systemInfo.redisAvailable,
    timestamp: new Date().toISOString()
  });
});

/**
 * STEP 3: Start the server
 */
startServer().catch(error => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});

/**
 * EXAMPLE USAGE FROM FRONTEND:
 */

/*
// Start onboarding when user connects Gmail
async function startUserOnboarding(accountId, userId) {
  const response = await fetch('/api/onboarding/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      account_id: accountId,
      user_id: userId
    })
  });

  const result = await response.json();
  console.log('Onboarding started:', result);

  // Poll for progress
  const interval = setInterval(async () => {
    const progress = await fetch(`/api/onboarding/progress/${accountId}`);
    const data = await progress.json();

    console.log('Progress:', data.progress);

    if (data.progress.status === 'completed') {
      clearInterval(interval);
      console.log('Onboarding complete!');
    }
  }, 5000); // Check every 5 seconds
}

// Check queue system status
async function checkSystemStatus() {
  const response = await fetch('/api/queue/status');
  const status = await response.json();

  console.log('Queue System:', status.system.queueType);
  console.log('Redis Available:', status.system.redisAvailable);
  console.log('Queue Stats:', status.stats);
}
*/