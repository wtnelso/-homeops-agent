import { AgentMemoryService } from '../services/agentMemoryService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // This endpoint can be called manually or via cron job
    const result = await AgentMemoryService.cleanupExpiredMemories();

    console.log(`🧹 Memory cleanup completed: ${result.deletedCount} expired memories deleted`);

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} expired memories`
    });
  } catch (error) {
    console.error('Error in memory cleanup handler:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}