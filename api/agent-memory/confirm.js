import { AgentMemoryService } from '../services/agentMemoryService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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
    console.error('Error in memory confirm handler:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}