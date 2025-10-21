/**
 * Gmail Forwarding Integration Routes - Simple Toggle API
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { validateJWT } from '../middleware/authMiddleware.js';
import { generateInboundAddress } from '../services/inboundEmailService.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

// POST /toggle - Enable or disable gmail-forwarding
router.post('/toggle', validateJWT, async (req, res) => {
  try {
    const { user } = req.auth;
    const { enable } = req.body;

    console.log('🔄 Gmail forwarding toggle request:', {
      user_id: user.id,
      enable,
      timestamp: new Date().toISOString()
    });

    if (enable) {
      // Generate email address and enable
      const emailAddress = generateInboundAddress(user.id);
      const config = { email_address: emailAddress };

      console.log('📧 Generated email address:', emailAddress);
      console.log('⚙️ Config object:', config);

      const insertData = {
        user_id: user.id,
        integration_id: 'gmail-forwarding',
        status: 'connected',
        config,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 Attempting to insert into user_integrations:', insertData);

      const { data, error } = await supabase
        .from('user_integrations')
        .insert(insertData)
        .select()
        .single();

      console.log('📊 Supabase insert result:', { data, error });

      if (error) {
        console.error('❌ Supabase insert error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Gmail forwarding enabled successfully for user:', user.id);

      return res.json({
        success: true,
        enabled: true,
        email_address: emailAddress
      });

    } else {
      console.log('🔄 Disabling gmail forwarding for user:', user.id);

      const { data, error } = await supabase
        .from('user_integrations')
        .update({ status: 'disconnected' })
        .eq('user_id', user.id)
        .eq('integration_id', 'gmail-forwarding')
        .select()
        .single();

      console.log('📊 Supabase update result:', { data, error });

      if (error) {
        console.error('❌ Supabase update error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Gmail forwarding disabled successfully for user:', user.id);

      return res.json({
        success: true,
        enabled: false,
        email_address: null
      });
    }

  } catch (error) {
    console.error('❌ Gmail forwarding toggle error:', {
      message: error.message,
      stack: error.stack,
      user_id: req.auth?.user?.id,
      enable: req.body?.enable
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /status - Get current status
router.get('/status', validateJWT, async (req, res) => {
  try {
    const { user } = req.auth;

    console.log('📊 Gmail forwarding status request for user:', user.id);

    const { data, error } = await supabase
      .from('user_integrations')
      .select('status, config')
      .eq('user_id', user.id)
      .eq('integration_id', 'gmail-forwarding')
      .single();

    console.log('📊 Supabase status query result:', { data, error });

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Supabase status error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    const enabled = data?.status === 'connected';
    const emailAddress = enabled ? data?.config?.email_address : null;

    console.log('✅ Gmail forwarding status result:', {
      enabled,
      emailAddress,
      rawData: data
    });

    res.json({
      success: true,
      enabled,
      email_address: emailAddress
    });

  } catch (error) {
    console.error('❌ Gmail forwarding status error:', {
      message: error.message,
      stack: error.stack,
      user_id: req.auth?.user?.id
    });
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;