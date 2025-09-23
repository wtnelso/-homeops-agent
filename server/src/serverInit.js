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
    // Initialize queue system (Redis or fallback)
    console.log('📋 Initializing queue system...');
    const queueResult = await QueueManager.initialize();

    console.log(`✅ Queue system initialized: ${queueResult.queueType}`);

    // Initialize Redis profile cache
    console.log('💾 Initializing Redis profile cache...');
    const cacheResult = await RedisProfileCache.initialize();

    if (cacheResult.cacheEnabled) {
      console.log('✅ Redis profile cache enabled');
    } else {
      console.log('⚠️  Redis profile cache disabled - using direct DB queries');
    }

    if (queueResult.redisAvailable) {
      console.log('🎯 Redis features enabled:');
      console.log('   ✅ Job persistence (survive restarts)');
      console.log('   ✅ Automatic retry with exponential backoff');
      console.log('   ✅ Built-in cron scheduling (2:00 AM daily)');
      console.log('   ✅ Priority queue management');
      console.log('   ✅ Horizontal scaling ready');
    } else {
      console.log('⚠️  In-memory queue features:');
      console.log('   ❌ Jobs lost on restart');
      console.log('   ❌ Manual cron job management needed');
      console.log('   ✅ Basic priority queuing');
      console.log('   💡 Deploy Redis for production features');
    }

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

      // Close Redis cache
      await RedisProfileCache.shutdown();

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