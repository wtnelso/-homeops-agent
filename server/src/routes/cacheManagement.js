/**
 * Cache Management Routes
 *
 * API endpoints for managing response cache,
 * including invalidation and statistics.
 */

import express from 'express';
import responseCacheService from '../services/responseCacheService.js';
import { validateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * Get cache statistics
 */
router.get('/stats', validateJWT, async (req, res) => {
  try {
    const stats = await responseCacheService.getCacheStats();

    res.status(200).json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Cache stats error:', error);
    res.status(500).json({
      error: 'Failed to get cache statistics',
      message: error.message
    });
  }
});

/**
 * Clear specific cache patterns
 */
router.post('/invalidate', validateJWT, async (req, res) => {
  try {
    const { pattern } = req.body;
    const userId = req.user.id;

    if (!pattern) {
      return res.status(400).json({
        error: 'Missing pattern parameter',
        message: 'Provide a pattern to invalidate cache entries'
      });
    }

    // Add user ID to pattern for security
    const userPattern = `${userId}:${pattern}`;

    await responseCacheService.invalidateCache(userPattern);

    console.log(`🧹 User ${userId} invalidated cache pattern: ${pattern}`);

    res.status(200).json({
      success: true,
      message: `Cache invalidated for pattern: ${pattern}`,
      pattern: userPattern
    });
  } catch (error) {
    console.error('❌ Cache invalidation error:', error);
    res.status(500).json({
      error: 'Failed to invalidate cache',
      message: error.message
    });
  }
});

/**
 * Clear all cache for the authenticated user
 */
router.post('/clear', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Invalidate all cache entries for this user
    await responseCacheService.invalidateCache(userId);

    console.log(`🧹 User ${userId} cleared all their cache entries`);

    res.status(200).json({
      success: true,
      message: 'All cache entries cleared for your account'
    });
  } catch (error) {
    console.error('❌ Cache clear error:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

/**
 * Auto-invalidate cache when family data changes
 * This endpoint is called by other services when data updates
 */
router.post('/auto-invalidate', async (req, res) => {
  try {
    const { userId, dataType, memberName } = req.body;

    if (!userId || !dataType) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'userId and dataType are required'
      });
    }

    // Invalidate relevant cache patterns based on data type
    const patterns = [];

    switch (dataType) {
      case 'schedule':
      case 'activity':
        patterns.push(`${userId}:schedule`);
        patterns.push(`${userId}:activities`);
        if (memberName) {
          patterns.push(`${userId}:${memberName.toLowerCase()}`);
        }
        break;

      case 'contact':
        patterns.push(`${userId}:contact`);
        patterns.push(`${userId}:phone`);
        patterns.push(`${userId}:email`);
        break;

      case 'family':
        patterns.push(`${userId}:family`);
        if (memberName) {
          patterns.push(`${userId}:${memberName.toLowerCase()}`);
        }
        break;

      case 'preferences':
        patterns.push(`${userId}:preferences`);
        patterns.push(`${userId}:allergies`);
        patterns.push(`${userId}:food`);
        break;

      default:
        // General invalidation
        patterns.push(`${userId}:general`);
    }

    // Execute invalidation for all patterns
    for (const pattern of patterns) {
      await responseCacheService.invalidateCache(pattern);
    }

    console.log(`🔄 Auto-invalidated cache for ${userId}, dataType: ${dataType}, patterns: ${patterns.length}`);

    res.status(200).json({
      success: true,
      message: 'Cache auto-invalidated',
      patternsCleared: patterns.length,
      dataType
    });

  } catch (error) {
    console.error('❌ Auto-invalidation error:', error);
    res.status(500).json({
      error: 'Failed to auto-invalidate cache',
      message: error.message
    });
  }
});

export default router;