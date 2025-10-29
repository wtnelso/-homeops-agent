/**
 * Google Calendar LangChain Tool
 *
 * Provides access to Google Calendar for event management, scheduling,
 * and calendar queries within the HomeOps AI assistant.
 */

import { Tool } from '@langchain/core/tools';
import { getTokenService } from '../services/oauthTokenService.js';
import { TOOLS_CONFIG } from '../config/chatConfig.js';

export class GoogleCalendarTool extends Tool {
  name = 'calendar';
  description = `ALWAYS use this tool when the user asks about calendar events, scheduling, or time-related queries.

  This tool provides access to Google Calendar for:
  - Viewing upcoming events and schedules
  - Creating new calendar events
  - Finding available time slots
  - Checking for scheduling conflicts
  - Managing family calendar coordination

  MUST USE for these queries:
  - "what's on my calendar" / "what do I have today" / "upcoming events"
  - "schedule a meeting" / "create an event" / "add to calendar"
  - "when am I free" / "find available time" / "check my schedule"
  - "do I have conflicts" / "when is my next meeting"
  - Family scheduling questions ("when is my child's practice", "family events")

  Input format: {"action": "action_type", "query": "details", "startDate": "optional", "endDate": "optional"}

  Supported actions:
  - "list_events": Get events for a date range
  - "create_event": Create a new calendar event
  - "find_free_time": Find available time slots
  - "search_events": Search for specific events

  TEMPORAL PARAMETER MAPPING - For time-based queries, map user phrases to specific parameters:
  - "today" → {"action": "list_events", "query": "today's events"}
  - "this week" → {"action": "list_events", "query": "this week's events"}
  - "what's going on this week" → {"action": "list_events", "query": "this week's schedule"}
  - "next week" → {"action": "list_events", "query": "next week's events"}
  - "tomorrow" → {"action": "list_events", "query": "tomorrow's events"}
  - "weekend" → {"action": "list_events", "query": "weekend events"}

  Example inputs:
  - {"action": "list_events", "query": "today's events"}
  - {"action": "list_events", "query": "this week's events"}
  - {"action": "list_events", "query": "next week's schedule"}
  - {"action": "list_events", "startDate": "2025-01-15", "endDate": "2025-01-16"}
  - {"action": "create_event", "query": "Doctor appointment", "startDate": "2025-01-20", "startTime": "2:00 PM"}
  - {"action": "find_free_time", "query": "2 hour meeting next week"}
  - {"action": "search_events", "query": "my child's soccer practice"}`;

