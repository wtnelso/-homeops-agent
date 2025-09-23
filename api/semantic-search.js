/**
 * Vercel API Endpoint: Semantic Email Search
 *
 * This endpoint provides semantic search capabilities over processed email embeddings.
 * It converts user queries to embeddings and finds similar emails using vector search.
 *
 * Key design principles:
 * - Fast response times (< 2 seconds typical)
 * - Secure: Account-scoped search only
 * - Cost-efficient: Uses OpenAI text-embedding-3-small model
 *
 * Processing flow:
 * 1. Validate user authentication and permissions
 * 2. Convert search query to embedding using OpenAI
 * 3. Perform vector similarity search in database
 * 4. Return ranked results with similarity scores
 *
 * Expected costs per search:
 * - OpenAI embedding: ~$0.0031 (1536 dimensions @ text-embedding-3-small rates)
 * - Database query: Negligible
 * - Total: ~$0.0031 per search
 *
 * @route POST /api/semantic-search
 * @auth Required - Supabase JWT token
 * @body {string} query - Search query text
 * @body {string} account_id - User's account ID
 * @body {number} max_results - Maximum results to return (optional, default: 10)
 * @body {number} similarity_threshold - Minimum similarity score (optional, default: 0.5)
 * @returns {object} Search results with similarity scores and email metadata
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client with service role for backend operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration constants
const SEARCH_CONFIG = {
  DEFAULT_MAX_RESULTS: 10,
  DEFAULT_SIMILARITY_THRESHOLD: 0.5,
  MAX_QUERY_LENGTH: 500,
  EMBEDDING_MODEL: 'text-embedding-3-small',
  EMBEDDING_DIMENSIONS: 1536
};

/**
 * Main request handler
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  const requestStart = Date.now();

  try {
    // Extract and validate request data
    const { query, account_id, max_results, similarity_threshold } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Invalid query',
        message: 'Query must be a non-empty string'
      });
    }

    if (!account_id || typeof account_id !== 'string') {
      return res.status(400).json({
        error: 'Invalid account_id',
        message: 'Account ID is required'
      });
    }

    if (query.length > SEARCH_CONFIG.MAX_QUERY_LENGTH) {
      return res.status(400).json({
        error: 'Query too long',
        message: `Query must be less than ${SEARCH_CONFIG.MAX_QUERY_LENGTH} characters`
      });
    }

    // Validate JWT token and get user
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid JWT token required'
      });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Verify user has access to the specified account
    const { data: userAccount, error: accountError } = await supabase
      .from('users')
      .select('account_id')
      .eq('auth_id', user.id)
      .single();

    if (accountError || !userAccount || userAccount.account_id !== account_id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied to specified account'
      });
    }

    // Set search parameters with defaults
    const searchMaxResults = Math.min(max_results || SEARCH_CONFIG.DEFAULT_MAX_RESULTS, 50);
    const searchThreshold = Math.max(
      similarity_threshold || SEARCH_CONFIG.DEFAULT_SIMILARITY_THRESHOLD,
      0.3
    );

    // Generate embedding for the search query
    const embeddingStart = Date.now();
    const embeddingResponse = await openai.embeddings.create({
      model: SEARCH_CONFIG.EMBEDDING_MODEL,
      input: query,
      dimensions: SEARCH_CONFIG.EMBEDDING_DIMENSIONS
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;
    const embeddingTime = Date.now() - embeddingStart;

    // Perform semantic search using the database function
    const searchStart = Date.now();
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_emails_by_embedding', {
        query_embedding: queryEmbedding,
        account_id_param: account_id,
        similarity_threshold: searchThreshold,
        max_results: searchMaxResults
      });

    if (searchError) {
      console.error('Semantic search error:', searchError);
      return res.status(500).json({
        error: 'Search failed',
        message: 'Database search operation failed',
        details: searchError.message
      });
    }

    const searchTime = Date.now() - searchStart;
    const totalTime = Date.now() - requestStart;

    // Format results for client
    const formattedResults = searchResults.map(result => ({
      id: result.id,
      gmail_message_id: result.gmail_message_id,
      subject: result.subject,
      from_email: result.from_email,
      from_domain: result.from_domain,
      content_snippet: result.content_snippet,
      timestamp: result.email_timestamp,
      priority_score: result.priority_score,
      similarity_score: result.similarity_score,
      email_record_id: result.email_record_id
    }));

    // Calculate estimated cost (embedding API call only)
    const estimatedCostCents = 0.31; // ~$0.0031 for text-embedding-3-small

    // Return successful response
    return res.status(200).json({
      success: true,
      query,
      account_id,
      results: formattedResults,
      metadata: {
        total_results: searchResults.length,
        max_results: searchMaxResults,
        similarity_threshold: searchThreshold,
        processing_time_ms: {
          embedding: embeddingTime,
          search: searchTime,
          total: totalTime
        },
        estimated_cost_cents: estimatedCostCents,
        embedding_model: SEARCH_CONFIG.EMBEDDING_MODEL
      }
    });

  } catch (error) {
    console.error('Semantic search API error:', error);

    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred during search',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}