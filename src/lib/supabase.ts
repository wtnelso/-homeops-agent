import { createClient } from '@supabase/supabase-js';
import { ROUTES } from '../config/routes';
import { detectProviderFromError, getProviderErrorMessage } from '../config/authProviders';

// Environment variables for Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to check user's sign-in provider
const getUserProvider = async (email: string): Promise<string | null> => {
  try {
    console.log('🔍 getUserProvider called for email:', email);

    // First check if there's a current user session and it matches this email
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    console.log('🔍 Current user:', currentUser?.email, 'App metadata:', currentUser?.app_metadata);

    if (currentUser && currentUser.email === email) {
      console.log('🎯 Email matches current user, checking provider...');

      // Check the current user's app metadata for provider info
      const provider = currentUser.app_metadata?.provider;
      console.log('🔍 Provider from app_metadata:', provider);
      if (provider && provider !== 'email') {
        console.log('✅ Current user provider from metadata:', provider);
        return provider;
      }

      // Check identities from current user
      if (currentUser.identities && currentUser.identities.length > 0) {
        console.log('🔍 Checking identities array:', currentUser.identities);
        const identity = currentUser.identities.find(id => id.provider !== 'email');
        if (identity) {
          console.log('✅ Current user provider from identities:', identity.provider);
          return identity.provider;
        }
      }
    }

    console.log('🔄 Using server endpoint to check provider...');
    // Use server endpoint to check provider with admin privileges
    try {
      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      const response = await fetch(`${serverUrl}/api/user/check-provider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Server response:', data);

        if (data.success && data.exists) {
          console.log('✅ Provider detected from server:', data.provider);
          return data.provider;
        } else if (data.success && !data.exists) {
          console.log('❌ User not found on server');
          return null;
        }
      } else {
        console.log('⚠️ Server endpoint failed, falling back to dummy password method');
      }
    } catch (serverError) {
      console.log('⚠️ Server request failed, falling back to dummy password method:', serverError);
    }

    // Fallback to dummy password method if server is unavailable
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'dummy-password-to-check-provider-' + Math.random()
    });

    if (error) {
      console.log('🔍 Sign-in error for provider detection:', error.message);
      const detectedProvider = detectProviderFromError(error.message);
      if (detectedProvider) {
        console.log('✅ Detected provider from error:', detectedProvider);
        return detectedProvider;
      }
    }

    console.log('❌ No provider detected, returning null');
    return null;
  } catch (err) {
    console.error('❌ Error checking user provider:', err);
    return null;
  }
};

// Auth helper functions
export const auth = {
  // Check what provider an email is registered with
  checkUserProvider: getUserProvider,

  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    // Check if email is already registered with any provider
    const existingProvider = await getUserProvider(email);
    if (existingProvider) {
      if (existingProvider !== 'email') {
        return {
          data: null,
          error: {
            message: getProviderErrorMessage(existingProvider, 'signUp'),
            provider: existingProvider
          }
        };
      } else {
        // User already exists with email/password
        return {
          data: null,
          error: {
            message: 'An account with this email already exists. Please sign in instead.',
            provider: 'email'
          }
        };
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    // Check if email is registered with another provider
    const existingProvider = await getUserProvider(email);
    if (existingProvider && existingProvider !== 'email') {
      return {
        data: null,
        error: {
          message: getProviderErrorMessage(existingProvider, 'signIn'),
          provider: existingProvider
        }
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    try {
      console.log('🔐 Starting Google OAuth...');
      console.log('🔧 Supabase client exists:', !!supabase);
      console.log('🔧 Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('🔧 Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
      
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      const redirectUrl = `${import.meta.env.VITE_REDIRECT_URI_BASE}${ROUTES.SUPABASE_AUTH_CALLBACK}`;
      console.log('🔗 Redirect URL:', redirectUrl);
      
      console.log('🚀 Calling supabase.auth.signInWithOAuth...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
      prompt: 'select_account'
    },
        },
      });
      
      console.log('📊 OAuth response:', { data, error });
      console.log('🔍 OAuth response data details:', JSON.stringify(data, null, 2));
      console.log('🔍 OAuth response error details:', JSON.stringify(error, null, 2));
      
      if (error) {
        console.error('❌ OAuth error details:', error);
        throw error;
      }
      
      // Check if we got a redirect URL and manually redirect if needed
      if (data?.url) {
        console.log('🔗 Got OAuth URL, redirecting to:', data.url);
        window.location.href = data.url;
      } else {
        console.warn('⚠️ No OAuth URL in response - manual redirect needed');
        console.log('🔍 Full data object:', data);
      }
      
      return { data, error };
    } catch (err) {
      console.error('💥 signInWithGoogle error:', err);
      return { data: null, error: err };
    }
  },

  // Reset password (send email)
  resetPasswordForEmail: async (
    email: string,
    options?: { redirectTo?: string }
  ) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
    }

    // Check if email is registered with another provider
    const existingProvider = await getUserProvider(email);
    if (existingProvider && existingProvider !== 'email') {
      return {
        data: null,
        error: {
          message: getProviderErrorMessage(existingProvider, 'resetPassword'),
          provider: existingProvider
        }
      };
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(
      email,
      options
    );
    return { data, error };
  },
  
  // Sign out
  signOut: async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    if (!supabase) {
      return { user: null, error: { message: 'Supabase not configured' } };
    }
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    if (!supabase) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};