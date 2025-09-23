import { Router } from 'express';
import { AgentMemoryService } from '../services/agentMemoryService.js';

const router = Router();

// GET /api/agent-memory - Get memories for account
router.get('/', async (req, res) => {
  console.log('🧠 GET /api/agent-memory called with query:', req.query);
  try {
    const {
      accountId,
      memoryType,
      tags,
      includeExpired = 'false',
      limit = '100',
      offset = '0'
    } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    const result = await AgentMemoryService.getMemories({
      accountId: accountId,
      memoryType: memoryType,
      tags: tags ? tags.split(',') : null,
      includeExpired: includeExpired === 'true',
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in GET /agent-memory:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/agent-memory - Delete specific memory
router.delete('/', async (req, res) => {
  try {
    const { memoryId, accountId } = req.body;

    if (!memoryId || !accountId) {
      return res.status(400).json({
        success: false,
        error: 'Memory ID and Account ID are required'
      });
    }

    const result = await AgentMemoryService.deleteMemory(memoryId, accountId);
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
router.post('/confirm', async (req, res) => {
  try {
    const { memoryId, accountId, isConfirmed = true } = req.body;

    if (!memoryId || !accountId) {
      return res.status(400).json({
        success: false,
        error: 'Memory ID and Account ID are required'
      });
    }

    const result = await AgentMemoryService.confirmMemory(memoryId, accountId, isConfirmed);
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
router.post('/expiration', async (req, res) => {
  try {
    const { memoryId, accountId, expiresAt } = req.body;

    if (!memoryId || !accountId) {
      return res.status(400).json({
        success: false,
        error: 'Memory ID and Account ID are required'
      });
    }

    const result = await AgentMemoryService.updateMemoryExpiration(memoryId, accountId, expiresAt);
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
router.get('/stats', async (req, res) => {
  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    const result = await AgentMemoryService.getMemoryStats(accountId);
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
router.post('/cleanup', async (req, res) => {
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