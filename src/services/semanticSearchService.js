/**
 * Semantic Search Service - Frontend Client
 *
 * Provides a frontend interface for semantic email search functionality.
 * Makes API calls to the Render server semantic search endpoint.
 *
 * Features:
 * - Type-safe semantic search requests
 * - Automatic authentication token handling
 * - Error handling and user-friendly error messages
 * - Result formatting and caching
 */

import { supabase } from '../lib/supabase';

/**
 * Semantic Search Service
 */
export class SemanticSearchService {
  static getApiEndpoint() {
    const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
    return `${serverUrl}/api/semantic-search`;
  }

  /**
   * Perform semantic search on user's emails
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query text
   * @param {string} params.account_id - User's account ID
   * @param {number} [params.max_results=10] - Maximum results to return
   * @param {number} [params.similarity_threshold=0.5] - Minimum similarity score
   * @returns {Promise<Object>} Search results with metadata
   */
  static async searchEmails({ query, account_id, max_results = 10, similarity_threshold = 0.5 }) {
    try {
      // Validate inputs
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        throw new Error('Search query is required and must be a non-empty string');
      }

      if (!account_id || typeof account_id !== 'string') {
        throw new Error('Account ID is required');
      }

      if (max_results < 1 || max_results > 50) {
        throw new Error('Max results must be between 1 and 50');
      }

      if (similarity_threshold < 0.1 || similarity_threshold > 1.0) {
        throw new Error('Similarity threshold must be between 0.1 and 1.0');
      }

      // Get current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Authentication required. Please log in.');
      }

      // Make API request
      const response = await fetch(this.getApiEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          query: query.trim(),
          account_id,
          max_results,
          similarity_threshold
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
          `Search request failed with status ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Search operation failed');
      }

      return {
        success: true,
        query: result.query,
        results: result.results || [],
        metadata: result.metadata || {},
        totalResults: result.results?.length || 0
      };

    } catch (error) {
      console.error('Semantic search error:', error);

      return {
        success: false,
        error: error.message || 'An unexpected error occurred during search',
        results: [],
        metadata: {},
        totalResults: 0
      };
    }
  }

  /**
   * Search emails with automatic query enhancement
   * @param {Object} params - Search parameters
   * @param {string} params.query - Search query text
   * @param {string} params.account_id - User's account ID
   * @param {Object} [params.options] - Additional search options
   * @returns {Promise<Object>} Enhanced search results
   */
  static async enhancedSearch({ query, account_id, options = {} }) {
    const searchParams = {
      query,
      account_id,
      max_results: options.maxResults || 15,
      similarity_threshold: options.threshold || 0.4
    };

    const result = await this.searchEmails(searchParams);

    if (!result.success) {
      return result;
    }

    // Add enhanced formatting to results
    const enhancedResults = result.results.map(email => ({
      ...email,
      // Format similarity score as percentage
      similarity_percentage: Math.round(email.similarity_score * 100),
      // Format timestamp for display
      formatted_timestamp: new Date(email.timestamp).toLocaleString(),
      // Highlight snippet (basic implementation)
      highlighted_snippet: this._highlightQueryInSnippet(
        email.content_snippet,
        query
      ),
      // Relevance category based on score
      relevance_category: this._getRelevanceCategory(email.similarity_score)
    }));

    return {
      ...result,
      results: enhancedResults,
      queryEnhancements: {
        suggestedFilters: this._generateSuggestedFilters(enhancedResults),
        searchTips: this._generateSearchTips(query, result.totalResults)
      }
    };
  }

  /**
   * Basic query highlighting in snippets
   * @private
   */
  static _highlightQueryInSnippet(snippet, query) {
    if (!snippet || !query) return snippet;

    // Simple word-based highlighting
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let highlighted = snippet;

    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });

    return highlighted;
  }

  /**
   * Categorize relevance based on similarity score
   * @private
   */
  static _getRelevanceCategory(score) {
    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }

  /**
   * Generate suggested filters based on results
   * @private
   */
  static _generateSuggestedFilters(results) {
    const filters = [];

    // Suggest domain filters if multiple domains present
    const domains = [...new Set(results.map(r => r.from_domain).filter(Boolean))];
    if (domains.length > 1 && domains.length <= 3) {
      filters.push({
        type: 'domain',
        label: 'Filter by sender',
        options: domains.slice(0, 3)
      });
    }

    // Suggest time-based filters if results span multiple periods
    const timestamps = results.map(r => new Date(r.timestamp)).sort();
    if (timestamps.length > 5) {
      const oldest = timestamps[0];
      const newest = timestamps[timestamps.length - 1];
      const daysDiff = (newest - oldest) / (1000 * 60 * 60 * 24);

      if (daysDiff > 30) {
        filters.push({
          type: 'timeframe',
          label: 'Filter by date',
          options: ['Last 7 days', 'Last 30 days', 'Last 90 days']
        });
      }
    }

    return filters;
  }

  /**
   * Generate helpful search tips based on query and results
   * @private
   */
  static _generateSearchTips(query, resultCount) {
    const tips = [];

    if (resultCount === 0) {
      tips.push('Try broader search terms or reduce the similarity threshold');
      tips.push('Check spelling and try synonyms');
    } else if (resultCount < 3) {
      tips.push('Try broader search terms for more results');
    } else if (resultCount > 20) {
      tips.push('Use more specific terms to narrow results');
      tips.push('Consider using date ranges or sender filters');
    }

    if (query.length < 5) {
      tips.push('Longer, more descriptive queries often yield better results');
    }

    return tips;
  }
}

export default SemanticSearchService;