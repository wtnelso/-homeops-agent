/**
 * Simple AI Processing for Inbound Emails with Family Context
 *
 * Direct, lightweight AI analysis that includes family information
 * Just extracts key information and stores basic analysis
 */

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Get family context data for user
 */
async function getFamilyContext(userId) {
  try {
    console.log(`👨‍👩‍👧‍👦 Getting family context for user ${userId}`);

    // Get user's family ID
    const { data: userFamily, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        family_members!inner(family_id, family_relationship, name)
      `)
      .eq('id', userId)
      .single();

    if (userError || !userFamily?.family_members?.[0]) {
      console.log(`⚠️ No family found for user ${userId}`);
      return null;
    }

    const familyId = userFamily.family_members[0].family_id;
    console.log(`👨‍👩‍👧‍👦 Found family ID: ${familyId}`);

    // Get all family members
    const { data: familyMembers, error: membersError } = await supabase
      .from('family_members')
      .select('name, family_relationship, user_id')
      .eq('family_id', familyId);

    // Get family keywords/preferences
    const { data: familyKeywords, error: keywordsError } = await supabase
      .from('family_keywords')
      .select('keyword, context, category')
      .eq('family_id', familyId);

    // Get family contacts
    const { data: familyContacts, error: contactsError } = await supabase
      .from('family_contacts')
      .select('name, email, phone, relationship, notes')
      .eq('family_id', familyId);

    const familyContext = {
      familyId,
      members: familyMembers || [],
      keywords: familyKeywords || [],
      contacts: familyContacts || []
    };

    console.log(`✅ Family context retrieved:`, {
      familyId,
      membersCount: familyContext.members.length,
      keywordsCount: familyContext.keywords.length,
      contactsCount: familyContext.contacts.length
    });

    return familyContext;

  } catch (error) {
    console.error('❌ Error getting family context:', error);
    return null;
  }
}

/**
 * Generate embedding for email content
 */
async function generateEmailEmbedding(emailData) {
  try {
    console.log(`🎯 Generating embedding for email: ${emailData.subject}`);

    // Prepare content for embedding (combine subject and text content)
    const content = `${emailData.subject || ''}\n\n${emailData.text || emailData.html || ''}`.trim();
    const contentSnippet = content.substring(0, 500); // First 500 chars for snippet
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');

    const startTime = Date.now();

    // Generate embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content
    });

    const embedding = embeddingResponse.data[0].embedding;
    const processingTime = Date.now() - startTime;

    console.log(`✅ Embedding generated: ${embedding.length} dimensions, ${processingTime}ms`);

    return {
      success: true,
      embedding,
      contentSnippet,
      contentHash,
      contentLength: content.length,
      processingTime,
      tokensUsed: embeddingResponse.usage?.total_tokens || 0
    };

  } catch (error) {
    console.error('❌ Embedding generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Store embedding in email_embeddings table
 */
async function storeEmailEmbedding(emailId, embeddingResult, emailData, userId) {
  try {
    console.log(`📝 Storing embedding for email ${emailId}`);

    if (!embeddingResult.success) {
      console.warn('⚠️ Skipping embedding storage due to generation failure');
      return { success: false, error: 'Embedding generation failed' };
    }

    // Extract domain from email address
    const fromDomain = emailData.from ? emailData.from.split('@')[1] : null;

    const embeddingData = {
      email_record_id: emailId, // Reference to inbound_emails table for joining
      gmail_message_id: emailData.messageId,
      embedding: embeddingResult.embedding,
      embedding_model: 'text-embedding-3-small',
      content_snippet: embeddingResult.contentSnippet,
      content_hash: embeddingResult.contentHash,
      subject: emailData.subject,
      from_email: emailData.from,
      from_domain: fromDomain,
      timestamp: new Date(emailData.date || Date.now()).toISOString(),
      priority_score: 0.5,
      content_length: embeddingResult.contentLength,
      processing_time_ms: embeddingResult.processingTime,
      user_id: userId
    };

    const { error } = await supabase
      .from('email_embeddings')
      .insert(embeddingData);

    if (error) {
      console.error('❌ Failed to store embedding:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Embedding stored successfully for email ${emailId}`);
    return {
      success: true,
      tokensUsed: embeddingResult.tokensUsed
    };

  } catch (error) {
    console.error('❌ Error storing embedding:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Store comprehensive content analysis in email_content_analysis table
 */
async function storeContentAnalysis(emailId, emailData, analysis, userId, processingTimeMs) {
  try {
    console.log(`📝 Storing content analysis for email ${emailId}`);
    console.log(`🔍 Analysis data received:`, JSON.stringify(analysis, null, 2));
    console.log(`🔍 Email data:`, JSON.stringify(emailData, null, 2));
    console.log(`🔍 User ID: ${userId}, Processing time: ${processingTimeMs}ms`);

    // Extract data from nested analysis structure
    const actionability = analysis.ACTIONABILITY || {};
    const familyContext = analysis['FAMILY_CONTEXT'] || analysis.FAMILY_CONTEXT || {};
    const intelligence = analysis.INTELLIGENCE || {};
    const coreAnalysis = analysis['CORE_ANALYSIS'] || analysis.CORE_ANALYSIS || {};
    const familyRelationships = analysis['FAMILY RELATIONSHIPS'] || {};

    console.log(`🔍 Extracting data from analysis sections:`, {
      actionability: !!actionability,
      familyContext: !!familyContext,
      intelligence: !!intelligence,
      coreAnalysis: !!coreAnalysis,
      familyRelationships: !!familyRelationships
    });

    const contentAnalysisData = {
      email_record_id: emailId, // Reference to inbound_emails table for joining
      gmail_message_id: emailData.messageId,
      user_id: userId,
      extracted_entities: intelligence.extracted_entities || [],
      action_items: actionability.action_items || [],
      key_information: intelligence.key_information || {},
      sentiment_score: intelligence.sentiment_score || 0.0,
      family_relevance_score: familyContext.family_relevance_score || 0.0,
      involves_children: familyContext.involves_children || false,
      requires_coordination: familyContext.requires_coordination || false,
      has_deadline: actionability.has_deadline || false,
      deadline_date: actionability.deadline_date || null,
      content_type: coreAnalysis.content_type || 'informational',
      spam_likelihood: intelligence.spam_likelihood || 0.0,
      priority_level: coreAnalysis.priority_level || 'medium',
      thread_position: 'standalone',
      references_previous_emails: false,
      mentioned_people: familyContext.mentioned_people || [],
      mentioned_locations: familyContext.mentioned_locations || [],
      related_family_member: familyRelationships.related_family_member || null,
      related_family_activity: familyRelationships.related_family_activity || null,
      analysis_model: 'gpt-4o-mini',
      processing_time_ms: processingTimeMs,
      confidence_score: intelligence.confidence_score || 0.5,
      content_quality: 'good',
      parsing_success: true,
      analysis_warnings: []
    };

    console.log(`📦 About to insert content analysis data:`, JSON.stringify(contentAnalysisData, null, 2));

    const { data, error } = await supabase
      .from('email_content_analysis')
      .insert(contentAnalysisData)
      .select();

    if (error) {
      console.error('❌ Failed to store content analysis:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Data that failed to insert:', JSON.stringify(contentAnalysisData, null, 2));
      return { success: false, error: error.message };
    }

    console.log(`✅ Content analysis inserted successfully:`, JSON.stringify(data, null, 2));

    console.log(`✅ Content analysis stored successfully for email ${emailId}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error storing content analysis:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Simple AI analysis for inbound emails with family context
 */
export async function analyzeInboundEmail(emailData, userId) {
  try {
    console.log(`🧠 Starting AI analysis with family context for: ${emailData.subject}`);

    // Get family context
    const familyContext = await getFamilyContext(userId);

    // Build family context prompt
    let familyPrompt = '';
    if (familyContext) {
      familyPrompt = `

FAMILY CONTEXT:
Family Members: ${familyContext.members.map(m => `ID:${m.id} ${m.name} (${m.family_relationship}, grade:${m.grade || 'N/A'}, school:${m.school || 'N/A'})`).join(', ')}
Family Activities: ${familyContext.activities?.map(a => `ID:${a.id} ${a.name} (${a.activity_type}, ${a.schedule_day} ${a.schedule_time})`).join(', ') || 'None'}
Family Keywords: ${familyContext.keywords.map(k => `${k.keyword} (${k.category})`).join(', ')}
Family Contacts: ${familyContext.contacts.map(c => `${c.name} - ${c.relationship}`).join(', ')}

Use this family context to identify which family member and/or activity this email relates to.`;
    }

    // Create intelligent, actionable analysis prompt
    const analysisPrompt = `You are an intelligent family email assistant. Analyze this email and be VERY SELECTIVE about what qualifies as truly actionable vs informational noise.

Email Subject: ${emailData.subject || 'No subject'}
From: ${emailData.from || 'Unknown'}
To: ${emailData.to || 'Unknown'}
Content: ${emailData.text || emailData.html || 'No content'}${familyPrompt}

ACTIONABLE CRITERIA - Only mark as actionable if email contains:
- Explicit deadlines or due dates (permission slips, forms, payments)
- Required responses or confirmations
- Scheduled appointments/events requiring attendance
- Medical/school emergencies requiring immediate action
- Bills/payments with due dates
- Registration deadlines for activities/events

NOT ACTIONABLE (mark as informational):
- General newsletters, announcements, marketing
- Social updates, thank you notes
- Informational bulletins without deadlines
- General reminders without specific due dates

Extract this JSON structure:

CORE ANALYSIS:
- primary_category: One of [school, healthcare, family, work, finance, social, travel, shopping, other]
- urgency_level: [low, medium, high] - HIGH only for urgent deadlines/emergencies
- priority_level: [low, medium, high, critical] - CRITICAL only for emergencies
- content_type: [informational, actionable, social, promotional, transactional, urgent]

ACTIONABILITY (BE STRICT):
- requires_action: Boolean - TRUE only if explicit action needed with deadline/consequence
- action_items: Array of specific, time-bound tasks (e.g., "Sign permission slip by Friday")
- has_deadline: Boolean - TRUE only if specific date/time mentioned
- deadline_date: ISO date string if deadline exists, null otherwise

FAMILY CONTEXT:
- family_relevance_score: 0.0-1.0 (1.0 = directly affects family member, 0.0 = irrelevant)
- involves_children: Boolean - TRUE if mentions/affects children specifically
- requires_coordination: Boolean - TRUE if multiple family members need to coordinate
- mentioned_people: Array of actual names mentioned (not sender/recipient)
- mentioned_locations: Array of specific places/addresses

INTELLIGENCE:
- brief_summary: 1-2 sentences focusing on WHY this matters to the family
- key_information: Object with critical details (amounts, dates, contacts)
- extracted_entities: Array of important entities (schools, doctors, organizations)
- sentiment_score: -1.0 to 1.0
- confidence_score: 0.0-1.0 (how confident you are in this analysis)
- spam_likelihood: 0.0-1.0

FAMILY RELATIONSHIPS (IF EMAIL RELATES TO SPECIFIC FAMILY DATA):
- related_family_member: If email mentions/relates to a specific family member, return {id: <member_id>, name: <name>, confidence: 0.0-1.0} or null
- related_family_activity: If email mentions/relates to a specific family activity, return {id: <activity_id>, name: <name>, confidence: 0.0-1.0} or null

Return ONLY valid JSON with these exact field names:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful email analysis assistant for family email management. Return only valid JSON.' },
        { role: 'user', content: analysisPrompt }
      ],
      temperature: 0.1,
      max_tokens: 800
    });

    let analysis;
    try {
      analysis = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse AI response, using fallback');
      analysis = {
        primary_category: 'other',
        urgency_level: 'low',
        priority_level: 'low',
        content_type: 'informational',
        requires_action: false,
        action_items: [],
        has_deadline: false,
        deadline_date: null,
        family_relevance_score: 0.0,
        involves_children: false,
        requires_coordination: false,
        mentioned_people: [],
        mentioned_locations: [],
        brief_summary: emailData.subject || 'Email received',
        key_information: {},
        extracted_entities: [],
        sentiment_score: 0.0,
        confidence_score: 0.5,
        spam_likelihood: 0.0
      };
    }

    console.log(`✅ AI analysis completed:`, analysis);
    return {
      success: true,
      analysis: analysis,
      tokens_used: completion.usage?.total_tokens || 0,
      family_context_used: !!familyContext
    };

  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    return {
      success: false,
      error: error.message,
      analysis: {
        category: 'other',
        urgency: 'low',
        requires_action: false,
        people_mentioned: [],
        dates_mentioned: [],
        summary: emailData.subject || 'Email received',
        family_relevance: 'low',
        action_items: []
      }
    };
  }
}

/**
 * Store simple analysis results in database
 */
export async function storeSimpleAnalysis(emailId, analysisResult) {
  try {
    console.log(`📝 Storing analysis for email ${emailId}`);

    // Store analysis in a simple JSON field for now
    const analysisData = {
      ...analysisResult.analysis,
      tokens_used: analysisResult.tokens_used,
      family_context_used: analysisResult.family_context_used,
      completed_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('inbound_emails')
      .update({
        processing_status: analysisResult.success ? 'analyzed' : 'analysis_failed',
        session_info: analysisData,  // Store analysis in session_info for now
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);

    if (error) {
      console.error('❌ Failed to store analysis:', error);
      return { success: false, error: error.message };
    }

    console.log(`✅ Analysis stored successfully for email ${emailId}`);
    return { success: true };

  } catch (error) {
    console.error('❌ Error storing analysis:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Complete simple AI processing pipeline with embeddings
 */
export async function processInboundEmailAI(emailData, emailId, userId) {
  try {
    console.log(`🚀 Starting AI processing with family context for email ${emailId}`);

    // Step 1: Analyze the email with family context
    const analysisResult = await analyzeInboundEmail(emailData, userId);

    // Step 2: Generate embedding for semantic search
    const embeddingResult = await generateEmailEmbedding(emailData);

    // Step 3: Store the analysis results
    const storeResult = await storeSimpleAnalysis(emailId, analysisResult);

    if (!storeResult.success) {
      throw new Error(`Failed to store analysis: ${storeResult.error}`);
    }

    // Step 4: Store the embedding
    const embeddingStoreResult = await storeEmailEmbedding(emailId, embeddingResult, emailData, userId);

    // Step 5: Store comprehensive content analysis
    console.log(`🔄 About to store content analysis for email ${emailId}`);
    const contentAnalysisResult = await storeContentAnalysis(emailId, emailData, analysisResult.analysis, userId, analysisResult.processing_time || 0);
    console.log(`📊 Content analysis result:`, JSON.stringify(contentAnalysisResult, null, 2));

    let totalTokensUsed = analysisResult.tokens_used;
    if (embeddingResult.success) {
      totalTokensUsed += embeddingResult.tokensUsed;
    }

    console.log(`✅ AI processing completed for email ${emailId}`);
    return {
      success: true,
      analysis: analysisResult.analysis,
      tokens_used: totalTokensUsed,
      family_context_used: analysisResult.family_context_used,
      embedding_created: embeddingStoreResult.success,
      content_analysis_created: contentAnalysisResult.success
    };

  } catch (error) {
    console.error(`❌ AI processing failed for email ${emailId}:`, error);

    // Update email record with failure status
    try {
      await supabase
        .from('inbound_emails')
        .update({
          processing_status: 'analysis_failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', emailId);
    } catch (updateError) {
      console.error('❌ Failed to update error status:', updateError);
    }

    return {
      success: false,
      error: error.message
    };
  }
}