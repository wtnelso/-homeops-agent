/**
 * Redis Profile Context Cache Service
 *
 * Caches family profile context data to improve email processing performance.
 * Reduces database queries by storing frequently accessed profile data in Redis.
 */

export class RedisProfileCache {
  static redisClient = null;
  static isAvailable = false;

  /**
   * Initialize Redis cache (called from serverInit)
   */
  static async initialize() {
    try {
      // Check if Redis is available first
      if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
        console.log('⚠️  Redis not configured, profile caching disabled');
        return { success: true, cacheEnabled: false };
      }

      // Import Redis client
      const Redis = await import('ioredis');

      // Create Redis connection
      this.redisClient = new Redis.default(process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true
      });

      // Test connection
      await this.redisClient.ping();
      this.isAvailable = true;

      console.log('✅ Redis profile cache initialized successfully');
      return { success: true, cacheEnabled: true };

    } catch (error) {
      console.log('⚠️  Redis profile cache unavailable, using direct DB queries:', error.message);
      this.isAvailable = false;
      return { success: true, cacheEnabled: false };
    }
  }

  /**
   * Cache family profile context for an account
   */
  static async cacheProfileContext(accountId, profileContext) {
    if (!this.isAvailable || !profileContext) {
      return false;
    }

    try {
      const cacheKey = `profile_context:${accountId}`;
      const cacheData = {
        ...profileContext,
        cached_at: new Date().toISOString()
      };

      // Cache for 1 hour (3600 seconds)
      await this.redisClient.setex(cacheKey, 3600, JSON.stringify(cacheData));

      console.log(`📦 Cached profile context for account ${accountId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to cache profile context:', error);
      return false;
    }
  }

  /**
   * Get cached family profile context
   */
  static async getCachedProfileContext(accountId) {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const cacheKey = `profile_context:${accountId}`;
      const cachedData = await this.redisClient.get(cacheKey);

      if (cachedData) {
        const profileContext = JSON.parse(cachedData);
        console.log(`🎯 Cache hit for profile context: ${accountId}`);
        return profileContext;
      }

      console.log(`🔍 Cache miss for profile context: ${accountId}`);
      return null;

    } catch (error) {
      console.error('❌ Failed to get cached profile context:', error);
      return null;
    }
  }

  /**
   * Invalidate cached profile context (call when profile is updated)
   */
  static async invalidateProfileContext(accountId) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const cacheKey = `profile_context:${accountId}`;
      await this.redisClient.del(cacheKey);

      console.log(`🗑️  Invalidated profile context cache for account ${accountId}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to invalidate profile context:', error);
      return false;
    }
  }

  /**
   * Cache relevance scores for email content hashes
   */
  static async cacheRelevanceScore(contentHash, relevanceScore, familyRelevanceScore) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const cacheKey = `relevance:${contentHash}`;
      const cacheData = {
        relevance_score: relevanceScore,
        family_relevance_score: familyRelevanceScore,
        cached_at: new Date().toISOString()
      };

      // Cache for 24 hours (86400 seconds)
      await this.redisClient.setex(cacheKey, 86400, JSON.stringify(cacheData));
      return true;

    } catch (error) {
      console.error('❌ Failed to cache relevance score:', error);
      return false;
    }
  }

  /**
   * Get cached relevance score
   */
  static async getCachedRelevanceScore(contentHash) {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const cacheKey = `relevance:${contentHash}`;
      const cachedData = await this.redisClient.get(cacheKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      return null;

    } catch (error) {
      console.error('❌ Failed to get cached relevance score:', error);
      return null;
    }
  }

  /**
   * Cache pattern matching results
   */
  static async cachePatternResults(contentHash, patternResults) {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const cacheKey = `patterns:${contentHash}`;
      const cacheData = {
        pattern_matches: patternResults,
        cached_at: new Date().toISOString()
      };

      // Cache for 6 hours (21600 seconds)
      await this.redisClient.setex(cacheKey, 21600, JSON.stringify(cacheData));
      return true;

    } catch (error) {
      console.error('❌ Failed to cache pattern results:', error);
      return false;
    }
  }

  /**
   * Get cached pattern results
   */
  static async getCachedPatternResults(contentHash) {
    if (!this.isAvailable) {
      return null;
    }

    try {
      const cacheKey = `patterns:${contentHash}`;
      const cachedData = await this.redisClient.get(cacheKey);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      return null;

    } catch (error) {
      console.error('❌ Failed to get cached pattern results:', error);
      return null;
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats() {
    if (!this.isAvailable) {
      return { enabled: false };
    }

    try {
      const info = await this.redisClient.info('memory');
      const keyspace = await this.redisClient.info('keyspace');

      // Count our specific cache keys
      const profileKeys = await this.redisClient.keys('profile_context:*');
      const relevanceKeys = await this.redisClient.keys('relevance:*');
      const patternKeys = await this.redisClient.keys('patterns:*');

      return {
        enabled: true,
        profile_contexts_cached: profileKeys.length,
        relevance_scores_cached: relevanceKeys.length,
        pattern_results_cached: patternKeys.length,
        total_cache_keys: profileKeys.length + relevanceKeys.length + patternKeys.length,
        redis_memory_usage: this.parseRedisInfo(info, 'used_memory_human'),
        redis_connections: this.parseRedisInfo(info, 'connected_clients')
      };

    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return { enabled: true, error: error.message };
    }
  }

  /**
   * Parse Redis INFO output
   */
  static parseRedisInfo(info, key) {
    const lines = info.split('\r\n');
    for (const line of lines) {
      if (line.startsWith(key + ':')) {
        return line.split(':')[1];
      }
    }
    return 'unknown';
  }

  /**
   * Clear all cache data (use carefully!)
   */
  static async clearAllCache() {
    if (!this.isAvailable) {
      return false;
    }

    try {
      const keys = await this.redisClient.keys('profile_context:*');
      const relevanceKeys = await this.redisClient.keys('relevance:*');
      const patternKeys = await this.redisClient.keys('patterns:*');

      const allKeys = [...keys, ...relevanceKeys, ...patternKeys];

      if (allKeys.length > 0) {
        await this.redisClient.del(...allKeys);
        console.log(`🗑️  Cleared ${allKeys.length} cache entries`);
      }

      return true;

    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Shutdown Redis connection
   */
  static async shutdown() {
    if (this.redisClient) {
      try {
        await this.redisClient.disconnect();
        console.log('✅ Redis profile cache disconnected');
      } catch (error) {
        console.error('❌ Error disconnecting Redis cache:', error);
      }
    }
  }
}

export default RedisProfileCache;