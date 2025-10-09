/**
 * Response Cache Service
 *
 * Intelligent caching for similar chat queries to reduce OpenAI API calls
 * and improve response times. Falls back to in-memory cache if Redis unavailable.
 */

import crypto from 'crypto';

class ResponseCacheService {
  constructor() {
    // In-memory cache fallback
    this.memoryCache = new Map();
    this.memoryCacheExpiry = new Map();

    // Redis client (will be null if not configured)
    this.redisClient = null;

    // Cache configuration
    this.config = {
      DEFAULT_TTL: 3600, // 1 hour default
      SIMILARITY_THRESHOLD: 0.85, // Semantic similarity threshold
      MAX_MEMORY_CACHE_SIZE: 1000, // Max items in memory cache
      CACHE_KEY_PREFIX: 'homeops_chat:',

      // TTL by query type
      TTL_BY_TYPE: {
        schedule_today: 1800,     // 30 minutes (schedules change)
        schedule_week: 3600,      // 1 hour
        contact_info: 0,          // No caching (contacts need to be current)
        preferences: 86400,       // 24 hours
        family_info: 86400,       // 24 hours
        general: 1800             // 30 minutes
      }
    };

    this.initializeRedis();
  }

  /**
   * Initialize Redis connection if available
   */
  async initializeRedis() {
    try {
      // Only try to connect if Redis URL is provided
      if (process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING) {
        const { createClient } = await import('redis');

        this.redisClient = createClient({
          url: process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING
        });

        await this.redisClient.connect();
        console.log('✅ Redis connected for response caching');

        // Test Redis with a ping
        await this.redisClient.ping();
      } else {
        console.log('⚠️  Redis not configured, using in-memory cache fallback');
      }
    } catch (error) {
      console.warn('⚠️  Redis connection failed, falling back to memory cache:', error.message);
      this.redisClient = null;
    }
  }

  /**
   * Generate cache key from query and context
   */
  generateCacheKey(userId, query, context = {}) {
    // Normalize query for better cache hits
    const normalizedQuery = this.normalizeQuery(query);

    // Create deterministic key from user, query intent, and context
    const keyData = {
      userId,
      query: normalizedQuery,
      date: this.getDateContext(query),
      familyMember: this.extractFamilyMember(query),
      queryType: this.categorizeQuery(query)
    };

    const keyString = JSON.stringify(keyData, Object.keys(keyData).sort());
    const hash = crypto.createHash('md5').update(keyString).digest('hex');

    return `${this.config.CACHE_KEY_PREFIX}${hash}`;
  }

  /**
   * Normalize query text for better cache matching
   */
  normalizeQuery(query) {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')        // Remove punctuation
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .replace(/\b(the|a|an|is|are|what|when|where|who|how)\b/g, '') // Remove common words
      .trim();
  }

  /**
   * Extract date context from query
   */
  getDateContext(query) {
    const today = new Date().toISOString().split('T')[0];

    if (/today|this morning|this afternoon|tonight/i.test(query)) {
      return today;
    }

    if (/tomorrow/i.test(query)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }

    if (/this week/i.test(query)) {
      return `week_${today}`;
    }

    return 'general';
  }

  /**
   * Extract family member from query
   */
  extractFamilyMember(query) {
    // Common names - in production, this would come from family data
    const namePatterns = /\b(emma|emily|jacob|sarah|mom|dad|kids?|children?)\b/i;
    const match = query.match(namePatterns);
    return match ? match[1].toLowerCase() : 'family';
  }

  /**
   * Categorize query type for appropriate TTL
   */
  categorizeQuery(query) {
    console.log(`🔍 Categorizing query: "${query}"`);

    if (/schedule|agenda|calendar|activities.*today/i.test(query)) {
      console.log(`📅 Categorized as: schedule_today`);
      return 'schedule_today';
    }

    if (/schedule|agenda|calendar|this week|next week/i.test(query)) {
      console.log(`📅 Categorized as: schedule_week`);
      return 'schedule_week';
    }

    if (/contacts?|phone|email|doctor|teacher|school.*number/i.test(query)) {
      console.log(`📞 Categorized as: contact_info`);
      return 'contact_info';
    }

    if ((/allergies|preferences|likes|dislikes|restrictions/i).test(query)) {
      return 'preferences';
    }

    if (/(age|birthday|grade|school|relationship)/i.test(query)) {
      return 'family_info';
    }

    return 'general';
  }

