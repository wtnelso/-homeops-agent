/**
 * Vercel API Endpoint: Start Email Embedding Processing
 * 
 * This endpoint provides a fast, user-facing API to initiate email embedding processing.
 * Key design principles:
 * - Responds in < 1 second (just creates job and triggers background processing)
 * - Non-blocking: User doesn't wait for AI processing
 * - Scalable: Can handle multiple concurrent users
 * - Cost-efficient: Minimal compute time on Vercel
 * 
 * Processing flow:
 * 1. Validate user authentication and permissions
 * 2. Create processing job record in database
 * 3. Trigger Supabase Edge Function for heavy processing
 * 4. Return job ID immediately to user
 * 
 * Expected costs per invocation:
 * - Vercel compute: ~$0.000001 (microseconds of execution)
 * - Database write: Negligible
 * - Total: < $0.00001 per request
 * 
 * @route POST /api/email-embeddings/start
 * @auth Required - Supabase JWT token
 * @body {string} account_id - User's account ID
 * @body {string} batch_type - 'full' | 'incremental' | 'refresh'
 * @body {number} email_limit - Max emails to process (optional)
 * @body {object} processing_options - Custom processing settings (optional)
 * @returns {object} Job ID and initial status
 */

import { createClient } from '@supabase/supabase-js';
// Note: ErrorLogger removed temporarily due to import issues in Vercel

// Initialize Supabase client with service role for backend operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration constants
const PROCESSING_CONFIG = {
  MAX_EMAILS_FREE: 100,      // Free tier limit
  MAX_EMAILS_PRO: 1000,      // Pro tier limit  
  MAX_EMAILS_ENTERPRISE: 5000, // Enterprise limit
  DEFAULT_BATCH_SIZE: 10,    // Emails processed per batch
  ESTIMATED_COST_PER_EMAIL: 0.21 // Cents per email (AI processing)
};

/**
 * Main request handler
 * Fast execution: Creates job record and triggers background processing
 */
