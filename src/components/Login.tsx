import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES, IS_LIVE } from '../config/routes';
import { auth } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { showToast } = useToast();

  // Redirect if user is already authenticated
  useEffect(() => {
    if (!loading && user) {
      const redirectTo = IS_LIVE ? ROUTES.DASHBOARD_HOME : ROUTES.HOME;
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 Testing email/password login...');
      const { data, error } = await auth.signIn(email, password);
      console.log('📊 Email login result:', { data, error });
      
      if (error) {
        setError(error.message);
        showToast(error.message, 'error');
        return;
      }

      if (data?.user) {
        console.log('✅ Email login successful');
        // In staging, redirect to home page after login
        const redirectTo = IS_LIVE ? ROUTES.DASHBOARD_HOME : ROUTES.HOME;
        navigate(redirectTo);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log("🚀 Google sign in button clicked");
    try {
      setError('');
      
      console.log("📞 About to call auth.signInWithGoogle()");
      const result = await auth.signInWithGoogle();
      console.log("📊 signInWithGoogle result:", result);
      
      if (result.error) {
        console.error("❌ OAuth error:", result.error);
        const errorMessage = 'Failed to sign in with Google. Please try again.';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      } else {
        console.log("✅ OAuth initiated successfully");
      }
      
      
    } catch (error) {
      console.error('💥 Google sign in error:', error);
      const errorMessage = 'Failed to sign in with Google. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Form Panel - Full width on mobile, half on desktop */}
      <div className="flex-1 flex flex-col lg:w-1/2">
        {/* Mobile Header with Logo */}
        <div className="lg:hidden py-6 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-purple-700">
          <div className="flex items-center justify-center">
            <img src="/favicon.ico" alt="HomeOps" className="w-8 h-8 mr-2" />
            <h1 className="text-2xl font-bold text-white">HomeOps</h1>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Back to dashboard link */}
            <div className="mb-8">
              <Link 
                to={ROUTES.HOME} 
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Return home
              </Link>
            </div>

          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email and password to sign in!
            </p>
          </div>

          <div className="mt-8">
            {/* Social Login Buttons */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  console.log('🖱️ Google button clicked!');
                  console.log('🔍 handleGoogleSignIn function:', handleGoogleSignIn);
                  console.log('🔍 auth object:', auth);
                  handleGoogleSignIn().catch(err => console.error('🚨 Click handler error:', err));
                }}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <img src="/google-logo.svg" alt="Google" style={{ width: 18, height: 18 }} />
                <span className="ml-2">Log in with Google</span>
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email<span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="info@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password<span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <div className="text-sm">
                  <Link to={ROUTES.RESET_PASSWORD} className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to={ROUTES.SIGNUP} className="font-medium text-blue-600 hover:text-blue-500">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>

        {/* Mobile Footer */}
        <div className="lg:hidden py-6 px-4 sm:px-6 bg-white">
          <div className="text-center space-y-4">
            <div className="flex justify-center space-x-8">
              <Link to={ROUTES.PRIVACY} className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </Link>
              <Link to={ROUTES.TERMS} className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Copyright © 2025 HomeOps. All rights reserved.
            </p>
            <p className="text-sm text-gray-500">
              Made with ❤️ for modern families
            </p>
          </div>
        </div>
    </div>

      {/* Right Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:block relative lg:w-1/2">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-blue-600 via-purple-700 to-blue-800 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold">H</span>
              </div>
              <h1 className="ml-3 text-3xl font-bold">HomeOps</h1>
            </div>
            <p className="text-lg text-blue-100 max-w-md">
              HomeOps — The Mental Load OS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;