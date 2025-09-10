import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { auth } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Eye, EyeOff } from 'lucide-react';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      const errorMessage = 'Passwords do not match';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return;
    }
    
    setIsLoading(true);

    try {
      const { data, error } = await auth.signUp(email, password);
      
      if (error) {
        setError(error.message);
        showToast(error.message, 'error');
        return;
      }

      if (data?.user) {
        navigate(ROUTES.DASHBOARD_HOME);
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      console.log('🚀 Google Sign Up button clicked');
      setError('');
      console.log('📞 Calling auth.signInWithGoogle...');
      const { data, error } = await auth.signInWithGoogle();
      
      console.log('📊 Google OAuth response:', { data, error });
      
      if (error) {
        console.error('❌ Google OAuth error:', error);
        const errorMessage = 'Failed to sign up with Google. Please try again.';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      } else {
        console.log('✅ Google OAuth initiated successfully');
      }
      // Note: Google OAuth will redirect automatically, so no manual navigation needed
    } catch (error) {
      console.error('💥 Google sign up error:', error);
      const errorMessage = 'Failed to sign up with Google. Please try again.';
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
            <h2 className="text-2xl font-bold text-gray-900">Sign Up</h2>
            <p className="mt-2 text-sm text-gray-600">
              Create your account to get started!
            </p>
          </div>

          <div className="mt-8">
            {/* Social Login Buttons */}
            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 gap-1.5 mb-2"
                style={{ textTransform: 'none' }}
              >
                <img src="/google-logo.svg" alt="Google" style={{ width: 18, height: 18 }} />
                Continue with Google
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
                    autoComplete="new-password"
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

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm Password<span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to={ROUTES.LOGIN} className="font-medium text-blue-600 hover:text-blue-500">
                Sign in here
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

export default Signup;