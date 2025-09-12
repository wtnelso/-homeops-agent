/**
 * Email Embedding Processor
 * 
 * Core service for processing emails with LangChain and OpenAI.
 * Generates embeddings, extracts themes, and stores results in database.
 */

import { OpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export class EmailEmbeddingProcessor {
  constructor(config) {
    this.config = config;
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    });
    
    this.llm = new OpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.3
    });
  }

  /**
   * Process a single email
   */
  async processEmail(email) {
    try {
      console.log(`🔄 Processing email: ${email.subject || 'No subject'}`);
      const startTime = Date.now();

      // Step 1: Extract and clean email content
      const content = this.extractEmailContent(email);
      
      // Step 2: Generate embeddings
      const embedding = await this.generateEmbedding(content);
      
      // Step 3: Analyze content with LangChain
      const analysis = await this.analyzeEmailContent(content);
      
      // Step 4: Store in database
      await this.storeEmailResults(email, content, embedding, analysis);
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Email processed in ${processingTime}ms`);

    } catch (error) {
      console.error('❌ Failed to process email:', error);
      throw error;
    }
  }

  /**
   * Extract clean content from email
   */
  extractEmailContent(email) {
    // Combine subject and body content
    const subject = email.subject || '';
    const body = email.body || email.snippet || '';
    
    // Clean and truncate content
    const content = `${subject}\n\n${body}`
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Truncate to max length
    const maxLength = this.config.max_content_length || 8000;
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...'
      : content;
  }

  /**
   * Generate embeddings using OpenAI
   */
  async generateEmbedding(content) {
    try {
      const embedding = await this.embeddings.embedQuery(content);
      return embedding;
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze email content with LangChain
   */
  async analyzeEmailContent(content) {
    try {
      const prompt = `
Analyze this email content for family logistics and themes:

Email Content:
${content}

Please analyze and extract:
1. Primary theme (family_logistics, school, work, health, finance, social, household, travel, emergency, general)
2. Family relevance score (0-1, how relevant is this to family coordination)
3. Action items or deadlines mentioned
4. People mentioned
5. Key information for family logistics

Respond with a JSON object containing your analysis.
`;

      const response = await this.llm.invoke(prompt);
      
      try {
        // Try to parse as JSON
        const analysis = JSON.parse(response);
        return analysis;
      } catch (parseError) {
        // Fallback if not valid JSON
        console.warn('⚠️  LLM response not valid JSON, using fallback');
        return {
          primary_theme: 'general',
          family_relevance_score: 0.5,
          action_items: [],
          people_mentioned: [],
          key_information: response.substring(0, 500)
        };
      }

    } catch (error) {
      console.error('❌ Failed to analyze email content:', error);
      return {
        primary_theme: 'general',
        family_relevance_score: 0.5,
        action_items: [],
        people_mentioned: [],
        error: error.message
      };
    }
  }

  /**
   * Store results in database
   */
  async storeEmailResults(email, content, embedding, analysis) {
    try {
      // 1. Store email embedding
      const embeddingId = uuidv4();
      await supabase
        .from('email_embeddings')
        .insert({
          id: embeddingId,
          job_id: this.config.job_id,
          account_id: this.config.account_id,
          gmail_message_id: email.id,
          embedding: JSON.stringify(embedding), // Store as JSON for now
          subject: email.subject,
          from_email: email.from,
          from_domain: this.extractDomain(email.from),
          timestamp: email.date ? new Date(email.date).toISOString() : new Date().toISOString(),
          content_snippet: content.substring(0, 500),
          content_hash: this.generateContentHash(content),
          priority_score: analysis.family_relevance_score || 0.5,
          content_length: content.length
        });

      // 2. Store content analysis
      await supabase
        .from('email_content_analysis')
        .insert({
          job_id: this.config.job_id,
          email_embedding_id: embeddingId,
          account_id: this.config.account_id,
          gmail_message_id: email.id,
          family_relevance_score: analysis.family_relevance_score || 0.5,
          action_items: analysis.action_items || [],
          mentioned_people: analysis.people_mentioned || [],
          key_information: analysis.key_information || {},
          content_type: this.classifyContentType(analysis),
          priority_level: this.calculatePriorityLevel(analysis.family_relevance_score || 0.5)
        });

      // 3. Store theme if significant
      if (analysis.family_relevance_score > 0.7) {
        await this.storeEmailTheme(analysis);
      }

    } catch (error) {
      console.error('❌ Failed to store email results:', error);
      throw error;
    }
  }

  /**
   * Store email theme
   */
  async storeEmailTheme(analysis) {
    // TODO: Implement theme aggregation logic
    // For now, just log that we would store a theme
    console.log(`📊 High relevance theme detected: ${analysis.primary_theme}`);
  }

  /**
   * Helper methods
   */
  extractDomain(email) {
    if (!email) return null;
    const match = email.match(/@([^>]+)/);
    return match ? match[1] : null;
  }

  generateContentHash(content) {
    // Simple hash function (consider using crypto for production)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  classifyContentType(analysis) {
    if (analysis.action_items && analysis.action_items.length > 0) {
      return 'actionable';
    }
    if (analysis.family_relevance_score > 0.8) {
      return 'urgent';
    }
    return 'informational';
  }

  calculatePriorityLevel(relevanceScore) {
    if (relevanceScore > 0.8) return 'high';
    if (relevanceScore > 0.6) return 'medium';
    return 'low';
  }
}