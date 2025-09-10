import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROUTES } from '../config/routes';
import { UserSessionService } from '../services/userSession';
import { useToast } from '../contexts/ToastContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 Processing Supabase auth callback...');
        console.log('🌐 Current URL:', window.location.href);
        console.log('🔍 URL Hash:', window.location.hash);
        console.log('🔍 URL Search:', window.location.search);
        
        // Check if this is an OAuth callback with tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        console.log('📋 Hash params:', Object.fromEntries(hashParams.entries()));
        console.log('📋 Search params:', Object.fromEntries(searchParams.entries()));
        
        // Let Supabase handle the callback automatically
        // This should process any tokens in the URL
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data, error } = await supabase.auth.getSession();
        console.log('Auth callback session data:', data);
        
        if (error) {
          console.error('❌ Auth callback error:', error);
          setError(error.message);
          setProcessing(false);
          return;
        }

        if (data.session) {
          console.log('✅ Authentication successful:', data.session.user.email);
          
          // Simply check if user has completed onboarding
          try {
            const { data: userData, error } = await supabase
              .from('users')
              .select('account_id, accounts!inner(onboarded_at)')
              .eq('auth_id', data.session.user.id)
              .single();

            if (!userData || !userData.accounts.onboarded_at) {
              // User needs onboarding
              console.log('🎯 User needs onboarding, redirecting...');
              
              // Check if user has started onboarding (has saved progress in localStorage)
              const savedStep = localStorage.getItem('homeops_onboarding_step');
              const savedData = localStorage.getItem('homeops_onboarding_data');
              
              if (savedStep && savedData) {
                // User has partially completed onboarding, show toast
                showToast('Please complete onboarding before using HomeOps', 'warning');
              }
              
              navigate(ROUTES.ONBOARDING, { replace: true });
            } else {
              // User has completed onboarding
              console.log('🏠 User onboarded, redirecting to dashboard');
              navigate(ROUTES.DASHBOARD_HOME, { replace: true });
            }
          } catch (fetchError) {
            console.error('Error checking onboarding status:', fetchError);
            // Default to onboarding if there's an error
            navigate(ROUTES.ONBOARDING, { replace: true });
          }
        } else {
          console.log('⚠️ No session found, redirecting to login');
          navigate(ROUTES.LOGIN, { replace: true });
        }
      } catch (err) {
        console.error('💥 Unexpected auth callback error:', err);
        setError('An unexpected error occurred during authentication.');
        setProcessing(false);
      }
    };

    // Handle the auth callback
    handleAuthCallback();
  }, [navigate]);

  if (processing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-4 text-lg font-medium text-gray-900">
                Completing sign in...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we complete your authentication
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
                Authentication Failed
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error}
              </p>
              <div className="mt-4">
                <button
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;