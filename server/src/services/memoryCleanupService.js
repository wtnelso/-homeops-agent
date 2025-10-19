import { AgentMemoryService } from './agentMemoryService.js';
import cron from 'node-cron';

export class MemoryCleanupService {
  static isRunning = false;

  /**
   * Start automatic memory cleanup service
   * Runs daily at 2 AM to clean up expired memories
   */
  static startCleanupSchedule() {
    if (this.isRunning) {
      console.log('🧹 Memory cleanup service is already running');
      return;
    }

    console.log('🧹 Starting memory cleanup service...');

    // Run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        console.log('🧹 Running scheduled memory cleanup...');
        const result = await AgentMemoryService.cleanupExpiredMemories();

        if (result.success) {
          console.log(`✅ Memory cleanup completed: ${result.deletedCount} expired memories deleted`);
        } else {
          console.error('❌ Memory cleanup failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Error during scheduled memory cleanup:', error);
      }
    }, {
      timezone: "America/New_York" // Adjust timezone as needed
    });

    this.isRunning = true;
    console.log('✅ Memory cleanup service started (runs daily at 2:00 AM)');
  }

  /**
   * Run cleanup immediately (for manual triggers)
   */
  static async runCleanupNow() {
    try {
      console.log('🧹 Running immediate memory cleanup...');
      const result = await AgentMemoryService.cleanupExpiredMemories();

      if (result.success) {
        console.log(`✅ Immediate cleanup completed: ${result.deletedCount} expired memories deleted`);
        return { success: true, deletedCount: result.deletedCount };
      } else {
        console.error('❌ Immediate cleanup failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error during immediate cleanup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get memories that will expire soon (next 7 days)
   * Useful for sending notifications to users
   */
  static async getExpiringMemories(userId, daysAhead = 7) {
    try {
      const client = await AgentMemoryService.createConnection();

      const query = `
        SELECT id, user_id, memory_type, key, value, expires_at, priority, tags
        FROM agent_memory
        WHERE user_id = $1
        AND expires_at IS NOT NULL
        AND expires_at > NOW()
        AND expires_at <= NOW() + INTERVAL '${daysAhead} days'
        ORDER BY expires_at ASC, priority ASC
      `;

      const result = await client.query(query, [userId]);
      await client.end();

      const memories = result.rows.map(row => ({
        ...row,
        value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value
      }));

      return { success: true, memories };
    } catch (error) {
      console.error('Error getting expiring memories:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send expiration notifications to users
   * This could be enhanced to send actual emails/notifications
   */
  static async notifyUsersOfExpiringMemories() {
    try {
      console.log('📢 Memory cleanup service disabled to prevent crashes');
      // Temporarily disabled to prevent database crashes
      return;
    } catch (error) {
      console.error('❌ Error in memory cleanup service:', error);
    }
  }

  /**
   * Start notification service (runs weekly on Sundays at 10 AM)
   */
  static startNotificationSchedule() {
    console.log('📢 Starting memory expiration notification service...');

    // Run weekly on Sundays at 10:00 AM
    cron.schedule('0 10 * * 0', async () => {
      await this.notifyUsersOfExpiringMemories();
    }, {
      timezone: "America/New_York"
    });

    console.log('✅ Memory expiration notification service started (runs Sundays at 10:00 AM)');
  }

  /**
   * Start all memory management services
   */
  static startAll() {
    this.startCleanupSchedule();
    this.startNotificationSchedule();
    console.log('🚀 All memory management services started');
  }
}