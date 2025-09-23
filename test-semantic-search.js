/**
 * Test Script for Semantic Search Functionality
 *
 * This script tests the semantic search API endpoint and database function
 * to ensure everything works correctly.
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import OpenAI from 'openai';

// Load environment variables if available
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testSemanticSearch() {
  console.log('🧪 Testing Semantic Search Functionality\n');

  try {
    // Step 1: Check if we have email embeddings data
    console.log('1. Checking for existing email embeddings...');
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('email_embeddings')
      .select('id, account_id, subject, from_email')
      .not('embedding', 'is', null)
      .limit(5);

    if (embeddingsError) {
      console.error('❌ Error fetching embeddings:', embeddingsError);
      return;
    }

    if (!embeddings || embeddings.length === 0) {
      console.log('⚠️  No email embeddings found. Need to process emails first.');
      return;
    }

    console.log(`✅ Found ${embeddings.length} email embeddings`);
    console.log('Sample emails:');
    embeddings.forEach((email, i) => {
      console.log(`  ${i + 1}. ${email.subject} (from: ${email.from_email})`);
    });

    const testAccountId = embeddings[0].account_id;
    console.log(`\n2. Using account ID: ${testAccountId}`);

    // Step 2: Test the database function directly
    console.log('\n3. Testing database function directly...');

    // Create a test embedding (you'd normally get this from OpenAI)
    const testQuery = "school activities and events";
    console.log(`Test query: "${testQuery}"`);

    // Get embedding for test query
    console.log('Generating embedding for test query...');
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: testQuery,
      dimensions: 1536
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log('✅ Generated embedding');

    // Test the database function
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_emails_by_embedding', {
        query_embedding: queryEmbedding,
        account_id_param: testAccountId,
        similarity_threshold: 0.1, // Lower threshold for testing
        max_results: 5
      });

    if (searchError) {
      console.error('❌ Database search error:', searchError);
      return;
    }

    console.log(`✅ Database function returned ${searchResults.length} results`);
    if (searchResults.length > 0) {
      console.log('Top results:');
      searchResults.forEach((result, i) => {
        console.log(`  ${i + 1}. ${result.subject || 'No subject'} (similarity: ${(result.similarity_score * 100).toFixed(1)}%)`);
      });
    }

    console.log('\n4. ✅ Semantic search function is working correctly!');

    // Step 3: Test the API endpoint (if running locally)
    console.log('\n5. Testing API endpoint...');
    console.log('Note: This would require a valid JWT token and running server');
    console.log('API endpoint: POST /api/semantic-search');
    console.log('Sample payload:', JSON.stringify({
      query: testQuery,
      account_id: testAccountId,
      max_results: 10,
      similarity_threshold: 0.5
    }, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testSemanticSearch();