import { AgentMemoryService } from './services/agentMemoryService.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return handleGetMemories(req, res);
  } else if (req.method === 'DELETE') {
    return handleDeleteMemory(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

async function handleGetMemories(req, res) {
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
      accountId: accountId as string,
      memoryType: memoryType as string,
      tags: tags ? (tags as string).split(',') : null,
      includeExpired: includeExpired === 'true',
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in handleGetMemories:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

async function handleDeleteMemory(req, res) {
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
    console.error('Error in handleDeleteMemory:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}