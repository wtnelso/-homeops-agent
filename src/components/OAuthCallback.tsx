import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { OAuthCallbackHandler } from '../services/oauthCallback';
import Loader from './ui/Loader';

const OAuthCallback: React.FC = () => {
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🎨 OAuth Callback Component: Starting callback processing');
        console.log('📋 Provider from URL params:', provider);
        console.log('🌐 Full URL:', window.location.href);
        console.log('🔍 URL search params:', window.location.search);
        console.log('📊 All URL parameters:', Object.fromEntries(new URLSearchParams(window.location.search)));

        // Process callback FIRST before cleaning URL
        console.log('🚀 Processing OAuth callback before cleaning URL...');
        const callbackResult = await OAuthCallbackHandler.handleCallback();
        console.log('📊 OAuth callback result:', callbackResult);

        // Clean up URL parameters after processing
        console.log('🧽 Cleaning URL parameters');
        OAuthCallbackHandler.cleanUrl();

        // Redirect immediately
        const returnUrl = OAuthCallbackHandler.getReturnUrl();
        console.log('🔄 Redirecting to:', returnUrl);

        if (callbackResult.success) {
          console.log('✅ OAuth callback successful, redirecting with page refresh');
          // Redirect and refresh in one action for immediate response
          window.location.href = returnUrl;
        } else {
          console.error('❌ OAuth callback failed:', callbackResult.error);
          navigate(returnUrl, { replace: true });
        }

      } catch (error) {
        console.error('💥 OAuth callback component error:', error);
        // Still redirect even if there's an error
        const returnUrl = OAuthCallbackHandler.getReturnUrl();
        navigate(returnUrl, { replace: true });
      }
    };

    console.log('🔍 Checking if this is an OAuth callback');
    if (OAuthCallbackHandler.isOAuthCallback()) {
      console.log('✅ This is an OAuth callback, processing...');
      handleCallback();
    } else {
      console.log('❌ No OAuth callback parameters detected');
      // Redirect to integrations page even if no OAuth parameters
      const returnUrl = OAuthCallbackHandler.getReturnUrl();
      navigate(returnUrl, { replace: true });
    }
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