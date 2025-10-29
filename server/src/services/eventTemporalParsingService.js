/**
 * Event Temporal Parsing Service
 *
 * Simplified temporal parsing specifically for event scheduling.
 * Keeps the correct parsed date/time without overriding it.
 */

import { parse as chronoParse } from 'chrono-node';
import { ChatOpenAI } from '@langchain/openai';

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
      console.log(`✅ Chrono parsed: ${chronoResult.phrase} → ${this.formatDate(chronoResult.startDate)} ${this.formatTime(chronoResult.startDate)} to ${this.formatTime(chronoResult.endDate)}`);
      return chronoResult;
    }

    // 3. Fallback to OpenAI for complex expressions
    try {
      const openAIResult = await this.parseWithOpenAI(userQuery, referenceDate);
      if (openAIResult) {
        console.log(`✅ OpenAI parsed: ${openAIResult.phrase} → ${this.formatDate(openAIResult.startDate)} ${this.formatTime(openAIResult.startDate)} to ${this.formatTime(openAIResult.endDate)}`);
        return openAIResult;
      }
    } catch (error) {
      console.warn('⚠️ OpenAI temporal parsing failed:', error.message);
    }

    // 4. Default range (next day at reasonable time)
    const defaultResult = this.getDefaultEventRange(referenceDate);
    console.log(`⚠️ Using default event range: ${this.formatDate(defaultResult.startDate)} ${this.formatTime(defaultResult.startDate)} to ${this.formatTime(defaultResult.endDate)}`);
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
      // Create a reference date in the user's timezone if provided
      let refDate = referenceDate;
      if (userTimezone) {
        // Convert reference date to user's timezone for more accurate parsing
        console.log(`🌍 Using user timezone: ${userTimezone} for chrono parsing`);
        refDate = new Date(referenceDate.toLocaleString("en-US", {timeZone: userTimezone}));
      }

      const results = chronoParse(userQuery, refDate);

      if (results.length === 0) {
        return null;
      }

      // Use the first result
      const result = results[0];

      if (result.start) {
        const startDate = result.start.date();

        // Check if chrono found a specific time (has hour component)
        const hasSpecificTime = result.start.get('hour') !== undefined;

        let endDate;
        if (hasSpecificTime) {
          // For specific times like "Friday at 7 pm", add 1 hour duration
          endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
          console.log(`🕒 Specific time detected: ${startDate.toISOString()} + 1 hour = ${endDate.toISOString()}`);
        } else {
          // For date-only like "Friday", set to 7 PM - 8 PM same day
          const eventStart = new Date(startDate);
          eventStart.setHours(19, 0, 0, 0); // 7 PM
          const eventEnd = new Date(eventStart);
          eventEnd.setHours(20, 0, 0, 0); // 8 PM

          console.log(`🕒 Date-only detected: Setting to 7-8 PM on ${eventStart.toDateString()}`);
          return {
            startDate: eventStart,
            endDate: eventEnd,
            phrase: result.text,
            source: 'chrono-enhanced'
          };
        }

        return {
          startDate,
          endDate,
          phrase: result.text,
          source: 'chrono'
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
}

export default EventTemporalParsingService;