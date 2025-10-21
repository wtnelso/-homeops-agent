/**
 * Email Embeddings Routes
 *
 * Handles email processing requests and status polling.
 * Processes emails with LangChain, OpenAI, and stores results in database.
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { queueEmailProcessing } from '../services/emailQueue.js';
import { validateJWT } from '../middleware/authMiddleware.js';
import { PlanConfig } from '../config/planConfig.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

// Start email processing
router.post('/start', validateJWT, async (req, res) => {
  const startTime = Date.now();

  try {
    const { batch_type = 'full', email_limit, processing_options = {} } = req.body;
    const { user } = req.auth;

    if (!['full', 'incremental', 'refresh'].includes(batch_type)) {
      return res.status(400).json({ error: 'Invalid batch_type. Must be: full, incremental, or refresh' });
    }

    // Get user plan
    const { data: userData } = await supabase
      .from('users')
      .select('plan')
      .eq('auth_id', user.id)
      .single();

    const user_plan = userData?.plan || 'free';

    // Calculate allowed email limit using plan config
    const allowed_email_limit = PlanConfig.getAllowedEmailLimit(user_plan, email_limit);
    const estimated_cost_cents = PlanConfig.calculateEstimatedCost(allowed_email_limit);

    // Check for existing active jobs
    const { data: activeJobs } = await supabase
      .from('email_processing_jobs')
      .select('id, status, started_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'processing'])
      .limit(1);

    if (activeJobs && activeJobs.length > 0) {
      const activeJob = activeJobs[0];
      return res.status(409).json({
        error: 'Processing job already active for this user',
        active_job_id: activeJob.id,
        status: activeJob.status,
        started_at: activeJob.started_at
      });
    }

    // Create processing job record
    const jobData = {
      user_id: user.id,
      status: 'pending',
      batch_type,
      total_emails: allowed_email_limit,
      processed_emails: 0,
      failed_emails: 0,
      skipped_emails: 0,
      embedding_api_calls: 0,
      theme_analysis_calls: 0,
      estimated_cost_cents,
      retry_count: 0,
      processing_config: {
        ...PlanConfig.processing.defaultProcessingOptions,
        batch_size: PlanConfig.processing.defaultBatchSize,
        ...processing_options
      }
    };

    const { data: jobRecord, error: jobError } = await supabase
      .from('email_processing_jobs')
      .insert([jobData])
      .select('id')
      .single();

    if (jobError) {
      console.error('❌ Database error creating job:', jobError);
      return res.status(500).json({ error: 'Failed to create processing job', details: jobError.message });
    }

    const job_id = jobRecord.id;
    console.log(`🔄 Created and starting email processing for job ${job_id}`);

    // Queue background processing (non-blocking)
    try {
      const queueJobId = await queueEmailProcessing({
        job_id,
        user_id: user.id,
        batch_type,
        processing_options
      });
      console.log(`📦 Email processing queued with job ID: ${queueJobId}`);
    } catch (error) {
      console.error(`❌ Failed to queue processing for job ${job_id}:`, error);
      supabase.from('email_processing_jobs').update({
        status: 'failed',
        error_message: 'Failed to queue background processing',
        updated_at: new Date().toISOString()
      }).eq('id', job_id);
    }

    const executionTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      job_id,
      status: 'processing',
      batch_type,
      estimated_emails: allowed_email_limit,
      estimated_cost_cents,
      estimated_duration_minutes: Math.ceil(allowed_email_limit / 50),
      started_at: new Date().toISOString(),
      execution_time_ms: executionTime,
      next_steps: {
        poll_status: `/api/embeddings/status/${job_id}`,
        polling_interval_seconds: 10
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Email processing start error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });
  }
});

// Get processing status
router.get('/status/:job_id', validateJWT, async (req, res) => {
  const startTime = Date.now();

  try {
    const { job_id } = req.params;
    const { user } = req.auth;

    if (!job_id) {
      return res.status(400).json({ error: 'Missing required parameter: job_id' });
    }

    // Fetch job status
    const { data: job, error: jobError } = await supabase
      .from('email_processing_jobs')
      .select(`
        id, status, batch_type, total_emails, processed_emails, failed_emails, skipped_emails,
        embedding_api_calls, theme_analysis_calls, estimated_cost_cents, started_at, completed_at,
        processing_duration_seconds, error_message, retry_count, processing_config, created_at, updated_at
      `)
      .eq('id', job_id)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      console.error('❌ Job not found:', jobError);
      return res.status(404).json({ error: 'Job not found or access denied', job_id });
    }

    // Calculate progress
    const calculateProgress = (status, processed, total, failed, skipped) => {
      switch (status) {
        case 'pending': return 0;
        case 'processing':
          if (total > 0) {
            const completed = processed + failed + skipped;
            return Math.min(Math.round((completed / total) * 95), 95);
          }
          return 10;
        case 'completed': return 100;
        case 'failed': return processed > 0 ? Math.round((processed / (processed + failed)) * 100) : 0;
        case 'archived': return 100;
        default: return 0;
      }
    };

    // Calculate ETA
    const calculateETA = (status, processed, total, started_at) => {
      if (status !== 'processing' || total <= 0 || processed <= 0) return null;
      const elapsed = Date.now() - new Date(started_at).getTime();
      const rate = processed / (elapsed / 1000 / 60); // emails per minute
      const remaining = total - processed;
      if (rate <= 0) return null;
      const eta_minutes = remaining / (rate || 0.8);
      return Math.max(Math.round(eta_minutes), 1);
    };

    const progress_percentage = calculateProgress(
      job.status, job.processed_emails, job.total_emails, job.failed_emails, job.skipped_emails
    );

    const eta_minutes = calculateETA(job.status, job.processed_emails, job.total_emails, job.started_at);

    const actual_cost_cents = Math.round(
      (job.embedding_api_calls * 0.01) + (job.theme_analysis_calls * 0.2)
    );

    const executionTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      job_id: job.id,
      status: job.status,
      batch_type: job.batch_type,
      progress: {
        percentage: progress_percentage,
        processed_emails: job.processed_emails,
        total_emails: job.total_emails,
        failed_emails: job.failed_emails,
        skipped_emails: job.skipped_emails,
        estimated_time_remaining_minutes: eta_minutes
      },
      costs: {
        estimated_cost_cents: job.estimated_cost_cents,
        actual_cost_cents: actual_cost_cents || 0,
        embedding_api_calls: job.embedding_api_calls,
        theme_analysis_calls: job.theme_analysis_calls
      },
      timing: {
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        processing_duration_seconds: job.processing_duration_seconds
      },
      error_message: job.error_message,
      retry_count: job.retry_count,
      execution_time_ms: executionTime
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Status check error:', error);
    return res.status(500).json({
      error: 'Failed to get status',
      message: error.message,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;