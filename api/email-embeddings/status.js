/**
 * Vercel API Endpoint: Email Embedding Processing Status
 * 
 * This endpoint provides fast status polling for email embedding jobs.
 * Key design principles:
 * - Ultra-fast response (< 100ms database lookup)
 * - Real-time progress tracking
 * - Detailed job metrics and error information
 * - Optimized for frequent polling (every 10 seconds)
 * 
 * Status flow:
 * pending -> processing -> completed/failed
 * 
 * Expected costs per invocation:
 * - Vercel compute: ~$0.0000005 (microseconds of execution)
 * - Database read: Negligible
 * - Total: < $0.000001 per request
 * 
 * @route GET /api/email-embeddings/status
 * @auth Required - Supabase JWT token
 * @query {string} job_id - Processing job ID
 * @returns {object} Job status, progress, and metrics
 */

import { createClient } from '@supabase/supabase-js';
// Note: ErrorLogger removed temporarily due to import issues in Vercel

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Status message templates for user-friendly display
 */
const STATUS_MESSAGES = {
  pending: 'Preparing to analyze your emails...',
  processing: 'Analyzing emails with AI to extract insights and themes...',
  completed: 'Email analysis complete! Your emails are now searchable.',
  failed: 'Email analysis failed. Please try again or contact support.',
  archived: 'Job archived. Results may still be available in your dashboard.'
};

/**
 * Calculate progress percentage based on job status and metrics
 */
function calculateProgress(status, processed, total, failed = 0, skipped = 0) {
  switch (status) {
    case 'pending':
      return 0;
    case 'processing':
      if (total > 0) {
        const completed = processed + failed + skipped;
        return Math.min(Math.round((completed / total) * 95), 95); // Max 95% while processing
      }
      return 10; // Default progress if no total available
    case 'completed':
      return 100;
    case 'failed':
      return processed > 0 ? Math.round((processed / (processed + failed)) * 100) : 0;
    case 'archived':
      return 100;
    default:
      return 0;
  }
}

/**
 * Calculate estimated time remaining based on current progress
 */
function calculateETA(status, processed, total, started_at, avg_processing_rate = 0.8) {
  if (status !== 'processing' || total <= 0 || processed <= 0) {
    return null;
  }

  const elapsed = Date.now() - new Date(started_at).getTime();
  const rate = processed / (elapsed / 1000 / 60); // emails per minute
  const remaining = total - processed;
  
  if (rate <= 0) return null;
  
  const eta_minutes = remaining / (rate || avg_processing_rate);
  return Math.max(Math.round(eta_minutes), 1);
}

