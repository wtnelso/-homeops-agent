/**
 * Smart Context Manager
 *
 * Optimizes OpenAI API calls by intelligently filtering and compressing context:
 * - Token-aware memory filtering
 * - Relevance-based context prioritization
 * - Smart memory compression
 * - Query-specific context optimization
 */

import { AgentMemoryService } from './agentMemoryService.js';

export class SmartContextManager {
  constructor() {
    // Token limits for different context types
    this.TOKEN_LIMITS = {
      AGENT_MEMORY: 800,        // Reduced from ~2000+
      CONVERSATION_HISTORY: 600, // Reduced from ~1500+
      EMAIL_CONTEXT: 400,       // Reduced from ~800+
      TOOL_CONTEXT: 200,        // For tool results
      TOTAL_CONTEXT: 2000       // Total context budget
    };

    // Query type patterns for context optimization
    this.QUERY_PATTERNS = {
      PERSONAL_INFO: /(?:my|our|who is|what does|when do|where do).*(family|wife|husband|kid|child|schedule|preference)/i,
      CONTACT_REQUEST: /(?:contact|call|reach|find).*(doctor|teacher|school|coach)/i,
      ACTIVITY_QUERY: /(?:activity|practice|lesson|schedule|when).*(today|tomorrow|this week|next week)/i,
      PREFERENCE_QUERY: /(?:like|dislike|prefer|avoid|allergic|restriction)/i,
      EMERGENCY_QUERY: /(?:emergency|urgent|important|asap|help)/i
    };
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4); // ~4 chars per token
  }

  /**
   * Categorize query to determine context priority
   */
  categorizeQuery(userQuery) {
    const categories = [];

    for (const [category, pattern] of Object.entries(this.QUERY_PATTERNS)) {
      if (pattern.test(userQuery)) {
        categories.push(category);
      }
    }

    return categories.length > 0 ? categories : ['GENERAL'];
  }

  /**
   * Get optimized agent memory based on query type
   */
  async getOptimizedMemories(userId, userQuery, tokenBudget = this.TOKEN_LIMITS.AGENT_MEMORY) {
    try {
      const categories = this.categorizeQuery(userQuery);

      // Get all relevant memories first
      const memoryResult = await AgentMemoryService.getRelevantMemories(userId, userQuery);
      if (!memoryResult.success || !memoryResult.memories) {
        return { memories: {}, tokenCount: 0 };
      }

      const allMemories = memoryResult.memories;
      const optimizedMemories = {};
      let currentTokens = 0;

      // Priority order based on query categories
      const priorityOrder = this.getPriorityOrder(categories);

      console.log(`🎯 Query categories: ${categories.join(', ')}`);
      console.log(`📊 Priority order: ${priorityOrder.join(' > ')}`);

      // Add memories in priority order until token budget is reached
      for (const contextType of priorityOrder) {
        if (allMemories[contextType]) {
          const memories = allMemories[contextType];

          for (const memory of memories) {
            const memoryText = this.formatMemoryForPrompt(memory);
            const tokens = this.estimateTokens(memoryText);

            if (currentTokens + tokens <= tokenBudget) {
              if (!optimizedMemories[contextType]) {
                optimizedMemories[contextType] = [];
              }
              optimizedMemories[contextType].push(memory);
              currentTokens += tokens;
            } else {
              // Try to compress the memory if it's important
              const compressed = this.compressMemory(memory);
              const compressedTokens = this.estimateTokens(compressed);

              if (currentTokens + compressedTokens <= tokenBudget) {
                if (!optimizedMemories[contextType]) {
                  optimizedMemories[contextType] = [];
                }
                optimizedMemories[contextType].push({
                  ...memory,
                  value: compressed,
                  compressed: true
                });
                currentTokens += compressedTokens;
              }
            }

            // Break if budget exceeded
            if (currentTokens >= tokenBudget) break;
          }
        }

        if (currentTokens >= tokenBudget) break;
      }

      console.log(`🧠 Memory optimization: ${Object.keys(allMemories).length} types → ${Object.keys(optimizedMemories).length} types, ~${currentTokens} tokens`);

      return {
        memories: optimizedMemories,
        tokenCount: currentTokens,
        compressionRatio: currentTokens / this.estimateTokens(JSON.stringify(allMemories))
      };

    } catch (error) {
      console.error('❌ Error optimizing memories:', error);
      return { memories: {}, tokenCount: 0 };
    }
  }

  /**
   * Determine priority order based on query categories
   */
  getPriorityOrder(categories) {
    const basePriority = ['contact_info', 'family_info', 'activity_info', 'preference_info', 'education_info'];

    // Reorder based on query type
    if (categories.includes('CONTACT_REQUEST')) {
      return ['contact_info', 'family_info', 'education_info', 'activity_info', 'preference_info'];
    }

    if (categories.includes('ACTIVITY_QUERY')) {
      return ['activity_info', 'family_info', 'education_info', 'contact_info', 'preference_info'];
    }

    if (categories.includes('PREFERENCE_QUERY')) {
      return ['preference_info', 'family_info', 'contact_info', 'activity_info', 'education_info'];
    }

    if (categories.includes('EMERGENCY_QUERY')) {
      return ['contact_info', 'preference_info', 'family_info', 'activity_info', 'education_info'];
    }

    return basePriority;
  }

  /**
   * Format memory for prompt (simplified version)
   */
  formatMemoryForPrompt(memory) {
    if (typeof memory.value === 'string') {
      return memory.value;
    }

    if (typeof memory.value === 'object') {
      const data = memory.value;

      // Format based on context type
      switch (data.context_type) {
        case 'contact_info':
          return `${data.name}: ${data.role}${data.phone ? `, ${data.phone}` : ''}${data.email ? `, ${data.email}` : ''}${data.notes ? ` (${data.notes})` : ''}`;

        case 'family_info':
          return `${data.name}: ${data.relationship}${data.age ? `, age ${data.age}` : ''}${data.birthday_month ? `, birthday ${data.birthday_month}/${data.birthday_day}` : ''}`;

        case 'activity_info':
          return `${data.name}: ${data.type}${data.member_name ? ` for ${data.member_name}` : ''}${data.frequency ? `, ${data.frequency}` : ''}${data.days ? ` on ${data.days.join(', ')}` : ''}`;

        case 'education_info':
          return `${data.name}: ${data.type}${data.member_name ? ` for ${data.member_name}` : ''}${data.grade ? `, ${data.grade}` : ''}`;

        case 'preference_info':
          return `${data.name}: ${data.type} - ${Array.isArray(data.items) ? data.items.join(', ') : data.items}`;

        default:
          return JSON.stringify(data);
      }
    }

    return String(memory.value);
  }

  /**
   * Compress memory by removing non-essential information
   */
  compressMemory(memory) {
    if (typeof memory.value === 'string') {
      // Simple text compression: remove filler words
      return memory.value.replace(/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by)\b/gi, '').trim();
    }

    if (typeof memory.value === 'object') {
      const data = memory.value;
      const compressed = {};

      // Keep only essential fields
      const essentialFields = {
        contact_info: ['name', 'role', 'phone'],
        family_info: ['name', 'relationship', 'age'],
        activity_info: ['name', 'type', 'member_name'],
        education_info: ['name', 'type', 'member_name'],
        preference_info: ['name', 'items']
      };

      const fields = essentialFields[data.context_type] || Object.keys(data);

      for (const field of fields) {
        if (data[field] !== undefined && data[field] !== null) {
          compressed[field] = data[field];
        }
      }

      return compressed;
    }

    return memory.value;
  }

  /**
   * Optimize conversation history based on token budget
   */
  optimizeConversationHistory(messages, tokenBudget = this.TOKEN_LIMITS.CONVERSATION_HISTORY) {
    if (!messages || messages.length === 0) {
      return { messages: [], tokenCount: 0 };
    }

    // Always include the last few messages
    const recentMessages = messages.slice(-3);
    let currentTokens = 0;
    const optimizedMessages = [];

    // Add recent messages first
    for (const message of recentMessages) {
      const tokens = this.estimateTokens(message.content);
      if (currentTokens + tokens <= tokenBudget) {
        optimizedMessages.push(message);
        currentTokens += tokens;
      }
    }

    // Add older messages if budget allows
    const olderMessages = messages.slice(0, -3).reverse(); // Most recent first
    for (const message of olderMessages) {
      const tokens = this.estimateTokens(message.content);
      if (currentTokens + tokens <= tokenBudget) {
        optimizedMessages.unshift(message); // Add to beginning
        currentTokens += tokens;
      } else {
        break;
      }
    }

    console.log(`💬 Conversation optimization: ${messages.length} messages → ${optimizedMessages.length} messages, ~${currentTokens} tokens`);

    return {
      messages: optimizedMessages,
      tokenCount: currentTokens
    };
  }

  /**
   * Create optimized system prompt with token awareness
   */
  async createOptimizedPrompt(userId, userQuery, basePrompt) {
    const categories = this.categorizeQuery(userQuery);
    let totalTokens = this.estimateTokens(basePrompt);
    let prompt = basePrompt;

    // Calculate remaining budget
    const remainingBudget = this.TOKEN_LIMITS.TOTAL_CONTEXT - totalTokens;
    const memoryBudget = Math.min(this.TOKEN_LIMITS.AGENT_MEMORY, remainingBudget * 0.6); // 60% for memories

    // Get optimized memories
    const memoryResult = await this.getOptimizedMemories(userId, userQuery, memoryBudget);

    if (Object.keys(memoryResult.memories).length > 0) {
      const formattedMemories = AgentMemoryService.formatMemoriesForPrompt(memoryResult.memories);
      prompt += formattedMemories;
      totalTokens += memoryResult.tokenCount;
    }

    // Add query-specific instructions
    if (categories.includes('EMERGENCY_QUERY')) {
      prompt += '\n\nIMPORTANT: This appears to be an urgent request. Prioritize immediate, actionable information.';
    }

    console.log(`📝 Optimized prompt: ~${totalTokens} tokens (${Math.round((totalTokens / this.TOKEN_LIMITS.TOTAL_CONTEXT) * 100)}% of budget)`);

    return {
      prompt,
      tokenCount: totalTokens,
      categories,
      optimization: {
        memoriesUsed: Object.keys(memoryResult.memories).length,
        compressionRatio: memoryResult.compressionRatio
      }
    };
  }
}