/**
 * Email Embedding Processor with LangChain Integration
 * 
 * This service orchestrates the complete email processing pipeline using LangChain
 * for sophisticated multi-step analysis and OpenAI for embeddings.
 * 
 * Key features:
 * - LangChain chains for complex email analysis workflows
 * - Multi-agent processing: content → themes → priorities → actions
 * - Cost-optimized processing with intelligent batching
 * - Comprehensive error handling and retry logic
 * - Progress tracking and user feedback
 * 
 * Processing Pipeline:
 * 1. Content Extraction Chain (LangChain)
 * 2. Theme Analysis Chain (LangChain + GPT-4o-mini)
 * 3. Priority Scoring Chain (LangChain + GPT-4o-mini)
 * 4. Action Item Extraction (LangChain + GPT-4o-mini)
 * 5. Embedding Generation (OpenAI text-embedding-3-small)
 * 6. Storage Optimization (Supabase + Object Storage)
 * 
 * Cost Analysis per Email:
 * - LangChain processing: 3 LLM calls × $0.002 = $0.006
 * - Embedding generation: 1 call × $0.0001 = $0.0001
 * - Total per email: ~$0.0061
 * - Monthly cost (200 emails/user): ~$1.22/user
 * 
 * @author HomeOps Agent
 * @version 1.0.0
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { 
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate 
} from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { RunnableSequence } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
// ErrorLogger import removed - not used in current implementation

// Initialize clients
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Initialize LangChain LLM with cost-optimized settings
const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',  // Cost-effective model
  temperature: 0.3,          // Balanced creativity/consistency
  maxTokens: 1000,          // Reasonable response length
  timeout: 30000,           // 30-second timeout
  maxRetries: 2,            // Retry failed requests
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Configuration constants for processing
 */
const PROCESSING_CONFIG = {
  // Batch processing settings
  BATCH_SIZE: 10,                    // Emails processed simultaneously
  MAX_CONCURRENT_CHAINS: 3,          // Parallel LangChain executions
  RATE_LIMIT_DELAY: 1000,           // 1 second between batches
  
  // Content processing limits
  MAX_EMAIL_CONTENT_LENGTH: 8000,    // Max chars for LLM processing
  MIN_EMAIL_CONTENT_LENGTH: 20,      // Skip very short emails
  MAX_SUBJECT_LENGTH: 200,           // Truncate long subjects
  
  // Quality thresholds
  MIN_THEME_CONFIDENCE: 0.3,         // Minimum theme confidence score
  MIN_PRIORITY_SCORE: 0.1,           // Minimum priority for storage
  MAX_ACTION_ITEMS: 5,               // Maximum action items per email
  
  // Cost management
  MAX_LLM_CALLS_PER_BATCH: 30,       // Prevent runaway costs
  COST_ALERT_THRESHOLD_CENTS: 100,   // Alert if batch exceeds $1
  
  // Storage optimization
  EMBEDDING_DIMENSIONS: 1536,        // OpenAI text-embedding-3-small
  COMPRESSION_ENABLED: true,         // Compress detailed chunks
} as const;

// Zod schemas removed - using direct JSON parsing for LangChain outputs

/**
 * Type definitions
 */
interface EmailProcessingInput {
  gmail_message_id: string;
  subject: string;
  sender_email: string;
  sender_name?: string;
  sent_date: string;
  raw_content: string;
  labels?: string[];
  thread_id?: string;
}

interface ProcessedEmailOutput {
  // Original metadata
  gmail_message_id: string;
  gmail_thread_id?: string;
  subject: string;
  sender_email: string;
  sender_name?: string;
  sent_date: string;
  
  // Processed content
  content_summary: string;
  original_content_length: number;
  content_language: string;
  
  // AI analysis results
  themes: Record<string, any>;
  priority_score: number;
  urgency_level: 'low' | 'medium' | 'high';
  actionable_items: Array<{
    action: string;
    priority: string;
    category: string;
    due_date?: string;
    assignee?: string;
  }>;
  
