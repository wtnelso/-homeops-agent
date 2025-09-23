/**
 * Intelligent Chat Orchestrator
 *
 * Combines three intelligence sources for powerful chat responses:
 * 1. Agent Memory (Neon) - Personal context and family knowledge
 * 2. Email Analysis (Supabase) - Structured email insights
 * 3. Email Embeddings (Supabase) - Semantic email search
 */

import { AgentMemoryService } from './agentMemoryService.js';
import { EmailSearchService } from './emailSearchService.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class IntelligentChatOrchestrator {
  constructor() {
    this.emailSearchService = new EmailSearchService();
    this.queryCache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
  }

  /**
   * Analyze query type to determine which intelligence sources to use
   */
  static analyzeQuery(userInput) {
    const queryTypes = {
      // Route to Agent Memory
      PERSONAL_INFO: /(?:my|our)\s+(wife|husband|son|daughter|child|schedule|preference)/i,
      FAMILY_FACTS: /(who is|what does|when do|where do).*(family|wife|husband|kid|child)/i,

      // Route to Email Analysis
      ACTION_ITEMS: /(what do I need|tasks|todo|deadline|due|urgent)/i,
      FAMILY_COORDINATION: /(schedule|appointment|practice|meeting|pickup|coordinate)/i,

      // Route to Semantic Search
      EMAIL_CONTENT: /(find email|search email|email about|show me email)/i,
      RECENT_COMMUNICATIONS: /(recent|latest|last email|yesterday|this week|today)/i,

      // Hybrid queries (use multiple sources)
      COMPLEX_PLANNING: /(plan|organize|coordinate|manage|help me with)/i,
      WEEKEND_FAMILY: /(weekend|saturday|sunday|family time|family activity)/i
    };

    const matches = [];
    for (const [type, pattern] of Object.entries(queryTypes)) {
      if (pattern.test(userInput)) {
        matches.push(type);
      }
    }

    return matches.length > 0 ? matches : ['GENERAL'];
  }

  /**
   * Get combined intelligence context for chat response
   */
  async getCombinedContext(accountId, userQuery, conversationId = null) {
    try {
      console.log(`🧠 Orchestrating intelligence for: "${userQuery}"`);

      const queryTypes = IntelligentChatOrchestrator.analyzeQuery(userQuery);
      console.log(`📊 Query types detected:`, queryTypes);

      // Check cache first
      const cacheKey = `${accountId}:${userQuery}`;
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`⚡ Using cached context`);
        return cached.context;
      }

      // Parallel intelligence gathering
      const intelligencePromises = [];

      // 1. Always get agent memory (personal context)
      intelligencePromises.push(
        this.getAgentMemoryContext(accountId, userQuery)
          .then(data => ({ source: 'agent_memory', data }))
          .catch(err => ({ source: 'agent_memory', data: null, error: err.message }))
      );

      // 2. Get email analysis if relevant
      if (this.shouldUseEmailAnalysis(queryTypes)) {
        intelligencePromises.push(
          this.getEmailAnalysisContext(accountId, userQuery, queryTypes)
            .then(data => ({ source: 'email_analysis', data }))
            .catch(err => ({ source: 'email_analysis', data: null, error: err.message }))
        );
      }

      // 3. Get semantic search if relevant
      if (this.shouldUseSemanticSearch(queryTypes)) {
        intelligencePromises.push(
          this.getSemanticSearchContext(accountId, userQuery)
            .then(data => ({ source: 'semantic_search', data }))
            .catch(err => ({ source: 'semantic_search', data: null, error: err.message }))
        );
      }

      // Wait for all intelligence sources
      const intelligenceResults = await Promise.allSettled(intelligencePromises);
      const successfulResults = intelligenceResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      // Combine and prioritize intelligence
      const combinedContext = this.combineIntelligence(successfulResults, queryTypes);

      // Cache the result
      this.queryCache.set(cacheKey, {
        context: combinedContext,
        timestamp: Date.now()
      });

      return combinedContext;

    } catch (error) {
      console.error('🚨 Error in chat orchestrator:', error);
      return {
        success: false,
        error: error.message,
        context: {
          agent_memory: null,
          email_analysis: null,
          semantic_search: null,
          combined_insights: []
        }
      };
    }
  }

  /**
   * Get agent memory context
   */
  async getAgentMemoryContext(accountId, query) {
    console.log(`🎯 Getting agent memory context...`);

    const memoryResult = await AgentMemoryService.getRelevantMemories(
      accountId,
      query,
      10 // limit
    );

    if (!memoryResult.success || memoryResult.memories.length === 0) {
      return { memories: [], context: '' };
    }

    const formattedContext = AgentMemoryService.formatMemoriesForPrompt(memoryResult.memories);

    return {
      memories: memoryResult.memories,
      context: formattedContext,
      count: memoryResult.memories.length,
      temporal_filter: memoryResult.temporalFilter
    };
  }

  /**
   * Get email analysis context (structured insights)
   */
  async getEmailAnalysisContext(accountId, query, queryTypes) {
    console.log(`📧 Getting email analysis context...`);

    // Build smart filters based on query type
    const filters = this.buildEmailAnalysisFilters(queryTypes);

    const { data: analysisResults, error } = await supabase
      .from('email_content_analysis')
      .select(`
        *,
        email_records!inner(subject, from_email, timestamp)
      `)
      .eq('account_id', accountId)
      .gte('family_relevance_score', filters.minFamilyRelevance)
      .order('family_relevance_score', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(`Email analysis query failed: ${error.message}`);
    }

    return {
      analysis: analysisResults || [],
      count: analysisResults?.length || 0,
      filters_used: filters
    };
  }

  /**
   * Get semantic search context
   */
  async getSemanticSearchContext(accountId, query) {
    console.log(`🔍 Getting semantic search context...`);

    const searchResults = await this.emailSearchService.semanticSearch(query, {
      account_id: accountId,
      limit: 5,
      similarity_threshold: 0.5,
      include_content: true
    });

    return {
      emails: searchResults.results || [],
      count: searchResults.total_results || 0,
      search_metadata: searchResults.metadata || {}
    };
  }

  /**
   * Determine if email analysis should be used
   */
  shouldUseEmailAnalysis(queryTypes) {
    const emailAnalysisTypes = [
      'ACTION_ITEMS', 'FAMILY_COORDINATION', 'COMPLEX_PLANNING', 'WEEKEND_FAMILY'
    ];
    return queryTypes.some(type => emailAnalysisTypes.includes(type));
  }

  /**
   * Determine if semantic search should be used
   */
  shouldUseSemanticSearch(queryTypes) {
    const semanticSearchTypes = [
      'EMAIL_CONTENT', 'RECENT_COMMUNICATIONS', 'COMPLEX_PLANNING'
    ];
    return queryTypes.some(type => semanticSearchTypes.includes(type));
  }

  /**
   * Build email analysis filters based on query types
   */
  buildEmailAnalysisFilters(queryTypes) {
    let minFamilyRelevance = 0.5; // default
    const filters = { minFamilyRelevance };

    if (queryTypes.includes('ACTION_ITEMS')) {
      minFamilyRelevance = Math.max(minFamilyRelevance, 0.6);
      filters.has_deadline = true;
    }

    if (queryTypes.includes('FAMILY_COORDINATION')) {
      minFamilyRelevance = Math.max(minFamilyRelevance, 0.7);
      filters.requires_coordination = true;
    }

    if (queryTypes.includes('COMPLEX_PLANNING')) {
      minFamilyRelevance = Math.max(minFamilyRelevance, 0.6);
      filters.involves_children = true;
    }

    filters.minFamilyRelevance = minFamilyRelevance;
    return filters;
  }

  /**
   * Combine intelligence from multiple sources
   */
  combineIntelligence(intelligenceResults, queryTypes) {
    const context = {
      agent_memory: null,
      email_analysis: null,
      semantic_search: null,
      combined_insights: [],
      intelligence_summary: {}
    };

    // Process each intelligence source
    intelligenceResults.forEach(result => {
      if (result.data) {
        context[result.source] = result.data;
      }
    });

    // Generate combined insights
    const insights = [];

    // Agent memory insights
    if (context.agent_memory?.memories?.length > 0) {
      insights.push({
        type: 'personal_context',
        priority: 'high',
        source: 'agent_memory',
        insight: `Found ${context.agent_memory.count} relevant personal details`,
        data: context.agent_memory.memories.slice(0, 3) // Top 3 most relevant
      });
    }

    // Email analysis insights
    if (context.email_analysis?.analysis?.length > 0) {
      const urgentItems = context.email_analysis.analysis.filter(a =>
        a.has_deadline || a.family_relevance_score > 0.8
      );

      if (urgentItems.length > 0) {
        insights.push({
          type: 'urgent_family_matters',
          priority: 'high',
          source: 'email_analysis',
          insight: `Found ${urgentItems.length} urgent family-related items`,
          data: urgentItems
        });
      }
    }

    // Semantic search insights
    if (context.semantic_search?.emails?.length > 0) {
      insights.push({
        type: 'relevant_communications',
        priority: 'medium',
        source: 'semantic_search',
        insight: `Found ${context.semantic_search.count} relevant emails`,
        data: context.semantic_search.emails.slice(0, 3)
      });
    }

    context.combined_insights = insights.sort((a, b) => {
      const priority = { high: 3, medium: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });

    // Intelligence summary
    context.intelligence_summary = {
      sources_used: intelligenceResults.map(r => r.source),
      total_memories: context.agent_memory?.count || 0,
      total_email_analysis: context.email_analysis?.count || 0,
      total_semantic_results: context.semantic_search?.count || 0,
      query_types: queryTypes,
      generated_at: new Date().toISOString()
    };

    return {
      success: true,
      context
    };
  }

  /**
   * Format combined context for LangChain prompt
   */
  static formatContextForPrompt(combinedContext) {
    if (!combinedContext.success) {
      return '';
    }

    let prompt = '\n\n=== INTELLIGENT CONTEXT ===\n';

    // Agent Memory Context
    if (combinedContext.context.agent_memory?.context) {
      prompt += combinedContext.context.agent_memory.context;
    }

    // Key Insights
    if (combinedContext.context.combined_insights.length > 0) {
      prompt += '\n\nKey Insights:\n';
      combinedContext.context.combined_insights.forEach(insight => {
        prompt += `- ${insight.insight} (${insight.source})\n`;
      });
    }

    // Recent Email Context
    if (combinedContext.context.semantic_search?.emails?.length > 0) {
      prompt += '\n\nRelevant Recent Emails:\n';
      combinedContext.context.semantic_search.emails.slice(0, 2).forEach(email => {
        prompt += `- "${email.subject}" from ${email.from_email}\n`;
      });
    }

    prompt += '\n=== END CONTEXT ===\n';

    return prompt;
  }
}

export default IntelligentChatOrchestrator;