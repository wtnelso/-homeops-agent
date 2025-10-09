/**
 * User Provider Routes
 *
 * Handles checking which authentication provider an email is registered with.
 * Used for preventing password resets on OAuth accounts.
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check which authentication provider an email is registered with
 * POST /api/user/check-provider
 */
router.post('/check-provider', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    console.log('🔍 Checking provider for email:', email);

    // Use RPC function to check user's authentication provider
    const { data: identities, error } = await supabase.rpc('get_user_provider_by_email', {
      user_email: email
    });

    if (error) {
      console.error('❌ SQL query error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to check user provider'
      });
    }

    if (!identities || identities.length === 0) {
      console.log('❌ User not found for email:', email);
      return res.json({
        success: true,
        provider: null,
        exists: false
      });
    }

    console.log('✅ User identities found:', identities);

    // Find the primary authentication provider
    // Priority: OAuth providers (google, github, etc.) > email
    const oauthProvider = identities.find(identity => identity.provider !== 'email');
    const provider = oauthProvider ? oauthProvider.provider : 'email';

    console.log('✅ Detected provider:', provider);

    return res.json({
      success: true,
      provider: provider,
      exists: true
    });

  } catch (error) {
    console.error('Error checking user provider:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;