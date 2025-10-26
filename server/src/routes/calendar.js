/**
 * Calendar Events API Routes
 * Handles Google Calendar integration and event creation
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { GoogleCalendarTool } from '../tools/googleCalendarTool.js';
import { getTokenService } from '../services/oauthTokenService.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const router = express.Router();

/**
 * POST /api/calendar/event
 * Create a calendar event via Google Calendar API
 */
router.post('/event', async (req, res) => {
  try {
    const {
      eventId,
      title,
      startTime,
      endTime,
      attendees,
      userId
    } = req.body;

    // Validate required fields
    if (!eventId || !title || !startTime || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: eventId, title, startTime, userId'
      });
    }

    // Get valid Google Calendar access token using the existing service
    const tokenService = getTokenService();
    const tokenResult = await tokenService.getValidAccessToken(userId, 'google-calendar');

    if (!tokenResult.success) {
      return res.status(401).json({
        success: false,
        error: tokenResult.error || 'Google Calendar access token not available'
      });
    }

    // Use the existing GoogleCalendarTool to create the event
    const calendarTool = new GoogleCalendarTool({ userId });

    // Calculate duration (default 1 hour if no end time)
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + 60 * 60 * 1000);

    // Create event directly using Google Calendar API instead of the tool
    const eventData = {
      summary: title,
      start: {
        dateTime: start.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    // Add attendees if provided
    if (attendees && attendees.length > 0) {
      eventData.attendees = attendees.map(email => ({ email: email.trim() }));
    }

    // Create the event using Google Calendar API directly
    const calendarResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenResult.token.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      return res.status(400).json({
        success: false,
        error: `Google Calendar API error: ${calendarResponse.status} ${calendarResponse.statusText}`,
        details: errorText
      });
    }

    const createdEvent = await calendarResponse.json();
    console.log(`➕ Event created: ${createdEvent.id}`);

    const result = {
      success: true,
      event: {
        id: createdEvent.id,
        title: createdEvent.summary,
        start: createdEvent.start?.dateTime || createdEvent.start?.date,
        end: createdEvent.end?.dateTime || createdEvent.end?.date,
        htmlLink: createdEvent.htmlLink,
        attendees: createdEvent.attendees?.map(a => a.email) || []
      }
    };

    // Update the pending event status in database
    const { error: updateError } = await supabase
      .from('pending_calendar_events')
      .update({
        status: 'completed',
        calendar_event_id: result.event.id,
        completed_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (updateError) {
      console.error('Failed to update pending event:', updateError);
      // Don't fail the request since the calendar event was created successfully
    }

    res.json({
      success: true,
      message: 'Calendar event created successfully',
      event: result.event
    });

  } catch (error) {
    console.error('Calendar event creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

export default router;