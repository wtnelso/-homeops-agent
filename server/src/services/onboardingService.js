/**
 * User Onboarding Email Analysis Service
 *
 * Handles the initial 1000 email processing when a user first connects their Gmail.
 * Creates the initial theme profile and family email insights.
 */

import { createClient } from '@supabase/supabase-js';
import { EmailConfig } from '../config/emailConfig.js';
import { RedisQueueService } from './redisQueueService.js';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class OnboardingService {
  /**
   * Start onboarding email analysis for a new user
   */
  static async startOnboardingAnalysis(account_id, user_id) {
    try {
      console.log(`🚀 Starting onboarding email analysis for account ${account_id}`);

      // Check if user already has onboarding in progress or completed
      const existingJob = await this.checkExistingOnboarding(account_id);
      if (existingJob) {
        console.log(`⚠️  Onboarding already ${existingJob.status} for account ${account_id}`);
        return existingJob;
      }

      // Verify Gmail integration is active
      const gmailIntegration = await this.verifyGmailIntegration(account_id);
      if (!gmailIntegration) {
        throw new Error('Gmail integration not found or inactive');
      }

      // Create onboarding job record
      const job_id = uuidv4();
      const jobConfig = EmailConfig.batchProcessing.jobConfigs.onboarding;

      const jobData = {
        id: job_id,
        account_id: account_id,
        user_id: user_id,
        job_type: 'onboarding',
        batch_type: 'onboarding',
        status: 'queued',
        email_limit: jobConfig.maxEmails,
        priority: jobConfig.priority,
        processing_options: {
          email_limit: jobConfig.maxEmails,
          chunk_size: jobConfig.chunkSize,
          description: jobConfig.description
        },
        estimated_cost_cents: Math.round(jobConfig.maxEmails * 0.025), // $0.00025 per email
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store job in database
      const { data: job, error: jobError } = await supabase
        .from('email_processing_jobs')
        .insert(jobData)
        .select()
        .single();

      if (jobError) {
        console.error('❌ Failed to create onboarding job:', jobError);
        throw jobError;
      }

      console.log(`✅ Created onboarding job ${job_id} for account ${account_id}`);

      // Add to Redis queue (with fallback to in-memory)
      const queueResult = await RedisQueueService.addOnboardingJob({
        ...jobData,
        email_count: jobConfig.maxEmails
      });

      // Update user's account to show onboarding in progress
      await this.updateAccountOnboardingStatus(account_id, 'processing', job_id);

      console.log(`🎯 Onboarding job queued: ${JSON.stringify(queueResult, null, 2)}`);

      return {
        job_id,
        status: 'queued',
        queue_info: queueResult,
        estimated_cost: `$${(jobData.estimated_cost_cents / 100).toFixed(3)}`,
        estimated_emails: jobConfig.maxEmails,
        estimated_time_minutes: Math.round(queueResult.estimatedProcessingTime / 60000)
      };

    } catch (error) {
      console.error('❌ Failed to start onboarding analysis:', error);
      throw error;
    }
  }

  /**
   * Check if user already has onboarding completed or in progress
   */
  static async checkExistingOnboarding(account_id) {
    try {
      const { data: existingJobs, error } = await supabase
        .from('email_processing_jobs')
        .select('*')
        .eq('account_id', account_id)
        .eq('job_type', 'onboarding')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (existingJobs && existingJobs.length > 0) {
        const job = existingJobs[0];
        return {
          job_id: job.id,
          status: job.status,
          created_at: job.created_at,
          completed_at: job.completed_at,
          processed_emails: job.processed_emails
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to check existing onboarding:', error);
      return null;
    }
  }

  /**
   * Get onboarding progress for a user
   */
  static async getOnboardingProgress(account_id) {
    try {
      const { data: job, error } = await supabase
        .from('email_processing_jobs')
        .select('*')
        .eq('account_id', account_id)
        .eq('job_type', 'onboarding')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { status: 'not_started' };
        }
        throw error;
      }

      const progress = {
        job_id: job.id,
        status: job.status,
        processed_emails: job.processed_emails || 0,
        total_emails: job.total_emails || job.email_limit,
        progress_percentage: job.total_emails > 0
          ? Math.round((job.processed_emails / job.total_emails) * 100)
          : 0,
        started_at: job.started_at,
        estimated_completion: null,
        theme_insights: job.theme_insights
      };

      // Calculate estimated completion if processing
      if (job.status === 'processing' && job.started_at) {
        const elapsedMs = Date.now() - new Date(job.started_at).getTime();
        const emailsPerMs = job.processed_emails / Math.max(elapsedMs, 1);
        const remainingEmails = (job.total_emails || job.email_limit) - job.processed_emails;
        const estimatedRemainingMs = remainingEmails / Math.max(emailsPerMs, 0.001);

        progress.estimated_completion = new Date(Date.now() + estimatedRemainingMs).toISOString();
      }

      return progress;

    } catch (error) {
      console.error('❌ Failed to get onboarding progress:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Complete onboarding and update account status
   */
  static async completeOnboarding(account_id, job_id) {
    try {
      console.log(`🎉 Completing onboarding for account ${account_id}, job ${job_id}`);

      // Get theme summary for this account
      const { data: themeSummary, error: themeError } = await supabase
        .from('account_theme_summary')
        .select('*')
        .eq('account_id', account_id)
        .order('total_emails', { ascending: false });

      if (themeError) {
        console.error('❌ Failed to get theme summary:', themeError);
      }

      // Update account onboarding status
      await this.updateAccountOnboardingStatus(account_id, 'completed', job_id);

      // Generate onboarding insights
      const insights = this.generateOnboardingInsights(themeSummary);

      console.log(`✅ Onboarding completed for account ${account_id}`);
      console.log(`📊 Insights: ${JSON.stringify(insights, null, 2)}`);

      return {
        status: 'completed',
        theme_count: themeSummary?.length || 0,
        top_themes: themeSummary?.slice(0, 3).map(t => t.theme_name) || [],
        insights: insights
      };

    } catch (error) {
      console.error('❌ Failed to complete onboarding:', error);
      throw error;
    }
  }

  /**
   * Verify Gmail integration is active
   */
  static async verifyGmailIntegration(account_id) {
    try {
      const { data: integration, error } = await supabase
        .from('account_integrations')
        .select('access_token, token_expires_at, status')
        .eq('account_id', account_id)
        .eq('integration_id', 'gmail')
        .eq('status', 'connected')
        .single();

      if (error || !integration) {
        console.error('❌ Gmail integration not found:', error);
        return null;
      }

      return integration;
    } catch (error) {
      console.error('❌ Failed to verify Gmail integration:', error);
      return null;
    }
  }

  /**
   * Update account onboarding status
   */
  static async updateAccountOnboardingStatus(account_id, status, job_id) {
    try {
      // You might want to add onboarding status fields to the accounts table
      // For now, we'll track this through the job status

      console.log(`📝 Updated account ${account_id} onboarding status: ${status}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to update account onboarding status:', error);
      return false;
    }
  }

  /**
   * Generate onboarding insights from theme data
   */
  static generateOnboardingInsights(themeSummary) {
    if (!themeSummary || themeSummary.length === 0) {
      return ['Your email analysis is complete! We\'ll build your theme profile as more emails are processed.'];
    }

    const insights = [];
    const totalEmails = themeSummary.reduce((sum, theme) => sum + theme.total_emails, 0);

    // Top theme insight
    const topTheme = themeSummary[0];
    const topPercentage = Math.round((topTheme.total_emails / totalEmails) * 100);
    insights.push(`${topTheme.theme_name} emails are your primary focus (${topPercentage}% of your inbox)`);

    // Diversity insight
    if (themeSummary.length >= 4) {
      insights.push(`Your emails span ${themeSummary.length} different life categories - you lead a well-rounded digital life!`);
    }

    // High-priority insight
    const highPriorityThemes = themeSummary.filter(t => t.high_relevance_count > 0);
    if (highPriorityThemes.length > 0) {
      insights.push(`${highPriorityThemes.length} themes generate high-priority family emails that need your attention`);
    }

    return insights.slice(0, 3); // Limit to top 3 insights
  }
}

export default OnboardingService;