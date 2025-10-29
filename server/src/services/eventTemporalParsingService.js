/**
 * Event Temporal Parsing Service
 *
 * Simplified temporal parsing specifically for event scheduling.
 * Keeps the correct parsed date/time without overriding it.
 */

import { parse as chronoParse } from 'chrono-node';
import { ChatOpenAI } from '@langchain/openai';
import moment from 'moment-timezone';

export class EventTemporalParsingService {
  /**
   * Parse user query for event scheduling and return exact start/end times
   */
  static async parseEventTemporal(userQuery, referenceDate = new Date(), userTimezone = null) {
    console.log(`🕒 Parsing event temporal: "${userQuery}"`);

    // 1. Check for vague timeframes first and return appropriate ranges
    const vagueResult = this.parseVagueTimeframe(userQuery, referenceDate);
    if (vagueResult) {
      console.log(`✅ Vague timeframe detected: ${vagueResult.phrase} → ${this.formatDate(vagueResult.startDate)} to ${this.formatDate(vagueResult.endDate)} (${Math.round((vagueResult.endDate - vagueResult.startDate) / (1000 * 60 * 60 * 24))} days)`);
      return vagueResult;
    }

    // 2. Try chrono-node for specific times
    const chronoResult = this.parseWithChrono(userQuery, referenceDate, userTimezone);
    if (chronoResult) {
      console.log(`✅ Chrono parsed: ${chronoResult.phrase} → ${chronoResult.startDate} to ${chronoResult.endDate}`);
      return chronoResult;
    }

    // 3. Fallback to OpenAI for complex expressions
    try {
      const openAIResult = await this.parseWithOpenAI(userQuery, referenceDate);
      if (openAIResult) {
        console.log(`✅ OpenAI parsed: ${openAIResult.phrase} → ${openAIResult.startDate} to ${openAIResult.endDate}`);
        return openAIResult;
      }
    } catch (error) {
      console.warn('⚠️ OpenAI temporal parsing failed:', error.message);
    }

    // 4. Default range (next day at reasonable time)
    const defaultResult = this.getDefaultEventRange(referenceDate);
    console.log(`⚠️ Using default event range: ${defaultResult.startDate} to ${defaultResult.endDate}`);
    return defaultResult;
  }

