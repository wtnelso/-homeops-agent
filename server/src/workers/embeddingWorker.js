/**
 * Email Embedding Worker
 * 
 * Handles the actual long-running email processing with LangChain and OpenAI.
 * This replaces the Supabase Edge Function for heavy AI processing.
 */

import { createClient } from '@supabase/supabase-js';
import { EmailEmbeddingProcessor } from '../services/emailProcessor.js';
import { GmailService } from '../services/gmailService.js';
import { CostCalculator } from '../services/costCalculator.js';
import { EmailConfig } from '../config/emailConfig.js';
import { globalScalableQueue } from '../services/scalableJobQueue.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class EmbeddingWorker {
  /**
   * Process email embeddings job
   * Main entry point for background processing
   */
  static async processEmailJob(jobData) {
    const { job_id, user_id, batch_type, processing_options } = jobData;

    try {
      console.log(`🚀 Processing job ${job_id} for user ${user_id}`);

      // Step 1: Update job status to processing
      await this.updateJobStatus(job_id, {
        status: 'processing',
        started_at: new Date().toISOString()
      });

      // Step 2: Get Gmail integration and access token
      const gmailIntegration = await this.getGmailIntegration(user_id);
      if (!gmailIntegration) {
        throw new Error('Gmail integration not found or inactive');
      }

      // Step 3: Initialize services
      const gmailService = new GmailService({
        ...gmailIntegration,
        user_id // Add user_id to integration for refresh functionality
      });
      const processor = new EmailEmbeddingProcessor({
        job_id,
        user_id,
        batch_type,
        ...processing_options
      });

      // Step 4: Fetch emails from Gmail
      console.log(`📧 Fetching emails for ${batch_type} processing...`);
      const emailLimit = processing_options.email_limit || EmailConfig.batchProcessing.defaultEmailLimit;
      // Ensure we don't exceed the max batch size
      const actualEmailLimit = Math.min(emailLimit, EmailConfig.batchProcessing.maxEmailsPerBatch);

      const emails = await gmailService.fetchEmails({
        maxResults: actualEmailLimit,
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

          // Add processing delay to prevent API overwhelm (configurable)
          const emailDelay = EmailConfig.batchProcessing.delayBetweenEmails || 100;
          if (emailDelay > 0 && processed < emails.length) {
            await new Promise(resolve => setTimeout(resolve, emailDelay));
          }

          // Update progress at configured interval
          if (processed % EmailConfig.batchProcessing.progressUpdateInterval === 0) {
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

      // Step 7: Get API call counts from processor
      const apiCounts = processor.getApiCallCounts();
      console.log(`📊 Final API call counts:`, apiCounts);
      
      // Step 8: Calculate actual cost based on API usage and token data
      const actualCost = CostCalculator.calculateActualCost({
        embedding_api_calls: apiCounts.embedding_api_calls || 0,
        theme_analysis_calls: apiCounts.theme_analysis_calls || 0,
        email_analysis_calls: processed, // Each processed email = 1 analysis call
        gpt_input_tokens: apiCounts.gpt_input_tokens || 0,
        gpt_output_tokens: apiCounts.gpt_output_tokens || 0,
        embedding_tokens: apiCounts.embedding_tokens || 0
      });
      console.log(`💰 Calculated actual cost:`, actualCost);
      
      // Step 9: Complete the job
      const jobUpdate = {
        status: 'completed',
        processed_emails: processed,
        failed_emails: failed,
        embedding_api_calls: apiCounts.embedding_api_calls,
        theme_analysis_calls: apiCounts.theme_analysis_calls,
        actual_cost_cents: actualCost.actual_cost_cents || 0,
        token_usage: {
          gpt_input_tokens: apiCounts.gpt_input_tokens || 0,
          gpt_output_tokens: apiCounts.gpt_output_tokens || 0,
          embedding_tokens: apiCounts.embedding_tokens || 0,
          total_tokens: (apiCounts.gpt_input_tokens || 0) + (apiCounts.gpt_output_tokens || 0) + (apiCounts.embedding_tokens || 0)
        },
        completed_at: new Date().toISOString(),
        processing_duration_seconds: Math.floor((Date.now() - new Date(jobData.started_at || Date.now()).getTime()) / 1000)
      };
      console.log(`📝 Job update data:`, jobUpdate);
      
      await this.updateJobStatus(job_id, jobUpdate);

      // Step 10: Generate user theme insights after batch completion
      if (processed > 0) {
        await this.generateUserThemeInsights(user_id, job_id, processed);
      }

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
   * Get Gmail integration for user
   */
  static async getGmailIntegration(user_id) {
    try {
      const { data: integration, error } = await supabase
        .from('account_integrations')
        .select('access_token, token_expires_at, refresh_token')
        .eq('user_id', user_id)
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
   * Generate user theme insights after batch completion
   */
  static async generateUserThemeInsights(user_id, job_id, processed_count) {
    try {
      console.log(`📊 Generating theme insights for user ${user_id}...`);

      // Get current theme summary for this user
      const { data: themeSummary, error } = await supabase
        .from('account_theme_summary')
        .select('*')
        .eq('user_id', user_id)
        .order('total_emails', { ascending: false });

      if (error) {
        console.error('❌ Failed to fetch theme summary:', error);
        return;
      }

      if (!themeSummary || themeSummary.length === 0) {
        console.log('📊 No themes found for this user yet');
        return;
      }

      // Calculate insights
      const totalThemeEmails = themeSummary.reduce((sum, theme) => sum + theme.total_emails, 0);
      const topThemes = themeSummary.slice(0, 3);
      const highRelevanceThemes = themeSummary.filter(theme => theme.high_relevance_count > 0);
      const recentlyActiveThemes = themeSummary.filter(theme => theme.recent_7d_count > 0);

      // Generate insight summary
      const insights = {
        user_id,
        batch_job_id: job_id,
        total_theme_emails: totalThemeEmails,
        emails_processed_this_batch: processed_count,
        unique_themes: themeSummary.length,
        top_themes: topThemes.map(theme => ({
          name: theme.theme_name,
          count: theme.total_emails,
          percentage: Math.round((theme.total_emails / totalThemeEmails) * 100),
          avg_relevance: theme.average_relevance_score,
          recent_activity: theme.recent_7d_count
        })),
        high_priority_themes: highRelevanceThemes.length,
        recently_active_themes: recentlyActiveThemes.length,
        generated_at: new Date().toISOString()
      };

      // Log insights for this batch
      console.log(`📈 User Theme Insights (Job ${job_id}):`);
      console.log(`   📧 Total theme emails: ${insights.total_theme_emails}`);
      console.log(`   🎯 Unique themes: ${insights.unique_themes}`);
      console.log(`   🔥 High priority themes: ${insights.high_priority_themes}`);
      console.log(`   ⏰ Recently active: ${insights.recently_active_themes}`);
      console.log(`   🏆 Top 3 themes:`);

      insights.top_themes.forEach((theme, index) => {
        console.log(`      ${index + 1}. ${theme.name}: ${theme.count} emails (${theme.percentage}%) - relevance: ${theme.avg_relevance}`);
      });

      // Store insights summary in job record for future reference
      await this.updateJobStatus(job_id, {
        theme_insights: insights
      });

      console.log(`✅ Theme insights generated successfully`);

    } catch (error) {
      console.error('❌ Failed to generate theme insights:', error);
      // Don't throw - insights failure shouldn't break job completion
    }
  }

  /**
   * Build Gmail search query based on batch type
   * Uses queries from EmailConfig for easy modification
   */
  static buildGmailQuery(batch_type) {
    return EmailConfig.batchProcessing.queries[batch_type]
      || EmailConfig.batchProcessing.queries.full;
  }
}