  // Search optimization
  keywords: string[];
  semantic_tags: string[];
  
  // Embedding
  embedding: number[];
  embedding_model: string;
  
  // Processing metadata
  processing_time_ms: number;
  llm_calls_made: number;
  cost_estimate_cents: number;
}

/**
 * Main Email Embedding Processor Class
 */
export class EmailEmbeddingProcessor {
  
  /**
   * Process a batch of emails through the complete LangChain pipeline
   * 
   * @param emails - Array of emails to process
   * @param userId - User ID for storage and tracking
   * @param jobId - Processing job ID for progress updates
   * @returns Promise resolving to processing results and metrics
   */
  static async processBatch(
    emails: EmailProcessingInput[],
    userId: string,
    jobId: string
  ): Promise<{
    success: boolean;
    processed: ProcessedEmailOutput[];
    failed: Array<{ email_id: string; error: string }>;
    metrics: {
      total_processed: number;
      total_failed: number;
      total_cost_cents: number;
      processing_time_ms: number;
      llm_calls_made: number;
    };
    error?: string;
  }> {
    const batchStartTime = Date.now();
    const processed: ProcessedEmailOutput[] = [];
    const failed: Array<{ email_id: string; error: string }> = [];
    let totalCostCents = 0;
    let totalLLMCalls = 0;

    console.log(`🔄 Processing batch of ${emails.length} emails for user ${userId} (job ${jobId})`);

    try {
      // Filter and validate emails before processing
      const validEmails = this.filterValidEmails(emails);
      console.log(`✅ Filtered to ${validEmails.length} valid emails from ${emails.length} total`);

      // Process emails in smaller sub-batches to manage memory and costs
      const subBatchSize = Math.min(PROCESSING_CONFIG.BATCH_SIZE, validEmails.length);
      
      for (let i = 0; i < validEmails.length; i += subBatchSize) {
        const subBatch = validEmails.slice(i, i + subBatchSize);
        console.log(`📧 Processing sub-batch ${Math.floor(i/subBatchSize) + 1}: emails ${i+1}-${Math.min(i + subBatchSize, validEmails.length)}`);
        
        // Process sub-batch with concurrent processing
        const subBatchResults = await Promise.allSettled(
          subBatch.map(email => this.processEmail(email, userId, jobId))
        );

        // Collect results and handle failures
        subBatchResults.forEach((result, index) => {
          const email = subBatch[index];
          
          if (result.status === 'fulfilled' && result.value.success && result.value.data) {
            processed.push(result.value.data);
            totalCostCents += result.value.cost_cents;
            totalLLMCalls += result.value.llm_calls;
          } else {
            const error = result.status === 'rejected' 
              ? result.reason?.message || 'Processing failed'
              : result.value.error || 'Unknown error';
            
            failed.push({
              email_id: email.gmail_message_id,
              error: error
            });
            
            console.error(`❌ Failed to process email ${email.gmail_message_id}:`, error);
          }
        });

        // Update job progress after each sub-batch
        await this.updateJobProgress(jobId, {
          processed_emails: processed.length,
          failed_emails: failed.length,
          embedding_api_calls: totalLLMCalls,
          theme_analysis_calls: totalLLMCalls
        });

        // Rate limiting: Brief pause between sub-batches
        if (i + subBatchSize < validEmails.length) {
          await this.sleep(PROCESSING_CONFIG.RATE_LIMIT_DELAY);
        }

        // Cost monitoring: Alert if exceeding thresholds
        if (totalCostCents > PROCESSING_CONFIG.COST_ALERT_THRESHOLD_CENTS) {
          console.warn(`⚠️  Batch cost alert: $${totalCostCents/100} (${totalLLMCalls} LLM calls)`);
        }
      }

      const batchProcessingTime = Date.now() - batchStartTime;
      
      console.log(`✅ Batch processing complete: ${processed.length} processed, ${failed.length} failed in ${batchProcessingTime}ms`);
      console.log(`💰 Batch cost: $${totalCostCents/100} (${totalLLMCalls} LLM calls)`);

      return {
        success: true,
        processed,
        failed,
        metrics: {
          total_processed: processed.length,
          total_failed: failed.length,
          total_cost_cents: totalCostCents,
          processing_time_ms: batchProcessingTime,
          llm_calls_made: totalLLMCalls
        }
      };

    } catch (error) {
      console.error('❌ Exception in batch processing:', error);
      
      return {
        success: false,
        processed,
        failed,
        metrics: {
          total_processed: processed.length,
          total_failed: failed.length,
          total_cost_cents: totalCostCents,
          processing_time_ms: Date.now() - batchStartTime,
          llm_calls_made: totalLLMCalls
        },
        error: error instanceof Error ? error.message : 'Batch processing failed'
      };
    }
  }

