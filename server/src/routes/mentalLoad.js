import express from 'express';
import { validateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * GET /api/mental-load/signals
 * Get mental load signals for the authenticated user
 */
router.get('/signals', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`🧠 Getting mental load signals for user: ${userId}`);
    
    // Sample signals for now - will be replaced with real agent memory integration
    const signals = [
      {
        id: '1',
        type: 'overwhelm',
        intensity: 8,
        timestamp: new Date().toISOString(),
        source: 'calendar',
        description: 'Multiple high-priority deadlines this week',
        actionable: true
      },
      {
        id: '2',
        type: 'stress',
        intensity: 6,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: 'email',
        description: 'Urgent emails requiring immediate response',
        actionable: true
      },
      {
        id: '3',
        type: 'calm',
        intensity: 3,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: 'memory',
        description: 'Completed important task ahead of schedule',
        actionable: false
      }
    ];
    
    res.json({
      success: true,
      data: {
        signals,
        count: signals.length,
        actionable_count: signals.filter(s => s.actionable).length
      }
    });
  } catch (error) {
    console.error('Error getting mental load signals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve mental load signals'
    });
  }
});

/**
 * GET /api/mental-load/calendar
 * Get calendar events with mental load analysis
 */
router.get('/calendar', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`📅 Getting calendar events for user: ${userId}`);
    
    // Sample events for now - will be replaced with real agent memory integration
    const events = [
      {
        id: '1',
        title: 'Doctor Appointment',
        date: new Date(2024, 11, 20, 10, 0).toISOString(),
        time: '10:00 AM',
        type: 'appointment',
        priority: 'high',
        mentalLoad: 7
      },
      {
        id: '2',
        title: 'Project Deadline',
        date: new Date(2024, 11, 25, 17, 0).toISOString(),
        time: '5:00 PM',
        type: 'deadline',
        priority: 'high',
        mentalLoad: 9
      },
      {
        id: '3',
        title: 'School Event',
        date: new Date(2024, 11, 22, 18, 0).toISOString(),
        time: '6:00 PM',
        type: 'event',
        priority: 'medium',
        mentalLoad: 4
      }
    ];
    
    res.json({
      success: true,
      data: {
        events,
        count: events.length,
        high_load_events: events.filter(e => e.mentalLoad > 7).length
      }
    });
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve calendar events'
    });
  }
});

/**
 * POST /api/mental-load/analyze
 * Trigger analysis of user's data for mental load signals
 */
router.post('/analyze', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log(`🔍 Triggering mental load analysis for user: ${userId}`);
    
    // For now, return sample analysis - will be replaced with real agent memory integration
    const analysis = {
      signals_generated: 3,
      signals_stored: 3,
      signals: [
        {
          id: 'analysis-1',
          type: 'overwhelm',
          intensity: 7,
          timestamp: new Date().toISOString(),
          source: 'calendar',
          description: 'High event density detected in upcoming week',
          actionable: true
        }
      ]
    };
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing mental load:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze mental load'
    });
  }
});

export default router;