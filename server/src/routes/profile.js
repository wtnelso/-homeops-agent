/**
 * Profile API Routes
 *
 * Handles account profile operations for structured family data
 */

import express from 'express';
import { accountProfileService } from '../services/accountProfileService.js';
import { validateJWT } from '../middleware/authMiddleware.js';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client for family data operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get account profile
router.post('/get', validateJWT, async (req, res) => {
  try {
    console.log('📋 Profile API: Get request');

    const { family_id } = req.body;

    if (!family_id) {
      return res.status(400).json({
        success: false,
        error: 'Family ID required'
      });
    }

    const familyId = family_id;

    const result = await accountProfileService.getProfile(familyId);

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
router.post('/update', validateJWT, async (req, res) => {
  try {
    console.log('📋 Profile API: Update request');

    const { family_id, ...profileData } = req.body;

    if (!family_id) {
      return res.status(400).json({
        success: false,
        error: 'Family ID required'
      });
    }

    if (!profileData || Object.keys(profileData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Profile data required'
      });
    }

    const familyId = family_id;

    // Handle family member creation/updates in Supabase
    if (profileData.members && Array.isArray(profileData.members)) {
      console.log('📝 Updating family members in Supabase...');

      for (const member of profileData.members) {
        console.log('👤 Processing member:', member.name);

        // Create family member record in Supabase
        const { error: memberError } = await supabase
          .from('family_members')
          .insert({
            family_id: familyId,
            user_id: null, // Non-user family members don't have user_id
            family_relationship: member.type || 'other',
            name: member.name,
            email: member.email || null,
            age: member.age || null,
            birthday_month: member.birthday?.month || null,
            birthday_day: member.birthday?.day || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (memberError) {
          console.error('❌ Error creating family member:', memberError);
          return res.status(500).json({
            success: false,
            error: `Failed to create family member: ${memberError.message}`
          });
        }
      }

      console.log('✅ Family members updated successfully in Supabase');

      res.json({
        success: true,
        message: 'Family members updated successfully'
      });
    } else {
      // For non-member profile updates, still use the Neon service for now
      const result = await accountProfileService.updateProfile(familyId, profileData, 'user');

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
router.get('/stats', validateJWT, async (req, res) => {
  try {
    console.log('📊 Profile API: Stats request');

    const accountId = req.user?.id || req.headers['x-user-id'];

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

// Complete user onboarding
router.post('/complete-onboarding', validateJWT, async (req, res) => {
  try {
    console.log('🎉 Profile API: Complete onboarding request');

    const { account_id } = req.body;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: 'Account ID required'
      });
    }

    // For now, just log the completion
    // In a full implementation, you might update a user status in Supabase
    // or perform additional setup tasks
    console.log(`✅ User onboarding completed for account: ${account_id}`);
    console.log(`📅 Completed at: ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Complete onboarding API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;