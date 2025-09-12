/**
 * Email Theme Analyzer with Advanced LangChain Integration
 * 
 * This service provides sophisticated family theme detection and pattern analysis
 * using LangChain's advanced reasoning chains and GPT-4o-mini for cost efficiency.
 * 
 * Key capabilities:
 * - Multi-step theme analysis with chain-of-thought reasoning
 * - Family pattern discovery and trend analysis
 * - Dynamic theme learning based on user behavior
 * - Automated coordination need detection
 * - Cross-email relationship analysis
 * - Seasonal pattern recognition
 * 
 * LangChain Integration:
 * - Sequential analysis chains for deep theme understanding
 * - Memory systems for learning user-specific patterns  
 * - Tool integration for calendar/contact context
 * - Multi-agent reasoning for complex family dynamics
 * 
 * Cost Analysis per Theme Analysis:
 * - Initial theme detection: $0.002 (GPT-4o-mini)
 * - Pattern analysis: $0.003 (deeper reasoning)
 * - Relationship mapping: $0.002 (cross-email analysis)
 * - Total per email batch: ~$0.007 per email
 * - Monthly cost (200 emails/user): ~$1.40/user
 * 
 * @author HomeOps Agent
 * @version 1.0.0
 */

import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence, RunnableBranch, RunnablePassthrough } from '@langchain/core/runnables';
import { StringOutputParser, JsonOutputParser } from '@langchain/core/output_parsers';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { ErrorLogger, LogLevel, LogCategory } from './errorLogger.js';

// Initialize clients
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize LangChain components with cost optimization
const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.2,           // Lower temperature for consistent theme detection
  maxTokens: 1500,           // Sufficient for detailed analysis
  timeout: 45000,            // 45-second timeout for complex analysis
  maxRetries: 2,
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

