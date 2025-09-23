/**
 * Gmail Search LangChain Tool
 *
 * Provides Gmail API search capabilities as a LangChain tool for the chat system.
 * This tool is used as a fallback when semantic search doesn't find relevant results.
 *
 * Features:
 * - Direct Gmail API search with query strings
 * - OAuth token management via shared service
 * - Account-scoped security
 * - Structured result formatting for LangChain
 */

import { Tool } from '@langchain/core/tools';
import { getTokenService } from '../services/oauthTokenService.js';

export class GmailSearchTool extends Tool {
  name = 'gmail_search';
  description = `Search the user's Gmail messages using Gmail API with precise query syntax. This tool is best for specific searches using Gmail's query operators.
  Input should be a JSON string with: {"query": "search terms", "maxResults": 8}

  Gmail search query format examples:
  - "subject:homework" - emails with homework in subject
  - "from:teacher@school.edu" - emails from specific sender
  - "after:2024/01/01 before:2024/02/01" - date range
  - "has:attachment" - emails with attachments
  - "is:unread" - unread emails
  - "label:important OR label:urgent" - emails with specific labels

  Use this tool when you need precise Gmail search operators or when looking for specific senders, dates, or email attributes.`;

  constructor({ accountId }) {
    super();
    this.accountId = accountId;
    this.tokenService = getTokenService();
  }

  /**
   * Execute Gmail search
   */
  async _call(input) {
    try {
      // Handle both object and JSON string input
      const params = typeof input === 'string' ? JSON.parse(input) : input;
      const { query, maxResults = 10 } = params;

      if (!query || typeof query !== 'string') {
        return JSON.stringify({
          success: false,
          error: 'Query parameter is required and must be a string'
        });
      }

      console.log(`🔍 Gmail API fallback search: "${query}" for account ${this.accountId}`);

      // Get valid access token
      const tokenResult = await this.tokenService.getValidAccessToken(this.accountId, 'gmail');

      if (!tokenResult.success) {
        return JSON.stringify({
          success: false,
          error: tokenResult.error,
          suggestion: 'Please connect or reconnect Gmail integration in Settings'
        });
      }

      // Search Gmail using API
      const searchResults = await this._searchGmail(tokenResult.accessToken, query, maxResults);

      if (!searchResults.success) {
        return JSON.stringify(searchResults);
      }

      // Format results for LangChain
      const formattedResults = this._formatResultsForLangChain(searchResults.messages);

      return JSON.stringify({
        success: true,
        source: 'gmail_api',
        query,
        total_results: searchResults.messages.length,
        results: formattedResults,
        metadata: {
          search_method: 'gmail_api_fallback',
          account_id: this.accountId,
          searched_at: new Date().toISOString(),
          cost_estimate_cents: 0.2 // Estimated cost per Gmail API call
        }
      });

    } catch (error) {
      console.error('Gmail search tool error:', error);
      return JSON.stringify({
        success: false,
        error: 'Gmail search failed',
        details: error.message
      });
    }
  }

  /**
   * Search Gmail using the API
   * @private
   */
  async _searchGmail(accessToken, query, maxResults) {
    try {
      // First, search for message IDs
      const searchResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => ({}));
        return {
          success: false,
          error: `Gmail API error: ${searchResponse.status}`,
          details: errorData.error?.message || 'Unknown Gmail API error'
        };
      }

      const searchData = await searchResponse.json();
      const messageIds = searchData.messages || [];

      if (messageIds.length === 0) {
        return {
          success: true,
          messages: []
        };
      }

      // Fetch detailed message data in batches to avoid rate limits
      const batchSize = 5;
      const messages = [];

      for (let i = 0; i < messageIds.length && i < maxResults; i += batchSize) {
        const batch = messageIds.slice(i, i + batchSize);
        const batchPromises = batch.map(async (msg) => {
          try {
            const messageResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date&metadataHeaders=To`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (messageResponse.ok) {
              return await messageResponse.json();
            }
            return null;
          } catch (error) {
            console.warn(`Failed to fetch message ${msg.id}:`, error);
            return null;
          }
        });

        const batchResults = (await Promise.all(batchPromises)).filter(Boolean);
        messages.push(...batchResults);

        // Small delay between batches to respect rate limits
        if (i + batchSize < messageIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return {
        success: true,
        messages
      };

    } catch (error) {
      return {
        success: false,
        error: 'Gmail API request failed',
        details: error.message
      };
    }
  }

  /**
   * Format Gmail API results for LangChain consumption
   * @private
   */
  _formatResultsForLangChain(messages) {
    return messages.map(message => {
      const headers = message.payload?.headers || [];
      const getHeader = (name) => headers.find(h => h.name === name)?.value || '';

      const subject = getHeader('Subject');
      const from = getHeader('From');
      const to = getHeader('To');
      const date = getHeader('Date');

      // Extract email address from "Name <email@domain.com>" format
      const fromEmail = from.match(/<(.+?)>/) ? from.match(/<(.+?)>/)[1] : from;
      const fromName = from.includes('<') ? from.split('<')[0].trim().replace(/"/g, '') : from;

      return {
        id: message.id,
        gmail_message_id: message.id,
        subject: subject || 'No Subject',
        from_email: fromEmail,
        from_name: fromName,
        from_display: from,
        to_email: to,
        date: date,
        timestamp: this._parseGmailDate(date),
        snippet: message.snippet || '',
        thread_id: message.threadId,
        label_ids: message.labelIds || [],
        internal_date: message.internalDate,
        relevance_score: 0.8, // High relevance since it's API search result
        source: 'gmail_api_direct'
      };
    });
  }

  /**
   * Parse Gmail date format to ISO string
   * @private
   */
  _parseGmailDate(dateString) {
    if (!dateString) return null;

    try {
      return new Date(dateString).toISOString();
    } catch (error) {
      console.warn('Failed to parse Gmail date:', dateString);
      return null;
    }
  }

  /**
   * Generate suggested Gmail search queries based on user input
   * @param {string} userQuery - Original user query
   * @returns {string[]} Array of suggested Gmail search queries
   */
  static generateSearchQueries(userQuery) {
    const normalizedQuery = userQuery.toLowerCase();
    const queries = [];

    // Add the original query
    queries.push(userQuery);

    // Generate context-specific queries based on patterns
    if (normalizedQuery.includes('schedule') || normalizedQuery.includes('calendar')) {
      queries.push('subject:schedule OR subject:calendar OR subject:appointment');
      queries.push('has:attachment subject:schedule');
    }

    if (normalizedQuery.includes('school') || normalizedQuery.includes('teacher') || normalizedQuery.includes('homework')) {
      queries.push('from:*@school.edu OR from:*teacher* OR subject:homework');
      queries.push('subject:school OR subject:class OR subject:assignment');
    }

    if (normalizedQuery.includes('bill') || normalizedQuery.includes('payment') || normalizedQuery.includes('due')) {
      queries.push('subject:bill OR subject:payment OR subject:invoice OR subject:due');
      queries.push('subject:statement OR subject:account');
    }

    if (normalizedQuery.includes('appointment') || normalizedQuery.includes('doctor') || normalizedQuery.includes('medical')) {
      queries.push('subject:appointment OR subject:reminder OR from:*medical* OR from:*doctor*');
    }

    // Add time-based queries for recent content
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const formattedDate = oneWeekAgo.toISOString().split('T')[0].replace(/-/g, '/');
    queries.push(`after:${formattedDate} ${userQuery}`);

    // Remove duplicates and limit
    return [...new Set(queries)].slice(0, 3);
  }
}

export default GmailSearchTool;