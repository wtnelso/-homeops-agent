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

    // Intent classification using keyword scoring
    this.INTENT_KEYWORDS = {
      SCHEDULE_QUERY: {
        // High-value schedule terms
        'schedule': 0.9,
        'calendar': 0.9,
        'activities': 0.8,
        'agenda': 0.8,
        'going on': 0.8,
        'happening': 0.7,
        'planned': 0.7,
        'events': 0.7,
        'practice': 0.6,
        'lesson': 0.6,
        'class': 0.6,
        'sport': 0.5,
        // Time references
        'today': 0.6,
        'tomorrow': 0.6,
        'this week': 0.7,
        'next week': 0.6,
        'weekend': 0.5,
        'week': 0.4,
        // Activity phrases
        'do we have': 0.5,
        'what do': 0.3,
        'show me': 0.3
      },
      EMAIL_QUERY: {
        'email': 0.9,
        'emails': 0.9,
        'inbox': 0.8,
        'mail': 0.7,
        'message': 0.6,
        'messages': 0.6,
        'correspondence': 0.5,
        'from': 0.4, // "email from X"
        'check': 0.3 // "check email"
      },
      CONTACT_QUERY: {
        'contact': 0.9,
        'doctor': 0.9,
        'teacher': 0.9,
        'pediatrician': 0.8,
        'dentist': 0.8,
        'coach': 0.7,
        'phone': 0.7,
        'number': 0.6,
        'call': 0.5,
        'reach': 0.5,
        'who is': 0.6
      },
      PREFERENCE_QUERY: {
        'like': 0.8,
        'likes': 0.8,
        'dislike': 0.8,
        'dislikes': 0.8,
        'prefer': 0.9,
        'preference': 0.9,
        'preferences': 0.9,
        'avoid': 0.8,
        'allergic': 0.9,
        'allergy': 0.9,
        'restriction': 0.8,
        'restrictions': 0.8
      },
      EMERGENCY_QUERY: {
        'emergency': 1.0,
        'urgent': 0.9,
        'important': 0.7,
        'asap': 0.8,
        'help': 0.6,
        'crisis': 0.9
      }
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
   * Classify query intent using keyword scoring
   */
  classifyIntent(userQuery) {
    const query = userQuery.toLowerCase();
    const intentScores = {};

    // Initialize all intent scores to 0
    for (const intent of Object.keys(this.INTENT_KEYWORDS)) {
      intentScores[intent] = 0;
    }

    // Score each intent based on keyword matches
    for (const [intent, keywords] of Object.entries(this.INTENT_KEYWORDS)) {
      for (const [keyword, weight] of Object.entries(keywords)) {
        if (query.includes(keyword.toLowerCase())) {
          intentScores[intent] += weight;
        }
      }
    }

    // Find the highest scoring intent(s)
    const maxScore = Math.max(...Object.values(intentScores));

    if (maxScore === 0) {
      return { primary: 'GENERAL', confidence: 0, scores: intentScores };
    }

    const topIntents = Object.entries(intentScores)
      .filter(([intent, score]) => score === maxScore)
      .map(([intent, score]) => intent);

    console.log(`🎯 Intent classification for "${userQuery}":`, {
      primary: topIntents[0],
      confidence: maxScore,
      allScores: intentScores
    });

    return {
      primary: topIntents[0],
      confidence: maxScore,
      scores: intentScores,
      allTopIntents: topIntents
    };
  }

  /**
   * Categorize query to determine context priority (legacy method for compatibility)
   */
  categorizeQuery(userQuery) {
    const classification = this.classifyIntent(userQuery);

    // Map new intent system to legacy categories
    const intentToCategory = {
      'SCHEDULE_QUERY': 'ACTIVITY_QUERY',
      'EMAIL_QUERY': 'GENERAL', // Email queries don't need agent memory
      'CONTACT_QUERY': 'CONTACT_REQUEST',
      'PREFERENCE_QUERY': 'PREFERENCE_QUERY',
      'EMERGENCY_QUERY': 'EMERGENCY_QUERY',
      'GENERAL': 'GENERAL'
    };

    const primaryCategory = intentToCategory[classification.primary] || 'GENERAL';
    return [primaryCategory];
  }

  /**
   * Get optimized agent memory based on query type
   */
  async getOptimizedMemories(userId, userQuery, tokenBudget = this.TOKEN_LIMITS.AGENT_MEMORY) {
    try {
      // Use new intent classification
      const classification = this.classifyIntent(userQuery);
      const categories = this.categorizeQuery(userQuery); // Legacy compatibility

      // Get all relevant memories first
      const memoryResult = await AgentMemoryService.getRelevantMemories(userId, userQuery);
      if (!memoryResult.success || !memoryResult.memories) {
        return { memories: {}, tokenCount: 0 };
      }

      const allMemories = memoryResult.memories;
      const optimizedMemories = {};
      let currentTokens = 0;

      // Priority order based on intent classification
      const priorityOrder = this.getPriorityOrderByIntent(classification.primary);

      console.log(`🎯 Intent: ${classification.primary} (confidence: ${classification.confidence.toFixed(2)})`);
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
   * Determine priority order based on intent classification
   */
  getPriorityOrder(categories) {
    const basePriority = ['contact_info', 'family_info', 'activity_info', 'preference_info', 'education_info'];

    // Reorder based on query type
    if (categories.includes('CONTACT_REQUEST')) {
      return ['contact_info', 'family_info', 'education_info', 'activity_info', 'preference_info'];
    }

    if (categories.includes('ACTIVITY_QUERY')) {
      return ['activity_info', 'education_info']; // Only activity-related info for focused responses
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
   * Determine priority order based on intent classification (new method)
   */
  getPriorityOrderByIntent(intent) {
    switch(intent) {
      case 'SCHEDULE_QUERY':
        return ['activity_info', 'education_info']; // Only schedule-related info
      case 'EMAIL_QUERY':
        return []; // No agent memory needed for email queries
      case 'CONTACT_QUERY':
        return ['contact_info', 'family_info'];
      case 'PREFERENCE_QUERY':
        return ['preference_info', 'family_info'];
      case 'EMERGENCY_QUERY':
        return ['contact_info', 'preference_info', 'family_info', 'activity_info', 'education_info'];
      default:
        return ['contact_info', 'family_info', 'activity_info', 'preference_info', 'education_info'];
    }
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
    const classification = this.classifyIntent(userQuery);
    const categories = this.categorizeQuery(userQuery); // Legacy compatibility
    let totalTokens = this.estimateTokens(basePrompt);
    let prompt = basePrompt;

    // Calculate remaining budget
    const remainingBudget = this.TOKEN_LIMITS.TOTAL_CONTEXT - totalTokens;
    const memoryBudget = Math.min(this.TOKEN_LIMITS.AGENT_MEMORY, remainingBudget * 0.6); // 60% for memories

    // Get optimized memories using new intent classification
    const memoryResult = await this.getOptimizedMemories(userId, userQuery, memoryBudget);

    if (Object.keys(memoryResult.memories).length > 0) {
      const formattedMemories = AgentMemoryService.formatMemoriesForPrompt(memoryResult.memories);
      prompt += formattedMemories;
      totalTokens += memoryResult.tokenCount;
    }

    // Add intent-specific instructions
    switch (classification.primary) {
      case 'EMERGENCY_QUERY':
        prompt += '\n\nIMPORTANT: This appears to be an urgent request. Prioritize immediate, actionable information.';
        break;

      case 'SCHEDULE_QUERY':
        prompt += '\n\nINSTRUCTION: User is asking about activities/schedules. Focus only on relevant activities. Be concise - list activities with essential details (name, dates, times) in a clear format. Do not include unrelated family information, contacts, or preferences unless directly requested.';
        break;

      case 'CONTACT_QUERY':
        prompt += '\n\nINSTRUCTION: User is asking about contacts. Focus only on the specific contact requested. Provide name, role, and contact details. Do not include unrelated information.';
        break;

      case 'EMAIL_QUERY':
        prompt += '\n\nINSTRUCTION: User is asking about emails. Use email tools to search and retrieve the requested information. Do not rely on stored agent memory for email content.';
        break;

      case 'PREFERENCE_QUERY':
        prompt += '\n\nINSTRUCTION: User is asking about preferences. Focus on the specific preferences or restrictions requested.';
        break;
    }

    console.log(`📝 Optimized prompt: ~${totalTokens} tokens (${Math.round((totalTokens / this.TOKEN_LIMITS.TOTAL_CONTEXT) * 100)}% of budget)`);

    return {
      prompt,
      tokenCount: totalTokens,
      categories,
      intent: classification,
      optimization: {
        memoriesUsed: Object.keys(memoryResult.memories).length,
        compressionRatio: memoryResult.compressionRatio
      }
    };
  }
}