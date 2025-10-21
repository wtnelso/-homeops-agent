/**
 * Server Initialization
 *
 * Initialize queue system and other services on server startup.
 * Add this to your main server file (index.js/server.js).
 */

import { QueueManager } from './services/queueManager.js';
import { RedisProfileCache } from './services/redisProfileCache.js';

/**
 * Initialize all server services
 */
export async function initializeServer() {
  console.log('🚀 Starting server initialization...');

  try {
    // Force in-memory queue system (Redis disabled)
    console.log('📋 Initializing in-memory queue system...');
    const queueResult = await QueueManager.initializeInMemoryOnly();

    console.log(`✅ Queue system initialized: ${queueResult.queueType}`);

    // Skip Redis profile cache initialization
    console.log('💾 Redis profile cache disabled - using direct DB queries');
    const cacheResult = { cacheEnabled: false };

    console.log('⚠️  In-memory queue features:');
    console.log('   ❌ Jobs lost on restart');
    console.log('   ❌ Manual cron job management needed');
    console.log('   ✅ Basic priority queuing');
    console.log('   💡 Redis disabled to avoid connection issues');

    // Setup graceful shutdown
    setupGracefulShutdown();

    return {
      success: true,
      queueSystem: queueResult,
      cacheSystem: cacheResult
    };

  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown() {
  const gracefulShutdown = async () => {
    console.log('🛑 Received shutdown signal, closing gracefully...');

    try {
      // Close queue system
      await QueueManager.shutdown();

      // Skip Redis cache shutdown (disabled)

      // Close other services (database connections, etc.)
      console.log('✅ Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different shutdown signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
  });
}

/**
 * Get queue system status endpoint (for monitoring)
 */
export async function getQueueSystemStatus() {
  const systemInfo = QueueManager.getSystemInfo();
  const queueStats = await QueueManager.getQueueStats();

  return {
    system: systemInfo,
    stats: queueStats,
    timestamp: new Date().toISOString()
  };
}

/**
 * Manual daily processing trigger (for admin/testing)
 */
export async function triggerDailyProcessingManually() {
  return await QueueManager.triggerDailyProcessing();
}