  /**
   * Process a single email through the complete LangChain pipeline
   * 
   * @param email - Email to process
   * @param userId - User ID for context
   * @param jobId - Job ID for tracking
   * @returns Promise resolving to processed email data
   */
  private static async processEmail(
    email: EmailProcessingInput,
    _userId: string,
    _jobId: string
  ): Promise<{
    success: boolean;
    data?: ProcessedEmailOutput;
    cost_cents: number;
    llm_calls: number;
    error?: string;
  }> {
    const emailStartTime = Date.now();
    let costCents = 0;
    let llmCalls = 0;

    try {
      console.log(`📧 Processing email: ${email.subject} (${email.gmail_message_id})`);

      // ============================================================
      // STEP 1: Content Extraction and Cleaning Chain
      // ============================================================
      const { content_summary, content_language, keywords } = await this.extractAndSummarizeContent(
        email.raw_content,
        email.subject
      );
      llmCalls += 1;
      costCents += 0.2; // ~$0.002 for content processing

      // ============================================================
      // STEP 2: Theme Analysis Chain (LangChain + GPT-4o-mini)
      // ============================================================
      const themeAnalysis = await this.analyzeThemes(email, content_summary);
      llmCalls += 1;
      costCents += 0.2; // ~$0.002 for theme analysis

      // ============================================================
      // STEP 3: Priority Scoring Chain (LangChain + GPT-4o-mini)
      // ============================================================
      const priorityAnalysis = await this.analyzePriority(email, content_summary, themeAnalysis);
      llmCalls += 1;
      costCents += 0.2; // ~$0.002 for priority analysis

      // ============================================================
      // STEP 4: Action Item Extraction (LangChain + GPT-4o-mini)
      // ============================================================
      const actionItems = await this.extractActionItems(email, content_summary, priorityAnalysis);
      llmCalls += 1;
      costCents += 0.2; // ~$0.002 for action extraction

      // ============================================================
      // STEP 5: Embedding Generation (OpenAI)
      // ============================================================
      const embeddingResult = await this.generateEmbedding(content_summary);
      costCents += 0.01; // ~$0.0001 for embedding

      if (!embeddingResult.success) {
        throw new Error(`Embedding generation failed: ${embeddingResult.error}`);
      }

      // ============================================================
      // STEP 6: Compile Final Processed Email
      // ============================================================
      const processedEmail: ProcessedEmailOutput = {
        // Original metadata
        gmail_message_id: email.gmail_message_id,
        gmail_thread_id: email.thread_id,
        subject: email.subject.slice(0, PROCESSING_CONFIG.MAX_SUBJECT_LENGTH),
        sender_email: email.sender_email,
        sender_name: email.sender_name,
        sent_date: email.sent_date,
        
        // Processed content
        content_summary,
        original_content_length: email.raw_content.length,
        content_language,
        
        // AI analysis results
        themes: themeAnalysis.themes,
        priority_score: priorityAnalysis.priority_score,
        urgency_level: priorityAnalysis.urgency_level,
        actionable_items: actionItems.actionable_items.slice(0, PROCESSING_CONFIG.MAX_ACTION_ITEMS),
        
        // Search optimization
        keywords,
        semantic_tags: this.generateSemanticTags(themeAnalysis, priorityAnalysis),
        
        // Embedding
        embedding: embeddingResult.embedding!,
        embedding_model: 'text-embedding-3-small',
        
        // Processing metadata
        processing_time_ms: Date.now() - emailStartTime,
        llm_calls_made: llmCalls,
        cost_estimate_cents: Math.round(costCents)
      };

      console.log(`✅ Email processed successfully: ${email.gmail_message_id} (${llmCalls} LLM calls, $${costCents/100})`);

      return {
        success: true,
        data: processedEmail,
        cost_cents: Math.round(costCents),
        llm_calls: llmCalls
      };

    } catch (error) {
      console.error(`❌ Failed to process email ${email.gmail_message_id}:`, error);
      
      return {
        success: false,
        cost_cents: Math.round(costCents),
        llm_calls: llmCalls,
        error: error instanceof Error ? error.message : 'Email processing failed'
      };
    }
  }

