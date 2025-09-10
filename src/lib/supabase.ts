import { createClient } from '@supabase/supabase-js';
import { ROUTES } from '../config/routes';

// These should be added to your environment variables
// Using placeholder values that won't cause URL construction errors
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper functions
export const auth = {
  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase not configured' } };
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