export default async function handler(req, res) {
  const startTime = Date.now();
  const timer = { startTime: Date.now() }; // Simplified timer
  let userId = 'unknown';
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed',
        allowed_methods: ['POST']
      });
    }

    console.log('🚀 Starting email embedding processing request...');

    // Extract and validate request data
    const {
      account_id,
      batch_type = 'full',
      email_limit,
      processing_options = {}
    } = req.body;

    // Validate required fields
    if (!account_id) {
      return res.status(400).json({
        error: 'Missing required field: account_id'
      });
    }

    // Validate batch type
    if (!['full', 'incremental', 'refresh'].includes(batch_type)) {
      return res.status(400).json({
        error: 'Invalid batch_type. Must be: full, incremental, or refresh'
      });
    }

    // ============================================================
    // STEP 1: Authenticate and authorize user
    // ============================================================
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return res.status(401).json({
        error: authResult.error
      });
    }

    const { user_id, user_plan, user_account_id } = authResult;
    userId = user_id;
    console.log(`✅ Authenticated user ${user_id} with ${user_plan} plan`);
    
    console.log(`User ${user_id} initiated ${batch_type} email embedding job`, {
      user_id,
      operation: 'start_embedding_processing', 
      request_data: { batch_type, email_limit, account_id }
    });

    // ============================================================
    // STEP 2: Validate user permissions and limits
    // ============================================================
    const permissionCheck = await validateUserPermissions(
      user_id, 
      account_id, 
      user_account_id,
      user_plan,
      email_limit
    );

    if (!permissionCheck.success) {
      return res.status(403).json({
        error: permissionCheck.error,
        current_usage: permissionCheck.current_usage,
        plan_limit: permissionCheck.plan_limit
      });
    }

    const { allowed_email_limit, estimated_cost_cents } = permissionCheck;
    console.log(`✅ User authorized for ${allowed_email_limit} emails (est. cost: $${estimated_cost_cents/100})`);

    // ============================================================
    // STEP 3: Check for existing active jobs
    // ============================================================
    const existingJobCheck = await checkExistingJobs(user_id, account_id);
    if (existingJobCheck.has_active_job) {
      return res.status(409).json({
        error: 'Processing job already active for this account',
        active_job_id: existingJobCheck.job_id,
        status: existingJobCheck.status,
        started_at: existingJobCheck.started_at
      });
    }

    // ============================================================
    // STEP 4: Create processing job record (FAST DATABASE WRITE)
    // ============================================================
    const jobResult = await createProcessingJob(
      user_id,
      account_id,
      batch_type,
      allowed_email_limit,
      estimated_cost_cents,
      processing_options
    );

    if (!jobResult.success) {
      console.error('❌ Failed to create processing job:', jobResult.error);
      return res.status(500).json({
        error: 'Failed to create processing job',
        details: jobResult.error
      });
    }

    const { job_id } = jobResult;
    console.log(`✅ Created processing job ${job_id}`);

    // ============================================================
    // STEP 5: Trigger background processing (NON-BLOCKING)
    // ============================================================
    // Fire-and-forget call to Supabase Edge Function
    // This doesn't block the response to the user
    triggerBackgroundProcessing(job_id, user_id, account_id, batch_type, processing_options)
      .catch(error => {
        console.error('❌ Failed to trigger background processing:', error);
        // Update job status to failed
        updateJobStatus(job_id, { 
          status: 'failed', 
          error_message: 'Failed to start background processing'
        });
      });

    // ============================================================
    // STEP 6: Return immediate response to user (< 1 second total)
    // ============================================================
    const executionTime = Date.now() - startTime;
    console.log(`✅ Job ${job_id} initiated in ${executionTime}ms`);

    // Log successful API call
    console.log('API call successful:', {
      endpoint: 'email-embeddings/start',
      job_id,
      estimated_emails: allowed_email_limit,
      estimated_cost_cents,
      execution_time: executionTime
    });

    await timer.finish(true, {
      job_id,
      estimated_emails: allowed_email_limit,
      batch_type
    });

    return res.status(200).json({
      success: true,
      job_id,
      status: 'processing',
      batch_type,
      estimated_emails: allowed_email_limit,
      estimated_cost_cents,
      estimated_duration_minutes: Math.ceil(allowed_email_limit / 50), // ~50 emails/minute
      started_at: new Date().toISOString(),
      execution_time_ms: executionTime,
      
      // User instructions
      next_steps: {
        poll_status: `/api/email-embeddings/status?job_id=${job_id}`,
        cancel_job: `/api/email-embeddings/cancel?job_id=${job_id}`,
        polling_interval_seconds: 10
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Unexpected error in start endpoint:', error);

    // Log the error with full context
    console.error('Email embedding start endpoint failed:', error, {
      user_id: userId,
      function_name: 'start_embedding_processing',
      execution_time_ms: executionTime,
      request_data: req.body
    });

    console.error('API call failed:', {
      endpoint: 'email-embeddings/start',
      error_message: error.message,
      execution_time: executionTime
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Authenticates the request and extracts user information
 * Validates Supabase JWT token and retrieves user plan
 */
async function authenticateRequest(req) {
  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid Authorization header'
      };
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return {
        success: false,
        error: 'Invalid or expired token'
      };
    }

    // Get user plan and account information from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('plan, monthly_api_calls, monthly_limit, account_id')
      .eq('auth_id', user.id)
      .single();

    if (userError) {
      console.warn('⚠️  Could not fetch user plan, defaulting to free. Error:', userError);
      console.log('User auth ID:', user.id);
    } else {
      console.log('✅ Found user data:', userData);
    }

    return {
      success: true,
      user_id: user.id,
      user_email: user.email,
      user_plan: userData?.plan || 'free',
      user_account_id: userData?.account_id,
      monthly_api_calls: userData?.monthly_api_calls || 0,
      monthly_limit: userData?.monthly_limit || 100
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Validates user permissions and calculates processing limits
 * Checks plan limits and current usage
 */
async function validateUserPermissions(user_id, account_id, user_account_id, user_plan, requested_email_limit) {
  try {
    // Determine plan limits
    const planLimits = {
      free: PROCESSING_CONFIG.MAX_EMAILS_FREE,
      pro: PROCESSING_CONFIG.MAX_EMAILS_PRO,
      enterprise: PROCESSING_CONFIG.MAX_EMAILS_ENTERPRISE
    };

    const plan_limit = planLimits[user_plan] || planLimits.free;

    // Check if user has access to this account (simple comparison - no database query needed)
    console.log('🔍 Account validation:', { user_account_id, requested_account_id: account_id });
    
    if (user_account_id !== account_id) {
      console.log('❌ Account mismatch:', { user_account_id, requested_account_id: account_id });
      return {
        success: false,
        error: 'Access denied: Account not found or not owned by user'
      };
    }
    
    console.log('✅ Account validation passed');

    // Calculate allowed email limit
    const allowed_email_limit = requested_email_limit 
      ? Math.min(requested_email_limit, plan_limit)
      : plan_limit;

    // Calculate estimated cost
    const estimated_cost_cents = Math.ceil(allowed_email_limit * PROCESSING_CONFIG.ESTIMATED_COST_PER_EMAIL);

    // Check monthly usage limits (if applicable)
    const { data: monthlyUsage } = await supabase
      .from('email_processing_jobs')
      .select('processed_emails')
      .eq('user_id', user_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    const current_monthly_processed = monthlyUsage?.reduce((sum, job) => sum + (job.processed_emails || 0), 0) || 0;
    const monthly_limit = user_plan === 'free' ? 500 : 10000; // Generous monthly limits

    if (current_monthly_processed + allowed_email_limit > monthly_limit) {
      return {
        success: false,
        error: 'Monthly processing limit would be exceeded',
        current_usage: current_monthly_processed,
        plan_limit: monthly_limit,
        requested: allowed_email_limit
      };
    }

    return {
      success: true,
      allowed_email_limit,
      estimated_cost_cents,
      current_usage: current_monthly_processed,
      plan_limit: monthly_limit
    };

  } catch (error) {
    console.error('Permission validation error:', error);
    return {
      success: false,
      error: 'Failed to validate permissions'
    };
  }
}

/**
 * Checks for existing active processing jobs
 * Prevents concurrent processing for the same account
 */
async function checkExistingJobs(user_id, account_id) {
  try {
    const { data: activeJobs, error } = await supabase
      .from('email_processing_jobs')
      .select('id, status, started_at')
      .eq('user_id', user_id)
      .eq('account_id', account_id)
      .in('status', ['pending', 'processing'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.warn('⚠️  Could not check existing jobs:', error);
      return { has_active_job: false };
    }

    if (activeJobs && activeJobs.length > 0) {
      const activeJob = activeJobs[0];
      return {
        has_active_job: true,
        job_id: activeJob.id,
        status: activeJob.status,
        started_at: activeJob.started_at
      };
    }

    return { has_active_job: false };

  } catch (error) {
    console.warn('⚠️  Error checking existing jobs:', error);
    return { has_active_job: false };
  }
}

/**
 * Creates a new processing job record in the database
 * Fast database write that enables progress tracking
 */
async function createProcessingJob(
  user_id,
  account_id, 
  batch_type,
  total_emails,
  estimated_cost_cents,
  processing_options
) {
  try {
    const jobData = {
      user_id,
      account_id,
      status: 'pending',
      batch_type,
      total_emails,
      processed_emails: 0,
      failed_emails: 0,
      skipped_emails: 0,
      embedding_api_calls: 0,
      theme_analysis_calls: 0,
      estimated_cost_cents,
      retry_count: 0,
      processing_config: {
        batch_size: PROCESSING_CONFIG.DEFAULT_BATCH_SIZE,
        embedding_model: 'text-embedding-3-small',
        theme_analysis_model: 'gpt-4o-mini',
        max_content_length: 8000,
        min_priority_score: 0.2,
        ...processing_options
      }
    };

    const { data, error } = await supabase
      .from('email_processing_jobs')
      .insert([jobData])
      .select('id')
      .single();

    if (error) {
      console.error('Database error creating job:', error);
      return {
        success: false,
        error: `Database error: ${error.message}`
      };
    }

    return {
      success: true,
      job_id: data.id
    };

  } catch (error) {
    console.error('Exception creating job:', error);
    return {
      success: false,
      error: 'Failed to create processing job'
    };
  }
}

/**
 * Triggers background processing via Supabase Edge Function
 * Non-blocking call that initiates heavy AI processing
 */
async function triggerBackgroundProcessing(job_id, user_id, account_id, batch_type, processing_options) {
  try {
    console.log(`🔄 Triggering background processing for job ${job_id}...`);

    // Call Supabase Edge Function asynchronously
    // This function will handle the heavy AI processing
    const { data, error } = await supabase.functions.invoke('process-email-embeddings', {
      body: {
        job_id,
        user_id,
        account_id,
        batch_type,
        processing_options
      }
    });

    if (error) {
      console.error('❌ Failed to invoke edge function:', error);
      throw new Error(`Edge function error: ${error.message}`);
    }

    console.log(`✅ Background processing triggered for job ${job_id}`);
    return { success: true, data };

  } catch (error) {
    console.error(`❌ Exception triggering background processing:`, error);
    throw error;
  }
}

/**
 * Updates job status in database
 * Used for error handling when background processing fails to start
 */
async function updateJobStatus(job_id, updates) {
  try {
    const { error } = await supabase
      .from('email_processing_jobs')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', job_id);

    if (error) {
      console.error('Failed to update job status:', error);
    }
  } catch (error) {
    console.error('Exception updating job status:', error);
  }
}