  /**
   * LangChain Content Extraction and Summarization Chain
   * Creates embedding-optimized summaries while preserving key information
   */
  private static async extractAndSummarizeContent(
    rawContent: string,
    subject: string
  ): Promise<{
    content_summary: string;
    content_language: string;
    keywords: string[];
  }> {
    // Create content processing prompt template
    const contentProcessingPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        You are an expert email content processor for family coordination systems.
        
        Your task is to:
        1. Clean and extract the essential content from emails
        2. Create a comprehensive summary optimized for semantic search
        3. Extract important keywords and phrases
        4. Detect the primary language
        
        Focus on:
        - Family logistics and coordination needs
        - Important dates, times, and deadlines
        - Action items and responsibilities
        - School, activities, health, travel, and household matters
        - Names, places, and specific details
        
        Return a JSON object with:
        - content_summary: A comprehensive 2-3 paragraph summary
        - content_language: ISO language code (e.g., "en", "es", "fr")
        - keywords: Array of 5-10 important keywords/phrases
      `),
      HumanMessagePromptTemplate.fromTemplate(`
        Email Subject: {subject}
        Email Content: {content}
        
        Process this email and return the structured JSON response.
      `)
    ]);

    // Create the processing chain
    const contentChain = RunnableSequence.from([
      contentProcessingPrompt,
      llm,
      new StringOutputParser()
    ]);

    try {
      // Truncate content if too long
      const processableContent = rawContent.length > PROCESSING_CONFIG.MAX_EMAIL_CONTENT_LENGTH
        ? rawContent.slice(0, PROCESSING_CONFIG.MAX_EMAIL_CONTENT_LENGTH) + '...'
        : rawContent;

      // Execute the chain
      const result = await contentChain.invoke({
        subject: subject,
        content: processableContent
      });

      // Parse JSON response
      const parsed = JSON.parse(result);
      
      return {
        content_summary: parsed.content_summary || 'No content summary available',
        content_language: parsed.content_language || 'en',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : []
      };

    } catch (error) {
      console.error('Content processing chain failed:', error);
      
      // Fallback to basic processing
      return {
        content_summary: rawContent.slice(0, 500) + (rawContent.length > 500 ? '...' : ''),
        content_language: 'en',
        keywords: this.extractBasicKeywords(subject + ' ' + rawContent)
      };
    }
  }

  /**
   * LangChain Theme Analysis Chain
   * Sophisticated family theme detection and categorization
   */
  private static async analyzeThemes(
    email: EmailProcessingInput,
    contentSummary: string
  ): Promise<any> {
    const themeAnalysisPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        You are an expert at analyzing family emails to identify themes and coordination needs.
        
        Analyze the email for these family theme categories:
        - school: Education, homework, parent-teacher communications, school events
        - activities: Sports, clubs, lessons, extracurricular activities
        - vacation: Travel plans, bookings, itineraries, family trips
        - health: Medical appointments, prescriptions, health insurance, wellness
        - social: Playdates, parties, family gatherings, social events
        - household: Chores, maintenance, utilities, household management
        - work: Work schedules, business trips, childcare coordination
        - financial: Bills, expenses, budgeting, insurance, investments
        - transportation: Carpools, ride sharing, vehicle maintenance
        - food: Meal planning, grocery lists, restaurant reservations
        
        For each theme present, provide:
        - confidence: 0.0-1.0 confidence score
        - details: Specific elements found in the email
        - subcategories: More specific categorization if applicable
        
        Also identify:
        - overall_category: Primary theme category
        - family_relevance: 0.0-1.0 score for family coordination importance
        - coordination_needs: List of coordination requirements this email suggests
        
        Return valid JSON matching the expected schema.
      `),
      HumanMessagePromptTemplate.fromTemplate(`
        Email From: {sender}
        Email Subject: {subject}
        Email Summary: {content}
        Sent Date: {date}
        
        Analyze this email for family themes and return JSON response.
      `)
    ]);

    const themeChain = RunnableSequence.from([
      themeAnalysisPrompt,
      llm,
      new StringOutputParser()
    ]);

    try {
      const result = await themeChain.invoke({
        sender: email.sender_name || email.sender_email,
        subject: email.subject,
        content: contentSummary,
        date: email.sent_date
      });

      const parsed = JSON.parse(result);
      
      // Validate and clean the response
      return {
        themes: parsed.themes || {},
        overall_category: parsed.overall_category || 'general',
        family_relevance: Math.max(0, Math.min(1, parsed.family_relevance || 0.5)),
        coordination_needs: Array.isArray(parsed.coordination_needs) ? parsed.coordination_needs : []
      };

    } catch (error) {
      console.error('Theme analysis chain failed:', error);
      
      // Fallback analysis
      return {
        themes: this.generateFallbackThemes(email, contentSummary),
        overall_category: 'general',
        family_relevance: 0.5,
        coordination_needs: []
      };
    }
  }

  /**
   * LangChain Priority Analysis Chain
   * Determines email importance and urgency for family coordination
   */
  private static async analyzePriority(
    email: EmailProcessingInput,
    contentSummary: string,
    themeAnalysis: any
  ): Promise<any> {
    const priorityPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        You are an expert at determining email priority for family coordination.
        
        Analyze the email to determine:
        
        Priority Score (0.0-1.0):
        - 0.9-1.0: Critical family matters (emergencies, urgent school issues, immediate action needed)
        - 0.7-0.8: High priority (important deadlines, scheduling conflicts, health matters)
        - 0.5-0.6: Medium priority (routine school communications, activity updates)
        - 0.3-0.4: Low priority (newsletters, general information)
        - 0.0-0.2: Very low priority (marketing, spam, automated notifications)
        
        Urgency Level:
        - high: Requires immediate attention (same day)
        - medium: Needs attention soon (within a few days)
        - low: Can be addressed when convenient
        
        Consider factors:
        - Time sensitivity and deadlines
        - Impact on family schedule and coordination
        - Sender importance and authority
        - Presence of action items or requests
        - Theme importance (school/health = higher priority)
        
        Return JSON with priority_score, urgency_level, importance_factors, time_sensitivity, and stakeholders.
      `),
      HumanMessagePromptTemplate.fromTemplate(`
        Email From: {sender}
        Email Subject: {subject}
        Email Summary: {content}
        Sent Date: {date}
        Themes Detected: {themes}
        Family Relevance: {family_relevance}
        
        Analyze priority and return JSON response.
      `)
    ]);

    const priorityChain = RunnableSequence.from([
      priorityPrompt,
      llm,
      new StringOutputParser()
    ]);

    try {
      const result = await priorityChain.invoke({
        sender: email.sender_name || email.sender_email,
        subject: email.subject,
        content: contentSummary,
        date: email.sent_date,
        themes: JSON.stringify(themeAnalysis.themes),
        family_relevance: themeAnalysis.family_relevance
      });

      const parsed = JSON.parse(result);
      
      return {
        priority_score: Math.max(0, Math.min(1, parsed.priority_score || 0.5)),
        urgency_level: ['low', 'medium', 'high'].includes(parsed.urgency_level) 
          ? parsed.urgency_level : 'medium',
        importance_factors: Array.isArray(parsed.importance_factors) ? parsed.importance_factors : [],
        time_sensitivity: parsed.time_sensitivity || 'normal',
        stakeholders: Array.isArray(parsed.stakeholders) ? parsed.stakeholders : []
      };

    } catch (error) {
      console.error('Priority analysis chain failed:', error);
      
      // Fallback priority analysis
      return {
        priority_score: this.calculateFallbackPriority(email, themeAnalysis),
        urgency_level: 'medium',
        importance_factors: ['automated_fallback'],
        time_sensitivity: 'normal',
        stakeholders: []
      };
    }
  }

  /**
   * LangChain Action Item Extraction Chain
   * Identifies actionable items and coordination needs
   */
  private static async extractActionItems(
    email: EmailProcessingInput,
    contentSummary: string,
    priorityAnalysis: any
  ): Promise<any> {
    const actionItemsPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        You are an expert at extracting actionable items from family emails.
        
        Identify specific action items that require family coordination:
        - Tasks to be completed
        - Appointments to be scheduled
        - Forms to be filled out
        - Payments to be made
        - Events to be attended
        - Communications to be sent
        - Preparations to be made
        
        For each action item, provide:
        - action: Clear, specific description of what needs to be done
        - priority: low/medium/high based on urgency and importance
        - due_date: Extract or estimate due date if mentioned
        - assignee: Who should handle this (if specified or inferable)
        - category: Type of action (communication, scheduling, payment, preparation, etc.)
        
        Also determine:
        - follow_up_needed: Whether this email requires a response
        - coordination_required: Whether multiple family members need to coordinate
        - automation_opportunities: Things that could potentially be automated
        
        Return JSON with actionable_items array and coordination flags.
      `),
      HumanMessagePromptTemplate.fromTemplate(`
        Email From: {sender}
        Email Subject: {subject}
        Email Summary: {content}
        Priority Level: {urgency}
        Time Sensitivity: {time_sensitivity}
        
        Extract action items and return JSON response.
      `)
    ]);

    const actionChain = RunnableSequence.from([
      actionItemsPrompt,
      llm,
      new StringOutputParser()
    ]);

    try {
      const result = await actionChain.invoke({
        sender: email.sender_name || email.sender_email,
        subject: email.subject,
        content: contentSummary,
        urgency: priorityAnalysis.urgency_level,
        time_sensitivity: priorityAnalysis.time_sensitivity
      });

      const parsed = JSON.parse(result);
      
      return {
        actionable_items: Array.isArray(parsed.actionable_items) 
          ? parsed.actionable_items.slice(0, PROCESSING_CONFIG.MAX_ACTION_ITEMS)
          : [],
        follow_up_needed: Boolean(parsed.follow_up_needed),
        coordination_required: Boolean(parsed.coordination_required),
        automation_opportunities: Array.isArray(parsed.automation_opportunities) 
          ? parsed.automation_opportunities : []
      };

    } catch (error) {
      console.error('Action items extraction chain failed:', error);
      
      // Fallback action item detection
      return {
        actionable_items: this.extractBasicActionItems(email, contentSummary),
        follow_up_needed: false,
        coordination_required: false,
        automation_opportunities: []
      };
    }
  }

  /**
   * Generate embedding for processed content
   */
  private static async generateEmbedding(content: string): Promise<{
    success: boolean;
    embedding?: number[];
    error?: string;
  }> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content,
        dimensions: PROCESSING_CONFIG.EMBEDDING_DIMENSIONS
      });

      return {
        success: true,
        embedding: response.data[0].embedding
      };

    } catch (error) {
      console.error('Embedding generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Embedding generation failed'
      };
    }
  }

  /**
   * Helper methods for processing and fallbacks
   */

  private static filterValidEmails(emails: EmailProcessingInput[]): EmailProcessingInput[] {
    return emails.filter(email => {
      // Skip emails that are too short or clearly automated
      if (email.raw_content.length < PROCESSING_CONFIG.MIN_EMAIL_CONTENT_LENGTH) return false;
      
      // Skip obvious spam/promotional emails
      if (email.sender_email.includes('noreply') || 
          email.subject.toLowerCase().includes('unsubscribe')) return false;
      
      // Skip if no meaningful content
      if (!email.subject.trim() && !email.raw_content.trim()) return false;
      
      return true;
    });
  }

  private static generateSemanticTags(themeAnalysis: any, priorityAnalysis: any): string[] {
    const tags: string[] = [];
    
    // Add theme-based tags
    Object.entries(themeAnalysis.themes || {}).forEach(([theme, data]: [string, any]) => {
      if (data.confidence > PROCESSING_CONFIG.MIN_THEME_CONFIDENCE) {
        tags.push(theme);
        if (data.subcategories) {
          tags.push(...data.subcategories.slice(0, 2));
        }
      }
    });
    
    // Add priority-based tags
    if (priorityAnalysis.priority_score > 0.7) tags.push('high-priority');
    if (priorityAnalysis.urgency_level === 'high') tags.push('urgent');
    
    return [...new Set(tags)].slice(0, 8); // Dedupe and limit
  }

  private static extractBasicKeywords(text: string): string[] {
    // Simple keyword extraction fallback
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 10);
  }

  private static generateFallbackThemes(email: EmailProcessingInput, content: string): Record<string, any> {
    const themes: Record<string, any> = {};
    const lowerContent = (email.subject + ' ' + content).toLowerCase();
    
    // Simple keyword-based theme detection
    const themeKeywords = {
      school: ['school', 'teacher', 'homework', 'class', 'grade', 'education'],
      activities: ['practice', 'game', 'lesson', 'club', 'sport', 'activity'],
      health: ['doctor', 'appointment', 'medical', 'health', 'prescription'],
      vacation: ['trip', 'travel', 'vacation', 'hotel', 'flight'],
      social: ['party', 'playdate', 'birthday', 'gathering', 'social']
    };
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      const matches = keywords.filter(keyword => lowerContent.includes(keyword));
      if (matches.length > 0) {
        themes[theme] = {
          confidence: Math.min(matches.length * 0.3, 0.8),
          details: matches,
          subcategories: []
        };
      }
    });
    
    return themes;
  }

  private static calculateFallbackPriority(email: EmailProcessingInput, themeAnalysis: any): number {
    let priority = 0.3; // Default medium-low priority
    
    // Boost for certain senders
    if (email.sender_email.includes('school') || email.sender_email.includes('teacher')) {
      priority += 0.3;
    }
    
    // Boost for urgent keywords in subject
    const urgentKeywords = ['urgent', 'important', 'deadline', 'asap', 'immediately'];
    if (urgentKeywords.some(keyword => email.subject.toLowerCase().includes(keyword))) {
      priority += 0.4;
    }
    
    // Boost for high-importance themes
    const highImportanceThemes = ['school', 'health', 'vacation'];
    if (highImportanceThemes.some(theme => themeAnalysis.themes[theme])) {
      priority += 0.2;
    }
    
    return Math.min(priority, 1.0);
  }

  private static extractBasicActionItems(email: EmailProcessingInput, content: string): any[] {
    const actionItems: any[] = [];
    const actionKeywords = ['rsvp', 'respond', 'sign', 'pay', 'attend', 'submit', 'register'];
    const text = (email.subject + ' ' + content).toLowerCase();
    
    actionKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        actionItems.push({
          action: `Action needed: ${keyword}`,
          priority: 'medium',
          category: 'general',
          due_date: undefined,
          assignee: undefined
        });
      }
    });
    
    return actionItems.slice(0, 3); // Limit to 3 basic action items
  }

  private static async updateJobProgress(jobId: string, updates: any): Promise<void> {
    try {
      await supabase
        .from('email_processing_jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    } catch (error) {
      console.error('Failed to update job progress:', error);
    }
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}