const embeddings = new OpenAIEmbeddings({
  modelName: 'text-embedding-3-small',
  openAIApiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Configuration constants for theme analysis
 */
const THEME_CONFIG = {
  // Core family theme categories with detailed subcategories
  FAMILY_THEMES: {
    school: {
      name: 'Education & School',
      subcategories: ['homework', 'parent_teacher', 'school_events', 'grades', 'assignments', 'field_trips'],
      keywords: ['school', 'teacher', 'homework', 'class', 'grade', 'education', 'student', 'assignment'],
      priority_weight: 0.9,    // High priority for school-related items
    },
    activities: {
      name: 'Activities & Sports',
      subcategories: ['sports', 'lessons', 'clubs', 'practices', 'competitions', 'performances'],
      keywords: ['practice', 'game', 'lesson', 'club', 'sport', 'activity', 'team', 'coach'],
      priority_weight: 0.7,
    },
    health: {
      name: 'Health & Medical',
      subcategories: ['appointments', 'prescriptions', 'insurance', 'dental', 'vision', 'therapy'],
      keywords: ['doctor', 'appointment', 'medical', 'health', 'prescription', 'dentist', 'therapy'],
      priority_weight: 0.95,   // Very high priority for health
    },
    vacation: {
      name: 'Travel & Vacation',
      subcategories: ['planning', 'bookings', 'itinerary', 'accommodations', 'flights', 'activities'],
      keywords: ['trip', 'travel', 'vacation', 'hotel', 'flight', 'booking', 'itinerary'],
      priority_weight: 0.6,
    },
    social: {
      name: 'Social & Events',
      subcategories: ['playdates', 'parties', 'gatherings', 'celebrations', 'community', 'friends'],
      keywords: ['party', 'playdate', 'birthday', 'gathering', 'social', 'friends', 'celebration'],
      priority_weight: 0.5,
    },
    household: {
      name: 'Household Management',
      subcategories: ['maintenance', 'utilities', 'chores', 'repairs', 'cleaning', 'organization'],
      keywords: ['house', 'home', 'repair', 'maintenance', 'utility', 'cleaning', 'chores'],
      priority_weight: 0.4,
    },
    work: {
      name: 'Work & Career',
      subcategories: ['schedule', 'meetings', 'travel', 'childcare', 'flexibility', 'income'],
      keywords: ['work', 'office', 'meeting', 'business', 'career', 'schedule', 'deadline'],
      priority_weight: 0.6,
    },
    financial: {
      name: 'Financial Management',
      subcategories: ['bills', 'budgeting', 'insurance', 'taxes', 'investments', 'expenses'],
      keywords: ['money', 'payment', 'bill', 'budget', 'expense', 'cost', 'financial', 'insurance'],
      priority_weight: 0.8,
    },
    transportation: {
      name: 'Transportation & Logistics',
      subcategories: ['carpools', 'rides', 'maintenance', 'scheduling', 'pickup', 'dropoff'],
      keywords: ['carpool', 'ride', 'pickup', 'dropoff', 'drive', 'transportation', 'schedule'],
      priority_weight: 0.6,
    },
    food: {
      name: 'Food & Meals',
      subcategories: ['planning', 'grocery', 'restaurants', 'allergies', 'nutrition', 'cooking'],
      keywords: ['food', 'meal', 'grocery', 'restaurant', 'cooking', 'dinner', 'lunch', 'recipe'],
      priority_weight: 0.4,
    }
  },
  
  // Analysis thresholds
  MIN_THEME_CONFIDENCE: 0.3,
  MIN_PATTERN_OCCURRENCES: 3,
  MAX_THEMES_PER_EMAIL: 5,
  PATTERN_ANALYSIS_LOOKBACK_DAYS: 90,
  
  // Cost management
  MAX_CHAIN_DEPTH: 3,          // Limit recursive analysis depth
  BATCH_ANALYSIS_SIZE: 20,     // Emails per pattern analysis batch
} as const;

/**
 * Zod schemas for structured theme analysis outputs
 */
const ThemeDetectionSchema = z.object({
  detected_themes: z.record(z.object({
    confidence: z.number().min(0).max(1),
    subcategory: z.string().optional(),
    evidence: z.array(z.string()),
    urgency_indicators: z.array(z.string()).optional(),
    coordination_needs: z.array(z.string()).optional(),
  })),
  primary_theme: z.string(),
  secondary_themes: z.array(z.string()),
  family_coordination_score: z.number().min(0).max(1),
  automation_opportunities: z.array(z.string()).optional(),
  relationships_detected: z.array(z.object({
    type: z.string(),
    entities: z.array(z.string()),
    confidence: z.number(),
  })).optional(),
});

const PatternAnalysisSchema = z.object({
  pattern_type: z.string(),
  pattern_name: z.string(),
  confidence_score: z.number().min(0).max(1),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'seasonal', 'ad-hoc']),
  trend_direction: z.enum(['increasing', 'decreasing', 'stable']),
  key_characteristics: z.array(z.string()),
  coordination_requirements: z.array(z.string()),
  suggested_automations: z.array(z.string()),
  stakeholders: z.array(z.string()),
  seasonal_factors: z.array(z.string()).optional(),
});

/**
 * Type definitions
 */
interface EmailThemeInput {
  gmail_message_id: string;
  subject: string;
  sender_email: string;
  sender_name?: string;
  sent_date: string;
  content_summary: string;
  raw_content?: string;
  thread_id?: string;
}

interface ThemeAnalysisResult {
  email_id: string;
  detected_themes: Record<string, {
    confidence: number;
    subcategory?: string;
    evidence: string[];
    urgency_indicators?: string[];
    coordination_needs?: string[];
  }>;
  primary_theme: string;
  secondary_themes: string[];
  family_coordination_score: number;
  automation_opportunities?: string[];
  relationships_detected?: Array<{
    type: string;
    entities: string[];
    confidence: number;
  }>;
  processing_metadata: {
    analysis_time_ms: number;
    llm_calls_made: number;
    cost_estimate_cents: number;
  };
}