/**
 * Main request handler
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  const timer = { startTime: Date.now() }; // Simplified timer
  let userId = 'unknown';
  let jobId = 'unknown';
  
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        allowed_methods: ['GET']
      });
    }

    // Extract job_id from query parameters
    const { job_id } = req.query;
    jobId = job_id || 'missing';

    if (!job_id) {
      return res.status(400).json({
        error: 'Missing required parameter: job_id'
      });
    }

    console.log(`📊 Fetching status for job ${job_id}...`);

    // ============================================================
    // STEP 1: Authenticate user (fast token validation)
    // ============================================================
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return res.status(401).json({
        error: authResult.error
      });
    }

    const { user_id } = authResult;
    userId = user_id;

    // ============================================================
    // STEP 2: Fetch job status (single optimized query)
    // ============================================================
    const { data: job, error: jobError } = await supabase
      .from('email_processing_jobs')
      .select(`
        id,
        status,
        batch_type,
        total_emails,
        processed_emails,
        failed_emails,
        skipped_emails,
        embedding_api_calls,
        theme_analysis_calls,
        estimated_cost_cents,
        started_at,
        completed_at,
        processing_duration_seconds,
        error_message,
        retry_count,
        processing_config,
        created_at,
        updated_at
      `)
      .eq('id', job_id)
      .eq('user_id', user_id) // Ensure user owns this job
      .single();

    if (jobError || !job) {
      console.error('❌ Job not found:', jobError);
      return res.status(404).json({
        error: 'Job not found or access denied',
        job_id
      });
    }

    // ============================================================
    // STEP 3: Calculate progress metrics and ETA
    // ============================================================
    const progress_percentage = calculateProgress(
      job.status,
      job.processed_emails,
      job.total_emails,
      job.failed_emails,
      job.skipped_emails
    );

    const eta_minutes = calculateETA(
      job.status,
      job.processed_emails,
      job.total_emails,
      job.started_at
    );

    // Calculate actual cost based on API calls made
    const actual_cost_cents = Math.round(
      (job.embedding_api_calls * 0.01) + // Embeddings: ~$0.0001 per call
      (job.theme_analysis_calls * 0.2)   // Themes: ~$0.002 per call
    );

    // ============================================================
    // STEP 4: Prepare comprehensive status response
    // ============================================================
    const executionTime = Date.now() - startTime;
    
    const response = {
      success: true,
      job_id: job.id,
      
      // Core status information
      status: job.status,
      status_message: STATUS_MESSAGES[job.status] || 'Processing...',
      batch_type: job.batch_type,
      
      // Progress metrics
      progress: {
        percentage: progress_percentage,
        processed: job.processed_emails,
        failed: job.failed_emails,
        skipped: job.skipped_emails,
        total: job.total_emails,
        remaining: Math.max(0, job.total_emails - job.processed_emails - job.failed_emails - job.skipped_emails)
      },
      
      // Timing information
      timing: {
        started_at: job.started_at,
        completed_at: job.completed_at,
        processing_duration_seconds: job.processing_duration_seconds,
        eta_minutes: eta_minutes,
        last_updated: job.updated_at
      },
      
      // Cost tracking
      cost: {
        estimated_cents: job.estimated_cost_cents,
        actual_cents: actual_cost_cents,
        embedding_api_calls: job.embedding_api_calls,
        theme_analysis_calls: job.theme_analysis_calls
      },
      
      // Error handling
      error_info: job.error_message ? {
        message: job.error_message,
        retry_count: job.retry_count,
        can_retry: job.retry_count < 3 && job.status === 'failed'
      } : null,
      
      // Configuration
      processing_config: job.processing_config,
      
      // Performance metadata
      response_metadata: {
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      }
    };

    // ============================================================
    // STEP 5: Add status-specific additional information
    // ============================================================
    
    // For completed jobs, add summary statistics
    if (job.status === 'completed' && job.processed_emails > 0) {
      response.completion_summary = {
        success_rate: Math.round((job.processed_emails / job.total_emails) * 100),
        total_processed: job.processed_emails,
        emails_per_minute: job.processing_duration_seconds > 0 
          ? Math.round((job.processed_emails / job.processing_duration_seconds) * 60)
          : 0,
        next_steps: [
          'Your emails are now searchable with semantic search',
          'Family themes and patterns have been identified',
          'Visit your dashboard to explore insights'
        ]
      };
    }
    
    // For processing jobs, add detailed progress
    if (job.status === 'processing') {
      response.processing_details = {
        current_phase: job.processed_emails < job.total_emails * 0.8 
          ? 'Extracting themes and generating embeddings'
          : 'Finalizing analysis and building search index',
        batch_size: job.processing_config?.batch_size || 10,
        estimated_completion: eta_minutes 
          ? new Date(Date.now() + eta_minutes * 60 * 1000).toISOString()
          : null
      };
    }
    
    // For failed jobs, add troubleshooting info
    if (job.status === 'failed') {
      response.troubleshooting = {
        common_solutions: [
          'Check your Gmail connection in Settings',
          'Ensure you have sufficient plan quota',
          'Try reducing the number of emails to process'
        ],
        support_info: {
          job_id: job.id,
          error_code: job.error_message ? 'PROCESSING_FAILED' : 'UNKNOWN_ERROR',
          timestamp: job.updated_at
        }
      };
    }

    console.log(`✅ Status fetched for job ${job_id} in ${executionTime}ms (${job.status}, ${progress_percentage}%)`);

    // Log successful API call
    console.log('API call successful:', {
      endpoint: 'email-embeddings/status',
      job_id,
      status: job.status,
      progress_percentage,
      processed_emails: job.processed_emails,
      total_emails: job.total_emails,
      execution_time: executionTime
    });

    // Timer removed - using simple console logging

    return res.status(200).json(response);

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Unexpected error in status endpoint:', error);

    // Log the error with full context
    console.error('Email embedding status endpoint failed:', error, {
      user_id: userId,
      job_id: jobId,
      function_name: 'get_embedding_status',
      execution_time_ms: executionTime,
      request_data: { job_id: req.query.job_id }
    });

    console.error('API call failed:', {
      endpoint: 'email-embeddings/status',
      error_message: error.message,
      job_id: jobId,
      execution_time: executionTime
    });

    // Timer removed - using simple console logging

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      job_id: req.query.job_id,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Fast authentication helper
 * Reused from start.js with minimal validation for speed
 */
async function authenticateRequest(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid Authorization header'
      };
    }

    const token = authHeader.slice(7);

    // Fast token validation - don't fetch additional user data for status checks
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    return {
      success: true,
      user_id: user.id,
      user_email: user.email
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}