  schema = {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'The calendar action to perform',
        enum: ['list_events', 'create_event', 'find_free_time', 'search_events']
      },
      query: {
        type: 'string',
        description: 'Natural language description of what to do (e.g., "today\'s meetings", "schedule dentist appointment")'
      },
      startDate: {
        type: 'string',
        description: 'Optional start date in YYYY-MM-DD format'
      },
      endDate: {
        type: 'string',
        description: 'Optional end date in YYYY-MM-DD format'
      },
      startTime: {
        type: 'string',
        description: 'Optional start time for event creation (e.g., "2:00 PM", "14:00")'
      },
      duration: {
        type: 'string',
        description: 'Optional duration for events (e.g., "1 hour", "30 minutes")'
      }
    },
    required: ['action', 'query']
  };

  constructor({ userId }) {
    super();
    this.userId = userId;
  }

  /**
   * Execute Google Calendar operation
   */
  async _call(input) {
    console.log(`🗓️ GOOGLE CALENDAR TOOL _call() EXECUTED!`);
    console.log(`🗓️ Input received:`, JSON.stringify(input, null, 2));

    try {
      const { action, query, temporalRange, startDate, endDate, startTime, duration } = input || {};
      console.log(`🗓️ Parsed - action: "${action}", query: "${query}"`);

      // Only require action parameter
      if (!action) {
        return JSON.stringify({
          success: false,
          error: 'Action parameter is required'
        });
      }

      console.log(`🗓️ Google Calendar operation: "${action}" - "${query}" for user ${this.userId}`);

      // Get user's Google Calendar access token
      const tokenService = getTokenService();
      const tokenResult = await tokenService.getValidAccessToken(this.userId, 'google-calendar');
      console.log(`🔑 Token retrieval result:`, {
        success: tokenResult?.success,
        hasToken: !!tokenResult?.token?.access_token
      });

      if (!tokenResult?.success || !tokenResult?.token?.access_token) {
        return JSON.stringify({
          success: false,
          error: 'Google Calendar not connected. Please connect your Google Calendar in settings to view your events.',
          action_required: 'oauth_setup',
          integration: 'google-calendar',
          user_message: 'Your Google Calendar is not connected. You can connect it in your account settings to view and manage your calendar events.'
        });
      }

      const accessToken = tokenResult.token.access_token;

      // Execute the requested calendar action
      switch (action) {
        case 'list_events':
          return await this.listEvents(accessToken, { temporalRange });

        case 'create_event':
          return await this.createEvent(accessToken, { query, startDate, startTime, duration });

        case 'find_free_time':
          return await this.findFreeTime(accessToken, { query, startDate, endDate, duration });

        case 'search_events':
          return await this.searchEvents(accessToken, { query, startDate, endDate });

        default:
          return JSON.stringify({
            success: false,
            error: `Unsupported calendar action: ${action}`
          });
      }

    } catch (error) {
      console.error('🗓️ Google Calendar tool error:', error);
      return JSON.stringify({
        success: false,
        error: 'Calendar operation failed',
        details: error.message
      });
    }
  }

  /**
   * Extract date range from temporal range object
   */
  parseTemporalRange(temporalRange) {
    if (!temporalRange || !temporalRange.startDate || !temporalRange.endDate) {
      throw new Error('Calendar tool requires valid temporalRange object with startDate and endDate');
    }

    console.log(`📅 Using temporal range "${temporalRange.phrase}": ${new Date(temporalRange.startDate).toDateString()} - ${new Date(temporalRange.endDate).toDateString()}`);

    return {
      start: new Date(temporalRange.startDate),
      end: new Date(temporalRange.endDate)
    };
  }

  /**
   * List calendar events for a date range
   */
  async listEvents(accessToken, { temporalRange }) {
    try {
      console.log(`📅 Listing events for temporal range:`, temporalRange?.phrase);

      const { start, end } = this.parseTemporalRange(temporalRange);

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${start.toISOString()}&` +
        `timeMax=${end.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=50`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const events = data.items || [];

      console.log(`📅 Found ${events.length} events`);

      const formattedEvents = events.map(event => ({
        id: event.id,
        title: event.summary,
        summary: event.summary,
        start: event.start?.dateTime || event.start?.date,
        startTime: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        description: event.description,
        attendees: event.attendees?.map(a => a.email) || [],
        allDay: !event.start?.dateTime
      }));

      const result = {
        success: true,
        action: 'list_events',
        dateRange: `${start.toDateString()} to ${end.toDateString()}`,
        eventCount: events.length,
        events: formattedEvents
      };

      console.log(`📅 Calendar tool returning:`, JSON.stringify(result, null, 2));
      return JSON.stringify(result);

    } catch (error) {
      console.error('📅 List events error:', error);
      return JSON.stringify({
        success: false,
        error: 'Failed to retrieve calendar events',
        details: error.message
      });
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(accessToken, { query, startDate, startTime, duration }) {
    try {
      console.log(`➕ Creating event: ${query}`);

      // Parse event details from query
      const eventData = this.parseEventFromQuery(query, { startDate, startTime, duration });

      const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
      }

      const createdEvent = await response.json();
      console.log(`➕ Event created: ${createdEvent.id}`);

      return JSON.stringify({
        success: true,
        action: 'create_event',
        query: query,
        event: {
          id: createdEvent.id,
          title: createdEvent.summary,
          start: createdEvent.start?.dateTime || createdEvent.start?.date,
          end: createdEvent.end?.dateTime || createdEvent.end?.date,
          htmlLink: createdEvent.htmlLink
        }
      });

    } catch (error) {
      console.error('➕ Create event error:', error);
      return JSON.stringify({
        success: false,
        error: 'Failed to create calendar event',
        details: error.message
      });
    }
  }

  /**
   * Find available time slots
   */
  async findFreeTime(accessToken, { query, startDate, endDate, duration = "1 hour" }) {
    try {
      console.log(`🔍 Finding free time from ${startDate} to ${endDate}, duration: ${duration}`);

      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required for finding free time');
      }

      if (!accessToken) {
        throw new Error('Access token is required for calendar operations');
      }

      // Parse duration (default 1 hour)
      const durationMinutes = this.parseDuration(duration);
      console.log(`🔍 Parsed duration: ${durationMinutes} minutes`);

      // Get existing events in the date range
      console.log(`🔍 Getting existing events...`);
      const existingEvents = await this.getEventsInRange(accessToken, startDate, endDate);
      console.log(`🔍 Found ${existingEvents?.length || 0} existing events`);

      // Generate time slot suggestions
      console.log(`🔍 Generating available slots...`);
      const suggestions = this.generateAvailableSlots(startDate, endDate, durationMinutes, existingEvents);
      console.log(`🔍 Generated ${suggestions?.length || 0} suggestions`);

      const result = {
        success: true,
        action: 'find_free_time',
        query: query,
        dateRange: `${startDate} to ${endDate}`,
        duration: duration,
        suggestions: suggestions || [],
        totalSuggestions: suggestions?.length || 0
      };

      console.log(`🔍 Find free time returning:`, JSON.stringify(result, null, 2));
      return JSON.stringify(result);

    } catch (error) {
      console.error('🔍 Find free time error:', error);
      console.error('🔍 Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      return JSON.stringify({
        success: false,
        error: 'Failed to find free time',
        details: error?.message || 'Unknown error'
      });
    }
  }

  /**
   * Search for specific events
   */
  async searchEvents(accessToken, { query, startDate, endDate }) {
    try {
      console.log(`🔎 Searching events: ${query}`);

      // Use the list events functionality with search query
      const listResult = await this.listEvents(accessToken, { query, startDate, endDate });
      const listData = JSON.parse(listResult);

      if (!listData.success) {
        return listResult;
      }

      // Filter events based on search query
      const searchTerms = query.toLowerCase();
      const filteredEvents = listData.events.filter(event => {
        return event.title.toLowerCase().includes(searchTerms) ||
               (event.description && event.description.toLowerCase().includes(searchTerms)) ||
               (event.location && event.location.toLowerCase().includes(searchTerms));
      });

      return JSON.stringify({
        success: true,
        action: 'search_events',
        query: query,
        totalEvents: listData.eventCount,
        matchingEvents: filteredEvents.length,
        events: filteredEvents
      });

    } catch (error) {
      console.error('🔎 Search events error:', error);
      return JSON.stringify({
        success: false,
        error: 'Failed to search calendar events',
        details: error.message
      });
    }
  }

  /**
   * Parse duration string into minutes
   */
  parseDuration(duration) {
    if (!duration) return 60; // Default 1 hour

    const durationMatch = duration.match(/(\d+)\s*(hour|minute|hr|min)/i);
    if (durationMatch) {
      const amount = parseInt(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      if (unit.startsWith('hour') || unit === 'hr') {
        return amount * 60;
      } else {
        return amount;
      }
    }
    return 60; // Default to 1 hour if can't parse
  }

  /**
   * Get existing events in a date range
   */
  async getEventsInRange(accessToken, startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      console.log(`📅 Getting events in range: ${start.toISOString()} to ${end.toISOString()}`);

      const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${start.toISOString()}&` +
        `timeMax=${end.toISOString()}&` +
        `singleEvents=true&` +
        `orderBy=startTime&` +
        `maxResults=100`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`📅 Calendar API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`📅 Calendar API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📅 Calendar API returned ${data.items?.length || 0} events`);
      return data.items || [];

    } catch (error) {
      console.error('🗓️ Error getting events:', error);
      return []; // Return empty array on error
    }
  }

  /**
   * Generate available time slots based on existing events and business hours
   */
  generateAvailableSlots(startDate, endDate, durationMinutes, existingEvents) {
    const suggestions = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Iterate through each day in the range
    let currentDate = new Date(start);
    while (currentDate <= end && suggestions.length < 5) {
      const daySlots = this.generateDaySlots(currentDate, durationMinutes, existingEvents);
      suggestions.push(...daySlots);

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Generate available slots for a specific day
   */
  generateDaySlots(date, durationMinutes, existingEvents) {
    const slots = [];
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // Define business hours based on day type
    let startHour, endHour;
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Weekend: 9 AM - 6 PM
      startHour = 9;
      endHour = 18;
    } else {
      // Weekday: 9 AM - 6 PM
      startHour = 9;
      endHour = 18;
    }

    // Generate hourly slots within business hours
    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

      // Check if this slot conflicts with existing events
      const hasConflict = existingEvents.some(event => {
        const eventStart = new Date(event.start?.dateTime || event.start?.date);
        const eventEnd = new Date(event.end?.dateTime || event.end?.date);

        // Check for overlap
        return (slotStart < eventEnd && slotEnd > eventStart);
      });

      if (!hasConflict) {
        slots.push({
          date: date.toDateString(),
          day: date.toLocaleDateString('en-US', { weekday: 'long' }),
          startTime: slotStart.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          endTime: slotEnd.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          isoStart: slotStart.toISOString(),
          isoEnd: slotEnd.toISOString()
        });

        // Limit to 2 slots per day to get variety across days
        if (slots.length >= 2) break;
      }
    }

    return slots;
  }

  /**
   * Parse event details from natural language query
   */
  parseEventFromQuery(query, { startDate, startTime, duration }) {
    // Basic event parsing - can be enhanced with NLP
    const now = new Date();
    const eventStart = startDate ? new Date(startDate) : now;

    if (startTime) {
      // Parse time like "2:00 PM" or "14:00"
      const timeMatch = startTime.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2] || '0');
        const ampm = timeMatch[3]?.toUpperCase();

        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;

        eventStart.setHours(hours, minutes, 0, 0);
      }
    }

    // Calculate end time (default 1 hour)
    const eventEnd = new Date(eventStart);
    if (duration) {
      const durationMatch = duration.match(/(\d+)\s*(hour|minute)/i);
      if (durationMatch) {
        const amount = parseInt(durationMatch[1]);
        const unit = durationMatch[2].toLowerCase();
        if (unit.startsWith('hour')) {
          eventEnd.setHours(eventEnd.getHours() + amount);
        } else {
          eventEnd.setMinutes(eventEnd.getMinutes() + amount);
        }
      }
    } else {
      eventEnd.setHours(eventEnd.getHours() + 1);
    }

    return {
      summary: query,
      start: {
        dateTime: eventStart.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: eventEnd.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }
}