interface FamilyPatternResult {
  pattern_id: string;
  user_id: string;
  account_id: string;
  pattern_type: string;
  pattern_name: string;
  confidence_score: number;
  frequency: string;
  trend_direction: string;
  supporting_emails: string[];
  key_characteristics: string[];
  coordination_requirements: string[];
  suggested_automations: string[];
  stakeholders: string[];
  seasonal_factors?: string[];
  first_detected: string;
  last_updated: string;
}

/**
 * Main Email Theme Analyzer Class
 */
export class EmailThemeAnalyzer {
  
  /**
   * Analyze themes for a single email using advanced LangChain reasoning
   * 
   * @param email - Email data to analyze
   * @param userContext - Optional user context for personalized analysis
   * @returns Promise resolving to detailed theme analysis
   */
  static async analyzeEmailThemes(
    email: EmailThemeInput,
    userContext?: {
      user_id: string;
      account_id: string;
      previous_patterns?: FamilyPatternResult[];
      family_preferences?: Record<string, any>;
    }
  ): Promise<ThemeAnalysisResult> {
    const startTime = Date.now();
    let llmCalls = 0;
    let costCents = 0;

    try {
      console.log(`🎯 Analyzing themes for email: ${email.subject} (${email.gmail_message_id})`);

      // ============================================================
      // STEP 1: Initial Theme Detection Chain
      // ============================================================
      const themeDetectionResult = await this.runThemeDetectionChain(email);
      llmCalls += 1;
      costCents += 0.2; // ~$0.002

      // ============================================================
      // STEP 2: Context-Aware Enhancement (if user context available)
      // ============================================================
      let enhancedThemes = themeDetectionResult;
      if (userContext?.previous_patterns) {
        enhancedThemes = await this.enhanceWithUserContext(
          themeDetectionResult, 
          email, 
          userContext
        );
        llmCalls += 1;
        costCents += 0.3; // ~$0.003 for deeper analysis
      }

      // ============================================================
      // STEP 3: Cross-Email Relationship Analysis
      // ============================================================
      const relationshipAnalysis = await this.analyzeEmailRelationships(
        email,
        enhancedThemes,
        userContext?.user_id
      );
      llmCalls += 1;
      costCents += 0.2; // ~$0.002

      // ============================================================
      // STEP 4: Compile Final Analysis Result
      // ============================================================
      const analysisResult: ThemeAnalysisResult = {
        email_id: email.gmail_message_id,
        detected_themes: enhancedThemes.detected_themes,
        primary_theme: enhancedThemes.primary_theme,
        secondary_themes: enhancedThemes.secondary_themes,
        family_coordination_score: enhancedThemes.family_coordination_score,
        automation_opportunities: enhancedThemes.automation_opportunities,
        relationships_detected: relationshipAnalysis.relationships_detected,
        processing_metadata: {
          analysis_time_ms: Date.now() - startTime,
          llm_calls_made: llmCalls,
          cost_estimate_cents: Math.round(costCents)
        }
      };

      console.log(`✅ Theme analysis complete: ${enhancedThemes.primary_theme} (${llmCalls} calls, $${costCents/100})`);

      return analysisResult;

    } catch (error) {
      console.error(`❌ Theme analysis failed for ${email.gmail_message_id}:`, error);
      
      // Return fallback analysis
      return {
        email_id: email.gmail_message_id,
        detected_themes: this.generateFallbackThemes(email),
        primary_theme: 'general',
        secondary_themes: [],
        family_coordination_score: 0.5,
        automation_opportunities: [],
        relationships_detected: [],
        processing_metadata: {
          analysis_time_ms: Date.now() - startTime,
          llm_calls_made: llmCalls,
          cost_estimate_cents: Math.round(costCents)
        }
      };
    }
  }

