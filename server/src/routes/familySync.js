import express from 'express';
import { FamilyProfileSyncService } from '../services/familyProfileSyncService.js';

const router = express.Router();

/**
 * Sync family activity to agent memory
 */
router.post('/activity', async (req, res) => {
  try {
    const { userId, familyId, activityData, familyMemberName } = req.body;

    if (!userId || !familyId || !activityData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, familyId, activityData'
      });
    }

    console.log('🔄 Syncing family activity to agent memory:', {
      userId,
      familyId,
      activityId: activityData.id,
      activityName: activityData.activity_name
    });

    const syncService = new FamilyProfileSyncService();
    const result = await syncService.syncActivityToAgentMemory(userId, familyId, activityData, familyMemberName);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Error in family activity sync route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Sync family member to agent memory
 */
router.post('/member', async (req, res) => {
  try {
    const { userId, familyId, memberData } = req.body;

    if (!userId || !familyId || !memberData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, familyId, memberData'
      });
    }

    console.log('🔄 Syncing family member to agent memory:', {
      userId,
      familyId,
      memberId: memberData.id,
      memberName: memberData.name
    });

    const syncService = new FamilyProfileSyncService();
    const result = await syncService.syncMemberToAgentMemory(userId, familyId, memberData);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Error in family member sync route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Sync family contact to agent memory
 */
router.post('/contact', async (req, res) => {
  try {
    const { userId, familyId, contactData } = req.body;

    if (!userId || !familyId || !contactData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, familyId, contactData'
      });
    }

    console.log('🔄 Syncing family contact to agent memory:', {
      userId,
      familyId,
      contactId: contactData.id,
      contactName: contactData.name
    });

    const syncService = new FamilyProfileSyncService();
    const result = await syncService.syncContactToAgentMemory(userId, familyId, contactData);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Error in family contact sync route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Sync family school to agent memory
 */
router.post('/school', async (req, res) => {
  try {
    const { userId, familyId, schoolData, familyMemberName } = req.body;

    if (!userId || !familyId || !schoolData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, familyId, schoolData'
      });
    }

    console.log('🔄 Syncing family school to agent memory:', {
      userId,
      familyId,
      schoolId: schoolData.id,
      schoolName: schoolData.school_name
    });

    const syncService = new FamilyProfileSyncService();
    const result = await syncService.syncSchoolToAgentMemory(userId, familyId, schoolData, familyMemberName);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Error in family school sync route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete family data from agent memory
 */
router.delete('/:dataType/:dataId', async (req, res) => {
  try {
    const { dataType, dataId } = req.params;

    if (!dataType || !dataId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: dataType, dataId'
      });
    }

    // Validate dataType
    const validTypes = ['activity', 'school', 'member', 'contact'];
    if (!validTypes.includes(dataType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid dataType. Must be one of: ${validTypes.join(', ')}`
      });
    }

    console.log('🗑️ Deleting family data from agent memory:', {
      dataType,
      dataId
    });

    const syncService = new FamilyProfileSyncService();
    const result = await syncService.deleteFromAgentMemory(dataType, dataId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('❌ Error in family data deletion route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;