#!/usr/bin/env node

/**
 * Test LangChain tools initialization only
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function testToolsOnly() {
  console.log('🔧 Testing LangChain Tools Initialization...\n');

  try {
    // Import the tools and config
    const { GmailSearchTool } = await import('./api/tools/gmailSearchTool.js');
    const { SemanticSearchTool } = await import('./api/tools/semanticSearchTool.js');
    const { TOOLS_CONFIG } = await import('./api/config/chatConfig.js');

    console.log('📋 Tools Configuration:');
    console.log('- Gmail enabled:', TOOLS_CONFIG.gmail.enabled);
    console.log('- Semantic search enabled:', TOOLS_CONFIG.semantic_search.enabled);
    console.log('- Calendar enabled:', TOOLS_CONFIG.calendar.enabled);
    console.log();

    // Test tool initialization
    const accountId = "87654321-4321-4321-4321-210987654321";
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    console.log('🔧 Environment Check:');
    console.log('- Supabase URL:', !!supabaseUrl);
    console.log('- Supabase Service Key:', !!supabaseServiceKey);
    console.log('- OpenAI API Key:', !!openaiApiKey);
    console.log();

    // Initialize Gmail Tool
    console.log('📧 Initializing Gmail Search Tool...');
    const gmailTool = new GmailSearchTool({ accountId });
    console.log('- Name:', gmailTool.name);
    console.log('- Description preview:', gmailTool.description.substring(0, 80) + '...');

    // Initialize Semantic Search Tool
    console.log('\n🧠 Initializing Semantic Search Tool...');
    const semanticTool = new SemanticSearchTool({
      accountId,
      supabaseUrl,
      supabaseServiceKey,
      openaiApiKey
    });
    console.log('- Name:', semanticTool.name);
    console.log('- Description preview:', semanticTool.description.substring(0, 80) + '...');

    console.log('\n✅ Both tools initialized successfully!');

    // Test tool descriptions to see how AI will choose
    console.log('\n🤖 Tool Selection Guidance:');
    console.log('\nGmail Tool (for specific queries):');
    console.log(gmailTool.description.split('\n').slice(0, 3).join('\n'));

    console.log('\nSemantic Tool (for conceptual queries):');
    console.log(semanticTool.description.split('\n').slice(0, 3).join('\n'));

    // Test a simple tool input format
    console.log('\n📝 Tool Input Format Test:');
    const testInput = JSON.stringify({
      query: "school activities",
      maxResults: 5
    });
    console.log('Sample input:', testInput);

    try {
      JSON.parse(testInput);
      console.log('✅ Input format is valid JSON');
    } catch (e) {
      console.log('❌ Input format error:', e.message);
    }

  } catch (error) {
    console.error('❌ Tools test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testToolsOnly();