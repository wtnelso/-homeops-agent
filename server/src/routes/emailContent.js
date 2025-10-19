/**
 * Email Content Routes
 * 
 * Provides endpoints for retrieving full email content for display in iframes.
 * Used by the "Read More" functionality in email summaries.
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { validateJWT } from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';
import { getTokenService } from '../services/oauthTokenService.js';

const router = express.Router();

// Initialize Supabase client - moved inside functions to ensure env vars are loaded
let supabase = null;

const getSupabaseClient = () => {
  if (!supabase) {
    console.log('🔍 EMAIL CONTENT: Creating Supabase client');
    console.log('🔍 EMAIL CONTENT: SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('🔍 EMAIL CONTENT: SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
};

// Custom middleware to handle token from query parameter (for iframe requests)
const validateJWTFromQuery = async (req, res, next) => {
  try {
    console.log('🔍 EMAIL CONTENT: Starting token validation');
    console.log('🔍 EMAIL CONTENT: Token received:', !!req.query.token);
    console.log('🔍 EMAIL CONTENT: Supabase URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
    console.log('🔍 EMAIL CONTENT: Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
    
    const token = req.query.token;
    
    if (!token) {
      console.log('❌ EMAIL CONTENT: No token provided');
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }

    console.log('🔍 EMAIL CONTENT: Token length:', token.length);
    console.log('🔍 EMAIL CONTENT: Token preview:', token.substring(0, 20) + '...');

    // Use JWT verification instead of Supabase client to avoid database issues
    console.log('🔍 EMAIL CONTENT: Verifying JWT token...');
    
    try {
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);
      
      if (!decoded || !decoded.sub) {
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication token'
        });
      }
      
      // Attach user info to request
      req.user = {
        id: decoded.sub,
        email: decoded.email
      };
      
      console.log(`✅ EMAIL CONTENT: Token verified for user: ${decoded.email} (${decoded.sub})`);
    } catch (jwtError) {
      console.error('❌ EMAIL CONTENT: JWT verification error:', jwtError);
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }
    
    next();
  } catch (error) {
    console.error('❌ EMAIL CONTENT: Token validation error:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }
};

/**
 * Fetch email content directly from Gmail API
 */
async function fetchFromGmailAPI(gmailMessageId, userId, gmailAccessToken) {
  try {
    console.log(`📧 Fetching email ${gmailMessageId} from Gmail API for user ${userId}`);
    
    if (!gmailAccessToken) {
      return {
        success: false,
        error: 'Gmail access token not provided'
      };
    }
    
    // Fetch full email content from Gmail API
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${gmailMessageId}?format=full`,
      {
        headers: {
          'Authorization': `Bearer ${gmailAccessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      return {
        success: false,
        error: `Gmail API error: ${response.status}`
      };
    }
    
    const messageData = await response.json();
    
    // Extract headers
    const headers = messageData.payload?.headers || [];
    const getHeader = (name) => headers.find(h => h.name === name)?.value || '';
    
    const subject = getHeader('Subject');
    const from = getHeader('From');
    const to = getHeader('To');
    const date = getHeader('Date');
    
    // Extract email address from "Name <email@domain.com>" format
    const fromEmail = from.match(/<(.+?)>/) ? from.match(/<(.+?)>/)[1] : from;
    const fromName = from.includes('<') ? from.split('<')[0].trim().replace(/"/g, '') : from;
    
    // Extract body content
    let bodyHtml = '';
    let bodyText = '';
    
    if (messageData.payload?.body?.data) {
      // Single part message
      const bodyData = Buffer.from(messageData.payload.body.data, 'base64').toString();
      bodyText = bodyData;
    } else if (messageData.payload?.parts) {
      // Multi-part message
      for (const part of messageData.payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          bodyHtml = Buffer.from(part.body.data, 'base64').toString();
        } else if (part.mimeType === 'text/plain' && part.body?.data) {
          bodyText = Buffer.from(part.body.data, 'base64').toString();
        }
      }
    }
    
    return {
      success: true,
      data: {
        id: gmailMessageId,
        gmail_message_id: gmailMessageId,
        subject: subject || 'No Subject',
        from_email: fromEmail,
        from_name: fromName,
        to_email: to,
        timestamp: new Date(date).toISOString(),
        body_html: bodyHtml,
        body_text: bodyText
      }
    };
    
  } catch (error) {
    console.error('Gmail API fetch error:', error);
    return {
      success: false,
      error: 'Failed to fetch email from Gmail API'
    };
  }
}

