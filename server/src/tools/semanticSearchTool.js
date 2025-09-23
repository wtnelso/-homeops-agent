/**
 * Semantic Email Search LangChain Tool
 *
 * Provides semantic search capabilities as a LangChain tool for the chat system.
 * Uses vector embeddings to find emails by semantic similarity rather than keyword matching.
 */

import { Tool } from '@langchain/core/tools';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { OPENAI_CONFIG, TOOLS_CONFIG } from '../config/chatConfig.js';

export class SemanticSearchTool extends Tool {
  name = 'semantic_email_search';
  description = `Search the user's email using AI-powered semantic similarity. This finds emails based on meaning rather than exact keyword matches.
  Input should be a JSON string with: {"query": "search terms", "maxResults": 5}

  Examples of semantic searches:
  - "school activities" - finds emails about field trips, sports, homework, etc.
  - "bills due soon" - finds payment reminders, invoices, statements
  - "doctor appointments" - finds medical appointment confirmations, reminders
  - "travel plans" - finds flight confirmations, hotel bookings, itineraries

  Use this tool when the user is asking about topics that might be discussed in their emails.`;

  constructor({ accountId, supabaseUrl, supabaseServiceKey, openaiApiKey }) {
    super();
    this.accountId = accountId;
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  /**
   * Execute semantic search
   */
  async _call(input) {
    try {
      // Input should be the arguments object directly from LangChain
      const { query, maxResults = TOOLS_CONFIG.semantic_search.max_results } = input || {};

      if (!query || typeof query !== 'string') {
        return JSON.stringify({
          success: false,
          error: 'Query parameter is required and must be a string'
        });
      }

      console.log(`🔍 Semantic search: "${query}" for account ${this.accountId}`);

      // Generate embedding for the search query
      const embeddingResponse = await this.openai.embeddings.create({
        model: OPENAI_CONFIG.EMBEDDING_MODEL,
        input: query,
        dimensions: OPENAI_CONFIG.EMBEDDING_DIMENSIONS
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Perform vector similarity search
      const { data: searchResults, error: searchError } = await this.supabase
        .rpc('search_emails_by_embedding', {
          query_embedding: queryEmbedding,
          account_id_param: this.accountId,
          similarity_threshold: TOOLS_CONFIG.semantic_search.similarity_threshold,
          max_results: Math.min(maxResults, TOOLS_CONFIG.semantic_search.max_results)
        });

      if (searchError) {
        console.error('Semantic search error:', searchError);
        return JSON.stringify({
          success: false,
          error: 'Semantic search failed',
          details: searchError.message
        });
      }

      // Format results for LangChain consumption
      const formattedResults = this._formatResults(searchResults);

      return JSON.stringify({
        success: true,
        source: 'semantic_search',
        query,
        total_results: searchResults.length,
        results: formattedResults,
        metadata: {
          search_method: 'vector_similarity',
          account_id: this.accountId,
          searched_at: new Date().toISOString(),
          cost_estimate_cents: TOOLS_CONFIG.semantic_search.cost_per_call_cents
        }
      });

    } catch (error) {
      console.error('Semantic search tool error:', error);
      return JSON.stringify({
        success: false,
        error: 'Semantic search failed',
        details: error.message
      });
    }
  }

  /**
   * Format search results for LangChain consumption
   * @private
   */
  _formatResults(results) {
    return results.map(result => ({
      id: result.id,
      gmail_message_id: result.gmail_message_id,
      subject: result.subject || 'No Subject',
      from_email: result.from_email,
      from_domain: result.from_domain,
      content_snippet: result.content_snippet,
      timestamp: result.email_timestamp,
      priority_score: result.priority_score,
      similarity_score: result.similarity_score,
      similarity_percentage: Math.round(result.similarity_score * 100),
      email_record_id: result.email_record_id,
      source: 'semantic_search'
    }));
  }
}

export default SemanticSearchTool;