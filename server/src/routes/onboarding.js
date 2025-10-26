/**
 * Onboarding API Routes
 * Handles processing and storage of onboarding data
 */

import express from 'express';
import { validateJWT } from '../middleware/authMiddleware.js';
import OnboardingDataProcessor from '../services/onboardingDataProcessor.js';

const router = express.Router();

/**
 * POST /api/onboarding/complete
 * Process onboarding data and mark as completed
 */
router.post('/complete', validateJWT, async (req, res) => {
  try {
    console.log('🎯 POST /api/onboarding/complete');

    const { onboardingData, familyId, publicUserId } = req.body;

    if (!publicUserId) {
      return res.status(400).json({
        success: false,
        error: 'Public user ID is required'
      });
    }

    if (!onboardingData) {
      return res.status(400).json({
        success: false,
        error: 'Onboarding data is required'
      });
    }

    console.log('📊 Processing onboarding data for user:', publicUserId);
    console.log('📋 Full request body:', JSON.stringify(req.body, null, 2));
    console.log('📋 Data summary:', {
      familyMembers: onboardingData.familyMembers?.length || 0,
      activities: onboardingData.activities?.length || 0,
      schools: onboardingData.schools?.length || 0,
      emailDomains: onboardingData.emailDomains?.length || 0,
      importantPlaces: onboardingData.importantPlaces?.length || 0
    });
    console.log('📋 Family members data:', onboardingData.familyMembers);

    // Process the onboarding data
    const processor = new OnboardingDataProcessor();
    const results = await processor.processOnboardingData(publicUserId, onboardingData, familyId);

    // Determine response based on results
    if (results.success) {
      console.log('✅ Onboarding data processing completed successfully');

      // Check if there were partial failures
      if (results.errors.length > 0) {
        console.log('⚠️ Some data could not be saved:', results.errors);
        return res.status(200).json({
          success: true,
          message: 'Onboarding completed with some data saved',
          warnings: results.errors,
          processed: results.processed
        });
      } else {
        return res.status(200).json({
          success: true,
          message: 'Onboarding completed successfully',
          processed: results.processed,
          refreshUserData: true  // Signal frontend to refresh user session data
        });
      }
    } else {
      console.error('❌ Critical error during onboarding data processing');
      return res.status(500).json({
        success: false,
        error: 'Failed to complete onboarding',
        details: results.errors
      });
    }

  } catch (error) {
    console.error('💥 Error in onboarding completion endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during onboarding completion'
    });
  }
});

export default router;