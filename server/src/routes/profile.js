/**
 * Profile API Routes
 *
 * Handles account profile operations for structured family data
 */

import express from 'express';
import { accountProfileService } from '../services/accountProfileService.js';

const router = express.Router();

// Get account profile
router.post('/get', async (req, res) => {
  try {
    console.log('📋 Profile API: Get request');

    const { account_id } = req.body;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: 'Account ID required'
      });
    }

    const accountId = account_id;

    const result = await accountProfileService.getProfile(accountId);

    console.log('🔍 Debug profile result structure:', {
      success: result.success,
      hasProfile: !!result.profile,
      profileKeys: result.profile ? Object.keys(result.profile) : 'no profile',
      hasData: result.profile ? !!result.profile.data : 'no profile',
      dataType: result.profile?.data ? typeof result.profile.data : 'no data'
    });

    if (result.success) {
      res.json({
        success: true,
        profile: result.profile.data,
        metadata: result.profile.metadata
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Profile API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Update account profile
router.post('/update', async (req, res) => {
  try {
    console.log('📋 Profile API: Update request');

    const { account_id, ...profileData } = req.body;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: 'Account ID required'
      });
    }

    if (!profileData || Object.keys(profileData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Profile data required'
      });
    }

    const accountId = account_id;

    const result = await accountProfileService.updateProfile(accountId, profileData, 'user');

    if (result.success) {
      res.json({
        success: true,
        profile: result.profile.data,
        metadata: result.profile.metadata,
        changes: result.changes
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Profile update API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get profile statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Profile API: Stats request');

    const accountId = req.user?.id || req.headers['x-account-id'];

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID required'
      });
    }

    const result = await accountProfileService.getProfileStats(accountId);

    res.json(result);

  } catch (error) {
    console.error('Profile stats API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;