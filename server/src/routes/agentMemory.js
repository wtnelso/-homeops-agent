import { Router } from 'express';
import { AgentMemoryService } from '../services/agentMemoryService.js';
import { validateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// GET /api/agent-memory - Get memories for account
router.get('/', validateJWT, async (req, res) => {
  console.log('🧠 GET /api/agent-memory called with query:', req.query);
  console.log('🔍 DEBUG: Full query object keys:', Object.keys(req.query));
  console.log('🔍 DEBUG: Query values:', Object.values(req.query));
  try {
    const {
      userId,
      memoryType,
      tags,
      includeExpired = 'false',
      limit = '100',
      offset = '0'
    } = req.query;

    console.log('🔍 DEBUG: Extracted userId:', userId);
    console.log('🔍 DEBUG: userId type:', typeof userId);

    if (!userId) {
      console.log('❌ DEBUG: No userId provided, returning error');
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await AgentMemoryService.getMemories({
      userId: userId,
      memoryType: memoryType,
      tags: tags ? tags.split(',') : null,
      includeExpired: includeExpired === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log('🔍 DEBUG: AgentMemoryService result:', JSON.stringify(result, null, 2));
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in GET /agent-memory:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/agent-memory/store - Store new memory
router.post('/store', validateJWT, async (req, res) => {
  console.log('💾 POST /api/agent-memory/store called with body:', req.body);
  try {
    const {
      account_id,
      memory_type,
      key,
      value,
      source_type = 'manual',
      source_id = null,
      confidence_score = null,
      priority = null,
      expires_at = null,
      tags = []
    } = req.body;

    if (!account_id || !memory_type || !key || value === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Account ID, memory type, key, and value are required'
      });
    }

    const result = await AgentMemoryService.addMemory({
      account_id,
      memory_type,
      key,
      value,
      source_type,
      source_id,
      confidence_score,
      priority,
      expires_at,
      tags
    });

    console.log('✅ Memory stored successfully:', result);
    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error in POST /agent-memory/store:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/agent-memory - Delete specific memory
router.delete('/', validateJWT, async (req, res) => {
  try {
    const { memoryId, userId } = req.body;

    if (!memoryId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Memory ID and User ID are required'
      });
    }

    const result = await AgentMemoryService.deleteMemory(memoryId, userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in DELETE /agent-memory:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/agent-memory/confirm - Confirm memory
router.post('/confirm', validateJWT, async (req, res) => {
  try {
    const { memoryId, userId, isConfirmed = true } = req.body;

    if (!memoryId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Memory ID and User ID are required'
      });
    }

    const result = await AgentMemoryService.confirmMemory(memoryId, userId, isConfirmed);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in POST /agent-memory/confirm:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/agent-memory/expiration - Update expiration
router.post('/expiration', validateJWT, async (req, res) => {
  try {
    const { memoryId, userId, expiresAt } = req.body;

    if (!memoryId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Memory ID and User ID are required'
      });
    }

    const result = await AgentMemoryService.updateMemoryExpiration(memoryId, userId, expiresAt);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in POST /agent-memory/expiration:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/agent-memory/stats - Get memory statistics
router.get('/stats', validateJWT, async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await AgentMemoryService.getMemoryStats(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in GET /agent-memory/stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/agent-memory/cleanup - Cleanup expired memories
router.post('/cleanup', validateJWT, async (req, res) => {
  try {
    const result = await AgentMemoryService.cleanupExpiredMemories();

    console.log(`🧹 Memory cleanup completed: ${result.deletedCount} expired memories deleted`);

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} expired memories`
    });
  } catch (error) {
    console.error('Error in POST /agent-memory/cleanup:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;