/**
 * Temporal Parsing Service
 *
 * Simple temporal parsing using chrono-node with OpenAI fallback for edge cases.
 */

import { parse as chronoParse } from 'chrono-node';
import { ChatOpenAI } from '@langchain/openai';

export class TemporalParsingService {
  /**
   * Parse user query for temporal context and return date ranges
   */
  static async parseTemporalQuery(userQuery, referenceDate = new Date(), userTimezone = null) {
    console.log(`🕒 Parsing temporal query: "${userQuery}"`);

    // 1. Try chrono-node first (handles 90% of cases)
    const chronoResult = this.parseWithChrono(userQuery, referenceDate, userTimezone);
    if (chronoResult) {
      console.log(`✅ Chrono parsed: ${chronoResult.phrase} → ${this.formatDate(chronoResult.startDate)} to ${this.formatDate(chronoResult.endDate)}`);
      return chronoResult;
    }

    // 2. Fallback to OpenAI for complex expressions
    try {
      const openAIResult = await this.parseWithOpenAI(userQuery, referenceDate);
      if (openAIResult) {
        console.log(`✅ OpenAI parsed: ${openAIResult.phrase} → ${this.formatDate(openAIResult.startDate)} to ${this.formatDate(openAIResult.endDate)}`);
        return openAIResult;
      }
    } catch (error) {
      console.warn('⚠️ OpenAI temporal parsing failed:', error.message);
    }

    // 3. Default range
    const defaultResult = this.getDefaultRange(referenceDate);
    console.log(`⚠️ Using default range: ${this.formatDate(defaultResult.startDate)} to ${this.formatDate(defaultResult.endDate)}`);
    return defaultResult;
  }

  /**
   * Parse using chrono-node library
   */
  static parseWithChrono(userQuery, referenceDate, userTimezone = null) {
    try {
      const query = userQuery.toLowerCase();

      // Check for complex temporal expressions that need OpenAI fallback
      if (this.isComplexTemporalExpression(query)) {
        console.log('🔍 Complex temporal expression detected, skipping chrono-node');
        return null; // Will trigger OpenAI fallback
      }

      // Handle specific day-related queries that chrono-node doesn't handle well in context
      // Check these BEFORE chrono parsing to override its behavior
      if (query.includes('tomorrow') && !query.includes('and')) {
        return TemporalParsingService.getSingleDayRange(referenceDate, 'tomorrow', userTimezone);
      }

      if (query.includes('today') && !query.includes('and')) {
        return TemporalParsingService.getSingleDayRange(referenceDate, 'today', userTimezone);
      }

      if (query.includes('yesterday') && !query.includes('and')) {
        return TemporalParsingService.getSingleDayRange(referenceDate, 'yesterday', userTimezone);
      }

      // Handle specific week-related queries that chrono-node doesn't handle well
      // Check these BEFORE chrono parsing to override its behavior
      if (query.includes('this week') && !query.includes('and')) {
        return TemporalParsingService.getWeekRange(referenceDate, 'this', userTimezone);
      }

      if ((query.includes('rest of the week') || query.includes('rest of this week')) && !query.includes('and')) {
        return TemporalParsingService.getRestOfWeekRange(referenceDate, userTimezone);
      }

      if (query.includes('last week') && !query.includes('and')) {
        return TemporalParsingService.getWeekRange(referenceDate, 'last', userTimezone);
      }

      if (query.includes('next week') && !query.includes('and')) {
        return TemporalParsingService.getWeekRange(referenceDate, 'next', userTimezone);
      }

      const results = chronoParse(userQuery, referenceDate);

      if (results.length === 0) {
        return null;
      }

      // Single result
      if (results.length === 1) {
        const result = results[0];

        if (result.start && result.end) {
          return {
            startDate: result.start.date(),
            endDate: result.end.date(),
            phrase: result.text,
            source: 'chrono'
          };
        }

        if (result.start) {
          // Expand single date to appropriate range
          const startDate = result.start.date();
          const endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 1);

          return {
            startDate,
            endDate,
            phrase: result.text,
            source: 'chrono'
          };
        }
      }

      // Multiple results - combine them
      if (results.length > 1) {
        const dates = results.map(r => r.start?.date()).filter(Boolean);
        if (dates.length > 0) {
          const startDate = new Date(Math.min(...dates));
          const endDate = new Date(Math.max(...dates));
          endDate.setDate(endDate.getDate() + 1); // Extend to end of last day

          return {
            startDate,
            endDate,
            phrase: results.map(r => r.text).join(' and '),
            source: 'chrono-combined'
          };
        }
      }
    } catch (error) {
      console.error('Chrono parsing error:', error);
    }

