/**
 * Health Check Routes
 * 
 * Provides health and readiness checks for the email processing server.
 * Used by Render.com and monitoring systems to verify service status.
 */

import express from 'express';
import { optionalJWT } from '../middleware/authMiddleware.js';
import { getHealthMonitor } from '../services/toolHealthMonitor.js';

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

// Tool health monitoring endpoint
router.get('/tools', optionalJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const healthMonitor = getHealthMonitor();
    const toolsHealth = await healthMonitor.getAllToolsHealth();

    res.json({
      success: true,
      user_id: userId,
      tools_health: toolsHealth,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve health data',
      details: error.message
    });
  }
});

export default router;