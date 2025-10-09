/**
 * Email Embeddings Routes
 * 
 * Handles long-running email processing requests from Vercel API endpoints.
 * Processes emails with LangChain, OpenAI, and stores results in database.
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { EmbeddingWorker } from '../workers/embeddingWorker.js';
import { validateJWT } from '../middleware/authMiddleware.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

// Process email embeddings (main endpoint called from Vercel)
router.post('/process', validateJWT, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { account_id, batch_type, processing_options } = req.body;

    // Validate required parameters
    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: account_id',
        timestamp: new Date().toISOString()
      });
    }

    // Create job record in database first
    const jobData = {
      account_id,
      status: 'pending',
      batch_type: batch_type || 'full',
      total_emails: 0,
      processed_emails: 0,
      failed_emails: 0,
      skipped_emails: 0,
      embedding_api_calls: 0,
      theme_analysis_calls: 0,
      actual_cost_cents: 0,
      retry_count: 0,
      processing_config: {
        batch_size: 10,
        embedding_model: 'text-embedding-3-small',
        theme_analysis_model: 'gpt-4o-mini',
        max_content_length: 8000,
        min_priority_score: 0.2,
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
      return res.status(500).json({
        success: false,
        error: `Database error: ${jobError.message}`,
        timestamp: new Date().toISOString()
      });
    }

    const job_id = jobRecord.id;
    console.log(`🔄 Created and starting email processing for job ${job_id}`);
    console.log(`📊 Config: batch_type=${batch_type}, account_id=${account_id}`);

    // Start background processing (non-blocking)
    // This will run the actual LangChain/OpenAI processing
    EmbeddingWorker.processEmailJob({
      job_id,
      account_id,
      batch_type: batch_type || 'full',
      processing_options: processing_options || {}
    }).catch(error => {
      console.error(`❌ Background processing failed for job ${job_id}:`, error);
    });

    const executionTime = Date.now() - startTime;

    // Return immediate response (don't wait for processing to complete)
    res.status(200).json({
      success: true,
      message: 'Email processing started',
      job_id,
      started_at: new Date().toISOString(),
      execution_time_ms: executionTime
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('❌ Email processing endpoint error:', error);

    res.status(500).json({
      success: false,
      error: 'Failed to start email processing',
      message: error.message,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString()
    });
  }
});

// Get processing status (optional - mainly for debugging)
router.get('/status/:job_id', validateJWT, async (req, res) => {
  try {
    const { job_id } = req.params;

    // TODO: Query job status from database
    // For now, return basic status
    res.status(200).json({
      success: true,
      job_id,
      message: 'Use Vercel /api/email-embeddings/status endpoint for detailed status',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check status',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;