    return null;
  }

  /**
   * Check if query contains complex temporal expressions that need OpenAI
   */
  static isComplexTemporalExpression(query) {
    const complexPatterns = [
      /rest of.*and.*week/i,     // "rest of this week and next week"
      /this week.*and.*next/i,    // "this week and next week"
      /week.*and.*week/i,         // "this week and next week"
      /rest.*week.*and/i,         // "rest of the week and next"
      /through.*week/i            // "through next week"
    ];

    return complexPatterns.some(pattern => pattern.test(query));
  }

  /**
   * Get single day range
   */
  static getSingleDayRange(referenceDate, which, userTimezone = null) {
    // Get the current time in the user's timezone using proper US format
    const userTimeString = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(referenceDate);

    // Convert MM/DD/YYYY to YYYY-MM-DD format for Date constructor
    const [month, day, year] = userTimeString.split('/');
    const isoDateString = `${year}-${month}-${day}T00:00:00`;
    const now = new Date(isoDateString);
    console.log(`🕒 Single day range for "${which}" - using timezone ${userTimezone}: server time ${referenceDate.toISOString()} -> user date ${userTimeString} -> ${now.toISOString()}`);

    let startDate, endDate;

    if (which === 'today') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (which === 'tomorrow') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (which === 'yesterday') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    }

    console.log(`🕒 ${which} calculation: start=${startDate.toDateString()}, end=${endDate.toDateString()}`);

    return {
      startDate,
      endDate,
      phrase: which,
      source: 'chrono-enhanced'
    };
  }

  /**
   * Get week range (Monday through Sunday)
   */
  static getWeekRange(referenceDate, which, userTimezone = null) {
    // Get the current time in the user's timezone using proper US format
    const userTimeString = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(referenceDate);

    // Convert MM/DD/YYYY to YYYY-MM-DD format for Date constructor
    const [month, day, year] = userTimeString.split('/');
    const isoDateString = `${year}-${month}-${day}T00:00:00`;
    const now = new Date(isoDateString);
    console.log(`🕒 Using timezone ${userTimezone}: server time ${referenceDate.toISOString()} -> user date ${userTimeString} -> ${now.toISOString()}`);
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    let startDate, endDate;

    if (which === 'this') {
      // Monday through Sunday of current week
      // If today is Sunday (0), go back 6 days to get Monday
      // If today is Monday (1), offset is 0 (stay on Monday)
      // If today is Tuesday (2), go back 1 day to get Monday
      // etc.
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

      startDate = new Date(now);
      startDate.setDate(now.getDate() + mondayOffset);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      console.log(`🕒 This week calculation: currentDay=${currentDay}, mondayOffset=${mondayOffset}, start=${startDate.toDateString()}, end=${endDate.toDateString()}`);
    } else if (which === 'next') {
      // Monday through Sunday of next week
      const nextMondayOffset = currentDay === 0 ? 1 : 8 - currentDay;
      startDate = new Date(now);
      startDate.setDate(now.getDate() + nextMondayOffset);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      console.log(`🕒 Next week calculation: currentDay=${currentDay}, nextMondayOffset=${nextMondayOffset}, start=${startDate.toDateString()}, end=${endDate.toDateString()}`);
    } else if (which === 'last') {
      // Monday through Sunday of last week
      const lastMondayOffset = currentDay === 0 ? -13 : -currentDay - 6;

      startDate = new Date(now);
      startDate.setDate(now.getDate() + lastMondayOffset);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      console.log(`🕒 Last week calculation: currentDay=${currentDay}, lastMondayOffset=${lastMondayOffset}, start=${startDate.toDateString()}, end=${endDate.toDateString()}`);
    }

    return {
      startDate,
      endDate,
      phrase: `${which} week`,
      source: 'chrono-enhanced'
    };
  }

  /**
   * Get rest of week range (now through Sunday)
   */
  static getRestOfWeekRange(referenceDate, userTimezone = null) {
    // Create timezone-aware date if timezone is provided
    let now;
    if (userTimezone) {
      const options = { timeZone: userTimezone };
      now = new Date(referenceDate.toLocaleString('en-US', options));
      console.log(`🕒 Rest of week - using user timezone ${userTimezone}: ${now.toISOString()}`);
    } else {
      now = new Date(referenceDate);
      console.log(`🕒 Rest of week - using server timezone: ${now.toISOString()}`);
    }
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const startDate = new Date(now);

    // End date is end of Sunday
    const daysUntilSunday = currentDay === 0 ? 0 : 7 - currentDay;
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + daysUntilSunday);
    endDate.setHours(23, 59, 59, 999);

    return {
      startDate,
      endDate,
      phrase: 'rest of the week',
      source: 'chrono-enhanced'
    };
  }

  /**
   * Parse using OpenAI for complex expressions chrono-node can't handle
   */
  static async parseWithOpenAI(userQuery, referenceDate) {
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0,
    });

    const currentDate = this.formatDate(referenceDate);
    const currentDay = referenceDate.toLocaleDateString('en-US', { weekday: 'long' });

    const prompt = `Today is ${currentDay}, ${currentDate}.

Parse "${userQuery}" into a date range.

Return only valid JSON, no markdown or formatting:
{"startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "phrase": "simplified phrase"}`;

    try {
      const response = await llm.invoke(prompt);
      const parsed = JSON.parse(response.content.trim());

      if (parsed.startDate && parsed.endDate) {
        const startDate = new Date(parsed.startDate);
        const endDate = new Date(parsed.endDate);
        endDate.setHours(23, 59, 59, 999);

        return {
          startDate,
          endDate,
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
   * Get default range (next 7 days)
   */
  static getDefaultRange(referenceDate) {
    const startDate = new Date(referenceDate);
    const endDate = new Date(referenceDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      startDate,
      endDate,
      phrase: 'next 7 days',
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
   * Format date for Gmail API (YYYY/MM/DD)
   */
  static formatForGmail(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }

  /**
   * Format date for Calendar API (YYYY-MM-DD)
   */
  static formatForCalendar(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Generate Gmail search query with date range
   */
  static async createGmailQuery(searchTerms, userQuery, referenceDate = new Date()) {
    const temporal = await this.parseTemporalQuery(userQuery, referenceDate);
    const startStr = this.formatForGmail(temporal.startDate);
    const endStr = this.formatForGmail(temporal.endDate);

    if (searchTerms && searchTerms.trim()) {
      return `${searchTerms.trim()} after:${startStr} before:${endStr}`;
    } else {
      return `after:${startStr} before:${endStr}`;
    }
  }

  /**
   * Generate Calendar API date range
   */
  static async createCalendarRange(userQuery, referenceDate = new Date()) {
    const temporal = await this.parseTemporalQuery(userQuery, referenceDate);
    return {
      startDate: this.formatForCalendar(temporal.startDate),
      endDate: this.formatForCalendar(temporal.endDate),
      startISO: temporal.startDate.toISOString(),
      endISO: temporal.endDate.toISOString(),
      phrase: temporal.phrase,
      source: temporal.source
    };
  }
}

export default TemporalParsingService;