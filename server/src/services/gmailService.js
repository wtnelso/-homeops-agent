/**
 * Gmail Service
 * 
 * Handles Gmail API integration for fetching emails.
 * Uses OAuth access tokens from account_integrations table.
 * Automatically refreshes tokens when they expire.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class GmailService {
  constructor(integration) {
    this.integration = integration;
    this.baseURL = 'https://gmail.googleapis.com/gmail/v1';
  }

  /**
   * Ensure we have a valid access token, refresh if needed
   */
  async ensureValidToken() {
    try {
      // Check if token needs refresh (expire in next 5 minutes)
      const expiresAt = new Date(this.integration.token_expires_at);
      const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
      
      if (expiresAt <= fiveMinutesFromNow) {
        console.log('🔄 Gmail token expires soon, refreshing...');
        const refreshedIntegration = await this.refreshToken();
        
        if (refreshedIntegration) {
          console.log('✅ Gmail token refreshed successfully');
          this.integration = refreshedIntegration;
        } else {
          console.error('❌ Failed to refresh Gmail token, using existing token');
        }
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      // Continue with existing token as fallback
    }
  }

  /**
   * Refresh Gmail OAuth token
   */
  async refreshToken() {
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: this.integration.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        throw new Error(`Token refresh failed (${tokenResponse.status}): ${errorData}`);
      }

      const tokenData = await tokenResponse.json();
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // Prepare update data with new access token
      const updateData = {
        access_token: tokenData.access_token,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      };

      // If Google provided a new refresh token, update it too
      if (tokenData.refresh_token) {
        console.log('🔄 New refresh token provided, updating database');
        updateData.refresh_token = tokenData.refresh_token;
      }

      // Update the database with new token(s)
      const { error } = await supabase
        .from('account_integrations')
        .update(updateData)
        .eq('account_id', this.integration.account_id)
        .eq('integration_id', 'gmail');

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }

      return {
        ...this.integration,
        access_token: tokenData.access_token,
        token_expires_at: expiresAt.toISOString(),
        refresh_token: tokenData.refresh_token || this.integration.refresh_token
      };

    } catch (error) {
      console.error('❌ Failed to refresh Gmail token:', error);
      return null;
    }
  }

  /**
   * Fetch emails from Gmail with automatic token refresh
   */
  async fetchEmails(options = {}) {
    try {
      const { maxResults = 20, query = '' } = options;
      
      console.log(`📧 Fetching up to ${maxResults} emails from Gmail...`);
      console.log(`🔍 Query: "${query || 'all emails'}"`);

      // Ensure we have a valid token before making API calls
      await this.ensureValidToken();

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
          'Authorization': `Bearer ${this.integration.access_token}`,
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
          'Authorization': `Bearer ${this.integration.access_token}`,
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

      // Extract headers for CC field
      const cc = this.getHeader(headers, 'Cc');
      
      // Extract both HTML and text body content
      const bodyContent = this.extractBody(gmailData.payload);

      return {
        id: gmailData.id,
        subject,
        from,
        to,
        cc,
        date,
        bodyHtml: bodyContent.html,
        bodyText: bodyContent.text,
        body: bodyContent.text || bodyContent.html, // Fallback for existing code
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
   * Extract email body content - returns both HTML and text
   */
  extractBody(payload) {
    try {
      const result = {
        html: '',
        text: ''
      };

      // Handle different payload structures
      if (payload.body && payload.body.data) {
        // Simple body structure
        const content = this.decodeBase64(payload.body.data);
        if (payload.mimeType === 'text/html') {
          result.html = content;
          result.text = this.stripHtml(content);
        } else {
          result.text = content;
        }
        return result;
      }

      if (payload.parts) {
        // Multi-part message - extract both HTML and text
        for (const part of payload.parts) {
          if (part.mimeType === 'text/plain' && part.body && part.body.data) {
            result.text = this.decodeBase64(part.body.data);
          }
          if (part.mimeType === 'text/html' && part.body && part.body.data) {
            result.html = this.decodeBase64(part.body.data);
          }
        }
        
        // If we have HTML but no text, generate text from HTML
        if (result.html && !result.text) {
          result.text = this.stripHtml(result.html);
        }
      }

      return result;

    } catch (error) {
      console.error('❌ Failed to extract email body:', error);
      return { html: '', text: '' };
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