/**
 * Event Scheduling LangChain Tool
 *
 * Handles event scheduling requests with intelligent attendee resolution,
 * time slot suggestions, and integration with Google Calendar.
 */

import { Tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import AgentMemoryService from '../services/agentMemoryService.js';
import { GoogleCalendarTool } from './googleCalendarTool.js';

export class EventSchedulingTool extends Tool {
  name = 'event_scheduling';
  description = `Use this tool for event scheduling requests with attendee management and time coordination.

  This tool handles:
  - Parsing scheduling requests with event details and attendees
  - Resolving attendee email addresses from agent memory and family data
  - Creating pending calendar events for user confirmation
  - Providing time slot suggestions for vague scheduling requests
  - Storing scheduling context for follow-up interactions

  Input format: {"event": "event_name", "attendee": "attendee_name", "timeframe": "when"}

  Example inputs:
  - {"event": "dinner", "attendee": "Caroline", "timeframe": "Friday at 7 pm"}
  - {"event": "golf", "attendee": "Mark", "timeframe": "this weekend"}
  - {"event": "meeting", "attendee": "Dr. Smith", "timeframe": "next week"}
  - {"event": "lunch", "attendee": "mom", "timeframe": "tomorrow"}`;

  schema = {
    type: 'object',
    properties: {
      event: {
        type: 'string',
        description: 'The event or activity to schedule (e.g., "dinner", "meeting", "golf")'
      },
      attendee: {
        type: 'string',
        description: 'The person to schedule with (name, relationship, or role)'
      },
      timeframe: {
        type: 'string',
        description: 'When to schedule (e.g., "Friday at 7 pm", "this weekend", "next week")'
      }
    },
    required: ['event', 'attendee', 'timeframe']
  };

  constructor({ userId }) {
    super();
    console.log(`📅 EventSchedulingTool constructor - userId:`, userId);
    this.userId = userId;
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
  }

  /**
   * Execute event scheduling operation - SIMPLIFIED APPROACH
   */
  async _call(input) {
    console.log(`📅 EVENT SCHEDULING TOOL _call() EXECUTED!`);
    console.log(`📅 Input received:`, JSON.stringify(input, null, 2));

    try {
      // Get the user's message - could come from different sources
      const userMessage = input?.query || input?.message || JSON.stringify(input);
      console.log(`📅 User message: "${userMessage}"`);

      if (!userMessage || userMessage === '{}') {
        return JSON.stringify({
          success: false,
          error: 'No scheduling message provided'
        });
      }

      // STEP 1: Get temporal information from EventTemporalParsingService
      const { EventTemporalParsingService } = await import('../services/eventTemporalParsingService.js');

      // Get user timezone
      let userTimezone;
      if (this.userId) {
        try {
          const { data: user } = await this.supabase
            .from('users')
            .select('timezone')
            .eq('id', this.userId)
            .single();
          userTimezone = user?.timezone;
        } catch (error) {
          console.log(`⚠️ Could not fetch user timezone`);
        }
      }

      const temporal = await EventTemporalParsingService.parseEventTemporal(userMessage, new Date(), userTimezone);
      console.log(`🕒 EventTemporalParsingService result:`, temporal);

      // STEP 2: Get event details from LLM (NO DATE/TIME PARSING)
      const eventDetails = await this.llmParseEventDetails(userMessage);
      console.log(`🤖 LLM event details:`, eventDetails);

      if (!eventDetails.success) {
        return JSON.stringify({
          success: false,
          error: 'Could not parse event details',
          details: eventDetails.error
        });
      }

      // STEP 3: Resolve attendees
      const attendeesInfo = [];
      if (eventDetails.attendees && Array.isArray(eventDetails.attendees)) {
        for (const attendeeName of eventDetails.attendees) {
          const attendeeInfo = await this.resolveAttendee(attendeeName);
          attendeesInfo.push(attendeeInfo);
        }
      }
      console.log(`👤 Attendees resolution result:`, attendeesInfo);

      // STEP 4: Combine temporal and event data
      // Override time type if original message contains vague timeframe words
      const isVagueTimeframe = this.detectVagueTimeframe(userMessage);
      const finalTimeType = isVagueTimeframe ? 'vague' : (temporal.startDate ? 'specific' : 'vague');

      const combinedData = {
        event: eventDetails.event,
        attendees: attendeesInfo,
        timeInfo: {
          type: finalTimeType,
          originalTimeframe: temporal.phrase,
          hasSpecificTime: !!temporal.startDate && !isVagueTimeframe,
          startTime: isVagueTimeframe ? null : (temporal.startDate?.toISOString() || null),
          endTime: isVagueTimeframe ? null : (temporal.endDate?.toISOString() || null),
          duration: eventDetails.duration || { value: 1, unit: 'hours' },
          suggestedDateRange: isVagueTimeframe ? {
            start: temporal.startDate?.toISOString() || null,
            end: temporal.endDate?.toISOString() || null
          } : null
        },
        originalRequest: userMessage
      };

      console.log(`🔄 Combined data:`, combinedData);

      // STEP 5: Store in database (create or update existing)
      const pendingEvent = await this.createOrUpdatePendingEvent(combinedData);

      // STEP 6: Generate response
      const response = await this.generateSchedulingResponse(pendingEvent, combinedData);

      return JSON.stringify(response);

    } catch (error) {
      console.error('📅 Event scheduling tool error:', error);
      return JSON.stringify({
        success: false,
        error: 'Event scheduling failed',
        details: error.message
      });
    }
  }

  /**
   * Use LLM to parse event details only (NO DATE/TIME PARSING)
   */
  async llmParseEventDetails(message) {
    try {
      console.log(`🤖 Parsing event details with LLM: "${message}"`);

      const prompt = `Parse this scheduling request and extract ONLY the event details. DO NOT extract any date or time information.

Message: "${message}"

Return ONLY valid JSON (no markdown, no code blocks, no explanation) with these fields:
{
  "event": "the activity/meeting name (e.g., 'dinner', 'meeting', 'coffee')",
  "attendees": ["array", "of", "attendee", "names"],
  "duration": {
    "value": number,
    "unit": "hours" or "minutes"
  },
  "success": true
}

CRITICAL INSTRUCTIONS:
- DO NOT extract any date, time, or when information - that will be handled separately
- DO NOT make anything up or guess
- If you cannot determine a value with certainty, set it to null
- Parse ALL attendees mentioned (could be multiple people)
- If duration not specified, default to 1 hour
- Only extract information that is explicitly stated or clearly implied

If you cannot parse the request, return: {"success": false, "error": "reason"}`;

      // Use LangChain ChatOpenAI with node-fetch configuration
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.1,
        maxTokens: 300,
        configuration: {
          fetch: (await import('node-fetch')).default
        }
      });

      const response = await llm.invoke(prompt);
      const result = JSON.parse(response.content);
      console.log(`🤖 LLM event details result:`, result);

      return result;

    } catch (error) {
      console.error('🤖 LLM event details parsing error:', error);
      return {
        success: false,
        error: `Failed to parse event details: ${error.message}`
      };
    }
  }


  /**
   * Resolve attendee information from agent memory and family data
   */
  async resolveAttendee(attendeeName) {
    try {
      console.log(`👤 Resolving attendee: "${attendeeName}"`);

      // Search agent memory for contacts and family members
      const memoryResult = await AgentMemoryService.getRelevantMemories(this.userId, attendeeName);

      if (memoryResult.success && memoryResult.memories.length > 0) {
        for (const memory of memoryResult.memories) {
          if (memory.value && typeof memory.value === 'object') {
            const data = memory.value;

            // Check for contact info
            if (data.context_type === 'contact_info' && data.name && data.email) {
              if (data.name.toLowerCase().includes(attendeeName.toLowerCase())) {
                return {
                  name: data.name,
                  email: data.email,
                  phone: data.phone,
                  role: data.role,
                  source: 'agent_memory_contact'
                };
              }
            }

            // Check for family info
            if (data.context_type === 'family_info' && data.name && data.email) {
              if (data.name.toLowerCase().includes(attendeeName.toLowerCase())) {
                return {
                  name: data.name,
                  email: data.email,
                  relationship: data.relationship,
                  source: 'agent_memory_family'
                };
              }
            }
          }
        }
      }

      // Search Supabase family_members table
      const { data: familyMembers, error: familyError } = await this.supabase
        .from('family_members')
        .select('name, email, family_relationship')
        .ilike('name', `%${attendeeName}%`);

      if (!familyError && familyMembers && familyMembers.length > 0) {
        const member = familyMembers[0];
        if (member.email) {
          return {
            name: member.name,
            email: member.email,
            relationship: member.family_relationship,
            source: 'supabase_family'
          };
        }
      }

      // If no email found, return basic info
      return {
        name: attendeeName,
        email: null,
        source: 'input_only',
        needs_email: true
      };

    } catch (error) {
      console.error('👤 Error resolving attendee:', error);
      return {
        name: attendeeName,
        email: null,
        source: 'error',
        error: error.message
      };
    }
  }


  /**
   * Create or update a pending event record in Supabase
   * Checks for recent pending events to avoid duplicates
   */
  async createOrUpdatePendingEvent({ event, attendees, timeInfo, originalRequest }) {
    try {
      // Format attendees array for database
      const attendeesData = attendees.map(attendee => ({
        name: attendee.name,
        email: attendee.email || null
      }));

      // Check for recent pending events for the same user/event/attendee combination
      const existingEvent = await this.findRecentPendingEvent(event, attendees);

      const pendingEventData = {
        user_id: this.userId,
        event_title: event,
        event_description: event,
        attendees: attendeesData,
        timeframe: timeInfo.originalTimeframe,
        time_type: timeInfo.type,
        original_request: originalRequest,
        status: 'pending',
        start_time: timeInfo.startTime || null,
        end_time: timeInfo.endTime || null
      };

      if (existingEvent) {
        // Update existing event
        console.log(`📝 Updating existing pending event:`, existingEvent.id);
        const { data, error } = await this.supabase
          .from('pending_calendar_events')
          .update(pendingEventData)
          .eq('id', existingEvent.id)
          .select()
          .single();

        if (error) throw error;
        console.log(`📝 Updated pending event:`, data.id);
        return data;
      } else {
        // Create new event
        console.log(`📝 Creating new pending event`);
        const { data, error } = await this.supabase
          .from('pending_calendar_events')
          .insert(pendingEventData)
          .select()
          .single();

        if (error) throw error;
        console.log(`📝 Created pending event:`, data.id);
        return data;
      }

    } catch (error) {
      console.error('📝 Error creating/updating pending event:', error);
      throw error;
    }
  }

  /**
   * Find recent pending event for the same context to avoid duplicates
   */
  async findRecentPendingEvent(eventTitle, attendees) {
    try {
      const attendeeNames = attendees.map(a => a.name);

      // Look for pending events from the last hour with same event and attendees
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { data, error } = await this.supabase
        .from('pending_calendar_events')
        .select('*')
        .eq('user_id', this.userId)
        .eq('event_title', eventTitle)
        .eq('status', 'pending')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.warn('Error finding recent pending events:', error);
        return null;
      }

      // Check if any of the recent events have matching attendees
      for (const event of data || []) {
        const eventAttendeeNames = event.attendees.map(a => a.name);
        const sameAttendees = attendeeNames.length === eventAttendeeNames.length &&
          attendeeNames.every(name => eventAttendeeNames.includes(name));

        if (sameAttendees) {
          console.log(`📝 Found recent matching pending event:`, event.id);
          return event;
        }
      }

      return null;
    } catch (error) {
      console.warn('Error finding recent pending events:', error);
      return null;
    }
  }

  /**
   * Generate appropriate scheduling response based on time specificity
   * Returns simple data object like other tools (orchestrator handles structured wrapping)
   */
  async generateSchedulingResponse(pendingEvent, combinedData) {
    const timeInfo = combinedData.timeInfo;
    const attendeesWithEmail = pendingEvent.attendees.filter(a => a.email);
    const hasAllEmails = attendeesWithEmail.length === pendingEvent.attendees.length;

    let nextAction, missingInfo = [];

    if (timeInfo.type === 'specific' && hasAllEmails) {
      // Ready for calendar creation
      nextAction = 'confirm_and_create';

    } else if (timeInfo.type === 'specific' && !hasAllEmails) {
      // Missing email addresses
      nextAction = 'request_email';
      missingInfo = ['attendee_emails'];

    } else if (timeInfo.type === 'vague' && hasAllEmails) {
      // Time suggestions needed
      nextAction = 'suggest_times';

    } else {
      // Need both email and specific time
      nextAction = 'request_details';
      missingInfo = ['attendee_emails', 'specific_time'];
    }

    // Return simple data object like other tools (let orchestrator handle structured wrapping)
    const responseData = {
      success: true,
      source: 'event_scheduling',
      action: 'event_scheduling',
      event_id: pendingEvent.id,
      event_title: pendingEvent.event_title,
      attendees: pendingEvent.attendees,
      timeframe: pendingEvent.timeframe,
      time_type: timeInfo.type,
      start_time: pendingEvent.start_time,
      end_time: pendingEvent.end_time,
      ready_for_calendar: timeInfo.type === 'specific' && hasAllEmails,
      next_action: nextAction,
      missing_info: missingInfo.length > 0 ? missingInfo : null
    };

    // Add time suggestions if applicable
    if (timeInfo.type === 'vague') {
      // Try to get real calendar availability, fall back to static suggestions
      try {
        const calendarSuggestions = await this.getCalendarAvailability(combinedData.timeInfo);
        if (calendarSuggestions && calendarSuggestions.length > 0) {
          responseData.time_suggestions = calendarSuggestions;
          responseData.suggestions_source = 'calendar';
        } else {
          responseData.time_suggestions = this.generateTimeSuggestions(pendingEvent.timeframe);
          responseData.suggestions_source = 'static';
        }
      } catch (error) {
        console.error('📅 Calendar availability check failed:', error);
        responseData.time_suggestions = this.generateTimeSuggestions(pendingEvent.timeframe);
        responseData.suggestions_source = 'static_fallback';
        responseData.calendar_error = error.message.includes('not connected') ?
          'Google Calendar not connected. Connect it in settings for personalized suggestions.' :
          'Calendar check failed, showing default suggestions.';
      }
    }

    return responseData;
  }

  /**
   * Get calendar availability using GoogleCalendarTool
   */
  async getCalendarAvailability(timeInfo) {
    try {
      if (!timeInfo.suggestedDateRange || !timeInfo.suggestedDateRange.start || !timeInfo.suggestedDateRange.end) {
        throw new Error('No date range available for calendar check');
      }

      // Create GoogleCalendarTool instance
      const calendarTool = new GoogleCalendarTool({ userId: this.userId });

      // Call find_free_time with the suggested date range
      const input = {
        action: 'find_free_time',
        query: `Find free time for ${timeInfo.duration?.value || 1} ${timeInfo.duration?.unit || 'hour'} meeting`,
        startDate: timeInfo.suggestedDateRange.start,
        endDate: timeInfo.suggestedDateRange.end,
        duration: `${timeInfo.duration?.value || 1} ${timeInfo.duration?.unit || 'hour'}`
      };

      console.log(`📅 Calling GoogleCalendarTool with:`, input);
      const result = await calendarTool._call(input);
      const calendarData = JSON.parse(result);

      if (!calendarData.success) {
        throw new Error(calendarData.error || 'Calendar check failed');
      }

      // Convert GoogleCalendarTool format to EventSchedulingTemplate format
      return this.convertCalendarSuggestions(calendarData.suggestions);

    } catch (error) {
      console.error('📅 getCalendarAvailability error:', error);
      throw error;
    }
  }

  /**
   * Convert GoogleCalendarTool suggestions to EventSchedulingTemplate format
   */
  convertCalendarSuggestions(calendarSuggestions) {
    if (!calendarSuggestions || calendarSuggestions.length === 0) {
      return [];
    }

    // Group suggestions by day
    const suggestionsByDay = {};

    calendarSuggestions.forEach(slot => {
      const day = slot.day;
      if (!suggestionsByDay[day]) {
        suggestionsByDay[day] = {
          day: day,
          date: slot.date,
          times: []
        };
      }
      suggestionsByDay[day].times.push(`${slot.startTime}`);
    });

    return Object.values(suggestionsByDay);
  }

  /**
   * Detect if a message contains vague timeframe words that should trigger calendar availability checking
   */
  detectVagueTimeframe(message) {
    const vaguePatterns = [
      /\bthis weekend\b/i,
      /\bnext weekend\b/i,
      /\bthis week\b/i,
      /\bnext week\b/i,
      /\bsometime\b/i,
      /\bsoon\b/i,
      /\bwhen.*available\b/i,
      /\bwhen.*free\b/i,
      /\bflexible\b/i
    ];

    return vaguePatterns.some(pattern => pattern.test(message));
  }

  /**
   * Generate time slot suggestions for vague timeframes
   * TODO: Replace with Google Calendar availability checking
   */
  generateTimeSuggestions(timeframe) {
    const now = new Date();
    const suggestions = [];

    if (timeframe.toLowerCase().includes('weekend')) {
      // Weekend suggestions
      const nextSat = new Date(now);
      nextSat.setDate(now.getDate() + (6 - now.getDay()));

      suggestions.push({
        day: 'Saturday',
        date: nextSat.toDateString(),
        times: ['10:00 AM', '2:00 PM', '6:00 PM']
      });

      const nextSun = new Date(nextSat);
      nextSun.setDate(nextSat.getDate() + 1);

      suggestions.push({
        day: 'Sunday',
        date: nextSun.toDateString(),
        times: ['11:00 AM', '3:00 PM', '5:00 PM']
      });

    } else if (timeframe.toLowerCase().includes('week')) {
      // Weekday suggestions
      const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      const times = ['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM'];

      for (let i = 0; i < 3; i++) {
        const day = new Date(now);
        day.setDate(now.getDate() + i + 1);

        if (day.getDay() >= 1 && day.getDay() <= 5) {
          suggestions.push({
            day: weekdays[day.getDay() - 1],
            date: day.toDateString(),
            times: times
          });
        }
      }
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }
}

export default EventSchedulingTool;