/**
 * GET /api/email/:emailId/full
 * Retrieve full email content for iframe display
 */
router.get('/:emailId/full', validateJWTFromQuery, async (req, res) => {
  try {
    const { emailId } = req.params;
    const user = req.user;

    if (!emailId) {
      return res.status(400).json({
        success: false,
        error: 'Email ID is required'
      });
    }

    console.log(`📧 Fetching full email content for ID: ${emailId}`);

    // Skip database lookup and go directly to Gmail API since we know emails aren't stored locally yet
    console.log('📧 Fetching directly from Gmail API...');
    
    // Get Gmail access token from query parameter
    const gmailAccessToken = req.query.gmail_token;
    
    if (!gmailAccessToken) {
      console.error('No Gmail access token provided in query parameter');
      return res.status(400).json({
        success: false,
        error: 'Gmail access token not available'
      });
    }
    
    const gmailContent = await fetchFromGmailAPI(emailId, user.id, gmailAccessToken);
    
    if (!gmailContent.success) {
      console.error('Gmail API fetch error:', gmailContent.error);
      return res.status(404).json({
        success: false,
        error: 'Email not found in Gmail'
      });
    }
    
    const emailContent = gmailContent.data;


    // Return HTML content for iframe display
    const htmlContent = generateEmailHTML(emailContent);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.send(htmlContent);

  } catch (error) {
    console.error('Email content endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve email content'
    });
  }
});

/**
 * Generate HTML content for email iframe display
 */
function generateEmailHTML(emailContent) {
  const { subject, from_name, from_email, to_email, timestamp, body_html, body_text } = emailContent;
  
  // Format timestamp
  const emailDate = new Date(timestamp).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Use HTML content if available, otherwise fall back to text
  const emailBody = body_html || body_text || 'No content available';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email: ${subject}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
            padding: 20px;
        }
        
        .email-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .email-header {
            background: #f8f9fa;
            padding: 24px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .email-subject {
            font-size: 24px;
            font-weight: 600;
            color: #212529;
            margin-bottom: 16px;
        }
        
        .email-meta {
            display: flex;
            flex-direction: column;
            gap: 8px;
            font-size: 14px;
            color: #6c757d;
        }
        
        .email-meta-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .email-meta-label {
            font-weight: 500;
            min-width: 60px;
        }
        
        .email-body {
            padding: 24px;
        }
        
        .email-body-content {
            font-size: 16px;
            line-height: 1.7;
            color: #495057;
        }
        
        .email-body-content img {
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 16px 0;
        }
        
        .email-body-content a {
            color: #007bff;
            text-decoration: none;
        }
        
        .email-body-content a:hover {
            text-decoration: underline;
        }
        
        .email-body-content blockquote {
            border-left: 4px solid #007bff;
            padding-left: 16px;
            margin: 16px 0;
            font-style: italic;
            color: #6c757d;
        }
        
        .email-body-content ul,
        .email-body-content ol {
            margin: 16px 0;
            padding-left: 24px;
        }
        
        .email-body-content li {
            margin: 8px 0;
        }
        
        .email-body-content h1,
        .email-body-content h2,
        .email-body-content h3,
        .email-body-content h4,
        .email-body-content h5,
        .email-body-content h6 {
            margin: 24px 0 16px 0;
            color: #212529;
        }
        
        .email-body-content p {
            margin: 16px 0;
        }
        
        .email-body-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
        }
        
        .email-body-content th,
        .email-body-content td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        
        .email-body-content th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .email-header,
            .email-body {
                padding: 16px;
            }
            
            .email-subject {
                font-size: 20px;
            }
            
            .email-meta {
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="email-subject">${subject}</div>
            <div class="email-meta">
                <div class="email-meta-item">
                    <span class="email-meta-label">From:</span>
                    <span>${from_name || from_email}</span>
                </div>
                <div class="email-meta-item">
                    <span class="email-meta-label">To:</span>
                    <span>${to_email}</span>
                </div>
                <div class="email-meta-item">
                    <span class="email-meta-label">Date:</span>
                    <span>${emailDate}</span>
                </div>
            </div>
        </div>
        <div class="email-body">
            <div class="email-body-content">
                ${emailBody}
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

export default router;
