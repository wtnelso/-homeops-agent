/**
 * Gmail Service
 * 
 * Handles Gmail API integration for fetching emails.
 * Uses OAuth access tokens from account_integrations table.
 */

export class GmailService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://gmail.googleapis.com/gmail/v1';
  }

  /**
   * Fetch emails from Gmail
   */
  async fetchEmails(options = {}) {
    try {
      const { maxResults = 20, query = '' } = options;
      
      console.log(`📧 Fetching up to ${maxResults} emails from Gmail...`);
      console.log(`🔍 Query: "${query || 'all emails'}"`);

      // Step 1: Get list of message IDs
      const messageIds = await this.getMessageIds(maxResults, query);
      console.log(`📊 Found ${messageIds.length} message IDs`);

      // Step 2: Fetch detailed email content for each ID
      const emails = [];
      for (const messageId of messageIds) {
        try {
          const email = await this.getEmailDetails(messageId);
          if (email) {
            emails.push(email);
          }
        } catch (error) {
          console.error(`❌ Failed to fetch email ${messageId}:`, error.message);
        }
      }

      console.log(`✅ Successfully fetched ${emails.length} emails`);
      return emails;

    } catch (error) {
      console.error('❌ Failed to fetch emails from Gmail:', error);
      throw new Error(`Gmail fetch failed: ${error.message}`);
    }
  }

  /**
   * Get list of message IDs
   */
  async getMessageIds(maxResults, query) {
    try {
      const params = new URLSearchParams({
        maxResults: maxResults.toString()
      });
      
      if (query) {
        params.append('q', query);
      }

      const response = await fetch(`${this.baseURL}/users/me/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gmail API error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      return (data.messages || []).map(msg => msg.id);

    } catch (error) {
      console.error('❌ Failed to get Gmail message IDs:', error);
      throw error;
    }
  }

  /**
   * Get detailed email content
   */
  async getEmailDetails(messageId) {
    try {
      const response = await fetch(`${this.baseURL}/users/me/messages/${messageId}?format=full`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gmail API error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      return this.parseEmailData(data);

    } catch (error) {
      console.error(`❌ Failed to get email details for ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Parse Gmail API response into clean email object
   */
  parseEmailData(gmailData) {
    try {
      const headers = gmailData.payload?.headers || [];
      
      // Extract headers
      const subject = this.getHeader(headers, 'Subject') || 'No Subject';
      const from = this.getHeader(headers, 'From') || 'Unknown Sender';
      const date = this.getHeader(headers, 'Date');
      const to = this.getHeader(headers, 'To');

      // Extract body content
      const body = this.extractBody(gmailData.payload);

      return {
        id: gmailData.id,
        subject,
        from,
        to,
        date,
        body,
        snippet: gmailData.snippet,
        labelIds: gmailData.labelIds || [],
        threadId: gmailData.threadId,
        sizeEstimate: gmailData.sizeEstimate
      };

    } catch (error) {
      console.error('❌ Failed to parse email data:', error);
      return null;
    }
  }

  /**
   * Extract header value
   */
  getHeader(headers, name) {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : null;
  }

  /**
   * Extract email body content
   */
  extractBody(payload) {
    try {
      // Handle different payload structures
      if (payload.body && payload.body.data) {
        return this.decodeBase64(payload.body.data);
      }

      if (payload.parts) {
        // Multi-part message
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body && part.body.data) {
            return this.decodeBase64(part.body.data);
          }
        }

        // If no plain text, try HTML
        for (const part of payload.parts) {
          if (part.mimeType === 'text/html' && part.body && part.body.data) {
            const htmlContent = this.decodeBase64(part.body.data);
            return this.stripHtml(htmlContent);
          }
        }
      }

      // Fallback to snippet
      return '';

    } catch (error) {
      console.error('❌ Failed to extract email body:', error);
      return '';
    }
  }

  /**
   * Decode base64 URL-safe content
   */
  decodeBase64(data) {
    try {
      // Gmail uses URL-safe base64 without padding
      const padded = data.replace(/-/g, '+').replace(/_/g, '/');
      const padding = padded.length % 4;
      const base64 = padding ? padded + '='.repeat(4 - padding) : padded;
      
      return Buffer.from(base64, 'base64').toString('utf8');
    } catch (error) {
      console.error('❌ Failed to decode base64:', error);
      return '';
    }
  }

  /**
   * Strip HTML tags from content
   */
  stripHtml(html) {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&amp;/g, '&') // Decode HTML entities
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
}