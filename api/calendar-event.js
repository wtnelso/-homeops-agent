import { createClient } from '@supabase/supabase-js';
import { GoogleCalendarTool } from '../server/src/tools/googleCalendarTool.js';
import { getTokenService } from '../server/src/services/oauthTokenService.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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
    const calendarTool = new GoogleCalendarTool();

    // Prepare the query string for the tool
    let query = title;
    if (attendees && attendees.length > 0) {
      query += ` with ${attendees.join(', ')}`;
    }

    // Calculate duration (default 1 hour if no end time)
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + 60 * 60 * 1000);
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // in minutes

    // Call the GoogleCalendarTool's createEvent method
    const result = await calendarTool.createEvent(tokenResult.token.access_token, {
      query,
      startDate: start.toISOString().split('T')[0], // YYYY-MM-DD
      startTime: start.toLocaleTimeString('en-US', { hour12: false }), // HH:MM:SS
      duration: `${Math.round(duration / 60)} hour${Math.round(duration / 60) !== 1 ? 's' : ''}`
    });

    const parsedResult = JSON.parse(result);

    if (!parsedResult.success) {
      return res.status(400).json({
        success: false,
        error: parsedResult.error || 'Failed to create calendar event',
        details: parsedResult.details
      });
    }

    // Update the pending event status in database
    const { error: updateError } = await supabase
      .from('pending_calendar_events')
      .update({
        status: 'completed',
        calendar_event_id: parsedResult.event.id,
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
      event: parsedResult.event
    });

  } catch (error) {
    console.error('Calendar event creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
}