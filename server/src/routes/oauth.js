/**
 * OAuth Routes
 *
 * Handles OAuth flows for Gmail, Google Calendar, and other integrations.
 * Replaces Supabase Edge Functions with server-side OAuth handling.
 */

import express from 'express';
import { getTokenService } from '../services/oauthTokenService.js';
import { createClient } from '@supabase/supabase-js';
import { validateJWT } from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize Supabase client for database operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Exchange OAuth authorization code for access tokens
 * POST /api/oauth/exchange
 */
router.post('/exchange', validateJWT, async (req, res) => {
  try {
    const { code, integrationId, userId } = req.body;

    console.log(`🔄 OAuth exchange started for ${integrationId}`, {
      userId,
      hasCode: !!code
    });

    // Validate required parameters
    if (!code || !integrationId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: code, integrationId, userId'
      });
    }

    // Get OAuth configuration for the integration
    const oauthConfig = getOAuthConfig(integrationId);
    if (!oauthConfig) {
      return res.status(400).json({
        success: false,
        error: `Unsupported integration: ${integrationId}`
      });
    }

    console.log(`🔑 Exchanging code for tokens with ${oauthConfig.tokenUrl}`);

    // Exchange authorization code for tokens
    const tokenResponse = await fetch(oauthConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: oauthConfig.clientId,
        client_secret: oauthConfig.clientSecret,
        redirect_uri: oauthConfig.redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}));
      console.error(`Token exchange failed for ${integrationId}:`, tokenResponse.status, errorData);
      return res.status(400).json({
        success: false,
        error: `Token exchange failed: ${errorData.error_description || 'Unknown error'}`
      });
    }

    const tokenData = await tokenResponse.json();
    console.log(`✅ Token exchange successful for ${integrationId}`);

    // Calculate token expiration
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Store or update integration in database
    const { data: existingIntegration } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .single();

    if (existingIntegration) {
      // Update existing integration
      const { error: updateError } = await supabase
        .from('user_integrations')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          status: 'connected',
          last_error: null,
          last_error_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('integration_id', integrationId);

      if (updateError) {
        console.error('Failed to update integration:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save integration credentials'
        });
      }
    } else {
      // Create new integration
      const { error: insertError } = await supabase
        .from('user_integrations')
        .insert({
          user_id: userId,
          integration_id: integrationId,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: expiresAt.toISOString(),
          status: 'connected',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Failed to create integration:', insertError);
        return res.status(500).json({
          success: false,
          error: 'Failed to save integration credentials'
        });
      }
    }

    console.log(`🎉 ${integrationId} integration successfully connected for user ${userId}`);

    res.json({
      success: true,
      message: `${integrationId} connected successfully`,
      integration: {
        id: integrationId,
        status: 'connected',
        connected_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('OAuth exchange error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during OAuth exchange'
    });
  }
});

/**
 * Refresh OAuth access token
 * POST /api/oauth/refresh
 */
router.post('/refresh', validateJWT, async (req, res) => {
  try {
    const { userId, integrationId } = req.body;

    if (!userId || !integrationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userId, integrationId'
      });
    }

    console.log(`🔄 Refreshing token for ${integrationId}, user ${userId}`);

    const tokenService = getTokenService();
    const result = await tokenService.getValidAccessToken(userId, integrationId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      accessToken: result.accessToken,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during token refresh'
    });
  }
});

/**
 * Check integration status
 * GET /api/oauth/status/:integrationId
 */
router.get('/status/:integrationId', validateJWT, async (req, res) => {
  try {
    const { integrationId } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required in x-user-id header'
      });
    }

    const tokenService = getTokenService();
    const status = await tokenService.checkIntegrationStatus(userId, integrationId);

    res.json({
      success: true,
      integration: {
        id: integrationId,
        connected: status.connected,
        error: status.error
      }
    });

  } catch (error) {
    console.error('Integration status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during status check'
    });
  }
});

/**
 * Disconnect/revoke OAuth integration
 * POST /api/oauth/disconnect
 */
router.post('/disconnect', validateJWT, async (req, res) => {
  try {
    const { userId, integrationId } = req.body;

    if (!userId || !integrationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: userId, integrationId'
      });
    }

    console.log(`🔌 Disconnecting ${integrationId} for user ${userId}`);

    // Get current tokens to revoke them
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token, refresh_token')
      .eq('user_id', userId)
      .eq('integration_id', integrationId)
      .single();

    // Revoke tokens with OAuth provider
    if (integration?.access_token) {
      const oauthConfig = getOAuthConfig(integrationId);
      if (oauthConfig?.revokeUrl) {
        try {
          await fetch(oauthConfig.revokeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              token: integration.access_token
            })
          });
          console.log(`✅ Revoked tokens for ${integrationId}`);
        } catch (revokeError) {
          console.warn(`Failed to revoke tokens for ${integrationId}:`, revokeError);
          // Continue with database cleanup even if revocation fails
        }
      }
    }

    // Update database to mark as disconnected
    const { error: updateError } = await supabase
      .from('user_integrations')
      .update({
        status: 'disconnected',
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('integration_id', integrationId);

    if (updateError) {
      console.error('Failed to update integration status:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to disconnect integration'
      });
    }

    console.log(`✅ ${integrationId} disconnected for user ${userId}`);

    res.json({
      success: true,
      message: `${integrationId} disconnected successfully`
    });

  } catch (error) {
    console.error('OAuth disconnect error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error during disconnect'
    });
  }
});

/**
 * Get OAuth configuration for different integrations
 * @private
 */
function getOAuthConfig(integrationId) {
  const baseRedirectUri = process.env.VITE_REDIRECT_URI_BASE || process.env.VITE_BASE_URL || 'http://localhost:3000';

  const configs = {
    gmail: {
      tokenUrl: 'https://oauth2.googleapis.com/token',
      revokeUrl: 'https://oauth2.googleapis.com/revoke',
      clientId: process.env.VITE_GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${baseRedirectUri}/oauth/gmail/callback`
    },
    'google-calendar': {
      tokenUrl: 'https://oauth2.googleapis.com/token',
      revokeUrl: 'https://oauth2.googleapis.com/revoke',
      clientId: process.env.VITE_GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: `${baseRedirectUri}/oauth/google-calendar/callback`
    }
    // Add more integrations here as needed
  };

  const config = configs[integrationId];
  if (!config) {
    return null;
  }

  // Validate required environment variables
  if (!config.clientId || !config.clientSecret) {
    console.error(`Missing OAuth credentials for ${integrationId}:`, {
      hasClientId: !!config.clientId,
      hasClientSecret: !!config.clientSecret
    });
    return null;
  }

  return config;
}

export default router;