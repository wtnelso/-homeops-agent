/**
 * Email Embedding Worker
 * 
 * Handles the actual long-running email processing with LangChain and OpenAI.
 * This replaces the Supabase Edge Function for heavy AI processing.
 */

import { createClient } from '@supabase/supabase-js';
import { EmailEmbeddingProcessor } from '../services/emailProcessor.js';
import { GmailService } from '../services/gmailService.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export class EmbeddingWorker {
  /**
   * Process email embeddings job
   * Main entry point for background processing
   */
  static async processEmailJob(jobData) {
    const { job_id, account_id, batch_type, processing_options } = jobData;
    
    try {
      console.log(`🚀 Processing job ${job_id} for account ${account_id}`);
      
      // Step 1: Update job status to processing
      await this.updateJobStatus(job_id, {
        status: 'processing',
        started_at: new Date().toISOString()
      });

      // Step 2: Get Gmail integration and access token
      const gmailIntegration = await this.getGmailIntegration(account_id);
      if (!gmailIntegration) {
        throw new Error('Gmail integration not found or inactive');
      }

      // Step 3: Initialize services
      const gmailService = new GmailService(gmailIntegration.access_token);
      const processor = new EmailEmbeddingProcessor({
        job_id,
        account_id,
        batch_type,
        ...processing_options
      });

      // Step 4: Fetch emails from Gmail
      console.log(`📧 Fetching emails for ${batch_type} processing...`);
      const emails = await gmailService.fetchEmails({
        maxResults: processing_options.email_limit || 20,
        query: this.buildGmailQuery(batch_type)
      });

      console.log(`📊 Found ${emails.length} emails to process`);

      // Step 5: Update job with total email count
      await this.updateJobStatus(job_id, {
        total_emails: emails.length
      });

      // Step 6: Process emails with LangChain
      let processed = 0;
      let failed = 0;

      for (const email of emails) {
        try {
          console.log(`🔄 Processing email ${processed + 1}/${emails.length}: ${email.subject || 'No subject'}`);
          
          await processor.processEmail(email);
          processed++;

          // Update progress every 5 emails
          if (processed % 5 === 0) {
            await this.updateJobStatus(job_id, {
              processed_emails: processed,
              failed_emails: failed
            });
          }

        } catch (emailError) {
          console.error(`❌ Failed to process email:`, emailError);
          failed++;
        }
      }

      // Step 7: Complete the job
      await this.updateJobStatus(job_id, {
        status: 'completed',
        processed_emails: processed,
        failed_emails: failed,
        completed_at: new Date().toISOString(),
        processing_duration_seconds: Math.floor((Date.now() - new Date(jobData.started_at || Date.now()).getTime()) / 1000)
      });

      console.log(`✅ Job ${job_id} completed: ${processed} processed, ${failed} failed`);

    } catch (error) {
      console.error(`❌ Job ${job_id} failed:`, error);
      
      await this.updateJobStatus(job_id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      });
    }
  }

  /**
   * Get Gmail integration for account
   */
  static async getGmailIntegration(account_id) {
    try {
      const { data: integration, error } = await supabase
        .from('account_integrations')
        .select('access_token, token_expires_at, refresh_token')
        .eq('account_id', account_id)
        .eq('integration_id', 'gmail')
        .eq('status', 'connected')
        .single();

      if (error) {
        console.error('❌ Gmail integration query error:', error);
        return null;
      }

      return integration;
    } catch (error) {
      console.error('❌ Failed to get Gmail integration:', error);
      return null;
    }
  }

  /**
   * Update job status in database
   */
  static async updateJobStatus(job_id, updates) {
    try {
      const { error } = await supabase
        .from('email_processing_jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', job_id);

      if (error) {
        console.error('❌ Failed to update job status:', error);
      }
    } catch (error) {
      console.error('❌ Exception updating job status:', error);
    }
  }

  /**
   * Build Gmail search query based on batch type
   */
  static buildGmailQuery(batch_type) {
    switch (batch_type) {
      case 'incremental':
        return 'newer_than:7d'; // Last 7 days
      case 'refresh':
        return 'newer_than:30d'; // Last 30 days
      case 'full':
      default:
        return ''; // All emails (up to limit)
    }
  }
}