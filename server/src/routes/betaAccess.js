/**
 * Beta Access API Routes
 * Handles beta user access verification using service role
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { validateJWT } from '../middleware/authMiddleware.js';

// Initialize Supabase client with service role key for RLS bypass
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

/**
 * GET /api/beta-access/check
 * Check if the authenticated user has beta access
 */
router.get('/check', validateJWT, async (req, res) => {
  try {
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        hasBetaAccess: false,
        error: 'User email not found in token'
      });
    }

    console.log(`🔍 BETA ACCESS: Checking beta access for email: ${userEmail}`);

    // Check if user is in beta_users table with service role (bypasses RLS)
    const { data, error } = await supabase
      .from('beta_users')
      .select('email, is_active')
      .eq('email', userEmail.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No matching records found - user does not have beta access
        console.log(`❌ BETA ACCESS: User ${userEmail} not found in beta_users table`);
        return res.json({
          success: true,
          hasBetaAccess: false
        });
      }

      console.error('Database error checking beta access:', error);
      return res.status(500).json({
        success: false,
        hasBetaAccess: false,
        error: 'Database error checking beta access'
      });
    }

    console.log(`✅ BETA ACCESS: User ${userEmail} has beta access`);
    res.json({
      success: true,
      hasBetaAccess: true
    });

  } catch (error) {
    console.error('Error checking beta access:', error);
    res.status(500).json({
      success: false,
      hasBetaAccess: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/beta-access/admin-check
 * Check if the authenticated user is an admin
 */
router.get('/admin-check', validateJWT, async (req, res) => {
  try {
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        isAdmin: false,
        error: 'User email not found in token'
      });
    }

    console.log(`🔍 ADMIN CHECK: Checking admin status for email: ${userEmail}`);

    // Check if user is in admin_users table with service role (bypasses RLS)
    const { data, error } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', userEmail.toLowerCase())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No matching records found - user is not an admin
        console.log(`❌ ADMIN CHECK: User ${userEmail} not found in admin_users table`);
        return res.json({
          success: true,
          isAdmin: false
        });
      }

      console.error('Database error checking admin status:', error);
      return res.status(500).json({
        success: false,
        isAdmin: false,
        error: 'Database error checking admin status'
      });
    }

    console.log(`✅ ADMIN CHECK: User ${userEmail} is an admin`);
    res.json({
      success: true,
      isAdmin: true
    });

  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({
      success: false,
      isAdmin: false,
      error: 'Internal server error'
    });
  }
});

export default router;