/**
 * Email Semantic Search Service
 *
 * Provides vector similarity search and hybrid search capabilities
 * for finding relevant emails based on semantic meaning and themes.
 *
 * Features:
 * - Vector similarity search using OpenAI embeddings
 * - Hybrid search combining vector similarity + structured filters
 * - Theme-based filtering and ranking
 * - Relevance scoring and result ranking
 * - Performance-optimized queries
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from '@langchain/openai';
import { EmailConfig } from '../config/emailConfig.js';
import { globalRateLimiter } from './openaiRateLimiter.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class EmailSearchService {
  constructor() {
    // Initialize OpenAI embeddings for query vectorization
    this.embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_EMBEDDING_MODEL || EmailConfig.openaiConfig.embeddingModel
    });

    console.log('🔍 Email Search Service initialized');
  }

  /**
   * Semantic search for emails using vector similarity
   */
  async semanticSearch(query, options = {}) {
    try {
      const {
        account_id,
        limit = 10,
        similarity_threshold = 0.7,
        include_content = false,
        date_range = null
      } = options;

      console.log(`🔍 Semantic search: "${query}" for account ${account_id}`);

      // Step 1: Generate embedding for search query
      const queryEmbedding = await this.generateQueryEmbedding(query);

      // Step 2: Perform vector similarity search
      const searchResults = await this.performVectorSearch(
        queryEmbedding,
        account_id,
        limit,
        similarity_threshold,
        date_range
      );

      // Step 3: Enrich results with content if requested
      const enrichedResults = include_content
        ? await this.enrichResultsWithContent(searchResults)
        : searchResults;

      // Step 4: Calculate relevance scores
      const rankedResults = this.calculateRelevanceScores(enrichedResults, query);

      console.log(`✅ Found ${rankedResults.length} semantic matches`);

      return {
        query,
        results: rankedResults,
        total_found: rankedResults.length,
        search_type: 'semantic',
        similarity_threshold,
        processing_time_ms: Date.now() - Date.now() // Will be calculated in wrapper
      };

    } catch (error) {
      console.error('❌ Semantic search failed:', error);
      throw new Error(`Semantic search failed: ${error.message}`);
    }
  }

  /**
   * Hybrid search combining vector similarity + structured filters
   */
  async hybridSearch(query, filters = {}, options = {}) {
    try {
      const {
        account_id,
        limit = 10,
        similarity_threshold = 0.6, // Lower threshold for hybrid
        include_content = false
      } = options;

      console.log(`🔍 Hybrid search: "${query}" with filters:`, filters);

      // Step 1: Generate embedding for search query
      const queryEmbedding = await this.generateQueryEmbedding(query);

      // Step 2: Build structured filters
      const structuredFilters = this.buildStructuredFilters(filters);

      // Step 3: Perform hybrid vector + structured search
      const searchResults = await this.performHybridSearch(
        queryEmbedding,
        account_id,
        structuredFilters,
        limit,
        similarity_threshold
      );

      // Step 4: Enrich and rank results
      const enrichedResults = include_content
        ? await this.enrichResultsWithContent(searchResults)
        : searchResults;

      const rankedResults = this.calculateHybridRelevanceScores(
        enrichedResults,
        query,
        filters
      );

      console.log(`✅ Found ${rankedResults.length} hybrid matches`);

      return {
        query,
        filters,
        results: rankedResults,
        total_found: rankedResults.length,
        search_type: 'hybrid',
        similarity_threshold,
        processing_time_ms: Date.now() - Date.now()
      };

    } catch (error) {
      console.error('❌ Hybrid search failed:', error);
      throw new Error(`Hybrid search failed: ${error.message}`);
    }
  }

  /**
   * Theme-based search (structured search without vector similarity)
   */
  async themeSearch(filters = {}, options = {}) {
    try {
      const {
        account_id,
        limit = 20,
        include_content = false,
        sort_by = 'relevance' // 'relevance', 'date', 'priority'
      } = options;

      console.log(`📊 Theme search with filters:`, filters);

      // Build structured query
      const structuredFilters = this.buildStructuredFilters(filters);

      // Perform theme-based search
      const searchResults = await this.performThemeSearch(
        account_id,
        structuredFilters,
        limit,
        sort_by
      );

      // Enrich results if requested
      const enrichedResults = include_content
        ? await this.enrichResultsWithContent(searchResults)
        : searchResults;

      console.log(`✅ Found ${enrichedResults.length} theme matches`);

      return {
        filters,
        results: enrichedResults,
        total_found: enrichedResults.length,
        search_type: 'theme',
        sort_by,
        processing_time_ms: Date.now() - Date.now()
      };

    } catch (error) {
      console.error('❌ Theme search failed:', error);
      throw new Error(`Theme search failed: ${error.message}`);
    }
  }

  /**
   * Generate embedding for search query
   */
  async generateQueryEmbedding(query) {
    try {
      console.log(`🔄 Generating embedding for query: "${query.substring(0, 50)}..."`);

      // Use rate limiter to prevent API overwhelm
      const embeddings = await globalRateLimiter.executeWithRateLimit(
        () => this.embeddings.embedDocuments([query]),
        'embedding'
      );

      const queryEmbedding = embeddings[0];
      console.log(`✅ Generated query embedding (${queryEmbedding.length} dimensions)`);

      return queryEmbedding;

    } catch (error) {
      console.error('❌ Failed to generate query embedding:', error);
      throw error;
    }
  }

  /**
   * Perform vector similarity search using Supabase pgvector
   */
  async performVectorSearch(queryEmbedding, account_id, limit, threshold, dateRange) {
    try {
      // Build the similarity search query
      let query = supabase.rpc('search_emails_by_similarity', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold,
        match_count: limit,
        target_account_id: account_id
      });

      // Add date range filter if specified
      if (dateRange) {
        if (dateRange.start) {
          query = query.gte('created_at', dateRange.start);
        }
        if (dateRange.end) {
          query = query.lte('created_at', dateRange.end);
        }
      }

      const { data: results, error } = await query;

      if (error) {
        console.error('❌ Vector search query failed:', error);
        throw error;
      }

      console.log(`📊 Vector search returned ${results?.length || 0} results`);
      return results || [];

    } catch (error) {
      // Fallback to basic text search if pgvector not available
      console.warn('⚠️  Vector search failed, falling back to text search:', error.message);
      return await this.fallbackTextSearch(account_id, limit);
    }
  }

  /**
   * Perform hybrid search combining vector + structured filters
   */
  async performHybridSearch(queryEmbedding, account_id, filters, limit, threshold) {
    try {
      // Build hybrid search query with both vector similarity and filters
      const { data: results, error } = await supabase.rpc('search_emails_hybrid', {
        query_embedding: JSON.stringify(queryEmbedding),
        match_threshold: threshold,
        match_count: limit,
        target_account_id: account_id,
        theme_filter: filters.themes || null,
        high_relevance_only: filters.high_relevance || false,
        has_deadline: filters.has_deadline || null,
        involves_children: filters.involves_children || null,
        date_range_start: filters.date_range?.start || null,
        date_range_end: filters.date_range?.end || null
      });

      if (error) {
        console.warn('⚠️  Hybrid search RPC failed, using fallback method:', error);
        // Fallback to sequential vector + filter approach
        return await this.fallbackHybridSearch(queryEmbedding, account_id, filters, limit, threshold);
      }

      return results || [];

    } catch (error) {
      console.error('❌ Hybrid search failed:', error);
      return await this.fallbackHybridSearch(queryEmbedding, account_id, filters, limit, threshold);
    }
  }

  /**
   * Perform theme-based structured search
   */
  async performThemeSearch(account_id, filters, limit, sortBy) {
    try {
      let query = supabase
        .from('email_content_analysis')
        .select(`
          *,
          email_embeddings!inner(
            gmail_message_id,
            created_at,
            priority_score
          ),
          email_records!inner(
            subject,
            from_email,
            timestamp
          )
        `)
        .eq('account_id', account_id);

      // Apply structured filters
      if (filters.themes && filters.themes.length > 0) {
        query = query.in('primary_theme', filters.themes);
      }

      if (filters.high_relevance) {
        query = query.gte('family_relevance_score', 0.7);
      }

      if (filters.has_deadline !== null) {
        query = query.eq('has_deadline', filters.has_deadline);
      }

      if (filters.involves_children !== null) {
        query = query.eq('involves_children', filters.involves_children);
      }

      if (filters.date_range) {
        if (filters.date_range.start) {
          query = query.gte('email_records.timestamp', filters.date_range.start);
        }
        if (filters.date_range.end) {
          query = query.lte('email_records.timestamp', filters.date_range.end);
        }
      }

      // Apply sorting
      switch (sortBy) {
        case 'date':
          query = query.order('email_records.timestamp', { ascending: false });
          break;
        case 'priority':
          query = query.order('family_relevance_score', { ascending: false });
          break;
        case 'relevance':
        default:
          query = query.order('family_relevance_score', { ascending: false })
                      .order('email_records.timestamp', { ascending: false });
          break;
      }

      const { data: results, error } = await query.limit(limit);

      if (error) {
        console.error('❌ Theme search failed:', error);
        throw error;
      }

      return this.normalizeThemeSearchResults(results || []);

    } catch (error) {
      console.error('❌ Theme search query failed:', error);
      throw error;
    }
  }

  /**
   * Build structured filters from user input
   */
  buildStructuredFilters(filters) {
    const structured = {};

    // Theme filters
    if (filters.themes) {
      structured.themes = Array.isArray(filters.themes) ? filters.themes : [filters.themes];
    }

    // Relevance filters
    if (filters.high_priority || filters.high_relevance) {
      structured.high_relevance = true;
    }

    // Content type filters
    if (filters.has_deadline !== undefined) {
      structured.has_deadline = Boolean(filters.has_deadline);
    }

    if (filters.involves_children !== undefined) {
      structured.involves_children = Boolean(filters.involves_children);
    }

    // Date range filters
    if (filters.date_range || filters.since || filters.until) {
      structured.date_range = {
        start: filters.date_range?.start || filters.since,
        end: filters.date_range?.end || filters.until
      };
    }

    return structured;
  }

  /**
   * Enrich search results with email content
   */
  async enrichResultsWithContent(results) {
    if (!results || results.length === 0) return [];

    try {
      // Get email content for results
      const emailIds = results.map(r => r.gmail_message_id || r.id);

      const { data: emailContent, error } = await supabase
        .from('email_records')
        .select('gmail_message_id, subject, from_email, body_html, snippet')
        .in('gmail_message_id', emailIds);

      if (error) {
        console.warn('⚠️  Failed to enrich results with content:', error);
        return results;
      }

      // Merge content with search results
      const contentMap = new Map(
        emailContent.map(email => [email.gmail_message_id, email])
      );

      return results.map(result => ({
        ...result,
        email_content: contentMap.get(result.gmail_message_id || result.id) || null
      }));

    } catch (error) {
      console.warn('⚠️  Failed to enrich results:', error);
      return results;
    }
  }

  /**
   * Calculate relevance scores for semantic search results
   */
  calculateRelevanceScores(results, query) {
    if (!results || results.length === 0) return [];

    const queryWords = query.toLowerCase().split(/\s+/);

    return results.map(result => {
      let relevanceScore = result.similarity || 0;

      // Boost score based on theme relevance
      if (result.family_relevance_score > 0.7) {
        relevanceScore += 0.1;
      }

      // Boost score for exact word matches in subject/content
      if (result.email_content) {
        const subject = (result.email_content.subject || '').toLowerCase();
        const matchingWords = queryWords.filter(word => subject.includes(word));
        relevanceScore += (matchingWords.length / queryWords.length) * 0.15;
      }

      // Boost score for recent emails
      if (result.timestamp || result.created_at) {
        const emailDate = new Date(result.timestamp || result.created_at);
        const daysSinceEmail = (Date.now() - emailDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceEmail < 7) {
          relevanceScore += 0.05; // Recent email boost
        }
      }

      return {
        ...result,
        relevance_score: Math.min(1.0, relevanceScore), // Cap at 1.0
        relevance_factors: {
          semantic_similarity: result.similarity || 0,
          theme_relevance: result.family_relevance_score || 0,
          recency_boost: result.timestamp ? 0.05 : 0,
          word_match_boost: 0 // Will be calculated above
        }
      };
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Calculate relevance scores for hybrid search results
   */
  calculateHybridRelevanceScores(results, query, filters) {
    const semanticResults = this.calculateRelevanceScores(results, query);

    // Add additional scoring for filter matches
    return semanticResults.map(result => {
      let hybridScore = result.relevance_score;

      // Boost for theme filter matches
      if (filters.themes && filters.themes.includes(result.primary_theme)) {
        hybridScore += 0.1;
      }

      // Boost for exact filter criteria matches
      if (filters.high_relevance && result.family_relevance_score > 0.7) {
        hybridScore += 0.05;
      }

      if (filters.has_deadline && result.has_deadline) {
        hybridScore += 0.05;
      }

      return {
        ...result,
        relevance_score: Math.min(1.0, hybridScore),
        search_type: 'hybrid'
      };
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  }

  /**
   * Fallback text search when vector search is unavailable
   */
  async fallbackTextSearch(account_id, limit) {
    console.log('🔄 Using fallback text search');

    try {
      const { data: results, error } = await supabase
        .from('email_content_analysis')
        .select(`
          *,
          email_records!inner(subject, from_email, timestamp)
        `)
        .eq('account_id', account_id)
        .order('family_relevance_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return results || [];
    } catch (error) {
      console.error('❌ Fallback text search failed:', error);
      return [];
    }
  }

  /**
   * Fallback hybrid search implementation
   */
  async fallbackHybridSearch(queryEmbedding, account_id, filters, limit, threshold) {
    console.log('🔄 Using fallback hybrid search');

    // First get vector search results
    const vectorResults = await this.performVectorSearch(
      queryEmbedding,
      account_id,
      limit * 2, // Get more results to filter
      threshold,
      filters.date_range
    );

    // Then apply structured filters
    let filteredResults = vectorResults;

    if (filters.themes) {
      filteredResults = filteredResults.filter(r =>
        filters.themes.includes(r.primary_theme)
      );
    }

    if (filters.high_relevance) {
      filteredResults = filteredResults.filter(r =>
        r.family_relevance_score >= 0.7
      );
    }

    return filteredResults.slice(0, limit);
  }

  /**
   * Normalize theme search results to consistent format
   */
  normalizeThemeSearchResults(results) {
    return results.map(result => ({
      id: result.id,
      gmail_message_id: result.gmail_message_id,
      primary_theme: result.primary_theme,
      family_relevance_score: result.family_relevance_score,
      has_deadline: result.has_deadline,
      involves_children: result.involves_children,
      action_items: result.action_items,
      mentioned_people: result.mentioned_people,
      key_information: result.key_information,
      timestamp: result.email_records?.timestamp,
      subject: result.email_records?.subject,
      from_email: result.email_records?.from_email,
      similarity: null, // No similarity score for theme search
      search_type: 'theme'
    }));
  }

  /**
   * Get search suggestions based on user's email themes
   */
  async getSearchSuggestions(account_id, limit = 10) {
    try {
      // Get top themes for this account
      const { data: themes, error } = await supabase
        .from('account_theme_summary')
        .select('theme_name, total_emails, high_relevance_count')
        .eq('account_id', account_id)
        .order('total_emails', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Generate search suggestions based on themes
      const suggestions = themes?.map(theme => ({
        suggestion: `Find ${theme.theme_name} emails`,
        theme: theme.theme_name,
        count: theme.total_emails,
        type: 'theme'
      })) || [];

      // Add common search patterns
      suggestions.push(
        { suggestion: 'High priority emails', type: 'filter', filter: { high_relevance: true } },
        { suggestion: 'Emails with deadlines', type: 'filter', filter: { has_deadline: true } },
        { suggestion: 'Recent family emails', type: 'hybrid', query: 'family', filter: { themes: ['family'] } }
      );

      return suggestions;

    } catch (error) {
      console.error('❌ Failed to get search suggestions:', error);
      return [];
    }
  }
}

export default EmailSearchService;