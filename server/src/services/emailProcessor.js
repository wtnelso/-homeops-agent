/**
 * Email Embedding Processor
 * 
 * Core service for processing emails with LangChain and OpenAI.
 * Generates embeddings, extracts themes, and stores results in database.
 * 
 * === ARCHITECTURE OVERVIEW ===
 * 
 * This processor creates two complementary data stores that power different AI capabilities:
 * 
 * 1. EMAIL_EMBEDDINGS TABLE (Semantic Search Engine)
 *    - Vector embeddings (1536 dimensions) for similarity search
 *    - Enables "find emails similar to this" queries
 *    - Powers semantic search across all email content
 *    - Used by AI agent to retrieve contextually relevant emails
 * 
 * 2. EMAIL_CONTENT_ANALYSIS TABLE (Structured Intelligence)
 *    - Extracted insights, entities, and categorizations
 *    - Enables structured queries like "urgent family emails"
 *    - Powers AI agent conversation context and decision making
 *    - Provides actionable intelligence for task suggestions
 * 
 * === AI AGENT INTEGRATION ===
 * 
 * The AI agent uses this data to:
 * - Semantic search: "Find emails about school events" → vector similarity
 * - Contextual understanding: "You have 3 urgent family emails about..."
 * - Task suggestions: Extract action_items as suggested tasks
 * - Calendar integration: Use deadline_date for scheduling
 * - Conversation context: Reference mentioned_people and key_information
 * - Priority filtering: Use family_relevance_score for importance ranking
 * 
 * === SEARCH CAPABILITIES ===
 * 
 * Hybrid search combining:
 * - Vector similarity (embeddings) for semantic understanding
 * - Structured filters (analysis) for precise categorization
 * - Example: "urgent school emails" = high family_relevance + involves_children + has_deadline
 */

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { EmailConfig } from '../config/emailConfig.js';
import { TokenUsageTracker } from './tokenUsageTracker.js';
import { globalRateLimiter } from './openaiRateLimiter.js';
import { AgentMemoryService } from './agentMemoryService.js';
import { accountProfileService } from './accountProfileService.js';
import { EmailRoutingEngine } from '../config/emailRoutingConfig.js';
import { profileSuggestionsService } from './profileSuggestionsService.js';
import { RedisProfileCache } from './redisProfileCache.js';
import { enhancedMapPreferenceType } from '../utils/preferenceTypeMapper.js';
import { parseActivitySchedule, convertBirthdayToMonthDay, normalizeGradeText, generateActivityExpiration } from '../utils/scheduleParser.js';
import { detectFrequency } from '../config/frequencies.js';
import { detectActivityType } from '../config/activityTypes.js';
dotenv.config();