  /**
   * Parse vague timeframes and return appropriate date ranges for calendar availability checking
   */
  static parseVagueTimeframe(userQuery, referenceDate) {
    const query = userQuery.toLowerCase();

    // "next week" - Monday to Friday of next week
    if (query.includes('next week')) {
      const nextMonday = new Date(referenceDate);
      const daysUntilNextMonday = ((7 - referenceDate.getDay() + 1) % 7) || 7;
      nextMonday.setDate(referenceDate.getDate() + daysUntilNextMonday);
      nextMonday.setHours(9, 0, 0, 0); // Start at 9 AM Monday

      const nextFriday = new Date(nextMonday);
      nextFriday.setDate(nextMonday.getDate() + 4);
      nextFriday.setHours(17, 0, 0, 0); // End at 5 PM Friday

      return {
        startDate: nextMonday,
        endDate: nextFriday,
        phrase: 'next week',
        source: 'vague-range'
      };
    }

    // "next weekend" - Saturday and Sunday of next weekend (check before "next week")
    if (query.includes('next weekend')) {
      const nextSaturday = new Date(referenceDate);
      const daysUntilNextSaturday = ((6 - referenceDate.getDay() + 7) % 7) || 7;
      nextSaturday.setDate(referenceDate.getDate() + daysUntilNextSaturday);
      nextSaturday.setHours(10, 0, 0, 0); // 10 AM Saturday

      const nextSunday = new Date(nextSaturday);
      nextSunday.setDate(nextSaturday.getDate() + 1);
      nextSunday.setHours(20, 0, 0, 0); // 8 PM Sunday

      return {
        startDate: nextSaturday,
        endDate: nextSunday,
        phrase: 'next weekend',
        source: 'vague-range'
      };
    }

    // "this weekend" - This Saturday and Sunday (check before "this week")
    if (query.includes('this weekend')) {
      const thisSaturday = new Date(referenceDate);
      const daysUntilSaturday = (6 - referenceDate.getDay() + 7) % 7;
      thisSaturday.setDate(referenceDate.getDate() + daysUntilSaturday);
      thisSaturday.setHours(10, 0, 0, 0);

      const thisSunday = new Date(thisSaturday);
      thisSunday.setDate(thisSaturday.getDate() + 1);
      thisSunday.setHours(20, 0, 0, 0);

      return {
        startDate: thisSaturday,
        endDate: thisSunday,
        phrase: 'this weekend',
        source: 'vague-range'
      };
    }

    // "this week" - Rest of this week (tomorrow to Friday)
    if (query.includes('this week')) {
      const tomorrow = new Date(referenceDate);
      tomorrow.setDate(referenceDate.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      const thisFriday = new Date(referenceDate);
      const daysUntilFriday = (5 - referenceDate.getDay() + 7) % 7;
      thisFriday.setDate(referenceDate.getDate() + daysUntilFriday);
      thisFriday.setHours(17, 0, 0, 0);

      return {
        startDate: tomorrow,
        endDate: thisFriday,
        phrase: 'this week',
        source: 'vague-range'
      };
    }

    return null; // No vague timeframe detected
  }

  /**
   * Parse using chrono-node library (fixed for events)
   */
  static parseWithChrono(userQuery, referenceDate, userTimezone = null) {
    try {
      console.log(`🌍 Using user timezone: ${userTimezone} for chrono parsing`);

      const results = chronoParse(userQuery, referenceDate);

      if (results.length === 0) {
        return null;
      }

      // Use the first result
      const result = results[0];

      if (result.start) {
        // Get the parsed date components from chrono
        const year = result.start.get('year');
        const month = result.start.get('month') || 1; // chrono uses 1-based months
        const day = result.start.get('day');
        const hour = result.start.get('hour');
        const minute = result.start.get('minute') || 0;

        // Check if chrono found a specific time (has hour component)
        const hasSpecificTime = hour !== undefined;

        let startDate, endDate;

        if (hasSpecificTime) {
          // Create moment in user's timezone with the parsed components
          if (userTimezone) {
            const momentInUserTz = moment.tz({
              year,
              month: month - 1, // moment uses 0-based months
              day,
              hour,
              minute
            }, userTimezone);

            startDate = momentInUserTz.toDate();
            endDate = momentInUserTz.add(1, 'hour').toDate();
          } else {
            // No timezone specified, use system local
            startDate = new Date(year, month - 1, day, hour, minute);
            endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
          }

          console.log(`🕒 Specific time detected: ${startDate.toISOString()} + 1 hour = ${endDate.toISOString()}`);
        } else {
          // For date-only like "Friday", set to 7 PM - 8 PM same day in user timezone
          if (userTimezone) {
            const startMoment = moment.tz({
              year,
              month: month - 1,
              day,
              hour: 19, // 7 PM
              minute: 0
            }, userTimezone);

            const endMoment = moment.tz({
              year,
              month: month - 1,
              day,
              hour: 20, // 8 PM
              minute: 0
            }, userTimezone);

            startDate = startMoment.toDate();
            endDate = endMoment.toDate();
          } else {
            startDate = new Date(year, month - 1, day, 19, 0); // 7 PM
            endDate = new Date(year, month - 1, day, 20, 0); // 8 PM
          }

          console.log(`🕒 Date-only detected: Setting to 7-8 PM on ${startDate.toDateString()}`);
          return {
            startDate,
            endDate,
            phrase: result.text,
            source: 'chrono-enhanced',
            userTimezone
          };
        }

        return {
          startDate,
          endDate,
          phrase: result.text,
          source: 'chrono',
          userTimezone
        };
      }
    } catch (error) {
      console.error('Chrono parsing error:', error);
    }

    return null;
  }

  /**
   * Parse using OpenAI for complex expressions
   */
  static async parseWithOpenAI(userQuery, referenceDate) {
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0,
      configuration: {
        fetch: (await import('node-fetch')).default
      }
    });

    const currentDate = this.formatDate(referenceDate);
    const currentDay = referenceDate.toLocaleDateString('en-US', { weekday: 'long' });

    const prompt = `Today is ${currentDay}, ${currentDate}.

Parse "${userQuery}" into an event start and end time.

Return only valid JSON, no markdown or formatting:
{
  "startDate": "YYYY-MM-DDTHH:MM:SS",
  "endDate": "YYYY-MM-DDTHH:MM:SS",
  "phrase": "simplified phrase"
}

Default to 1 hour duration if not specified.`;

    try {
      const response = await llm.invoke(prompt);
      const parsed = JSON.parse(response.content.trim());

      if (parsed.startDate && parsed.endDate) {
        return {
          startDate: new Date(parsed.startDate),
          endDate: new Date(parsed.endDate),
          phrase: parsed.phrase,
          source: 'openai'
        };
      }
    } catch (error) {
      console.error('OpenAI parsing error:', error);
    }

    return null;
  }

  /**
   * Get default event range (tomorrow 7-8 PM)
   */
  static getDefaultEventRange(referenceDate) {
    const tomorrow = new Date(referenceDate.getTime() + 24 * 60 * 60 * 1000);
    const startDate = new Date(tomorrow);
    startDate.setHours(19, 0, 0, 0); // 7 PM

    const endDate = new Date(startDate);
    endDate.setHours(20, 0, 0, 0); // 8 PM

    return {
      startDate,
      endDate,
      phrase: 'tomorrow evening',
      source: 'default'
    };
  }

  /**
   * Format date for display
   */
  static formatDate(date) {
    return date.toLocaleDateString('en-US');
  }

  /**
   * Format time for display
   */
  static formatTime(date) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Format date-time in user's timezone as readable string
   */
  static formatUserReadableDateTime(date, userTimezone) {
    if (!userTimezone) {
      return date.toISOString();
    }

    // Simple format in user's timezone
    return date.toLocaleString('en-US', {
      timeZone: userTimezone,
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}

export default EventTemporalParsingService;