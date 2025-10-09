import { Client } from 'pg';
import {
  MEMORY_CONFIG,
  QUERY_ANALYZER,
  EXTRACTION_PATTERNS,
  MEMORY_UTILS,
  DATE_PARSER,
  SOURCE_TYPES,
  AGENT_MEMORY_VALUE_FORMATS
} from '../config/agentMemoryConfig.js';
import { accountProfileService } from './accountProfileService.js';

export class AgentMemoryService {
  static async createConnection() {
    // For now, use the direct connection string - the branch is already configured in the URL
    const connectionString = process.env.NEON_DATABASE_URL;

    console.log(`🔀 Using Neon connection: ${connectionString.substring(0, 50)}...`);

    const client = new Client({
      connectionString: connectionString,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    return client;
  }

  /**
   * Get profile-based context to enhance memory system
   * @private
   */
  static async getProfileContext(userId) {
    try {
      const profileResult = await accountProfileService.getProfile(userId);
      if (!profileResult.success) {
        return null;
      }

      const profile = profileResult.profile.data;
      const profileMemories = [];

      // Convert key profile info to memory-compatible format
      if (profile.family?.spouse?.name) {
        profileMemories.push({
          key: 'spouse_name',
          value: profile.family.spouse.name,
          memory_type: 'family_member',
          confidence_score: 0.95,
          priority: 1,
          source: 'profile'
        });
      }

      if (profile.family?.children) {
        profile.family.children.forEach((child, index) => {
          if (child.name) {
            profileMemories.push({
              key: `child_${index + 1}_name`,
              value: child.name,
              memory_type: 'family_member',
              confidence_score: 0.95,
              priority: 1,
              source: 'profile'
            });

            if (child.activities?.length > 0) {
              profileMemories.push({
                key: `${child.name}_activities`,
                value: child.activities.join(', '),
                memory_type: 'activity',
                confidence_score: 0.9,
                priority: 2,
                source: 'profile'
              });
            }

            // Add schedule information
            if (child.schedule) {
              Object.entries(child.schedule).forEach(([day, activity]) => {
                if (activity && activity !== 'Free') {
                  profileMemories.push({
                    key: `${child.name}_${day}`,
                    value: activity,
                    memory_type: 'schedule',
                    confidence_score: 0.9,
                    priority: 2,
                    source: 'profile'
                  });
                }
              });
            }
          }
        });
      }

      // Add family allergies
      if (profile.preferences?.dietary?.allergies?.length > 0) {
        profileMemories.push({
          key: 'family_allergies',
          value: {
            name: 'Family Allergies',
            type: 'dietary',
            items: profile.preferences.dietary.allergies,
            context_type: 'preference_info',
            category: 'dietary'
          },
          memory_type: 'preference',
          confidence_score: 0.95,
          priority: 1,
          source: 'profile'
        });
      }

      // Add favorite cuisines
      if (profile.preferences?.dietary?.favorite_cuisines?.length > 0) {
        profileMemories.push({
          key: 'favorite_cuisines',
          value: {
            name: 'Favorite Cuisines',
            type: 'dietary',
            items: profile.preferences.dietary.favorite_cuisines,
            context_type: 'preference_info',
            category: 'dietary'
          },
          memory_type: 'preference',
          confidence_score: 0.9,
          priority: 2,
          source: 'profile'
        });
      }

      return {
        memories: profileMemories,
        completeness_score: profileResult.profile.metadata.completeness_score
      };

    } catch (error) {
      console.warn('⚠️ Could not get profile context:', error.message);
      return null;
    }
  }

  /**
   * Enhanced method that combines profile and memory context
   * This is a simple adapter that can be used by the chat system
   */
  static async getEnhancedContext(userId, context = '', limit = null) {
    try {
      // Get the enhanced memories (this will use the updated getRelevantMemories method)
      const memoryResult = await this.getRelevantMemories(userId, context, limit);

      // Also get profile context for AI prompt generation
      const profileContext = await this.getProfileContext(userId);

      return {
        ...memoryResult,
        profile_context: profileContext,
        has_profile: !!profileContext,
        usage_note: 'This enhanced context combines traditional memories with structured profile data'
      };
    } catch (error) {
      console.error('❌ Error getting enhanced context:', error);
      return {
        success: false,
        error: error.message,
        memories: []
      };
    }
  }

  /**
   * Store new agent memory with proper source tracking
   */
  static async storeMemoryWithSource({
    userId,
    memoryType,
    key,
    coreData,
    originalText = null,
    sourceType = SOURCE_TYPES.MANUAL,
    sourceId = null,
    confidenceScore = null,
    tags = [],
    priority = null,
    expiresAt = null
  }) {
    // Create properly formatted value with optional original text
    const value = MEMORY_UTILS.createMemoryEntry(coreData, originalText);

    return this.storeMemory({
      userId,
      memoryType,
      key,
      value,
      sourceType,
      sourceId,
      confidenceScore,
      tags,
      priority,
      expiresAt
    });
  }

  /**
   * Store new agent memory (legacy method - still works)
   */
  /**
   * Add memory with structured data (alias for storeMemory with better parameter mapping)
   * Used by profileSuggestionsService for JSONB values
   */
  static async addMemory({
    user_id,
    memory_key,
    memory_value,
    key,
    value,
    memory_type,
    confidence_score = null,
    priority = null,
    source_type = 'manual',
    source_id = null,
    expires_at = null,
    tags = [],
    familyId = null,
    familyMemberId = null,
    contentHash = null
  }) {
    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: addMemory called with parameters:`);
    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: user_id: ${user_id}`);
    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: memory_key: ${memory_key}`);
    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: key: ${key}`);
    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: memory_type: ${memory_type}`);
    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: source_type: ${source_type}`);
    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: source_id: ${source_id}`);
    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: familyId: ${familyId}`);
    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: contentHash: ${contentHash}`);

    // Use the correct parameter names - key/value if provided, fallback to memory_key/memory_value
    const finalKey = key || memory_key;
    const finalValue = value || memory_value;

    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: finalKey: ${finalKey}`);
    console.log(`🔍 DEBUG AGENT MEMORY SERVICE: finalValue:`, JSON.stringify(finalValue, null, 2));

    return this.storeMemory({
      userId: user_id,
      memoryType: memory_type,
      key: finalKey,
      value: finalValue,
      sourceType: source_type,
      sourceId: source_id,
      confidenceScore: confidence_score,
      tags: tags,
      priority: priority,
      expiresAt: expires_at,
      familyId: familyId,
      familyMemberId: familyMemberId,
      contentHash: contentHash
    });
  }

  static async storeMemory({
    userId,
    memoryType,
    key,
    value,
    sourceType = 'manual',
    sourceId = null,
    confidenceScore = null,
    tags = [],
    priority = null,
    expiresAt = null,
    familyId = null,
    familyMemberId = null,
    contentHash = null
  }) {
    console.log(`🔍 DEBUG STORE MEMORY: Starting storeMemory`);
    console.log(`🔍 DEBUG STORE MEMORY: userId: ${userId}`);
    console.log(`🔍 DEBUG STORE MEMORY: memoryType: ${memoryType}`);
    console.log(`🔍 DEBUG STORE MEMORY: key: ${key}`);
    console.log(`🔍 DEBUG STORE MEMORY: value:`, JSON.stringify(value, null, 2));
    console.log(`🔍 DEBUG STORE MEMORY: sourceType: ${sourceType}`);
    console.log(`🔍 DEBUG STORE MEMORY: sourceId: ${sourceId}`);

    const client = await this.createConnection();
    console.log(`🔍 DEBUG STORE MEMORY: Connection created`);

    try {
      // Validate input data
      console.log(`🔍 DEBUG STORE MEMORY: Validating memory data`);
      const validation = MEMORY_UTILS.validateMemoryData({
        userId, memoryType, key, value, confidenceScore, priority
      });

      if (!validation.isValid) {
        console.log(`❌ DEBUG STORE MEMORY: Validation failed:`, validation.errors);
        throw new Error(`Invalid memory data: ${validation.errors.join(', ')}`);
      }
      console.log(`✅ DEBUG STORE MEMORY: Validation passed`);

      // Apply config-based defaults
      console.log(`🔍 DEBUG STORE MEMORY: Applying defaults`);
      const typeDefaults = MEMORY_UTILS.getTypeDefaults(memoryType);
      const finalConfidenceScore = confidenceScore ?? typeDefaults.confidence;
      const finalPriority = priority ?? typeDefaults.priority;
      // Don't override user's explicit expiration choice (including null for "never")
      // Only use default if expiresAt is explicitly undefined (not null)
      const finalExpiresAt = expiresAt !== undefined ? expiresAt : typeDefaults.expiresAt;

      console.log(`🔍 DEBUG STORE MEMORY: Final parameters:`);
      console.log(`🔍 DEBUG STORE MEMORY: finalConfidenceScore: ${finalConfidenceScore}`);
      console.log(`🔍 DEBUG STORE MEMORY: finalPriority: ${finalPriority}`);
      console.log(`🔍 DEBUG STORE MEMORY: finalExpiresAt: ${finalExpiresAt}`);

      const query = `
        INSERT INTO agent_memory (
          user_id, memory_type, key, value,
          source_type, source_id, confidence_score, tags, priority, expires_at, family_id, family_member_id, content_hash
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (user_id, memory_type, key)
        DO UPDATE SET
          value = EXCLUDED.value,
          confidence_score = EXCLUDED.confidence_score,
          tags = EXCLUDED.tags,
          priority = EXCLUDED.priority,
          expires_at = EXCLUDED.expires_at,
          family_id = EXCLUDED.family_id,
          family_member_id = EXCLUDED.family_member_id,
          content_hash = EXCLUDED.content_hash,
          updated_at = NOW()
        RETURNING id, created_at, updated_at
      `;

      console.log(`🔍 DEBUG STORE MEMORY: Executing query with parameters:`);
      console.log(`🔍 DEBUG STORE MEMORY: [${userId}, ${memoryType}, ${key}, ${JSON.stringify(value)}, ${sourceType}, ${sourceId}, ${finalConfidenceScore}, ${JSON.stringify(tags)}, ${finalPriority}, ${finalExpiresAt}, ${familyId}, ${contentHash}]`);

      const result = await client.query(query, [
        userId, memoryType, key, JSON.stringify(value),
        sourceType, sourceId, finalConfidenceScore, tags, finalPriority, finalExpiresAt, familyId, familyMemberId, contentHash
      ]);

      console.log(`✅ DEBUG STORE MEMORY: Query successful, result:`, result.rows[0]);
      return { success: true, memory: result.rows[0] };
    } catch (error) {
      console.error('Error storing agent memory:', error);
      console.error('❌ DEBUG STORE MEMORY: Error stack:', error.stack);
      return { success: false, error: error.message };
    } finally {
      await client.end();
      console.log(`🔍 DEBUG STORE MEMORY: Connection closed`);
    }
  }

  /**
   * Get memories for account with optional filtering
   */
  static async getMemories({
    userId,
    memoryType = null,
    tags = null,
    includeExpired = false,
    limit = 100,
    offset = 0
  }) {
    const client = await this.createConnection();

    try {
      let query = `
        SELECT id, user_id, memory_type, key, value,
               source_type, source_id, confidence_score, is_user_confirmed,
               tags, priority, expires_at, created_at, updated_at
        FROM agent_memory
        WHERE user_id = $1
      `;

      const params = [userId];
      let paramIndex = 2;

      if (memoryType) {
        query += ` AND memory_type = $${paramIndex}`;
        params.push(memoryType);
        paramIndex++;
      }

      if (tags && tags.length > 0) {
        query += ` AND tags && $${paramIndex}`;
        params.push(tags);
        paramIndex++;
      }

      if (!includeExpired) {
        query += ` AND (expires_at IS NULL OR expires_at > NOW())`;
      }

      query += ` ORDER BY priority ASC, confidence_score DESC, updated_at DESC`;
      query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await client.query(query, params);

      // Parse JSON values safely
      const memories = result.rows.map(row => {
        let parsedValue = row.value;
        if (typeof row.value === 'string') {
          try {
            parsedValue = JSON.parse(row.value);
          } catch (error) {
            console.error('Error parsing JSON value for memory row:', row.id, error);
            // Keep original string value if JSON parsing fails
            parsedValue = row.value;
          }
        }
        return {
          ...row,
          value: parsedValue
        };
      });

      return { success: true, memories };
    } catch (error) {
      console.error('Error getting agent memories:', error);
      return { success: false, error: error.message };
    } finally {
      await client.end();
    }
  }

  /**
   * Update memory confirmation status
   */
  static async confirmMemory(memoryId, userId, isConfirmed = true) {
    const client = await this.createConnection();

    try {
      const query = `
        UPDATE agent_memory
        SET is_user_confirmed = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING id, is_user_confirmed
      `;

      const result = await client.query(query, [isConfirmed, memoryId, userId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Memory not found or access denied' };
      }

      return { success: true, memory: result.rows[0] };
    } catch (error) {
      console.error('Error confirming memory:', error);
      return { success: false, error: error.message };
    } finally {
      await client.end();
    }
  }

  /**
   * Update memory expiration date
   */
  static async updateMemoryExpiration(memoryId, userId, expiresAt) {
    const client = await this.createConnection();

    try {
      const query = `
        UPDATE agent_memory
        SET expires_at = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING id, expires_at
      `;

      const result = await client.query(query, [expiresAt, memoryId, userId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Memory not found or access denied' };
      }

      return { success: true, memory: result.rows[0] };
    } catch (error) {
      console.error('Error updating memory expiration:', error);
      return { success: false, error: error.message };
    } finally {
      await client.end();
    }
  }

  /**
   * Delete expired memories
   */
  static async cleanupExpiredMemories() {
    const client = await this.createConnection();

    try {
      const query = `
        DELETE FROM agent_memory
        WHERE expires_at IS NOT NULL AND expires_at < NOW()
        RETURNING count(*)
      `;

      const result = await client.query(query);
      const deletedCount = result.rowCount;

      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error cleaning up expired memories:', error);
      return { success: false, error: error.message };
    } finally {
      await client.end();
    }
  }

  /**
   * Delete specific memory
   */
  static async deleteMemory(memoryId, userId) {
    const client = await this.createConnection();

    try {
      const query = `
        DELETE FROM agent_memory
        WHERE id = $1 AND user_id = $2
        RETURNING id
      `;

      const result = await client.query(query, [memoryId, userId]);

      if (result.rows.length === 0) {
        return { success: false, error: 'Memory not found or access denied' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting memory:', error);
      return { success: false, error: error.message };
    } finally {
      await client.end();
    }
  }

  /**
   * Search memories by content
   */
  static async searchMemories({
    userId,
    searchTerm,
    memoryType = null,
    limit = 50
  }) {
    const client = await this.createConnection();

    try {
      let query = `
        SELECT id, user_id, memory_type, key, value,
               source_type, confidence_score, is_user_confirmed,
               tags, priority, expires_at, created_at, updated_at
        FROM agent_memory
        WHERE user_id = $1
        AND (expires_at IS NULL OR expires_at > NOW())
        AND (
          key ILIKE $2
          OR value::text ILIKE $2
          OR array_to_string(tags, ' ') ILIKE $2
        )
      `;

      const params = [userId, `%${searchTerm}%`];

      if (memoryType) {
        query += ` AND memory_type = $3`;
        params.push(memoryType);
      }

      query += ` ORDER BY confidence_score DESC, updated_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await client.query(query, params);

      // Parse JSON values safely
      const memories = result.rows.map(row => {
        let parsedValue = row.value;
        if (typeof row.value === 'string') {
          try {
            parsedValue = JSON.parse(row.value);
          } catch (error) {
            console.error('Error parsing JSON value for memory row:', row.id, error);
            // Keep original string value if JSON parsing fails
            parsedValue = row.value;
          }
        }
        return {
          ...row,
          value: parsedValue
        };
      });

      return { success: true, memories };
    } catch (error) {
      console.error('Error searching memories:', error);
      return { success: false, error: error.message };
    } finally {
      await client.end();
    }
  }

  /**
   * Get memory statistics for an account
   */
  static async getMemoryStats(userId) {
    const client = await this.createConnection();

    try {
      const query = `
        SELECT
          COUNT(*) as total_memories,
          COUNT(*) FILTER (WHERE expires_at IS NULL OR expires_at > NOW()) as active_memories,
          COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at <= NOW()) as expired_memories,
          COUNT(*) FILTER (WHERE is_user_confirmed = true) as confirmed_memories,
          COUNT(*) FILTER (WHERE source_type = 'email') as email_derived_memories,
          COUNT(DISTINCT memory_type) as memory_types_count,
          AVG(confidence_score) as avg_confidence_score
        FROM agent_memory
        WHERE user_id = $1
      `;

      const result = await client.query(query, [userId]);
      const stats = result.rows[0];

      // Convert numeric fields
      Object.keys(stats).forEach(key => {
        if (stats[key] !== null) {
          stats[key] = parseFloat(stats[key]) || 0;
        }
      });

      return { success: true, stats };
    } catch (error) {
      console.error('Error getting memory stats:', error);
      return { success: false, error: error.message };
    } finally {
      await client.end();
    }
  }

  /**
   * Get relevant memories for chat context with smart temporal filtering
   */
  static async getRelevantMemories(userId, context = '', limit = null) {
    const client = await this.createConnection();

    try {
      // Use config-based limit if not provided
      const memoryLimit = limit || MEMORY_CONFIG.DEFAULT_MEMORY_LIMIT;

      // Analyze query type using config
      const memoryFilter = QUERY_ANALYZER.getMemoryFilter(context);

      let query;
      let params;

      if (memoryFilter.includeExpired) {
        // For past queries, include expired memories but prioritize by temporal relevance
        query = `
          SELECT id, memory_type, key, value, confidence_score,
                 priority, expires_at, created_at,
                 CASE
                   WHEN expires_at IS NULL OR expires_at > NOW() THEN 1
                   ELSE 2
                 END as temporal_priority
          FROM agent_memory
          WHERE user_id = $1
          ORDER BY temporal_priority ASC, priority ASC, confidence_score DESC, created_at DESC
          LIMIT $2
        `;
        params = [userId, memoryLimit];
      } else {
        // For present/future queries, only active memories
        query = `
          SELECT id, memory_type, key, value, confidence_score,
                 priority, expires_at, created_at,
                 1 as temporal_priority
          FROM agent_memory
          WHERE user_id = $1
          AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY priority ASC, confidence_score DESC, created_at DESC
          LIMIT $2
        `;
        params = [userId, memoryLimit];
      }

      const result = await client.query(query, params);
      console.log(`🧠 Retrieved ${result.rows.length} memories (filter: ${memoryFilter.temporalFilter})`);

      return {
        success: true,
        memories: result.rows,
        temporalFilter: memoryFilter.temporalFilter
      };
    } catch (error) {
      console.error('Error getting relevant memories:', error);
      return { success: false, error: error.message, memories: [] };
    } finally {
      await client.end();
    }
  }

  /**
   * Format memories for chat prompt context
   */
  static formatMemoriesForPrompt(memories) {
    if (!memories || memories.length === 0) {
      return '';
    }

    const memoryText = memories.map(memory => {
      const value = typeof memory.value === 'object'
        ? JSON.stringify(memory.value)
        : memory.value;
      return `- ${memory.key}: ${value} (${memory.memory_type}, confidence: ${Math.round(memory.confidence_score * 100)}%)`;
    }).join('\n');

    return `\n\nRelevant stored information about this user:\n${memoryText}\n`;
  }

  /**
   * Extract and store memories from chat conversations or emails
   */
  static async extractAndStoreMemories(userId, sourceId, content, sourceContext = 'chat') {
    // Determine source type based on context
    const sourceType = sourceContext === 'email' ? SOURCE_TYPES.EMAIL : SOURCE_TYPES.CHAT;

    console.log(`🧠 [DEBUG] Starting memory extraction for ${sourceContext}:`, {
      userId,
      sourceId,
      sourceType,
      contentLength: content?.length,
      contentPreview: content?.substring(0, 100) + (content?.length > 100 ? '...' : '')
    });

    const extractedMemories = [];

    // Process each memory type from config
    for (const [memoryType, config] of Object.entries(EXTRACTION_PATTERNS)) {
      console.log(`🧠 [DEBUG] Testing ${memoryType} patterns (${config.patterns.length} patterns)`);

      for (const patternConfig of config.patterns) {
        let match;
        // Reset regex lastIndex to avoid issues with global flag
        patternConfig.regex.lastIndex = 0;

        console.log(`🧠 [DEBUG] Testing pattern: ${patternConfig.regex.source}`);

        while ((match = patternConfig.regex.exec(content)) !== null) {
          try {
            console.log(`🧠 [DEBUG] PATTERN MATCH FOUND!`, {
              memoryType,
              fullMatch: match[0],
              groups: match.slice(1)
            });

            const extracted = patternConfig.extract(match);

            console.log(`🧠 [DEBUG] Extracted memory:`, {
              key: extracted.key,
              value: extracted.value,
              expiresAt: extracted.expiresAt
            });

            // Get defaults for this memory type
            const typeDefaults = MEMORY_UTILS.getTypeDefaults(memoryType);

            extractedMemories.push({
              userId,
              memoryType,
              key: extracted.key,
              coreData: extracted.value,
              originalText: match[0], // Store the original matched text
              sourceType: sourceType,
              sourceId: sourceId,
              confidenceScore: extracted.confidence || (sourceType === SOURCE_TYPES.EMAIL ? MEMORY_CONFIG.CONFIDENCE_SCORING.EMAIL_EXTRACTION : MEMORY_CONFIG.CONFIDENCE_SCORING.CHAT_EXTRACTION),
              tags: [`extracted_from_${sourceContext}`, 'auto_detected'],
              priority: typeDefaults.priority, // Use type default priority
              expiresAt: extracted.expiresAt || typeDefaults.expiresAt,
            });
          } catch (error) {
            console.error(`🧠 [ERROR] Error extracting memory from pattern:`, error);
          }
        }
      }
    }

    // Store extracted memories using config-based defaults and new format
    const storedMemories = [];
    for (const memory of extractedMemories) {
      try {
        const result = await this.storeMemoryWithSource(memory);
        if (result.success) {
          storedMemories.push(result.memory);
        }
      } catch (error) {
        console.error('Error storing extracted memory:', error);
      }
    }

    console.log(`🧠 Extracted ${storedMemories.length} memories from ${sourceContext} message`);
    return storedMemories;
  }
}

export default AgentMemoryService;