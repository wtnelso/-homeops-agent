/**
 * Inbound Email Routes
 * Handles incoming emails for AI analysis and processing
 */

import express from 'express';
import multer from 'multer';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
import { userProfileService } from '../services/userProfileService.js';
import { sendEmail } from '../services/emailService.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Extract user ID from forwarding address (e.g., turnernelson1-659959@inbound.homeops.ai)
 */
async function extractUserIdFromForwardingAddress(forwardingAddress) {
  try {
    const { data: integration, error } = await supabase
      .from('user_integrations')
      .select('user_id')
      .eq('integration_id', 'gmail-forwarding')
      .eq('status', 'connected')
      .contains('config', { email_address: forwardingAddress })
      .single();

    return integration?.user_id || null;
  } catch (error) {
    console.error('❌ Error extracting user ID from forwarding address:', error);
    return null;
  }
}

/**
 * Extract user ID from direct email address (e.g., turner.nelson1@gmail.com)
 */
async function extractUserIdFromDirectEmail(emailAddress) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .ilike('email', emailAddress) // Case-insensitive search
      .single();

    return user?.id || null;
  } catch (error) {
    console.error('❌ Error extracting user ID from direct email:', error);
    return null;
  }
}

/**
 * Check if email is a Gmail forwarding verification email
 */
function isGmailVerificationEmail(emailData) {
  return emailData.from?.includes('forwarding-noreply@google.com');
}

/**
 * Create simple HomeOps wrapper around original Gmail verification content
 */