  /**
   * Get cached response if available
   */
  async getCachedResponse(userId, query, context = {}) {
    try {
      const cacheKey = this.generateCacheKey(userId, query, context);
      let cachedData = null;

      if (this.redisClient) {
        // Try Redis first
        const redisData = await this.redisClient.get(cacheKey);
        if (redisData) {
          cachedData = JSON.parse(redisData);
        }
      } else {
        // Fallback to memory cache
        cachedData = this.getFromMemoryCache(cacheKey);
      }

      if (cachedData) {
        console.log(`🎯 Cache hit for query: "${query.substring(0, 50)}..."`);
        return {
          success: true,
          response: cachedData.response,
          cached: true,
          cacheKey,
          timestamp: cachedData.timestamp
        };
      }

      console.log(`⭕ Cache miss for query: "${query.substring(0, 50)}..."`);
      return { success: false, cached: false, cacheKey };

    } catch (error) {
      console.error('❌ Cache retrieval error:', error);
      return { success: false, cached: false, error: error.message };
    }
  }

  /**
   * Cache a response
   */
  async cacheResponse(userId, query, response, context = {}) {
    try {
      const cacheKey = this.generateCacheKey(userId, query, context);
      const queryType = this.categorizeQuery(query);
      const ttl = this.config.TTL_BY_TYPE[queryType] || this.config.DEFAULT_TTL;
      console.log(`⏰ TTL lookup: queryType="${queryType}", ttl=${ttl}, available=${JSON.stringify(Object.keys(this.config.TTL_BY_TYPE))}`);

      // Skip caching if TTL is 0
      if (ttl === 0) {
        console.log(`⏭️ Skipping cache for "${query.substring(0, 50)}..." (TTL: 0 - no caching)`);
        return { success: true, cacheKey, ttl: 0, cached: false };
      }

      const cacheData = {
        response,
        timestamp: new Date().toISOString(),
        queryType,
        userId,
        originalQuery: query
      };

      if (this.redisClient) {
        // Store in Redis with TTL
        await this.redisClient.setEx(cacheKey, ttl, JSON.stringify(cacheData));
      } else {
        // Store in memory cache with TTL
        this.setInMemoryCache(cacheKey, cacheData, ttl);
      }

      console.log(`💾 Cached response for "${query.substring(0, 50)}..." (TTL: ${ttl}s)`);
      return { success: true, cacheKey, ttl };

    } catch (error) {
      console.error('❌ Cache storage error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Memory cache operations
   */
  getFromMemoryCache(key) {
    // Check if expired
    const expiry = this.memoryCacheExpiry.get(key);
    if (expiry && expiry < Date.now()) {
      this.memoryCache.delete(key);
      this.memoryCacheExpiry.delete(key);
      return null;
    }

    return this.memoryCache.get(key);
  }

  setInMemoryCache(key, data, ttlSeconds) {
    // Implement simple LRU if cache is full
    if (this.memoryCache.size >= this.config.MAX_MEMORY_CACHE_SIZE) {
      const oldestKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(oldestKey);
      this.memoryCacheExpiry.delete(oldestKey);
    }

    this.memoryCache.set(key, data);
    this.memoryCacheExpiry.set(key, Date.now() + (ttlSeconds * 1000));
  }

  /**
   * Invalidate cache for specific patterns
   */
  async invalidateCache(pattern) {
    try {
      if (this.redisClient) {
        // Redis pattern deletion
        const keys = await this.redisClient.keys(`${this.config.CACHE_KEY_PREFIX}*${pattern}*`);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          console.log(`🧹 Invalidated ${keys.length} Redis cache entries for pattern: ${pattern}`);
        }
      } else {
        // Memory cache pattern deletion
        let deletedCount = 0;
        for (const [key, data] of this.memoryCache.entries()) {
          if (key.includes(pattern) || data.originalQuery?.includes(pattern)) {
            this.memoryCache.delete(key);
            this.memoryCacheExpiry.delete(key);
            deletedCount++;
          }
        }
        if (deletedCount > 0) {
          console.log(`🧹 Invalidated ${deletedCount} memory cache entries for pattern: ${pattern}`);
        }
      }
    } catch (error) {
      console.error('❌ Cache invalidation error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      if (this.redisClient) {
        const info = await this.redisClient.info('memory');
        return {
          type: 'redis',
          connected: true,
          info: info
        };
      } else {
        return {
          type: 'memory',
          connected: false,
          size: this.memoryCache.size,
          maxSize: this.config.MAX_MEMORY_CACHE_SIZE
        };
      }
    } catch (error) {
      return {
        type: 'error',
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Clear all cache
   */
  async clearAll() {
    try {
      if (this.redisClient) {
        const keys = await this.redisClient.keys(`${this.config.CACHE_KEY_PREFIX}*`);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        this.memoryCache.clear();
        this.memoryCacheExpiry.clear();
      }
      console.log('🧹 All cache cleared');
    } catch (error) {
      console.error('❌ Cache clear error:', error);
    }
  }
}

// Singleton instance
const responseCacheService = new ResponseCacheService();

export default responseCacheService;