/**
 * Inbound Email Routes
 * Handles incoming emails for AI analysis and processing
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { userProfileService } from '../services/userProfileService.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Extract user ID from inbound email address by matching against gmail-forwarding integrations
 */
async function extractUserIdFromAddress(recipientAddress) {
  try {
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('user_id')
      .eq('integration_id', 'gmail-forwarding')
      .eq('status', 'connected')
      .contains('config', { email_address: recipientAddress })
      .single();

    if (error || !integration) {
      return null;
    }

    return integration.user_id;
  } catch (error) {
    console.error('❌ Error extracting user ID from address:', error);
    return null;
  }
}

const router = express.Router();

/**
 * POST /inbound-email
 * Process incoming email with direct AI analysis + embeddings
 */
router.post('/', async (req, res) => {
  try {
    console.log('📧 Received inbound email request');
    console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));

    // Extract email data from SendGrid webhook format
    const emailData = {
      from: req.body.from || req.body.sender,
      to: req.body.to || req.body.recipient,
      subject: req.body.subject,
      text: req.body.text || req.body['body-plain'],
      html: req.body.html || req.body['body-html'],
      messageId: req.body.messageId || req.body['Message-Id'],
      date: req.body.date || new Date().toISOString()
    };
    console.log('🔍 Extracted emailData:', JSON.stringify(emailData, null, 2));

    // Validate required fields
    if (!emailData.from || !emailData.subject || !emailData.text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required email fields: from, subject, text',
        timestamp: new Date().toISOString()
      });
    }

    // Extract user ID from recipient address
    console.log('🔍 emailData.to value:', emailData.to);
    console.log('🔍 emailData.to type:', typeof emailData.to);
    const userId = await extractUserIdFromAddress(emailData.to);
    console.log(`👤 Found user ID: ${userId} for address: ${emailData.to}`);

    let userProfile = null;
    let familyContext = null;

    if (userId) {
      try {
        // Get user profile and family context
        const profileResult = await userProfileService.getProfile(userId);
        if (profileResult.success) {
          userProfile = profileResult.profile;
          familyContext = userProfile; // Family context is included in profile
          console.log(`👨‍👩‍👧‍👦 Retrieved family context for user ${userId}`);
        } else {
          console.log(`⚠️ No profile found for user ${userId}, proceeding without context`);
        }
      } catch (error) {
        console.error(`❌ Error getting profile for user ${userId}:`, error);
      }
    } else {
      console.log(`⚠️ No user found for address ${emailData.to}, processing without user context`);
    }

    // Store email directly in database
    const receivedAt = emailData.date || new Date().toISOString();

    // Store email in database first
    const emailInsertData = {
      user_id: userId,
      recipient_address: emailData.to,
      from_address: emailData.from,
      subject: emailData.subject,
      text_content: emailData.text,
      html_content: emailData.html,
      message_id: emailData.messageId || `inbound_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      received_at: receivedAt,
      original_date: emailData.date,
      processing_status: 'received',
      session_info: null
    };

    console.log(`📝 Inserting email into inbound_emails table:`, {
      user_id: emailInsertData.user_id,
      recipient_address: emailInsertData.recipient_address,
      from_address: emailInsertData.from_address,
      subject: emailInsertData.subject
    });
    console.log('🔍 Full emailInsertData object:', JSON.stringify(emailInsertData, null, 2));

    const { data: emailRecord, error: emailError } = await supabase
      .from('inbound_emails')
      .insert(emailInsertData)
      .select('id')
      .single();

    if (emailError) {
      console.error('❌ Failed to store email:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to store email in database',
        details: emailError.message,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Email stored with ID: ${emailRecord.id}`);

    // Process with simple AI analysis + embeddings (linear, direct)
    console.log(`🧠 Performing simple AI analysis with family context for email ${emailRecord.id}`);

    // Import simple AI processor
    const { processInboundEmailAI } = await import('../services/simpleInboundEmailAI.js');

    // Process with family context + embeddings
    const aiResult = await processInboundEmailAI(emailData, emailRecord.id, userId);

    if (!aiResult.success) {
      console.error(`❌ AI processing failed for email ${emailRecord.id}: ${aiResult.error}`);
      return res.status(500).json({
        success: false,
        error: `AI processing failed: ${aiResult.error}`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Email processed successfully with AI analysis + embeddings for email ${emailRecord.id}:`, {
      category: aiResult.analysis.primary_category,
      urgency: aiResult.analysis.urgency_level,
      family_relevance: aiResult.analysis.family_relevance,
      tokens_used: aiResult.tokens_used,
      family_context_used: aiResult.family_context_used,
      embedding_created: aiResult.embedding_created,
      content_analysis_created: aiResult.content_analysis_created
    });

    res.status(200).json({
      success: true,
      message: 'Email processed with AI analysis + embeddings',
      emailId: emailRecord.id,
      analysis: aiResult.analysis,
      tokens_used: aiResult.tokens_used,
      embedding_created: aiResult.embedding_created,
      content_analysis_created: aiResult.content_analysis_created,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Inbound email route error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error processing email',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});


export default router;