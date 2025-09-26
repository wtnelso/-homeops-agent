/**
 * OAuth Token Management Service
 *
 * Provides centralized OAuth token management for Gmail and other integrations.
 * Handles token refresh, validation, and database updates.
 */

import { createClient } from '@supabase/supabase-js';

export class OAuthTokenService {
  constructor(supabaseUrl, supabaseServiceKey) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Get valid access token for an integration, refreshing if necessary
   * @param {string} accountId - User's account ID
   * @param {string} integrationId - Integration type (e.g., 'gmail')
   * @returns {Promise<{success: boolean, accessToken?: string, error?: string}>}
   */
  async getValidAccessToken(accountId, integrationId) {
    try {
      // Get integration credentials
      const { data: integration, error: integrationError } = await this.supabase
        .from('account_integrations')
        .select('access_token, refresh_token, token_expires_at, status')
        .eq('account_id', accountId)
        .eq('integration_id', integrationId)
        .single();

      if (integrationError || !integration) {
        return {
          success: false,
          error: `${integrationId} integration not found or not connected`
        };
      }

      if (integration.status !== 'connected') {
        return {
          success: false,
          error: `${integrationId} integration is not connected`
        };
      }

      // Check if token is still valid
      if (integration.token_expires_at) {
        const expirationTime = new Date(integration.token_expires_at);
        const now = new Date();
        const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

        if (expirationTime > new Date(now.getTime() + bufferTime)) {
          // Token is still valid
          return {
            success: true,
            accessToken: integration.access_token
          };
        }
      }

      // Token is expired or about to expire, refresh it
      const refreshResult = await this.refreshAccessToken(
        accountId,
        integrationId,
        integration.refresh_token
      );

      return refreshResult;

    } catch (error) {
      console.error('Token validation error:', error);
      return {
        success: false,
        error: 'Failed to validate access token'
      };
    }
  }

  /**
   * Refresh OAuth access token
   * @param {string} accountId - User's account ID
   * @param {string} integrationId - Integration type (e.g., 'gmail')
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<{success: boolean, accessToken?: string, error?: string}>}
   */
  async refreshAccessToken(accountId, integrationId, refreshToken) {
    try {
      if (!refreshToken) {
        return {
          success: false,
          error: 'No refresh token available'
        };
      }

      // Get OAuth configuration for the integration
      const oauthConfig = this._getOAuthConfig(integrationId);
      if (!oauthConfig) {
        return {
          success: false,
          error: `OAuth configuration not found for ${integrationId}`
        };
      }

      console.log(`🔄 Refreshing ${integrationId} access token for account ${accountId}`);

      // Make token refresh request
      const response = await fetch(oauthConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: oauthConfig.clientId,
          client_secret: oauthConfig.clientSecret
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`${integrationId} token refresh failed:`, response.status, errorData);

        // Mark integration as error state
        await this._updateIntegrationStatus(accountId, integrationId, 'error',
          `Token refresh failed: ${errorData.error || response.status}`);

        return {
          success: false,
          error: `Token refresh failed: ${errorData.error_description || 'Unknown error'}`
        };
      }

      const tokenData = await response.json();

      // Calculate expiration time
      const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

      // Update token in database
      const { error: updateError } = await this.supabase
        .from('account_integrations')
        .update({
          access_token: tokenData.access_token,
          token_expires_at: expiresAt.toISOString(),
          status: 'connected',
          last_error: null,
          last_error_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('account_id', accountId)
        .eq('integration_id', integrationId);

      if (updateError) {
        console.error('Failed to update token in database:', updateError);
        return {
          success: false,
          error: 'Failed to save new token'
        };
      }

      console.log(`✅ Successfully refreshed ${integrationId} token`);

      return {
        success: true,
        accessToken: tokenData.access_token
      };

    } catch (error) {
      console.error(`${integrationId} token refresh error:`, error);

      // Mark integration as error state
      await this._updateIntegrationStatus(accountId, integrationId, 'error',
        `Token refresh exception: ${error.message}`);

      return {
        success: false,
        error: 'Token refresh failed due to network or server error'
      };
    }
  }

  /**
   * Update integration status and error information
   * @private
   */
  async _updateIntegrationStatus(accountId, integrationId, status, errorMessage = null) {
    try {
      await this.supabase
        .from('account_integrations')
        .update({
          status,
          last_error: errorMessage,
          last_error_at: errorMessage ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('account_id', accountId)
        .eq('integration_id', integrationId);
    } catch (error) {
      console.error('Failed to update integration status:', error);
    }
  }

  /**
   * Get OAuth configuration for different integrations
   * @private
   */
  _getOAuthConfig(integrationId) {
    const configs = {
      gmail: {
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: process.env.VITE_GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      },
      calendar: {
        tokenUrl: 'https://oauth2.googleapis.com/token',
        clientId: process.env.VITE_GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
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

  /**
   * Check if an integration is properly connected and has valid credentials
   * @param {string} accountId - User's account ID
   * @param {string} integrationId - Integration type
   * @returns {Promise<{connected: boolean, error?: string}>}
   */
  async checkIntegrationStatus(accountId, integrationId) {
    try {
      const { data: integration, error } = await this.supabase
        .from('account_integrations')
        .select('status, last_error, last_error_at, token_expires_at')
        .eq('account_id', accountId)
        .eq('integration_id', integrationId)
        .single();

      if (error || !integration) {
        return {
          connected: false,
          error: 'Integration not found'
        };
      }

      if (integration.status !== 'connected') {
        return {
          connected: false,
          error: integration.last_error || `Integration status: ${integration.status}`
        };
      }

      // Check token expiration
      if (integration.token_expires_at) {
        const expirationTime = new Date(integration.token_expires_at);
        const now = new Date();

        if (expirationTime <= now) {
          return {
            connected: false,
            error: 'Access token has expired'
          };
        }
      }

      return {
        connected: true
      };

    } catch (error) {
      console.error('Integration status check error:', error);
      return {
        connected: false,
        error: 'Failed to check integration status'
      };
    }
  }
}

// Create a singleton instance for the API
let tokenServiceInstance = null;

export function getTokenService() {
  if (!tokenServiceInstance) {
    tokenServiceInstance = new OAuthTokenService(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return tokenServiceInstance;
}

export default OAuthTokenService;