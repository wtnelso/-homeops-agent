/**
 * Inbound Email SMTP Server
 *
 * Receives emails via SMTP forwarding and queues them for processing.
 * Architecture: Gmail → forward → SMTP server → Redis queue → workers
 */

import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { createClient } from '@supabase/supabase-js';
// Removed Redis dependencies - using direct processing only
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// Initialize connections
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Removed Redis queue - using direct processing only

/**
 * Generate unique inbound email address for a user
 */
export function generateInboundAddress(userId) {
  const token = crypto.randomBytes(6).toString('hex');
  return `${userId}-${token}@inbound.homeops.ai`;
}

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
    return null;
  }
}

/**
 * SMTP Server Configuration
 */
export const smtpServer = new SMTPServer({
  secure: false,
  authOptional: true,
  allowInsecureAuth: true,
  disabledCommands: ['AUTH'],

  onData(stream, session, callback) {
    console.log(`📧 SMTP: Receiving email from ${session.envelope.mailFrom?.address}`);

    simpleParser(stream)
      .then(async (parsed) => {
        const { from, to, subject, text, html, messageId, date } = parsed;

        // Handle multiple recipients (to, cc, bcc)
        const recipients = [
          ...(to?.value || []),
          ...(parsed.cc?.value || []),
          ...(parsed.bcc?.value || [])
        ];

        for (const recipient of recipients) {
          const recipientAddress = recipient.address;
          const userId = await extractUserIdFromAddress(recipientAddress);

          if (!userId) {
            console.warn(`⚠️ Unable to extract user ID from ${recipientAddress}`);
            continue;
          }

          console.log(`📩 Processing email directly for user ${userId}: ${subject}`);

          // Queue email for processing through Redis workers
          const emailData = {
            userId,
            recipientAddress,
            from: from?.text || from?.address,
            subject: subject || '(no subject)',
            text: text || '',
            html: html || '',
            messageId: messageId || `${Date.now()}-${Math.random()}`,
            receivedAt: new Date().toISOString(),
            originalDate: date ? date.toISOString() : null,
            sessionInfo: {
              remoteAddress: session.remoteAddress,
              hostNameAppearsAs: session.hostNameAppearsAs
            }
          };

          try {
            // SMTP processing disabled - use HTTP route instead
            console.log(`📧 SMTP email received: ${subject} (use HTTP route for processing)`);
          } catch (error) {
            console.error('❌ Failed to queue email for processing:', error);
          }
        }

        callback();
      })
      .catch((error) => {
        console.error('📧 SMTP: Email parsing error:', error);
        callback(error);
      });
  },

  onAuth(auth, session, callback) {
    // No authentication required for inbound mail
    callback(null, { user: 'anonymous' });
  },

  onConnect(session, callback) {
    console.log(`📧 SMTP: Connection from ${session.remoteAddress}`);
    callback();
  },

  onClose(session) {
    console.log(`📧 SMTP: Connection closed from ${session.remoteAddress}`);
  }
});

/**
 * Process email directly (temporary function to test comprehensive AI analysis)
 */
