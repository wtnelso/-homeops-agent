import { AgentMemoryService } from '../services/agentMemoryService.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    const result = await AgentMemoryService.getMemoryStats(accountId as string);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in memory stats handler:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}