// Polyfill fetch for OpenAI SDK compatibility with Node.js 20
// TODO: Remove this when Node.js/undici fixes the "cookies is not iterable" bug
globalThis.fetch = fetch;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class EmailEmbeddingProcessor {
  constructor(config) {
    console.log('🏗️  Initializing EmailEmbeddingProcessor...');
    console.log('📋 Config:', config);
    console.log('🔧 Environment variables:');
    console.log('  - OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 10)}...` : 'NOT SET');
    console.log('  - OPENAI_EMBEDDING_MODEL:', process.env.OPENAI_EMBEDDING_MODEL);
    console.log('  - OPENAI_CHAT_MODEL:', process.env.OPENAI_CHAT_MODEL);
    console.log('  - OPENAI_TEMPERATURE:', process.env.OPENAI_TEMPERATURE);
    
    this.config = config;
    this.apiCallCounts = {
      embedding_api_calls: 0,
      theme_analysis_calls: 0
    };
    
    // Initialize token usage tracker
    this.tokenUsageTracker = new TokenUsageTracker();
    
    try {
      console.log('🤖 Creating OpenAI embeddings client...');
      this.embeddings = new OpenAIEmbeddings({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_EMBEDDING_MODEL || EmailConfig.openaiConfig.embeddingModel
      });
      console.log('✅ Embeddings client created successfully');
      
      console.log('💬 Creating ChatOpenAI client...');
      this.llm = new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_CHAT_MODEL || EmailConfig.openaiConfig.chatModel,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || EmailConfig.openaiConfig.temperature,
        maxTokens: EmailConfig.openaiConfig.maxTokens,
        topP: EmailConfig.openaiConfig.topP,
        frequencyPenalty: EmailConfig.openaiConfig.frequencyPenalty,
        presencePenalty: EmailConfig.openaiConfig.presencePenalty
      });
      console.log('✅ Chat client created successfully');

      // Initialize routing engine
      console.log('🔀 Creating routing engine...');
      this.routingEngine = new EmailRoutingEngine();
      console.log('✅ Routing engine created successfully');

    } catch (error) {
      console.error('❌ Failed to initialize OpenAI clients:', error);
      throw error;
    }
  }

  /**
   * Process a single email
   */
  async processEmail(email) {
    try {
      console.log(`🔄 Processing email: ${email.subject || 'No subject'}`);
      const startTime = Date.now();

      // Step 0: Pre-analyze email domains for priority boosting
      const domainContext = await this.analyzeDomainContext(email);

      // Step 1: Extract and clean email content
      const content = this.extractEmailContent(email);
      
      // Step 2: Generate embeddings
      const embedding = await this.generateEmbedding(content);
      this.trackApiCall('embedding');
      
      // Step 3: Analyze content with LangChain (enhanced with domain context)
      const analysis = await this.analyzeEmailContent(content, domainContext);
      this.trackApiCall('theme_analysis');
      
      // Step 4: Extract and store agent memory (unified system)
      const fullText = `${email.subject || ''}\n\n${content}`;
      await AgentMemoryService.extractAndStoreMemories(
        this.config.account_id,
        email.id || email.messageId || `email_${Date.now()}`,
        fullText,
        'email'
      );

      // Step 4.5: Route extracted information using our new engine
      await this.processExtractedInformation(email, content, analysis);

      // Step 5: Calculate processing time and add to analysis
      const processingTime = Date.now() - startTime;
      analysis.processing_time_ms = processingTime;
      analysis.confidence_score = this.calculateConfidenceScore(analysis);

      // Step 6: Store in database
      await this.storeEmailResults(email, content, embedding, analysis);
      
      console.log(`✅ Email processed in ${processingTime}ms`);

    } catch (error) {
      console.error('❌ Failed to process email:', error);
      throw error;
    }
  }

  /**
   * Analyze email domain context for priority boosting and enhanced prompts
   */
  async analyzeDomainContext(email) {
    try {
      const fromDomain = this.extractDomain(email.from);
      const profileContext = await this.getProfileContext();

      if (!profileContext || !fromDomain) {
        return {
          isSchoolEmail: false,
          matchedSchool: null,
          familyMemberContext: null,
          priorityBoost: 0
        };
      }

      // Check if email domain matches any family member's school
      for (const member of profileContext.family_members) {
        for (const school of member.schools) {
          if (school.email_domain && fromDomain.includes(school.email_domain.replace('@', ''))) {
            console.log(`🎯 School email detected: ${fromDomain} matches ${member.name}'s school ${school.name}`);
            return {
              isSchoolEmail: true,
              matchedSchool: school,
              familyMemberContext: member,
              priorityBoost: 0.3, // Boost family relevance score
              schoolContext: `This email is from ${school.name}${school.type ? ` (${school.type})` : ''}${school.grade ? `, grade ${school.grade}` : ''}, which ${member.name} attends.`
            };
          }
        }
      }

      return {
        isSchoolEmail: false,
        matchedSchool: null,
        familyMemberContext: null,
        priorityBoost: 0
      };

    } catch (error) {
      console.warn('⚠️  Failed to analyze domain context:', error.message);
      return {
        isSchoolEmail: false,
        matchedSchool: null,
        familyMemberContext: null,
        priorityBoost: 0
      };
    }
  }

  /**
   * Extract clean content from email
   */
  extractEmailContent(email) {
    // Combine subject and body content
    const subject = email.subject || '';
    const body = email.body || email.snippet || '';
    
    // Comprehensive content cleaning
    let content = `${subject}\n\n${body}`
      // Remove HTML tags and entities
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Decode HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Remove other HTML entities
      
      // Remove URLs and their surrounding artifacts
      .replace(/\([^)]*https?:\/\/[^)]*\)/g, '') // Remove parentheses containing URLs
      .replace(/\([^)]*\[link\][^)]*\)/g, '') // Remove parentheses containing [link] markers
      .replace(/https?:\/\/[^\s]+/g, '') // Remove all remaining URLs
      .replace(/\[link\]/g, '') // Remove any remaining [link] markers
      
      // Remove email tracking artifacts
      .replace(/\([^)]*tracking[^)]*\)/gi, '') // Remove tracking parentheses
      .replace(/\([^)]*utm[^)]*\)/gi, '') // Remove UTM tracking
      .replace(/\([^)]*redirect[^)]*\)/gi, '') // Remove redirect tracking
      
      // Clean up CSS and styling artifacts
      .replace(/style\s*=\s*"[^"]*"/gi, '') // Remove inline styles
      .replace(/class\s*=\s*"[^"]*"/gi, '') // Remove CSS classes
      
      // Normalize whitespace and cleanup
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/^\s+|\s+$/g, '') // Trim start/end
      .trim();
    
    // Truncate to max length
    const maxLength = this.config.max_content_length || EmailConfig.contentProcessing.max_content_length;
    return content.length > maxLength
      ? content.substring(0, maxLength) + EmailConfig.contentProcessing.truncation_suffix
      : content;
  }

  /**
   * Generate embeddings using OpenAI
   */
  async generateEmbedding(content) {
    try {
      console.log('🔄 Starting embedding generation...');
      console.log('📝 Content length:', content.length);
      console.log('🔧 Using model:', process.env.OPENAI_EMBEDDING_MODEL);
      console.log('🔑 API key exists:', !!process.env.OPENAI_API_KEY);
      
      // Use LangChain OpenAI embeddings with rate limiting
      const embeddings = await globalRateLimiter.executeWithRateLimit(
        () => this.embeddings.embedDocuments([content]),
        'embedding'
      );
      
      // Extract the first (and only) embedding from the array
      const embedding = embeddings[0];
      
      // Track embedding token usage (use fallback estimation since LangChain doesn't expose token usage)
      this.tokenUsageTracker.trackEmbeddingResponse(null, content.length);
      
      console.log('✅ Embedding generated successfully, length:', embedding.length);
      return embedding;
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause
      });
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Analyze email content with LangChain
   */
  async analyzeEmailContent(content, domainContext = null) {
    try {
      // Get account profile context for enhanced analysis
      const profileContext = await this.getProfileContext();

      // Enhanced prompt with profile context and domain information
      const prompt = this.buildEnhancedAnalysisPrompt(content, profileContext, domainContext);

      const response = await globalRateLimiter.executeWithRateLimit(
        () => this.llm.invoke(prompt),
        'llm'
      );
      
      // Track LLM token usage
      this.tokenUsageTracker.trackLLMResponse(response, prompt.length);
      
      // Handle different response types from LangChain
      let responseText = '';
      if (typeof response === 'string') {
        responseText = response;
      } else if (response && response.content) {
        responseText = response.content;
      } else if (response && response.text) {
        responseText = response.text;
      } else {
        responseText = JSON.stringify(response);
      }

      try {
        // Clean the response text - remove markdown json code blocks
        let cleanResponse = responseText.trim();
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        // Try to parse as JSON
        const analysis = JSON.parse(cleanResponse);
        
        // Validate required fields and set defaults
        let familyRelevanceScore = typeof analysis.family_relevance_score === 'number' ? analysis.family_relevance_score : 0.5;

        // Apply domain context priority boost for school emails
        if (domainContext && domainContext.isSchoolEmail && domainContext.priorityBoost > 0) {
          familyRelevanceScore = Math.min(1.0, familyRelevanceScore + domainContext.priorityBoost);
          console.log(`🎯 Applied school email priority boost: ${familyRelevanceScore} (boosted by ${domainContext.priorityBoost})`);
        }

        return {
          primary_theme: analysis.primary_theme || 'general',
          family_relevance_score: familyRelevanceScore,
          involves_children: typeof analysis.involves_children === 'boolean' ? analysis.involves_children : false,
          requires_coordination: typeof analysis.requires_coordination === 'boolean' ? analysis.requires_coordination : false,
          has_deadline: typeof analysis.has_deadline === 'boolean' ? analysis.has_deadline : false,
          deadline_date: analysis.deadline_date || null,
          action_items: Array.isArray(analysis.action_items) ? analysis.action_items : [],
          mentioned_people: Array.isArray(analysis.mentioned_people) ? analysis.mentioned_people : [],
          key_information: analysis.key_information || '',
          sentiment_score: typeof analysis.sentiment_score === 'number' ? analysis.sentiment_score : null,
          references_previous_email: typeof analysis.references_previous_email === 'boolean' ? analysis.references_previous_email : false,
          content_quality: this.mapContentQuality(analysis.content_quality),
          extracted_entities: Array.isArray(analysis.extracted_entities) ? analysis.extracted_entities : [],
          parsing_success: true
        };
      } catch (parseError) {
        // Fallback if not valid JSON
        console.warn('⚠️  LLM response not valid JSON, using fallback');
        console.warn('Response:', responseText.substring(0, 200) + '...');
        return {
          primary_theme: 'general',
          family_relevance_score: 0.5,
          involves_children: false,
          requires_coordination: false,
          has_deadline: false,
          deadline_date: null,
          action_items: [],
          mentioned_people: [],
          key_information: responseText.substring(0, 500),
          sentiment_score: null,
          references_previous_email: false,
          content_quality: 'unknown',
          extracted_entities: [],
          parsing_success: false
        };
      }

    } catch (error) {
      console.error('❌ Failed to analyze email content:', error);
      return {
        primary_theme: 'general',
        family_relevance_score: 0.5,
        involves_children: false,
        requires_coordination: false,
        has_deadline: false,
        deadline_date: null,
        action_items: [],
        mentioned_people: [],
        key_information: '',
        sentiment_score: null,
        references_previous_email: false,
        content_quality: 'poor',
        extracted_entities: [],
        parsing_success: false,
        error: error.message
      };
    }
  }

  /**
   * Get profile context for enhanced email analysis
   */
  async getProfileContext() {
    try {
      if (!this.config.account_id) {
        return null;
      }

      // Check Redis cache first
      const cachedContext = await RedisProfileCache.getCachedProfileContext(this.config.account_id);
      if (cachedContext) {
        return cachedContext;
      }

      // Cache miss - fetch from database
      const profileResult = await accountProfileService.getProfile(this.config.account_id);

      if (!profileResult.success || !profileResult.profile) {
        return null;
      }

      const profile = profileResult.profile.profile_data;

      // Build structured context summary for AI analysis
      const context = {
        family_members: [],
        household_head: null,
        preferences: {},
        contacts: []
      };

      // Extract spouse/parent information
      if (profile.family?.spouse?.name) {
        context.household_head = {
          name: profile.family.spouse.name,
          type: 'spouse',
          details: []
        };
      }

      // Extract detailed family member information from members array
      if (profile.members) {
        profile.members.forEach(member => {
          if (member.name) {
            const memberContext = {
              name: member.name,
              type: member.type || 'family_member',
              age: member.age || null,
              schools: [],
              activities: [],
              details: []
            };

            // Add schools with details
            if (member.schools) {
              member.schools.forEach(school => {
                if (school.name) {
                  const schoolInfo = {
                    name: school.name,
                    type: school.type || null,
                    grade: school.grade || null,
                    email_domain: school.email_domain || null
                  };
                  memberContext.schools.push(schoolInfo);
                }
              });
            }

            // Add activities with details
            if (member.activities) {
              member.activities.forEach(activity => {
                if (activity.name) {
                  const activityInfo = {
                    name: activity.name,
                    frequency: activity.frequency || null,
                    days: activity.days || null,
                    start_time: activity.start_time || null,
                    end_time: activity.end_time || null,
                    location: activity.location || null
                  };
                  memberContext.activities.push(activityInfo);
                }
              });
            }

            context.family_members.push(memberContext);
          }
        });
      }

      // Extract household-level activities that aren't member-specific
      if (profile.activities?.recurring_events) {
        profile.activities.recurring_events.forEach(event => {
          if (event.activity_name) {
            // Find if this activity is already associated with a family member
            const isAssigned = context.family_members.some(member =>
              member.activities.some(activity => activity.name === event.activity_name)
            );

            if (!isAssigned) {
              // Add as household activity
              if (!context.household_activities) {
                context.household_activities = [];
              }
              context.household_activities.push({
                name: event.activity_name,
                frequency: event.frequency || null,
                participants: event.participants || []
              });
            }
          }
        });
      }

      // Extract preferences
      if (profile.preferences) {
        context.preferences = {
          dietary: profile.preferences.dietary || {},
          communication: profile.preferences.communication || {}
        };
      }

      // Extract important contacts
      if (profile.contacts?.important_contacts) {
        context.contacts = profile.contacts.important_contacts.map(contact => contact.name).filter(Boolean);
      }

      // Cache the context for future requests (async, don't wait)
      RedisProfileCache.cacheProfileContext(this.config.account_id, context)
        .catch(err => console.warn('⚠️  Failed to cache profile context:', err.message));

      return context;
    } catch (error) {
      console.warn('⚠️  Failed to get profile context for email analysis:', error.message);
      return null;
    }
  }

  /**
   * Build enhanced analysis prompt with profile context and domain information
   */
  buildEnhancedAnalysisPrompt(content, profileContext, domainContext = null) {
    let prompt = EmailConfig.analysisPrompt.replace('{content}', content);

    // Add profile context if available
    if (profileContext) {
      const contextInfo = [];

      // Build detailed family member profiles
      if (profileContext.family_members && profileContext.family_members.length > 0) {
        profileContext.family_members.forEach(member => {
          const memberDetails = [];

          // Add basic info
          if (member.age) {
            memberDetails.push(`${member.age} years old`);
          }

          // Add school information
          if (member.schools && member.schools.length > 0) {
            member.schools.forEach(school => {
              let schoolInfo = `attends ${school.name}`;
              if (school.type) schoolInfo += ` (${school.type})`;
              if (school.grade) schoolInfo += ` in grade ${school.grade}`;
              memberDetails.push(schoolInfo);
            });
          }

          // Add activities
          if (member.activities && member.activities.length > 0) {
            const activityNames = member.activities.map(activity => {
              let activityDesc = activity.name;
              if (activity.frequency && activity.days) {
                activityDesc += ` (${activity.frequency} on ${Array.isArray(activity.days) ? activity.days.join(', ') : activity.days})`;
              }
              return activityDesc;
            });
            if (activityNames.length > 0) {
              memberDetails.push(`participates in ${activityNames.join(', ')}`);
            }
          }

          // Create natural sentence
          if (memberDetails.length > 0) {
            contextInfo.push(`${member.name} ${memberDetails.join(', ')}.`);
          } else {
            contextInfo.push(`${member.name} is a family member.`);
          }
        });
      }

      // Add household head if available
      if (profileContext.household_head) {
        contextInfo.push(`${profileContext.household_head.name} is the ${profileContext.household_head.type}.`);
      }

      // Add household activities if any
      if (profileContext.household_activities && profileContext.household_activities.length > 0) {
        const householdActivities = profileContext.household_activities.map(activity => activity.name).join(', ');
        contextInfo.push(`Family participates in: ${householdActivities}.`);
      }

      // Add important contacts
      if (profileContext.contacts && profileContext.contacts.length > 0) {
        contextInfo.push(`Important contacts: ${profileContext.contacts.join(', ')}.`);
      }

      if (contextInfo.length > 0) {
        const contextSection = `\n\nFamily Profile Context:\n${contextInfo.join('\n')}\n\nUse this detailed family context to better identify family relevance, mentioned people, and coordination needs.`;
        prompt = prompt.replace('Requirements:', contextSection + '\n\nRequirements:');
      }
    }

    // Add domain context if this is a school email
    if (domainContext && domainContext.isSchoolEmail) {
      const domainSection = `\n\n🏫 SCHOOL EMAIL DETECTED:\n${domainContext.schoolContext}\n\nIMPORTANT: This email is from a known school in your family profile. Increase family_relevance_score by ${domainContext.priorityBoost} and set involves_children to true if appropriate.`;
      prompt = prompt.replace('Requirements:', domainSection + '\n\nRequirements:');
    }

    return prompt;
  }


  /**
   * Calculate confidence score for extracted memory
   */
  calculateMemoryConfidence(patternConfig, extractedData, familyRelevanceScore) {
    let confidence = 0;

    // Base confidence from family relevance (40% weight)
    confidence += familyRelevanceScore * 0.4;

    // Data completeness factor (40% weight)
    const totalFields = Object.keys(patternConfig.extractors || {}).length;
    const extractedFields = Object.keys(extractedData).length;
    if (totalFields > 0) {
      confidence += (extractedFields / totalFields) * 0.4;
    }

    // Priority boost (20% weight) - higher priority patterns get confidence boost
    const priorityBoost = {
      1: 0.2,  // Critical
      2: 0.15, // High
      3: 0.1,  // Medium
      4: 0.05, // Low
      5: 0.0   // Archive
    };
    confidence += priorityBoost[patternConfig.priority] || 0.1;

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  /**
   * Generate a descriptive key for the memory
   */
  generateMemoryKey(patternType, extractedData) {
    switch (patternType) {
      case 'schedule':
        if (extractedData.activity_type && extractedData.day) {
          return `${extractedData.activity_type}_${extractedData.day}`.toLowerCase();
        }
        return `schedule_${Date.now()}`;

      case 'contacts':
        if (extractedData.name && extractedData.role) {
          return `${extractedData.role}_${extractedData.name}`.toLowerCase().replace(/\s+/g, '_');
        }
        return `contact_${Date.now()}`;

      case 'medical':
        if (extractedData.condition) {
          return `medical_${extractedData.condition}`.toLowerCase().replace(/\s+/g, '_');
        }
        if (extractedData.doctor) {
          return `doctor_${extractedData.doctor}`.toLowerCase().replace(/\s+/g, '_');
        }
        return `medical_${Date.now()}`;

      case 'financial':
        if (extractedData.item) {
          return `payment_${extractedData.item}`.toLowerCase().replace(/\s+/g, '_');
        }
        return `financial_${Date.now()}`;

      case 'school':
        if (extractedData.subject && extractedData.assignment) {
          return `${extractedData.subject}_${extractedData.assignment}`.toLowerCase().replace(/\s+/g, '_');
        }
        if (extractedData.teacher) {
          return `teacher_${extractedData.teacher}`.toLowerCase().replace(/\s+/g, '_');
        }
        return `school_${Date.now()}`;

      case 'transportation':
        if (extractedData.type && extractedData.location) {
          return `${extractedData.type}_${extractedData.location}`.toLowerCase().replace(/\s+/g, '_');
        }
        return `transport_${Date.now()}`;

      case 'emergency':
        if (extractedData.contact_name) {
          return `emergency_${extractedData.contact_name}`.toLowerCase().replace(/\s+/g, '_');
        }
        return `emergency_${Date.now()}`;

      default:
        return `${patternType}_${Date.now()}`;
    }
  }

  /**
   * Store results in database
   */
  async storeEmailResults(email, content, embedding, analysis) {
    try {
      console.log('💾 Starting database storage...');
      console.log('📊 Analysis data:', JSON.stringify(analysis, null, 2));
      
      // 1. Store full email record first - For display in email UI
      const emailRecordId = uuidv4();
      console.log('📧 Storing email record with ID:', emailRecordId);
      
      const emailRecordData = {
        id: emailRecordId,
        gmail_message_id: email.id,
        subject: email.subject || 'No Subject',
        from_email: this.extractCleanEmail(email.from),
        from_domain: this.extractDomain(email.from),
        to_email: this.extractCleanEmail(email.to),
        cc_email: this.extractCleanEmail(email.cc),
        body_html: email.bodyHtml || '',
        timestamp: email.date ? new Date(email.date).toISOString() : new Date().toISOString(),
        received_date: email.date ? new Date(email.date).toISOString() : new Date().toISOString(),
        label_ids: email.labelIds || [],
        category: this.categorizeEmail(email, analysis)
      };
      
      const emailRecordResult = await supabase
        .from('email_records')
        .insert(emailRecordData);

      if (emailRecordResult.error) {
        console.error('❌ Email record insertion error:', emailRecordResult.error);
        throw new Error(`Failed to insert email record: ${emailRecordResult.error.message}`);
      } else {
        console.log('✅ Email record stored successfully');
      }
      
      // 2. Store email embedding - Core vector search data for semantic similarity (cleaned up)
      const embeddingId = uuidv4();
      console.log('📧 Storing email embedding with ID:', embeddingId);
      
      const embeddingResult = await supabase
        .from('email_embeddings')
        .insert({
          id: embeddingId, // Primary key for linking to analysis data
          job_id: this.config.job_id, // Links to processing batch for job tracking
          account_id: this.config.account_id, // User isolation for multi-tenant security
          email_record_id: emailRecordId, // Links to full email record for display
          gmail_message_id: email.id, // Gmail's unique identifier for deduplication
          embedding: JSON.stringify(embedding), // 1536-dimensional vector for semantic search & similarity matching
          content_hash: this.generateContentHash(content), // Duplicate detection across processing runs
          priority_score: analysis.family_relevance_score || 0.5, // Semantic search ranking weight
          content_length: content.length // Content richness indicator for search relevance
        });

      if (embeddingResult.error) {
        console.error('❌ Email embedding insertion error:', embeddingResult.error);
        throw new Error(`Failed to insert email embedding: ${embeddingResult.error.message}`);
      } else {
        console.log('✅ Email embedding stored successfully');
      }

      // 2. Store content analysis - Structured AI insights for intelligent conversations
      console.log('📊 Storing content analysis...');
      const analysisData = {
        job_id: this.config.job_id, // Processing batch tracking
        email_embedding_id: embeddingId, // Links to vector embedding for hybrid search
        account_id: this.config.account_id, // User isolation for multi-tenant access
        gmail_message_id: email.id, // Gmail deduplication key
        
        // === FAMILY LOGISTICS INTELLIGENCE ===
        family_relevance_score: analysis.family_relevance_score || 0.5, // AI agent priority weighting (0-1)
        involves_children: analysis.involves_children || false, // Childcare context for AI responses
        requires_coordination: analysis.requires_coordination || false, // Multi-person scheduling context
        has_deadline: analysis.has_deadline || false, // Time-sensitive action flag for AI urgency
        deadline_date: analysis.deadline_date, // Specific deadline for AI calendar integration
        
        // === ACTIONABLE CONTENT EXTRACTION ===
        action_items: analysis.action_items || [], // AI agent can suggest these as tasks
        mentioned_people: analysis.mentioned_people || [], // Name recognition for family member context
        key_information: analysis.key_information || '', // AI agent conversation summary material
        
        // === EMOTIONAL & QUALITY CONTEXT ===
        sentiment_score: analysis.sentiment_score, // AI agent tone matching (0=negative, 1=positive)
        content_quality: this.mapContentQuality(analysis.content_quality), // Search result ranking factor
        
        // === SEMANTIC CATEGORIZATION ===
        extracted_entities: analysis.extracted_entities || [], // Named entities for AI knowledge graphs
        content_type: this.classifyContentType(analysis), // AI response style adaptation
        priority_level: this.calculatePriorityLevel(analysis.family_relevance_score || 0.5), // User attention prioritization
        
        // === PROCESSING METADATA ===
        parsing_success: analysis.parsing_success !== undefined ? analysis.parsing_success : true, // Data reliability indicator
        processing_time_ms: analysis.processing_time_ms || null, // Performance monitoring
        confidence_score: analysis.confidence_score || null // AI certainty for response confidence weighting
      };
      
      console.log('📝 Analysis data to insert:', JSON.stringify(analysisData, null, 2));
      
      const analysisResult = await supabase
        .from('email_content_analysis')
        .insert(analysisData);

      if (analysisResult.error) {
        console.error('❌ Content analysis insertion error:', analysisResult.error);
        throw new Error(`Failed to insert content analysis: ${analysisResult.error.message}`);
      } else {
        console.log('✅ Content analysis stored successfully');
      }

      // 3. Store theme if significant
      if (analysis.family_relevance_score > 0.7) {
        await this.storeEmailTheme(analysis);
      }

      console.log('✅ All database operations completed successfully');

    } catch (error) {
      console.error('❌ Failed to store email results:', error);
      throw error;
    }
  }

  /**
   * Store email theme and update account-wide theme summary
   */
  async storeEmailTheme(analysis) {
    try {
      console.log(`📊 High relevance theme detected: ${analysis.primary_theme} (relevance: ${analysis.family_relevance_score})`);

      const theme_name = analysis.primary_theme;
      const relevance_score = analysis.family_relevance_score || 0.5;
      const account_id = this.config.account_id;
      const job_id = this.config.job_id;

      // Use UPSERT to insert or update the theme summary
      const { error } = await supabase
        .from('account_theme_summary')
        .upsert({
          account_id: account_id,
          theme_name: theme_name,
          total_emails: 1, // Will be handled by SQL increment logic
          high_relevance_count: relevance_score > 0.7 ? 1 : 0,
          average_relevance_score: relevance_score,
          first_seen_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          recent_30d_count: 1,
          recent_7d_count: 1,
          last_updated_at: new Date().toISOString(),
          last_batch_id: job_id
        }, {
          onConflict: 'account_id,theme_name',
          ignoreDuplicates: false
        });

      if (error) {
        // If upsert failed, try updating existing record
        console.log('🔄 Upsert failed, attempting manual aggregation update...');
        await this.updateThemeSummary(account_id, theme_name, relevance_score, job_id);
      } else {
        console.log(`✅ Theme summary updated for ${theme_name}`);
      }

    } catch (error) {
      console.error('❌ Failed to store theme summary:', error);
      // Don't throw error - theme aggregation failure shouldn't break email processing
    }
  }

  /**
   * Manually update theme summary with proper aggregation
   */
  async updateThemeSummary(account_id, theme_name, relevance_score, job_id) {
    try {
      // Get existing record
      const { data: existing, error: fetchError } = await supabase
        .from('account_theme_summary')
        .select('*')
        .eq('account_id', account_id)
        .eq('theme_name', theme_name)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
        throw fetchError;
      }

      const now = new Date().toISOString();

      if (existing) {
        // Update existing record with proper aggregation
        const new_total = existing.total_emails + 1;
        const new_high_relevance = existing.high_relevance_count + (relevance_score > 0.7 ? 1 : 0);
        const new_avg_relevance = ((existing.average_relevance_score * existing.total_emails) + relevance_score) / new_total;

        const { error: updateError } = await supabase
          .from('account_theme_summary')
          .update({
            total_emails: new_total,
            high_relevance_count: new_high_relevance,
            average_relevance_score: Math.round(new_avg_relevance * 100) / 100, // Round to 2 decimals
            last_seen_at: now,
            recent_30d_count: existing.recent_30d_count + 1,
            recent_7d_count: existing.recent_7d_count + 1,
            last_updated_at: now,
            last_batch_id: job_id
          })
          .eq('account_id', account_id)
          .eq('theme_name', theme_name);

        if (updateError) throw updateError;
        console.log(`✅ Updated existing theme summary for ${theme_name} (total: ${new_total})`);

      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from('account_theme_summary')
          .insert({
            account_id: account_id,
            theme_name: theme_name,
            total_emails: 1,
            high_relevance_count: relevance_score > 0.7 ? 1 : 0,
            average_relevance_score: relevance_score,
            first_seen_at: now,
            last_seen_at: now,
            recent_30d_count: 1,
            recent_7d_count: 1,
            last_updated_at: now,
            last_batch_id: job_id
          });

        if (insertError) throw insertError;
        console.log(`✅ Created new theme summary for ${theme_name}`);
      }

    } catch (error) {
      console.error('❌ Failed to manually update theme summary:', error);
    }
  }

  /**
   * Helper methods
   */
  extractDomain(email) {
    if (!email) return null;
    // Extract email from formats like: "Display Name" <email@domain.com> or just email@domain.com
    const emailMatch = email.match(/<([^>]+)>/) || email.match(/([^\s<>]+@[^\s<>]+)/);
    if (!emailMatch) return null;
    
    const cleanEmail = emailMatch[1] || emailMatch[0];
    const domainMatch = cleanEmail.match(/@([^>\s]+)/);
    return domainMatch ? domainMatch[1].trim() : null;
  }

  /**
   * Extract clean email address from display name format
   */
  extractCleanEmail(email) {
    if (!email) return null;
    // Extract email from formats like: "Display Name" <email@domain.com> or just email@domain.com
    const emailMatch = email.match(/<([^>]+)>/) || email.match(/([^\s<>]+@[^\s<>]+)/);
    return emailMatch ? (emailMatch[1] || emailMatch[0]).trim() : email;
  }

  extractDomain(email) {
    if (!email) return null;
    const cleanEmail = this.extractCleanEmail(email);
    if (!cleanEmail) return null;
    const domainMatch = cleanEmail.match(/@(.+)/);
    return domainMatch ? domainMatch[1].trim() : null;
  }

  categorizeEmail(email, analysis) {
    if (!analysis) return EmailConfig.defaultCategory;
    
    // First, try using AI analysis theme
    if (analysis.primary_theme && EmailConfig.themeCategories[analysis.primary_theme]) {
      return EmailConfig.themeCategories[analysis.primary_theme];
    }
    
    // Fallback: categorize based on domain patterns
    const domain = this.extractDomain(email.from);
    if (domain) {
      const lowerDomain = domain.toLowerCase();
      
      // Check each category for domain matches
      for (const [category, keywords] of Object.entries(EmailConfig.domainCategories)) {
        if (keywords.some(keyword => lowerDomain.includes(keyword))) {
          return category;
        }
      }
    }
    
    return EmailConfig.defaultCategory;
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
    if (relevanceScore > EmailConfig.priorityThresholds.high) return 'high';
    if (relevanceScore > EmailConfig.priorityThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Map content quality values to database-allowed values
   */
  mapContentQuality(quality) {
    return EmailConfig.contentQualityMap[quality?.toLowerCase()] || 'fair';
  }

  /**
   * Calculate confidence score based on analysis completeness
   */
  calculateConfidenceScore(analysis) {
    let score = 0;
    let factors = 0;
    
    // Parsing success factor (30%)
    if (analysis.parsing_success === true) {
      score += 0.3;
    }
    factors++;
    
    // Content quality factor (25%)
    const qualityScore = {
      'excellent': 1.0,
      'good': 0.8,
      'fair': 0.6,
      'poor': 0.3
    };
    score += (qualityScore[analysis.content_quality] || 0.5) * 0.25;
    factors++;
    
    // Data completeness factor (25%) 
    let completeness = 0;
    if (analysis.primary_theme && analysis.primary_theme !== 'general') completeness += 0.2;
    if (analysis.key_information && analysis.key_information.length > 10) completeness += 0.2;
    if (analysis.action_items && analysis.action_items.length > 0) completeness += 0.2;
    if (analysis.mentioned_people && analysis.mentioned_people.length > 0) completeness += 0.2;
    if (analysis.extracted_entities && analysis.extracted_entities.length > 0) completeness += 0.2;
    score += completeness * 0.25;
    factors++;
    
    // Sentiment analysis factor (20%)
    if (analysis.sentiment_score !== null && analysis.sentiment_score !== undefined) {
      score += 0.2;
    }
    factors++;
    
    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Track API calls for cost estimation and metrics
   */
  trackApiCall(type) {
    if (type === 'embedding') {
      this.apiCallCounts.embedding_api_calls++;
      console.log(`📊 Embedding API calls: ${this.apiCallCounts.embedding_api_calls}`);
    } else if (type === 'theme_analysis') {
      this.apiCallCounts.theme_analysis_calls++;
      console.log(`📊 Theme analysis API calls: ${this.apiCallCounts.theme_analysis_calls}`);
    }
  }

  /**
   * Get current API call counts and token usage for job tracking
   */
  getApiCallCounts() {
    const tokenUsage = this.tokenUsageTracker.getUsage();
    return {
      ...this.apiCallCounts,
      ...tokenUsage
    };
  }

  /**
   * Process extracted information using routing engine
   * Routes to preferences, memory, or profile suggestions based on content
   */
  async processExtractedInformation(email, content, analysis) {
    try {
      console.log('🔀 Starting intelligent information routing...');

      // Get family profile context for routing decisions
      const profileContext = await this.getProfileContext();

      // Prepare extracted information for routing
      const extractedInfo = [
        {
          text: analysis.key_information,
          confidence: analysis.confidence_score || 0.7,
          extracted_entities: analysis.extracted_entities || [],
          mentioned_people: analysis.mentioned_people || []
        },
        // Add action items as separate routing candidates
        ...analysis.action_items.map(item => ({
          text: item,
          confidence: 0.6, // Lower confidence for action items
          extracted_entities: [],
          mentioned_people: analysis.mentioned_people || []
        }))
      ].filter(info => info.text && info.text.length > 10); // Only process substantial content

      // Route each piece of information
      const routingDecisions = this.routingEngine.routeInformation(extractedInfo, profileContext);

      console.log(`📊 Made ${routingDecisions.length} routing decisions`);

      // Process each routing decision
      for (const decision of routingDecisions) {
        await this.executeRoutingDecision(decision, email, analysis);
      }

      console.log('✅ Information routing completed');
    } catch (error) {
      console.error('❌ Failed to process extracted information:', error);
      // Don't throw - this is an enhancement, shouldn't break main flow
    }
  }

  /**
   * Execute a single routing decision
   */
  async executeRoutingDecision(decision, email, analysis) {
    const { route, confidence, requires_review, original_text } = decision;

    console.log(`🎯 Executing route: ${route} (confidence: ${confidence.toFixed(2)})`);

    switch (route) {
      case 'preference':
        await this.handlePreferenceRoute(decision, email, analysis);
        break;

      case 'memory':
        await this.handleMemoryRoute(decision, email, analysis);
        break;

      case 'profile_suggestion':
        await this.handleProfileSuggestionRoute(decision, email, analysis);
        break;

      case 'discard':
        console.log('🗑️  Information discarded due to low confidence');
        break;

      default:
        console.warn(`⚠️  Unknown route: ${route}`);
    }
  }

  /**
   * Handle routing to preferences
   */
  async handlePreferenceRoute(decision, email, analysis) {
    try {
      console.log('📝 Creating profile suggestion for preference update');

      // Log intelligent preference type mapping
      const mappingResult = enhancedMapPreferenceType(
        decision.original_text || '',
        decision.preference_value || decision.original_text || '',
        email.subject || ''
      );
      console.log(`🧠 Preference type mapping: "${decision.preference_type || 'unknown'}" → "${mappingResult.type}" (confidence: ${mappingResult.confidence}, expiration: ${mappingResult.expiration})`);

      // For now, create a profile suggestion even for preferences
      // Later we can auto-update high-confidence preferences
      await profileSuggestionsService.createSuggestion({
        accountId: this.config.account_id,
        suggestionType: 'preference_update',
        suggestedData: {
          preference_text: decision.original_text,
          preference_type: mappingResult.type,
          preference_value: decision.preference_value || decision.original_text,
          category: 'user_preference',
          confidence: Math.max(decision.confidence, mappingResult.confidence),
          // Store original AI classification for reference
          original_ai_type: decision.preference_type,
          // Include smart expiration default from server
          default_expiration: mappingResult.expiration
        },
        confidenceScore: Math.max(decision.confidence, mappingResult.confidence),
        sourceEmailId: email.id,
        sourceEmailSubject: email.subject,
        sourceEmailDate: email.date,
        reasoning: `Detected preference: ${decision.reasoning}`
      });

      console.log('✅ Preference suggestion created');
    } catch (error) {
      console.error('❌ Failed to handle preference route:', error);
    }
  }

  /**
   * Handle routing to memory (this leverages existing AgentMemoryService)
   */
  async handleMemoryRoute(decision, email, analysis) {
    try {
      console.log('🧠 Enhanced memory storage with entity links');

      // The existing AgentMemoryService already handles this,
      // but we could enhance it with our entity links
      if (decision.entity_links && decision.entity_links.length > 0) {
        console.log(`🔗 Found ${decision.entity_links.length} entity links for memory`);
        // Could store entity links in a future memory_entity_links table
      }

      console.log('✅ Memory route handled by existing AgentMemoryService');
    } catch (error) {
      console.error('❌ Failed to handle memory route:', error);
    }
  }

  /**
   * Handle routing to profile suggestions using structured data
   */
  async handleProfileSuggestionRoute(decision, email, analysis) {
    try {
      console.log('👨‍👩‍👧‍👦 Processing structured suggestions from email analysis');

      // Get existing family members for fuzzy matching
      const profileContext = await this.getProfileContext();
      const existingMembers = profileContext?.family_members || [];

      // Process family suggestions with fuzzy matching logic
      if (analysis.family_suggestions && analysis.family_suggestions.length > 0) {
        for (const familySuggestion of analysis.family_suggestions) {
          let suggestionType = 'contact_add'; // Default to contact
          let reasoning = `New contact detected: ${decision.reasoning}`;

          // Check if this matches an existing family member
          if (familySuggestion.member_name && existingMembers.length > 0) {
            const nameMatch = profileSuggestionsService.fuzzyNameMatch(familySuggestion.member_name, existingMembers);

            // Only create as family_info if there's a decent match (confidence > 0.3)
            if (nameMatch.match && nameMatch.confidence > 0.3) {
              suggestionType = 'family_info';
              reasoning = `Family info detected for existing member ${nameMatch.member.name} (${Math.round(nameMatch.confidence * 100)}% confidence): ${decision.reasoning}`;
              console.log(`🔍 Fuzzy match found: "${familySuggestion.member_name}" matches "${nameMatch.member.name}" with ${Math.round(nameMatch.confidence * 100)}% confidence`);
            } else {
              console.log(`🚫 No fuzzy match for "${familySuggestion.member_name}" - creating as contact instead`);
            }
          }

          // Create standardized suggestion data structure
          let enhancedSuggestionData = { ...familySuggestion };

          // Handle activity/schedule data in standardized format matching account_profiles schema
          if (familySuggestion.activity || familySuggestion.activity_type || familySuggestion.schedule) {
            try {
              const activityName = familySuggestion.activity || familySuggestion.activity_type || 'Activity';
              const scheduleText = familySuggestion.schedule || '';

              // Parse schedule using existing utility
              const parsedSchedule = parseActivitySchedule(scheduleText, activityName);

              // Map lowercase days to capitalized format for UI compatibility
              const standardizeDays = (days = []) => {
                const dayMapping = {
                  'monday': 'Monday',
                  'tuesday': 'Tuesday',
                  'wednesday': 'Wednesday',
                  'thursday': 'Thursday',
                  'friday': 'Friday',
                  'saturday': 'Saturday',
                  'sunday': 'Sunday'
                };
                return days.map(day => dayMapping[day.toLowerCase()] || day);
              };

              // Convert expires_at to end_date format (YYYY-MM-DD)
              const formatEndDate = (expiresAt) => {
                if (!expiresAt) return '';
                try {
                  const date = new Date(expiresAt);
                  return date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
                } catch (error) {
                  console.warn('Error formatting expires_at date:', error);
                  return '';
                }
              };

              // Create standardized data structure matching account_profiles format
              enhancedSuggestionData.name = activityName;
              enhancedSuggestionData.type = detectActivityType(activityName);
              enhancedSuggestionData.frequency = detectFrequency(`${activityName} ${scheduleText}`);
              enhancedSuggestionData.days = standardizeDays(parsedSchedule.days || []);
              enhancedSuggestionData.end_date = formatEndDate(generateActivityExpiration(activityName));

              // Store additional schedule details for context (optional)
              if (parsedSchedule.time || parsedSchedule.location || scheduleText) {
                enhancedSuggestionData.schedule_details = {
                  time: parsedSchedule.time || null,
                  location: parsedSchedule.location || null,
                  raw_text: scheduleText
                };
              }

              // Clean up old format fields to avoid confusion
              delete enhancedSuggestionData.activity;
              delete enhancedSuggestionData.activity_type;
              delete enhancedSuggestionData.schedule;

              console.log(`📅 Standardized activity data for ${familySuggestion.member_name}:`, {
                name: enhancedSuggestionData.name,
                type: enhancedSuggestionData.type,
                frequency: enhancedSuggestionData.frequency,
                days: enhancedSuggestionData.days,
                end_date: enhancedSuggestionData.end_date
              });

            } catch (error) {
              console.error('❌ Error standardizing activity data:', error);
            }
          }

          // Convert full birthday dates to privacy-safe month-day format
          if (familySuggestion.birthday) {
            try {
              const convertedBirthday = convertBirthdayToMonthDay(familySuggestion.birthday);
              if (convertedBirthday !== familySuggestion.birthday) {
                enhancedSuggestionData.birthday = convertedBirthday;
                console.log(`🎂 Converted birthday for ${familySuggestion.member_name}:`, {
                  original: familySuggestion.birthday,
                  converted: convertedBirthday
                });
              }
            } catch (error) {
              console.error('❌ Error converting birthday data:', error);
            }
          }

          // Normalize grade text to structured format
          if (familySuggestion.grade) {
            try {
              const normalizedGrade = normalizeGradeText(familySuggestion.grade);
              enhancedSuggestionData.grade = normalizedGrade;
              if (normalizedGrade !== familySuggestion.grade) {
                console.log(`🎓 Normalized grade for ${familySuggestion.member_name}:`, {
                  original: familySuggestion.grade,
                  normalized: normalizedGrade
                });
              }
            } catch (error) {
              console.error('❌ Error normalizing grade data:', error);
            }
          }

          await profileSuggestionsService.createSuggestion({
            accountId: this.config.account_id,
            suggestionType: suggestionType,
            suggestedData: enhancedSuggestionData,
            confidenceScore: decision.confidence,
            sourceEmailId: email.id,
            sourceEmailSubject: email.subject,
            sourceEmailDate: email.date,
            reasoning: reasoning
          });
          console.log(`✅ ${suggestionType} suggestion created for ${familySuggestion.member_name}`);
        }
      }

      // Create contact_add suggestions from structured data
      if (analysis.contact_suggestions && analysis.contact_suggestions.length > 0) {
        for (const contactSuggestion of analysis.contact_suggestions) {
          await profileSuggestionsService.createSuggestion({
            accountId: this.config.account_id,
            suggestionType: 'contact_add',
            suggestedData: contactSuggestion,
            confidenceScore: decision.confidence,
            sourceEmailId: email.id,
            sourceEmailSubject: email.subject,
            sourceEmailDate: email.date,
            reasoning: `Contact detected: ${contactSuggestion.name} (${contactSuggestion.role})`
          });
          console.log(`✅ Contact suggestion created for ${contactSuggestion.name}`);
        }
      }

      // Fallback: If no structured suggestions but decision indicates family info, create basic suggestion
      if ((!analysis.family_suggestions || analysis.family_suggestions.length === 0) &&
          (!analysis.contact_suggestions || analysis.contact_suggestions.length === 0)) {
        console.log('⚠️ No structured suggestions found, creating fallback contact suggestion');

        // Since we can't determine fuzzy matching without a clear name, default to contact
        await profileSuggestionsService.createSuggestion({
          accountId: this.config.account_id,
          suggestionType: 'contact_add',
          suggestedData: {
            extracted_info: decision.original_text,
            entity_links: decision.entity_links || [],
            suggested_entities: analysis.extracted_entities || [],
            mentioned_people: analysis.mentioned_people || []
          },
          confidenceScore: decision.confidence,
          sourceEmailId: email.id,
          sourceEmailSubject: email.subject,
          sourceEmailDate: email.date,
          reasoning: `Contact detected (fallback): ${decision.reasoning}`
        });
      }

      console.log('✅ Profile suggestions processing complete');
    } catch (error) {
      console.error('❌ Failed to handle profile suggestion route:', error);
    }
  }
}