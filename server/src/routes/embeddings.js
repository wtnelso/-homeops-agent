/**
 * Email Embeddings Routes
 * 
 * Handles long-running email processing requests from Vercel API endpoints.
 * Processes emails with LangChain, OpenAI, and stores results in database.
 */

import express from 'express';
import { EmbeddingWorker } from '../workers/embeddingWorker.js';

const router = express.Router();

// Process email embeddings (main endpoint called from Vercel)
router.post('/process', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { job_id, account_id, batch_type, processing_options } = req.body;

    // Validate required parameters
    if (!job_id || !account_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: job_id, account_id',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🔄 Starting email processing for job ${job_id}`);
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
router.get('/status/:job_id', async (req, res) => {
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