async function processEmailDirectly(emailData) {
  console.log(`🔄 Processing email: ${emailData.subject} for user ${emailData.userId}`);

  try {
    console.log(`🔍 Verifying user ${emailData.userId} and gmail-forwarding integration...`);

    // Get user info and family_id in a single query by joining with family_members
    const { data: userWithFamily, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        family_members!inner(family_id, family_relationship, name)
      `)
      .eq('id', emailData.userId)
      .single();

    console.log(`👤 User and family lookup result:`, { userWithFamily, userError });

    if (userError || !userWithFamily) {
      console.error(`❌ User ${emailData.userId} not found or not in a family:`, userError);
      throw new Error(`User ${emailData.userId} not found or not in a family`);
    }

    const user = {
      id: userWithFamily.id,
      email: userWithFamily.email
    };
    const familyMember = userWithFamily.family_members[0]; // Get first family membership
    const familyId = familyMember?.family_id;

    console.log(`👨‍👩‍👧‍👦 Family context: familyId=${familyId}, relationship=${familyMember?.family_relationship}`);

    // Verify user exists and has gmail-forwarding integration enabled
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('user_id, status, integration_id, config')
      .eq('user_id', emailData.userId)
      .eq('integration_id', 'gmail-forwarding')
      .eq('status', 'connected')
      .single();

    console.log(`🔗 Integration lookup result:`, { integration, integrationError });

    if (integrationError || !integration) {
      console.warn(`❌ Gmail forwarding not enabled for user: ${emailData.userId}`);
      throw new Error(`Gmail forwarding integration not found or not active for user: ${emailData.userId}`);
    }

    console.log(`✅ User and integration verified for ${emailData.userId}`);

    // Store email in database
    const emailInsertData = {
      user_id: emailData.userId,
      recipient_address: emailData.recipientAddress,
      from_address: emailData.from,
      subject: emailData.subject,
      text_content: emailData.text,
      html_content: emailData.html,
      message_id: emailData.messageId,
      received_at: emailData.receivedAt,
      original_date: emailData.originalDate,
      processing_status: 'received',
      session_info: emailData.sessionInfo
    };

    console.log(`📝 Inserting email into inbound_emails table:`, {
      user_id: emailInsertData.user_id,
      recipient_address: emailInsertData.recipient_address,
      from_address: emailInsertData.from_address,
      subject: emailInsertData.subject
    });

    const { data: emailRecord, error: emailError } = await supabase
      .from('inbound_emails')
      .insert(emailInsertData)
      .select('id')
      .single();

    console.log(`💾 Email insert result:`, { emailRecord, emailError });

    if (emailError) {
      console.error('❌ Failed to store email:', emailError);
      throw emailError;
    }

    console.log(`✅ Email stored with ID: ${emailRecord.id}`);

    // Process comprehensive AI analysis if enabled
    if (emailData.text?.length > 10) {
      console.log(`🧠 Performing comprehensive AI analysis for email ${emailRecord.id} (user: ${emailData.userId})`);

      try {
        // Import comprehensive email processor
        const { EmailEmbeddingProcessor } = await import('./emailProcessor.js');

        // Create processor configuration for inbound emails
        const processorConfig = {
          user_id: emailData.userId,
          family_id: familyId, // Pass family context for better AI analysis
          job_id: uuidv4(), // Proper UUID for database compatibility
          max_content_length: 4000 // Reasonable limit for inbound emails
        };

        // Initialize processor
        const processor = new EmailEmbeddingProcessor(processorConfig);

        // Transform inbound email data to match Gmail email format expected by processor
        const emailForProcessor = {
          id: emailData.messageId || `inbound_${emailRecord.id}`,
          subject: emailData.subject || '(no subject)',
          from: emailData.from,
          to: null, // Not available in inbound format
          cc: null,
          bodyHtml: emailData.html || '',
          body: emailData.text || '', // The processor uses this field
          snippet: emailData.text || '',
          date: emailData.originalDate || emailData.receivedAt || new Date().toISOString(),
          labelIds: ['INBOX', 'INBOUND'], // Mark as inbound
          messageId: emailData.messageId
        };

        console.log(`📧 Processing inbound email through comprehensive AI pipeline...`);

        // Process email through the full AI pipeline
        // This will:
        // 1. Generate embeddings
        // 2. Perform comprehensive AI analysis
        // 3. Extract agent memories
        // 4. Create profile suggestions
        // 5. Store in email_records, email_embeddings, and email_content_analysis tables
        await processor.processEmail(emailForProcessor);

        // Get the analysis results and API call counts
        const apiCallCounts = processor.getApiCallCounts();
        console.log(`📊 AI processing completed. API calls:`, apiCallCounts);

        // Update inbound_emails record to indicate successful comprehensive processing
        await supabase
          .from('inbound_emails')
          .update({
            processing_status: 'analyzed_comprehensive',
            ai_processing_completed_at: new Date().toISOString(),
            api_call_counts: apiCallCounts,
            updated_at: new Date().toISOString()
          })
          .eq('id', emailRecord.id);

        console.log(`✅ Comprehensive AI analysis completed for email ${emailRecord.id}`);

      } catch (error) {
        console.error(`❌ Comprehensive email analysis failed for ${emailRecord.id}:`, error);

        // Update processing status on failure
        await supabase
          .from('inbound_emails')
          .update({
            processing_status: 'analysis_failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', emailRecord.id);

        throw error;
      }
    }

    return { success: true, emailId: emailRecord.id };

  } catch (error) {
    console.error(`❌ Email processing failed:`, error);

    // Update processing status on failure
    if (emailData.messageId) {
      await supabase
        .from('inbound_emails')
        .update({
          processing_status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('message_id', emailData.messageId);
    }

    throw error;
  }
}

/**
 * Email Processing Worker
 * Processes emails from Redis queue and stores in Supabase
 * TEMPORARILY DISABLED FOR TESTING
 */

/*
export const emailWorker = new Worker('inbound-emails', async (job) => {
  const emailData = {
    ...job.data,
    recipientAddress: job.data.recipientAddress || job.data.to
  };
  console.log(`🔄 Processing email: ${emailData.subject} for user ${emailData.userId}`);

  try {
    console.log(`🔍 Verifying user ${emailData.userId} and gmail-forwarding integration...`);

    // First check if user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', emailData.userId)
      .single();

    console.log(`👤 User lookup result:`, { user, userError });

    if (userError || !user) {
      console.error(`❌ User ${emailData.userId} not found in users table:`, userError);
      throw new Error(`User ${emailData.userId} not found in users table`);
    }

    // Verify user exists and has gmail-forwarding integration enabled
    const { data: integration, error: integrationError } = await supabase
      .from('user_integrations')
      .select('user_id, status, integration_id, config')
      .eq('user_id', emailData.userId)
      .eq('integration_id', 'gmail-forwarding')
      .eq('status', 'connected')
      .single();

    console.log(`🔗 Integration lookup result:`, { integration, integrationError });

    if (integrationError || !integration) {
      console.warn(`❌ Gmail forwarding not enabled for user: ${emailData.userId}`);
      throw new Error(`Gmail forwarding integration not found or not active for user: ${emailData.userId}`);
    }

    console.log(`✅ User and integration verified for ${emailData.userId}`);

    // Store email in database
    const emailInsertData = {
      user_id: emailData.userId,
      recipient_address: emailData.recipientAddress,
      from_address: emailData.from,
      subject: emailData.subject,
      text_content: emailData.text,
      html_content: emailData.html,
      message_id: emailData.messageId,
      received_at: emailData.receivedAt,
      original_date: emailData.originalDate,
      processing_status: 'received',
      session_info: emailData.sessionInfo
    };

    console.log(`📝 Inserting email into inbound_emails table:`, {
      user_id: emailInsertData.user_id,
      recipient_address: emailInsertData.recipient_address,
      from_address: emailInsertData.from_address,
      subject: emailInsertData.subject
    });

    const { data: emailRecord, error: emailError } = await supabase
      .from('inbound_emails')
      .insert(emailInsertData)
      .select('id')
      .single();

    console.log(`💾 Email insert result:`, { emailRecord, emailError });

    if (emailError) {
      console.error('❌ Failed to store email:', emailError);
      throw emailError;
    }

    console.log(`✅ Email stored with ID: ${emailRecord.id}`);

    // Queue disabled - processing via HTTP route only
    console.log(`📧 Email stored, processing disabled in SMTP (use HTTP route)`);

    return { success: true, emailId: emailRecord.id };

  } catch (error) {
    console.error(`❌ Email processing failed:`, error);

    // Update processing status on failure
    if (emailData.messageId) {
      await supabase
        .from('inbound_emails')
        .update({
          processing_status: 'failed',
          error_message: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('message_id', emailData.messageId);
    }

    throw error;
  }
}, {
  connection: redis,
  concurrency: 3,
  removeOnComplete: 100,
  removeOnFail: 50
});

/**
 * Email Analysis Worker
 * Handles comprehensive AI analysis of received emails using EmailEmbeddingProcessor
 * TEMPORARILY DISABLED FOR TESTING
 */
/*
export const analysisWorker = new Worker('inbound-emails', async (job) => {
  if (job.name !== 'analyze-email') return;

  const { emailId, userId, subject, text, html, from, receivedAt, originalDate, messageId } = job.data;
  console.log(`🧠 Performing comprehensive AI analysis for email ${emailId} (user: ${userId})`);

  try {
    // Import comprehensive email processor
    const { EmailEmbeddingProcessor } = await import('./emailProcessor.js');

    // Create processor configuration for inbound emails
    const processorConfig = {
      user_id: userId,
      job_id: uuidv4(), // Proper UUID for database compatibility
      max_content_length: 4000 // Reasonable limit for inbound emails
    };

    // Initialize processor
    const processor = new EmailEmbeddingProcessor(processorConfig);

    // Transform inbound email data to match Gmail email format expected by processor
    const emailForProcessor = {
      id: messageId || `inbound_${emailId}`,
      subject: subject || '(no subject)',
      from: from,
      to: null, // Not available in inbound format
      cc: null,
      bodyHtml: html || '',
      body: text || '', // The processor uses this field
      snippet: text || '',
      date: originalDate || receivedAt || new Date().toISOString(),
      labelIds: ['INBOX', 'INBOUND'], // Mark as inbound
      messageId: messageId
    };

    console.log(`📧 Processing inbound email through comprehensive AI pipeline...`);

    // Process email through the full AI pipeline
    // This will:
    // 1. Generate embeddings
    // 2. Perform comprehensive AI analysis
    // 3. Extract agent memories
    // 4. Create profile suggestions
    // 5. Store in email_records, email_embeddings, and email_content_analysis tables
    await processor.processEmail(emailForProcessor);

    // Get the analysis results and API call counts
    const apiCallCounts = processor.getApiCallCounts();
    console.log(`📊 AI processing completed. API calls:`, apiCallCounts);

    // Update inbound_emails record to indicate successful comprehensive processing
    await supabase
      .from('inbound_emails')
      .update({
        processing_status: 'analyzed_comprehensive',
        ai_processing_completed_at: new Date().toISOString(),
        api_call_counts: apiCallCounts,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);

    console.log(`✅ Comprehensive AI analysis completed for email ${emailId}`);
    return {
      success: true,
      processingType: 'comprehensive',
      apiCallCounts: apiCallCounts,
      jobId: processorConfig.job_id
    };

  } catch (error) {
    console.error(`❌ Comprehensive email analysis failed for ${emailId}:`, error);

    // Update processing status on failure
    await supabase
      .from('inbound_emails')
      .update({
        processing_status: 'analysis_failed',
        error_message: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);

    throw error;
  }
}, {
  connection: redis,
  concurrency: 2 // Keep same concurrency for now
});
*/

/**
 * Start SMTP Server
 */
export function startSMTPServer(port = process.env.SMTP_PORT || 2525) {
  return new Promise((resolve, reject) => {
    smtpServer.listen(port, (err) => {
      if (err) {
        console.error('❌ Failed to start SMTP server:', err);
        reject(err);
      } else {
        console.log(`📧 SMTP server listening on port ${port}`);
        console.log(`📬 Ready to receive emails at *@inbound.homeops.ai`);
        resolve(smtpServer);
      }
    });
  });
}

/**
 * Get queue statistics (disabled)
 */
export async function getQueueStats() {
  return {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    workers: {
      emailWorker: false,
      analysisWorker: false
    },
    note: 'Queue disabled - using HTTP route processing'
  };
}

// Handle graceful shutdown - DISABLED FOR TESTING
/*
process.on('SIGTERM', async () => {
  console.log('📧 SMTP: Graceful shutdown initiated');

  await emailWorker.close();
  await analysisWorker.close();
  await emailQueue.close();

  smtpServer.close(() => {
    console.log('📧 SMTP: Server closed');
    process.exit(0);
  });
});
*/

// Worker startup logging - DISABLED FOR TESTING
/*
emailWorker.on('ready', () => {
  console.log('📧 Email worker ready and listening for jobs');
});

emailWorker.on('error', (err) => {
  console.error('📧 Email worker error:', err);
});

analysisWorker.on('ready', () => {
  console.log('📧 Analysis worker ready and listening for jobs');
});

analysisWorker.on('error', (err) => {
  console.error('📧 Analysis worker error:', err);
});
*/

export default {
  startSMTPServer,
  generateInboundAddress,
  getQueueStats,
  smtpServer
};