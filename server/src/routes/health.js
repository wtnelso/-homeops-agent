/**
 * Health Check Routes
 * 
 * Provides health and readiness checks for the email processing server.
 * Used by Render.com and monitoring systems to verify service status.
 */

import express from 'express';

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'HomeOps Email Processing Server',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Detailed readiness check
router.get('/ready', async (req, res) => {
  try {
    // Check database connection
    // TODO: Add actual database connectivity check
    const checks = {
      server: 'healthy',
      database: 'checking...',
      openai: 'checking...',
      dependencies: 'healthy'
    };

    // For now, return basic readiness
    res.status(200).json({
      status: 'ready',
      checks,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe (minimal check)
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export default router;