function createVerificationEmailTemplate(originalHtml, originalText, forwardingAddress) {
  const wrappedHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gmail Forwarding Verification - HomeOps</title>
</head>
<body style="margin: 0; padding: 20px; font-family: arial, sans-serif; background-color: #ffffff; line-height: 1.5;">
    <!-- HomeOps Introduction -->
    <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
        Hey there!<br><br>
        In order to complete the Gmail Forwarding Verification process, we follow the steps below. The below email was forwarded to ${forwardingAddress} from Google, so we&rsquo;re forwarding it on to you here!
    </p>

    <!-- Original Gmail Verification Content (Indented) -->
    <div style="margin: 20px 0 30px 30px; padding-left: 20px; border-left: 3px solid #dadce0; color: #5f6368;">
        ${originalHtml || (originalText ? originalText.replace(/\n/g, '<br>') : '')}
    </div>

    <!-- HomeOps Closing -->
    <p style="margin: 0; color: #374151; font-size: 16px;">
        Cheers,<br>
        The HomeOps Team
    </p>
</body>
</html>`;

  const wrappedText = `
To complete HomeOps email forwarding, here's the email from Google to verify forwarding:

--- Gmail Verification ---
${originalText}

Cheers,
The HomeOps Team
`;

  return { html: wrappedHtml, text: wrappedText };
}

/**
 * Forward Gmail verification email to user with HomeOps-branded wrapper
 */
async function forwardVerificationEmail(userId, emailData, forwardingAddress) {
  console.log('📧 Forwarding Gmail verification email with HomeOps branding');

  if (!userId) {
    return { success: false, error: 'No user found for verification email' };
  }

  // Get user's email address
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  // Save Gmail verification email to database first
  const receivedAt = emailData.date || new Date().toISOString();
  const emailInsertData = {
    user_id: userId,
    recipient_address: emailData.to,
    from_address: emailData.from,
    subject: emailData.subject,
    text_content: emailData.text,
    html_content: emailData.html,
    message_id: emailData.messageId || `gmail_verification_${Date.now()}_${crypto.randomUUID()}`,
    received_at: receivedAt,
    original_date: emailData.date,
    processing_status: 'received',
    session_info: null
  };

  console.log(`📝 Storing Gmail verification email in database`);
  const { data: emailRecord, error: emailError } = await supabase
    .from('inbound_emails')
    .insert(emailInsertData)
    .select('id')
    .single();

  if (emailError) {
    console.error('❌ Failed to store Gmail verification email:', emailError);
    // Continue with forwarding even if database save fails
  } else {
    console.log(`✅ Gmail verification email stored with ID: ${emailRecord.id}`);
  }

  // Create branded template with original Gmail content
  const emailTemplate = createVerificationEmailTemplate(emailData.html, emailData.text, forwardingAddress);

  // Send email using SendGrid with HomeOps-branded template
  // Ensure proper subject formatting with closing parenthesis if missing
  let formattedSubject = emailData.subject;
  if (formattedSubject && formattedSubject.includes('(') && !formattedSubject.includes(')')) {
    formattedSubject = formattedSubject + ')';
  }

  const emailResult = await sendEmail({
    to: user.email,
    subject: `[HomeOps] ${formattedSubject}`,
    html: emailTemplate.html,
    text: emailTemplate.text
  });

  if (!emailResult.success) {
    console.error('❌ Failed to forward Gmail verification email:', emailResult.error);
    return {
      success: false,
      error: `Failed to forward email: ${emailResult.error}`
    };
  }

  console.log(`✅ Gmail verification email forwarded to: ${user.email}`);

  return {
    success: true,
    message: 'Gmail verification email forwarded with HomeOps branding',
    forwardedTo: user.email,
    messageId: emailResult.messageId,
    emailId: emailRecord?.id,
    preservedHTML: true,
    brandedTemplate: true,
    skippedAI: true
  };
}

const router = express.Router();

// Configure multer for multipart/form-data parsing
const upload = multer();

/**
 * POST /inbound-email
 * Process incoming email with direct AI analysis + embeddings
 */
router.post('/', upload.none(), async (req, res) => {
  try {
    console.log('📧 Received inbound email request');
    console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request body keys:', Object.keys(req.body || {}));

    // Parse the raw email content from SendGrid
    const rawEmail = req.body.email;
    console.log('🔍 Raw email from SendGrid:', rawEmail?.substring(0, 500) + '...');
    const parsedEmail = await simpleParser(rawEmail);
    console.log('🔍 Parsed email HTML:', parsedEmail.html);
    console.log('🔍 Parsed email text:', parsedEmail.text?.substring(0, 200) + '...');

    const emailData = {
      from: parsedEmail.from.text,
      to: parsedEmail.to.text,
      subject: parsedEmail.subject,
      text: parsedEmail.text,
      html: parsedEmail.html || null,
      messageId: parsedEmail.messageId,
      date: parsedEmail.date.toISOString()
    };

    console.log('🔍 Message ID details:', {
      messageId: parsedEmail.messageId,
      messageIdType: typeof parsedEmail.messageId,
      messageIdLength: parsedEmail.messageId?.length,
      willUseFallback: !parsedEmail.messageId
    });
    console.log('🔍 Extracted emailData:', JSON.stringify(emailData, null, 2));

    // Validate required fields
    if (!emailData.from || !emailData.subject || !emailData.text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required email fields: from, subject, text',
        timestamp: new Date().toISOString()
      });
    }

    // Extract user ID - try forwarding address first, then direct email
    const envelopeRecipient = req.body.to?.toLowerCase(); // SendGrid envelope (turnernelson1-659959@inbound.homeops.ai)
    const originalRecipient = emailData.to?.toLowerCase(); // Original email (turner.nelson1@gmail.com)

    console.log('🔍 Envelope recipient (forwarding):', envelopeRecipient);
    console.log('🔍 Original recipient (direct):', originalRecipient);

    // Try forwarding address first
    let userId = await extractUserIdFromForwardingAddress(envelopeRecipient);

    // If not found, try direct email lookup
    if (!userId) {
      console.log(`⚠️ No user found for forwarding address, trying direct email...`);
      userId = await extractUserIdFromDirectEmail(originalRecipient);
    }

    console.log(`👤 Found user ID: ${userId}`);

    // Handle Gmail verification emails specially - forward without AI processing
    if (isGmailVerificationEmail(emailData)) {
      const forwardResult = await forwardVerificationEmail(userId, emailData, envelopeRecipient);

      if (forwardResult.success) {
        return res.status(200).json({
          success: true,
          message: forwardResult.message,
          forwardedTo: forwardResult.forwardedTo,
          skippedAI: true,
          timestamp: new Date().toISOString()
        });
      } else {
        return res.status(400).json({
          success: false,
          error: forwardResult.error,
          timestamp: new Date().toISOString()
        });
      }
    }

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
      message_id: emailData.messageId || `inbound_${Date.now()}_${crypto.randomUUID()}`,
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

    // Queue email for background AI processing
    console.log(`📤 Queueing email ${emailRecord.id} for background AI processing`);

    // Import queue service
    const { queueEmail } = await import('../services/emailQueue.js');

    // Queue the email for processing
    const queueResult = await queueEmail(emailData, emailRecord.id, userId);

    if (!queueResult.success) {
      console.error(`❌ Failed to queue email ${emailRecord.id}: ${queueResult.error}`);
      return res.status(500).json({
        success: false,
        error: `Failed to queue email: ${queueResult.error}`,
        timestamp: new Date().toISOString()
      });
    }

    console.log(`✅ Email ${emailRecord.id} queued successfully for background processing`);

    // Return immediate response - processing will happen in background
    res.status(200).json({
      success: true,
      message: 'Email received and queued for processing',
      emailId: emailRecord.id,
      queued: true,
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