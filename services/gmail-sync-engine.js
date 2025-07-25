/**
 * HomeOps Gmail Sync Engine — Phase 1
 * 
 * 1. Fix broken Gmail OAuth integration (read-only, user-initiated)
 * 2. After successful auth, hit Gmail API
 * 3. Pull last 1000 emails from:
 *    - promotions
 *    - primary inbox
 * 4. For each email, extract:
 *    - from
 *    - subject
 *    - timestamp
 *    - labelIds
 *    - snippet or short body text
 * 5. Return as JSON array to backend
 * 
 * This powers our Email Decoder + Brand Signal system.
 * This is for analysis, not triage.
 */

const { google } = require('googleapis');
require('dotenv').config();

class GmailSyncEngine {
  constructor() {
    this.gmail = null;
    this.oauth2Client = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/auth/gmail/callback'
      );

      if (process.env.GMAIL_ACCESS_TOKEN) {
        this.oauth2Client.setCredentials({
          access_token: process.env.GMAIL_ACCESS_TOKEN,
          refresh_token: process.env.GMAIL_REFRESH_TOKEN
        });
      }

      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      this.isInitialized = true;
      console.log('✅ Gmail Sync Engine initialized');
      return true;
    } catch (error) {
      console.error('❌ Gmail Sync Engine initialization failed:', error);
      return false;
    }
  }

  async setCredentials(tokens) {
    try {
      this.oauth2Client.setCredentials(tokens);
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      console.log('✅ Gmail credentials updated');
      return true;
    } catch (error) {
      console.error('❌ Failed to set Gmail credentials:', error);
      return false;
    }
  }

  /**
   * Pull 500-1000 emails from user's inbox for signal analysis
   * This is the foundation for Email Decoder + Brand Signal system
   */
  async syncEmails(maxEmails = 1000) {
    try {
      if (!this.oauth2Client?.credentials?.access_token) {
        throw new Error('Gmail not authenticated. Please connect Gmail first.');
      }

      console.log(`🔄 Starting Gmail sync for ${maxEmails} emails...`);
      
      const emails = [];
      const batchSize = 100; // Gmail API limit
      
      // Step 1: Get emails from Promotions category
      console.log('📧 Fetching emails from Promotions...');
      const promotionsEmails = await this.fetchEmailsByQuery(
        'category:promotions',
        Math.floor(maxEmails * 0.4) // 40% from promotions
      );
      emails.push(...promotionsEmails);

      // Step 2: Get emails from Primary inbox (exclude promotions)
      console.log('📧 Fetching emails from Primary inbox...');
      const primaryEmails = await this.fetchEmailsByQuery(
        'in:inbox -category:promotions -category:social -category:updates',
        Math.floor(maxEmails * 0.6) // 60% from primary
      );
      emails.push(...primaryEmails);

      console.log(`✅ Gmail sync completed: ${emails.length} emails processed`);
      
      // Return processed email data for analysis
      return {
        success: true,
        totalEmails: emails.length,
        emails: emails,
        categoryCounts: {
          promotions: promotionsEmails.length,
          primary: primaryEmails.length
        },
        syncTimestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Gmail sync failed:', error);
      return {
        success: false,
        error: error.message,
        emails: []
      };
    }
  }

  /**
   * Fetch emails by Gmail search query
   */
  async fetchEmailsByQuery(query, maxResults) {
    try {
      const messageList = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults
      });

      if (!messageList.data.messages) {
        console.log(`No emails found for query: ${query}`);
        return [];
      }

      console.log(`📬 Found ${messageList.data.messages.length} messages for: ${query}`);
      
      const emails = [];
      const batchSize = 10; // Process in smaller batches to avoid rate limits

      // Process emails in batches
      for (let i = 0; i < messageList.data.messages.length; i += batchSize) {
        const batch = messageList.data.messages.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (message) => {
          try {
            const emailData = await this.extractEmailData(message.id);
            return emailData;
          } catch (error) {
            console.error(`Error processing email ${message.id}:`, error.message);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        const validEmails = batchResults.filter(email => email !== null);
        emails.push(...validEmails);

        // Rate limiting - pause between batches
        if (i + batchSize < messageList.data.messages.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Progress logging
        if (i % 50 === 0) {
          console.log(`📊 Processed ${i + batchSize}/${messageList.data.messages.length} emails...`);
        }
      }

      return emails;

    } catch (error) {
      console.error(`Error fetching emails for query "${query}":`, error);
      return [];
    }
  }

  /**
   * Extract structured data from individual email
   * Returns: from, subject, timestamp, labelIds, snippet, body
   */
  async extractEmailData(messageId) {
    try {
      const email = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const headers = email.data.payload.headers;
      const from = headers.find(h => h.name === 'From')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      // Extract sender email and domain
      const fromEmailMatch = from.match(/<(.+?)>/) || from.match(/([^\s]+@[^\s]+)/);
      const fromEmail = fromEmailMatch ? fromEmailMatch[1] || fromEmailMatch[0] : '';
      const fromDomain = fromEmail.includes('@') ? fromEmail.split('@')[1] : '';

      // Extract body text
      let body = '';
      try {
        if (email.data.payload.body?.data) {
          body = Buffer.from(email.data.payload.body.data, 'base64').toString();
        } else if (email.data.payload.parts) {
          for (const part of email.data.payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
              body += Buffer.from(part.body.data, 'base64').toString();
            }
          }
        }
      } catch (bodyError) {
        console.error('Error extracting email body:', bodyError.message);
      }

      // Return structured email data for analysis
      return {
        id: messageId,
        from: from,
        fromEmail: fromEmail,
        fromDomain: fromDomain,
        subject: subject,
        timestamp: new Date(date).toISOString(),
        labelIds: email.data.labelIds || [],
        snippet: email.data.snippet || '',
        body: body.substring(0, 2000), // Limit body size
        internalDate: email.data.internalDate,
        gmailUrl: `https://mail.google.com/mail/u/0/#inbox/${messageId}`
      };

    } catch (error) {
      console.error(`Error extracting email data for ${messageId}:`, error.message);
      return null;
    }
  }

  /**
   * Get Gmail OAuth authorization URL
   */
  getAuthUrl(forceConsent = false) {
    if (!this.oauth2Client) {
      throw new Error('OAuth client not initialized');
    }

    const authParams = {
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly'
      ],
      include_granted_scopes: true
    };
    
    // Force consent screen to appear
    if (forceConsent) {
      authParams.prompt = 'consent';
      // Add a random state to prevent caching
      authParams.state = JSON.stringify({ 
        isOnboarding: true, 
        timestamp: Date.now(),
        forceConsent: true 
      });
    }

    return this.oauth2Client.generateAuthUrl(authParams);
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code) {
    try {
      console.log('🔄 Exchanging authorization code for tokens...');
      
      // Use getToken() instead of getAccessToken() for authorization code exchange
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens || !tokens.access_token) {
        throw new Error('No access token received from Google');
      }
      
      console.log('✅ Tokens received, setting credentials...');
      this.oauth2Client.setCredentials(tokens);
      
      // Re-initialize the Gmail client with the new credentials
      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
      
      console.log('✅ Gmail tokens exchanged and client updated');
      
      return {
        success: true,
        tokens: tokens
      };
    } catch (error) {
      console.error('❌ Error exchanging code for tokens:', error);
      console.error('Error details:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test Gmail connection
   */
  async testConnection() {
    try {
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      return {
        success: true,
        email: profile.data.emailAddress,
        totalMessages: profile.data.messagesTotal
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get real emails for calibration cards
   */
  async getEmailsForCalibration(maxEmails = 5) {
    console.log("🔧 Loading Firebase tokens into Gmail client...");
    const admin = require("firebase-admin");
    const db = admin.firestore();
    const tokenDoc = await db.collection("gmail_tokens").doc("current_user").get();
    if (tokenDoc.exists) {
      const tokens = tokenDoc.data();
      this.oauth2Client.setCredentials({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      });
      console.log("✅ Gmail tokens loaded from Firebase into OAuth client");
    } else {
      console.log("❌ No tokens found in Firebase");
    }    try {
      console.log(`📧 Getting ${maxEmails} emails for calibration...`);
      
      // Get list of messages
      const listResponse = await this.gmail.users.messages.list({
        userId: 'me',
        maxResults: maxEmails * 3, // Get more to filter for good examples
        labelIds: ['INBOX']
      });

      if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
        throw new Error('No messages found');
      }

      const calibrationCards = [];
      let processed = 0;

      for (const message of listResponse.data.messages) {
        if (calibrationCards.length >= maxEmails) break;
        
        try {
          // Get full message details
          const messageResponse = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });

          const messageData = messageResponse.data;
          const headers = messageData.payload.headers;
          
          // Extract email details
          const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
          const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
          const snippet = messageData.snippet || '';
          
          // Extract brand name from sender
          const brandName = this.extractBrandName(from);
          
          // Skip if it looks like a personal email
          if (this.isPersonalEmail(from)) {
            continue;
          }
          
          // Create calibration card
          const calibrationCard = {
            id: calibrationCards.length + 1,
            brandName: brandName,
            category: this.categorizeBrand(brandName),
            logo: this.getBrandIcon(brandName),
            emailSubject: subject,
            emailSnippet: snippet.substring(0, 120) + (snippet.length > 120 ? '...' : ''),
            insight: `<i data-lucide="mail" style="width: 14px; height: 14px; margin-right: 6px;"></i>Real email from your inbox`
          };
          
          calibrationCards.push(calibrationCard);
          processed++;
          
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error.message);
          continue;
        }
      }

      console.log(`✅ Created ${calibrationCards.length} calibration cards from real emails`);
      return calibrationCards;
      
    } catch (error) {
      console.error('❌ Error getting calibration emails:', error);
      throw error;
    }
  }

  /**
   * Extract brand name from email sender
   */
  extractBrandName(fromHeader) {
    // Remove email address and clean up
    let brandName = fromHeader.replace(/<.*?>/g, '').trim();
    
    // Remove common email prefixes
    brandName = brandName.replace(/^(no-reply|noreply|support|info|hello|team)@.*/i, '');
    
    // If it's still an email, extract domain
    if (brandName.includes('@')) {
      const domain = brandName.split('@')[1];
      brandName = domain.split('.')[0];
    }
    
    // Capitalize first letter
    return brandName.charAt(0).toUpperCase() + brandName.slice(1);
  }

  /**
   * Check if email looks personal
   */
  isPersonalEmail(fromHeader) {
    const personalIndicators = ['gmail.com', 'yahoo.com', 'hotmail.com', 'icloud.com', 'outlook.com'];
    return personalIndicators.some(indicator => fromHeader.includes(indicator));
  }

  /**
   * Categorize brand
   */
  categorizeBrand(brandName) {
    const categories = {
      'amazon': 'E-commerce',
      'target': 'Retail & Shopping',
      'walmart': 'Retail & Shopping',
      'costco': 'Retail & Shopping',
      'spotify': 'Entertainment',
      'netflix': 'Entertainment',
      'google': 'Technology',
      'apple': 'Technology',
      'uber': 'Transportation',
      'lyft': 'Transportation',
      'airbnb': 'Travel & Lodging',
      'booking': 'Travel & Lodging',
      'chase': 'Financial Services',
      'bank': 'Financial Services'
    };
    
    const lowerBrand = brandName.toLowerCase();
    for (const [key, category] of Object.entries(categories)) {
      if (lowerBrand.includes(key)) {
        return category;
      }
    }
    
    return 'Other';
  }

  /**
   * Get brand icon
   */
  getBrandIcon(brandName) {
    const icons = {
      'amazon': '<i data-lucide="package" style="width: 20px; height: 20px; color: #ff9500;"></i>',
      'target': '<i data-lucide="target" style="width: 20px; height: 20px; color: #e53e3e;"></i>',
      'walmart': '<i data-lucide="shopping-cart" style="width: 20px; height: 20px; color: #004c91;"></i>',
      'spotify': '<i data-lucide="music" style="width: 20px; height: 20px; color: #1db954;"></i>',
      'netflix': '<i data-lucide="play" style="width: 20px; height: 20px; color: #e50914;"></i>',
      'google': '<i data-lucide="search" style="width: 20px; height: 20px; color: #4285f4;"></i>',
      'apple': '<i data-lucide="smartphone" style="width: 20px; height: 20px; color: #000;"></i>',
      'uber': '<i data-lucide="car" style="width: 20px; height: 20px; color: #000;"></i>',
      'bank': '<i data-lucide="building-2" style="width: 20px; height: 20px; color: #2563eb;"></i>'
    };
    
    const lowerBrand = brandName.toLowerCase();
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerBrand.includes(key)) {
        return icon;
      }
    }
    
    // Default icon
    return '<i data-lucide="mail" style="width: 20px; height: 20px; color: #6b7280;"></i>';
  }
}

module.exports = GmailSyncEngine;
