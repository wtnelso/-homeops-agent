import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { OAuthCallbackHandler } from '../services/oauthCallback';
import { OAUTH_RETURN_URLS } from '../config/routes';
import Loader from './ui/Loader';

const OAuthCallback: React.FC = () => {
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      let returnUrl: string = OAUTH_RETURN_URLS.INTEGRATIONS_SETTINGS; // Default fallback

      try {
        console.log('🎨 OAuth Callback Component: Starting callback processing');
        console.log('📋 Provider from URL params:', provider);

        // Process OAuth callback (now includes returnUrl extraction)
        const callbackResult = await OAuthCallbackHandler.handleCallback();
        console.log('📊 OAuth callback result:', callbackResult);

        // Use returnUrl from callback result if available
        if (callbackResult.returnUrl) {
          returnUrl = callbackResult.returnUrl;
        }

        // Clean up URL parameters
        OAuthCallbackHandler.cleanUrl();

      } catch (error) {
        console.error('💥 OAuth callback component error:', error);
      }

      // Single redirect point - always use window.location.href for fresh page load
      console.log('🔄 Redirecting to:', returnUrl);
      window.location.href = returnUrl;
    };

    handleCallback();
  }, [provider, navigate]);

  // Show transparent loading overlay using Portal
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <Loader size="lg" />
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OAuthCallback;