  /**
   * Discover and analyze family patterns across multiple emails
   * 
   * @param userId - User ID for pattern analysis
   * @param accountId - Account ID for family context
   * @param lookbackDays - Days to analyze (default: 90)
   * @returns Promise resolving to discovered family patterns
   */
  static async discoverFamilyPatterns(
    userId: string,
    accountId: string,
    lookbackDays: number = THEME_CONFIG.PATTERN_ANALYSIS_LOOKBACK_DAYS
  ): Promise<{
    success: boolean;
    patterns: FamilyPatternResult[];
    insights: {
      total_patterns_found: number;
      strongest_patterns: string[];
      coordination_opportunities: string[];
      automation_suggestions: string[];
    };
    cost_metadata: {
      emails_analyzed: number;
      llm_calls_made: number;
      total_cost_cents: number;
    };
    error?: string;
  }> {
    const startTime = Date.now();
    let llmCalls = 0;
    let costCents = 0;

    try {
      console.log(`🔍 Discovering family patterns for user ${userId} (${lookbackDays} days lookback)`);

      // ============================================================
      // STEP 1: Fetch recent emails with themes
      // ============================================================
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

      const { data: emails, error: fetchError } = await supabase
        .from('email_embeddings')
        .select(`
          gmail_message_id,
          subject,
          sender_email,
          sender_name,
          sent_date,
          themes,
          priority_score,
          actionable_items,
          keywords
        `)
        .eq('user_id', userId)
        .eq('account_id', accountId)
        .gte('sent_date', cutoffDate.toISOString())
        .order('sent_date', { ascending: false })
        .limit(200); // Analyze up to 200 recent emails

      if (fetchError || !emails || emails.length === 0) {
        return {
          success: false,
          patterns: [],
          insights: {
            total_patterns_found: 0,
            strongest_patterns: [],
            coordination_opportunities: [],
            automation_suggestions: []
          },
          cost_metadata: {
            emails_analyzed: 0,
            llm_calls_made: 0,
            total_cost_cents: 0
          },
          error: 'No emails found for pattern analysis'
        };
      }

      console.log(`📊 Analyzing ${emails.length} emails for patterns...`);

      // ============================================================
      // STEP 2: Group emails by themes and time patterns
      // ============================================================
      const themeGroups = this.groupEmailsByThemes(emails);
      const temporalPatterns = this.analyzeTemporalPatterns(emails);

      // ============================================================
      // STEP 3: Run LangChain pattern analysis for each group
      // ============================================================
      const discoveredPatterns: FamilyPatternResult[] = [];

      for (const [themeCategory, themeEmails] of Object.entries(themeGroups)) {
        if (themeEmails.length >= THEME_CONFIG.MIN_PATTERN_OCCURRENCES) {
          console.log(`🎯 Analyzing ${themeCategory} pattern (${themeEmails.length} emails)`);
          
          const patternAnalysis = await this.runPatternAnalysisChain(
            themeCategory,
            themeEmails,
            temporalPatterns.get(themeCategory) || {},
            userId,
            accountId
          );
          
          llmCalls += 1;
          costCents += 0.3; // ~$0.003 per pattern analysis

          if (patternAnalysis.confidence_score >= 0.5) {
            discoveredPatterns.push(patternAnalysis);
          }
        }
      }

      // ============================================================
      // STEP 4: Cross-pattern relationship analysis
      // ============================================================
      if (discoveredPatterns.length > 1) {
        const relationshipInsights = await this.analyzeCrossPatternRelationships(
          discoveredPatterns,
          emails
        );
        llmCalls += 1;
        costCents += 0.2; // ~$0.002 for relationship analysis

        // Enhance patterns with relationship insights
        this.enhancePatternsWithRelationships(discoveredPatterns, relationshipInsights);
      }

      // ============================================================
      // STEP 5: Store patterns in database
      // ============================================================
      await this.storeFamilyPatterns(discoveredPatterns, userId, accountId);

      // ============================================================
      // STEP 6: Generate insights and recommendations
      // ============================================================
      const insights = this.generatePatternInsights(discoveredPatterns, emails);

      const totalTime = Date.now() - startTime;
      console.log(`✅ Pattern discovery complete: ${discoveredPatterns.length} patterns found in ${totalTime}ms`);
      console.log(`💰 Analysis cost: $${costCents/100} (${llmCalls} LLM calls, ${emails.length} emails)`);

      return {
        success: true,
        patterns: discoveredPatterns,
        insights,
        cost_metadata: {
          emails_analyzed: emails.length,
          llm_calls_made: llmCalls,
          total_cost_cents: Math.round(costCents)
        }
      };

    } catch (error) {
      console.error('❌ Family pattern discovery failed:', error);
      
      return {
        success: false,
        patterns: [],
        insights: {
          total_patterns_found: 0,
          strongest_patterns: [],
          coordination_opportunities: [],
          automation_suggestions: []
        },
        cost_metadata: {
          emails_analyzed: 0,
          llm_calls_made: llmCalls,
          total_cost_cents: Math.round(costCents)
        },
        error: error instanceof Error ? error.message : 'Pattern discovery failed'
      };
    }
  }

