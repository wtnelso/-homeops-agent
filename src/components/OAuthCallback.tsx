import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OAuthCallbackHandler } from '../services/oauthCallback';
import Loader from './ui/Loader';

const OAuthCallback: React.FC = () => {
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🎨 OAuth Callback Component: Starting callback processing');
        console.log('📋 Provider from URL params:', provider);
        const callbackResult = await OAuthCallbackHandler.handleCallback();
        console.log('📊 OAuth callback result:', callbackResult);
        setResult(callbackResult);
        
        // Clean up URL parameters
        console.log('🧽 Cleaning URL parameters');
        OAuthCallbackHandler.cleanUrl();
        
        // Redirect after a brief delay to show status
        const returnUrl = OAuthCallbackHandler.getReturnUrl();
        console.log('🔄 Setting redirect timer to:', returnUrl);
        setTimeout(() => {
          console.log('🏠 Redirecting to:', returnUrl);
          navigate(returnUrl);
        }, 2000);
        
      } catch (error) {
        console.error('💥 OAuth callback component error:', error);
        setResult({
          success: false,
          error: 'Failed to process OAuth callback'
        });
      } finally {
        console.log('⚙️ Setting processing to false');
        setProcessing(false);
      }
    };

    console.log('🔍 Checking if this is an OAuth callback');
    if (OAuthCallbackHandler.isOAuthCallback()) {
      console.log('✅ This is an OAuth callback, processing...');
      handleCallback();
    } else {
      console.log('❌ No OAuth callback parameters detected');
      setResult({
        success: false,
        error: 'No OAuth callback parameters found'
      });
      setProcessing(false);
    }
  }, [provider, navigate]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <Loader size="lg" text="Processing OAuth callback..." />
              <p className="mt-2 text-sm text-gray-600">
                Setting up your {provider} integration
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (result?.success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                Integration Successful!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Your {provider} integration has been set up successfully.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-medium text-gray-900">
              Integration Failed
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {result?.error || 'An error occurred during the OAuth process'}
            </p>
            <div className="mt-4">
              <button
                onClick={() => {
                  const returnUrl = OAuthCallbackHandler.getReturnUrl();
                  navigate(returnUrl);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Return to Previous Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;