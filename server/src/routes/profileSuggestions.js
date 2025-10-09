/**
 * Profile Suggestions API Routes
 *
 * Handles API endpoints for managing AI-generated profile enhancement suggestions.
 * Provides CRUD operations for pending suggestions and approval workflows.
 */

import express from 'express';
import { profileSuggestionsService } from '../services/profileSuggestionsService.js';
import { validateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/profile-suggestions
 * Get pending suggestions for the authenticated user
 */
router.get('/', validateJWT, async (req, res) => {
  try {
    console.log('🔍 DEBUG: Profile suggestions GET request received');
    console.log('🔍 DEBUG: Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🔍 DEBUG: User from JWT:', req.user);

    const {
      limit = 50,
      offset = 0,
      suggestion_type,
      min_confidence = 0.0,
      userId
    } = req.query;

    console.log(`📋 API: Getting suggestions for user ${userId}`);

    const result = await profileSuggestionsService.getPendingSuggestions(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      suggestionType: suggestion_type,
      minConfidence: parseFloat(min_confidence)
    });

    if (result.success) {
      res.json({
        success: true,
        suggestions: result.suggestions,
        total: result.total,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: result.suggestions.length === parseInt(limit)
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ API Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});


/**
 * POST /api/profile-suggestions/:id/approve
 * Approve a specific suggestion
 */
router.post('/:id/approve', validateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    console.log(`✅ API: Approving suggestion ${id} for user ${userId}`);

    const result = await profileSuggestionsService.approveSuggestion(id, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Suggestion approved successfully',
        suggestion_id: result.suggestion_id,
        suggestion_type: result.suggestion_type,
        applied_data: result.applied_data
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ API Error approving suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/profile-suggestions/:id/approve-with-edits
 * Approve a specific suggestion with user edits
 */
router.post('/:id/approve-with-edits', validateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { edit_data, userId, familyId, suggestionType } = req.body;

    console.log(`🔍 DEBUG API ROUTE: Starting approve-with-edits`);
    console.log(`🔍 DEBUG API ROUTE: Suggestion ID: ${id}`);
    console.log(`🔍 DEBUG API ROUTE: User ID: ${userId}`);
    console.log(`🔍 DEBUG API ROUTE: Family ID: ${familyId}`);
    console.log(`🔍 DEBUG API ROUTE: Suggestion Type: ${suggestionType}`);
    console.log(`🔍 DEBUG API ROUTE: Edit data:`, JSON.stringify(edit_data, null, 2));

    if (!edit_data) {
      console.log(`❌ DEBUG API ROUTE: Missing edit data`);
      return res.status(400).json({
        success: false,
        error: 'Edit data is required'
      });
    }

    if (!familyId) {
      console.log(`❌ DEBUG API ROUTE: Missing family ID`);
      return res.status(400).json({
        success: false,
        error: 'Family ID is required'
      });
    }

    if (!suggestionType) {
      console.log(`❌ DEBUG API ROUTE: Missing suggestion type`);
      return res.status(400).json({
        success: false,
        error: 'Suggestion type is required'
      });
    }

    console.log(`✏️ API: Approving edited suggestion ${id} for user ${userId}`);
    console.log(`🔍 DEBUG API ROUTE: Calling profileSuggestionsService.approveSuggestionWithEdits`);

    const result = await profileSuggestionsService.approveSuggestionWithEdits(id, userId, edit_data, suggestionType, familyId);

    console.log(`🔍 DEBUG API ROUTE: Service result:`, JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`✅ DEBUG API ROUTE: Success response being sent`);
      res.json({
        success: true,
        message: 'Edited suggestion approved successfully',
        suggestion_id: result.suggestion_id,
        suggestion_type: result.suggestion_type,
        applied_data: result.applied_data,
        destination: result.destination,
        expires_at: result.expires_at
      });
    } else {
      console.log(`❌ DEBUG API ROUTE: Service returned error:`, result.error);
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ API Error approving edited suggestion:', error);
    console.error('❌ DEBUG API ROUTE: Full error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/profile-suggestions/:id/reject
 * Reject a specific suggestion
 */
router.post('/:id/reject', validateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.headers['x-user-id'];

    console.log(`❌ API: Rejecting suggestion ${id} for user ${userId}`);

    const result = await profileSuggestionsService.rejectSuggestion(id, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Suggestion rejected successfully',
        suggestion_id: result.suggestion_id,
        suggestion_type: result.suggestion_type
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ API Error rejecting suggestion:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/profile-suggestions/bulk-approve
 * Bulk approve multiple suggestions
 */
router.post('/bulk-approve', validateJWT, async (req, res) => {
  try {
    const { suggestion_ids } = req.body;
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!suggestion_ids || !Array.isArray(suggestion_ids) || suggestion_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'suggestion_ids array is required'
      });
    }

    console.log(`✅ API: Bulk approving ${suggestion_ids.length} suggestions for user ${userId}`);

    const result = await profileSuggestionsService.bulkApproveSuggestions(suggestion_ids, userId);

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully approved ${result.approved_count} suggestions`,
        approved_count: result.approved_count,
        failed_count: result.failed_count,
        errors: result.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ API Error bulk approving suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/profile-suggestions/bulk-reject
 * Bulk reject multiple suggestions
 */
router.post('/bulk-reject', validateJWT, async (req, res) => {
  try {
    const { suggestion_ids } = req.body;
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!suggestion_ids || !Array.isArray(suggestion_ids) || suggestion_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'suggestion_ids array is required'
      });
    }

    console.log(`❌ API: Bulk rejecting ${suggestion_ids.length} suggestions for user ${userId}`);

    const result = await profileSuggestionsService.bulkRejectSuggestions(suggestion_ids, userId);

    if (result.success) {
      res.json({
        success: true,
        message: `Successfully rejected ${result.rejected_count} suggestions`,
        rejected_count: result.rejected_count,
        failed_count: result.failed_count,
        errors: result.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ API Error bulk rejecting suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});


export default router;