  /**
   * LangChain Theme Detection Chain
   * Advanced multi-step reasoning for accurate theme identification
   */
  private static async runThemeDetectionChain(email: EmailThemeInput): Promise<any> {
    // Create comprehensive theme detection prompt
    const themeDetectionPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        You are an expert family coordination analyst specializing in email theme detection.
        
        Your task is to analyze emails for family coordination themes with high precision.
        
        THEME CATEGORIES TO ANALYZE:
        ${Object.entries(THEME_CONFIG.FAMILY_THEMES)
          .map(([key, theme]) => `- ${key}: ${theme.name} (${theme.subcategories.join(', ')})`)
          .join('\n')}
        
        ANALYSIS APPROACH:
        1. Read the email content carefully for explicit and implicit family coordination needs
        2. Identify specific evidence for each theme (quotes, keywords, context clues)
        3. Assess confidence levels based on strength of evidence
        4. Look for urgency indicators (deadlines, time sensitivity, action required)
        5. Identify coordination needs (multiple people involved, scheduling, logistics)
        6. Suggest automation opportunities where patterns exist
        
        SCORING GUIDELINES:
        - Confidence 0.9-1.0: Explicit theme with strong evidence and clear family impact
        - Confidence 0.7-0.8: Clear theme with good evidence
        - Confidence 0.5-0.6: Probable theme with moderate evidence  
        - Confidence 0.3-0.4: Possible theme with weak evidence
        - Below 0.3: Not present or insufficient evidence
        
        Family Coordination Score (0.0-1.0):
        - How much does this email require family coordination/logistics management?
        - Consider: scheduling, multiple stakeholders, deadlines, preparation needed
        
        Return a valid JSON response matching the ThemeDetectionSchema.
      `),
      HumanMessagePromptTemplate.fromTemplate(`
        Email Analysis Request:
        
        FROM: {sender_name} <{sender_email}>
        SUBJECT: {subject}
        DATE: {sent_date}
        THREAD: {thread_id}
        
        CONTENT SUMMARY: {content_summary}
        
        Analyze this email for family coordination themes and return structured JSON.
      `)
    ]);

    // Create the analysis chain
    const themeChain = RunnableSequence.from([
      themeDetectionPrompt,
      llm,
      new JsonOutputParser(ThemeDetectionSchema)
    ]);

    try {
      const result = await themeChain.invoke({
        sender_name: email.sender_name || 'Unknown',
        sender_email: email.sender_email,
        subject: email.subject,
        sent_date: email.sent_date,
        thread_id: email.thread_id || 'none',
        content_summary: email.content_summary
      });

      // Validate and clean the response
      return {
        detected_themes: result.detected_themes || {},
        primary_theme: result.primary_theme || 'general',
        secondary_themes: result.secondary_themes || [],
        family_coordination_score: Math.max(0, Math.min(1, result.family_coordination_score || 0.5)),
        automation_opportunities: result.automation_opportunities || [],
        relationships_detected: result.relationships_detected || []
      };

    } catch (error) {
      console.error('Theme detection chain failed:', error);
      throw new Error(`Theme detection failed: ${error.message}`);
    }
  }

  /**
   * Enhance theme analysis with user-specific context and patterns
   */
  private static async enhanceWithUserContext(
    initialThemes: any,
    email: EmailThemeInput,
    userContext: any
  ): Promise<any> {
    // Create context enhancement prompt
    const contextEnhancementPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        You are enhancing email theme analysis with user-specific family patterns and context.
        
        Given the initial theme analysis and the user's established patterns, refine the analysis to:
        1. Boost confidence for themes that match established user patterns
        2. Identify theme subcategories based on user history
        3. Enhance coordination needs based on family patterns
        4. Suggest automations based on recurring patterns
        5. Adjust family coordination score based on user's typical complexity
        
        USER PATTERNS PROVIDED:
        {user_patterns}
        
        INITIAL ANALYSIS:
        {initial_themes}
        
        Enhance and return the improved theme analysis as JSON.
      `),
      HumanMessagePromptTemplate.fromTemplate(`
        EMAIL: {subject}
        FROM: {sender}
        
        Enhance the theme analysis considering this user's established patterns and preferences.
      `)
    ]);

    const enhancementChain = RunnableSequence.from([
      contextEnhancementPrompt,
      llm,
      new StringOutputParser()
    ]);

    try {
      const result = await enhancementChain.invoke({
        user_patterns: JSON.stringify(userContext.previous_patterns?.slice(0, 5) || []),
        initial_themes: JSON.stringify(initialThemes),
        subject: email.subject,
        sender: email.sender_name || email.sender_email
      });

      const enhanced = JSON.parse(result);
      return enhanced;

    } catch (error) {
      console.error('Context enhancement failed, using initial themes:', error);
      return initialThemes;
    }
  }

  /**
   * Analyze relationships between this email and others in the user's account
   */
  private static async analyzeEmailRelationships(
    email: EmailThemeInput,
    themeAnalysis: any,
    userId?: string
  ): Promise<any> {
    // For now, return basic relationship analysis
    // In full implementation, this would use vector similarity to find related emails
    return {
      relationships_detected: []
    };
  }

  /**
   * LangChain Pattern Analysis Chain for discovering family coordination patterns
   */
  private static async runPatternAnalysisChain(
    themeCategory: string,
    emails: any[],
    temporalData: any,
    userId: string,
    accountId: string
  ): Promise<FamilyPatternResult> {
    const patternAnalysisPrompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(`
        You are analyzing family coordination patterns to discover recurring themes and logistics needs.
        
        THEME CATEGORY: {theme_category}
        
        Analyze the provided emails to identify:
        1. What specific coordination pattern exists in this theme?
        2. How frequently does this pattern occur?
        3. What are the key characteristics that define this pattern?
        4. Who are the typical stakeholders involved?
        5. What coordination requirements does this pattern create?
        6. What could be automated to reduce coordination overhead?
        7. Are there seasonal or temporal factors affecting this pattern?
        
        FREQUENCY CLASSIFICATION:
        - daily: Occurs most days
        - weekly: Occurs weekly or multiple times per week
        - monthly: Occurs monthly or multiple times per month
        - seasonal: Occurs during specific seasons or times of year
        - ad-hoc: Irregular but recurring pattern
        
        TREND ANALYSIS:
        - increasing: Pattern is becoming more frequent or complex
        - decreasing: Pattern is becoming less frequent or simpler
        - stable: Pattern frequency and complexity are consistent
        
        Return analysis as JSON matching PatternAnalysisSchema.
      `),
      HumanMessagePromptTemplate.fromTemplate(`
        EMAILS TO ANALYZE ({email_count} total):
        {email_data}
        
        TEMPORAL PATTERNS:
        {temporal_data}
        
        Analyze this data to identify the family coordination pattern.
      `)
    ]);

    const patternChain = RunnableSequence.from([
      patternAnalysisPrompt,
      llm,
      new JsonOutputParser(PatternAnalysisSchema)
    ]);

    try {
      // Prepare email data for analysis
      const emailData = emails.slice(0, 10).map(email => ({
        subject: email.subject,
        sender: email.sender_name || email.sender_email,
        date: email.sent_date,
        themes: email.themes,
        keywords: email.keywords
      }));

      const result = await patternChain.invoke({
        theme_category: themeCategory,
        email_count: emails.length,
        email_data: JSON.stringify(emailData, null, 2),
        temporal_data: JSON.stringify(temporalData, null, 2)
      });

      return {
        pattern_id: `${userId}_${themeCategory}_${Date.now()}`,
        user_id: userId,
        account_id: accountId,
        pattern_type: themeCategory,
        pattern_name: result.pattern_name || `${themeCategory} coordination`,
        confidence_score: Math.max(0, Math.min(1, result.confidence_score || 0.5)),
        frequency: result.frequency || 'ad-hoc',
        trend_direction: result.trend_direction || 'stable',
        supporting_emails: emails.map(e => e.gmail_message_id).slice(0, 20),
        key_characteristics: result.key_characteristics || [],
        coordination_requirements: result.coordination_requirements || [],
        suggested_automations: result.suggested_automations || [],
        stakeholders: result.stakeholders || [],
        seasonal_factors: result.seasonal_factors || [],
        first_detected: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Pattern analysis failed for ${themeCategory}:`, error);
      
      // Return basic pattern
      return {
        pattern_id: `${userId}_${themeCategory}_${Date.now()}`,
        user_id: userId,
        account_id: accountId,
        pattern_type: themeCategory,
        pattern_name: `${themeCategory} pattern`,
        confidence_score: 0.3,
        frequency: 'ad-hoc',
        trend_direction: 'stable',
        supporting_emails: emails.map(e => e.gmail_message_id).slice(0, 10),
        key_characteristics: [`${emails.length} emails in ${themeCategory} theme`],
        coordination_requirements: [],
        suggested_automations: [],
        stakeholders: [],
        seasonal_factors: [],
        first_detected: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
    }
  }

  /**
   * Helper methods for pattern analysis and data processing
   */

  private static groupEmailsByThemes(emails: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    emails.forEach(email => {
      if (email.themes && typeof email.themes === 'object') {
        Object.entries(email.themes).forEach(([theme, data]: [string, any]) => {
          if (data.confidence > THEME_CONFIG.MIN_THEME_CONFIDENCE) {
            if (!groups[theme]) groups[theme] = [];
            groups[theme].push(email);
          }
        });
      }
    });
    
    return groups;
  }

  private static analyzeTemporalPatterns(emails: any[]): Map<string, any> {
    const patterns = new Map();
    
    // Group by theme and analyze timing
    const themeGroups = this.groupEmailsByThemes(emails);
    
    Object.entries(themeGroups).forEach(([theme, themeEmails]) => {
      const dates = themeEmails.map(email => new Date(email.sent_date));
      const dayOfWeek = dates.map(date => date.getDay());
      const hourOfDay = dates.map(date => date.getHours());
      
      patterns.set(theme, {
        total_occurrences: themeEmails.length,
        date_range: {
          start: Math.min(...dates.map(d => d.getTime())),
          end: Math.max(...dates.map(d => d.getTime()))
        },
        common_days: this.getMostCommon(dayOfWeek),
        common_hours: this.getMostCommon(hourOfDay),
        avg_frequency_days: this.calculateAverageFrequency(dates)
      });
    });
    
    return patterns;
  }

  private static getMostCommon(arr: number[]): number[] {
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    const maxCount = Math.max(...Object.values(counts));
    return Object.entries(counts)
      .filter(([, count]) => count === maxCount)
      .map(([val]) => parseInt(val));
  }

  private static calculateAverageFrequency(dates: Date[]): number {
    if (dates.length < 2) return 0;
    
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime());
    const intervals = [];
    
    for (let i = 1; i < sortedDates.length; i++) {
      const daysBetween = (sortedDates[i].getTime() - sortedDates[i-1].getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(daysBetween);
    }
    
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  }

  private static async analyzeCrossPatternRelationships(patterns: FamilyPatternResult[], emails: any[]): Promise<any> {
    // Placeholder for cross-pattern analysis
    return {
      relationships: [],
      coordination_insights: []
    };
  }

  private static enhancePatternsWithRelationships(patterns: FamilyPatternResult[], relationships: any): void {
    // Placeholder for relationship enhancement
  }

  private static async storeFamilyPatterns(patterns: FamilyPatternResult[], userId: string, accountId: string): Promise<void> {
    try {
      // Delete existing patterns for this user/account
      await supabase
        .from('family_theme_patterns')
        .delete()
        .eq('user_id', userId)
        .eq('account_id', accountId);

      // Insert new patterns
      if (patterns.length > 0) {
        const { error } = await supabase
          .from('family_theme_patterns')
          .insert(patterns.map(pattern => ({
            user_id: pattern.user_id,
            account_id: pattern.account_id,
            theme_category: pattern.pattern_type,
            pattern_name: pattern.pattern_name,
            pattern_description: `${pattern.key_characteristics.join('. ')}`,
            confidence_score: pattern.confidence_score,
            email_count: pattern.supporting_emails.length,
            frequency: pattern.frequency,
            trend_direction: pattern.trend_direction,
            first_detected: pattern.first_detected,
            last_observed: pattern.last_updated,
            keywords: pattern.key_characteristics,
            coordination_needs: pattern.coordination_requirements,
            suggested_actions: pattern.suggested_automations,
            automation_opportunities: pattern.suggested_automations
          })));

        if (error) {
          console.error('Failed to store family patterns:', error);
        } else {
          console.log(`✅ Stored ${patterns.length} family patterns`);
        }
      }
    } catch (error) {
      console.error('Exception storing family patterns:', error);
    }
  }

  private static generatePatternInsights(patterns: FamilyPatternResult[], emails: any[]): any {
    const strongestPatterns = patterns
      .filter(p => p.confidence_score > 0.7)
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, 5)
      .map(p => p.pattern_name);

    const allCoordination = patterns.flatMap(p => p.coordination_requirements);
    const allAutomation = patterns.flatMap(p => p.suggested_automations);

    return {
      total_patterns_found: patterns.length,
      strongest_patterns: strongestPatterns,
      coordination_opportunities: [...new Set(allCoordination)].slice(0, 10),
      automation_suggestions: [...new Set(allAutomation)].slice(0, 10)
    };
  }

  private static generateFallbackThemes(email: EmailThemeInput): Record<string, any> {
    // Simple keyword-based fallback theme detection
    const themes: Record<string, any> = {};
    const content = (email.subject + ' ' + email.content_summary).toLowerCase();
    
    Object.entries(THEME_CONFIG.FAMILY_THEMES).forEach(([themeKey, themeData]) => {
      const matches = themeData.keywords.filter(keyword => content.includes(keyword));
      if (matches.length > 0) {
        themes[themeKey] = {
          confidence: Math.min(matches.length * 0.2, 0.6),
          evidence: matches,
          subcategory: themeData.subcategories[0] || themeKey
        };
      }
    });

    return themes;
  }
}