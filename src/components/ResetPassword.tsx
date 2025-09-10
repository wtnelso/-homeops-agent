import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { auth } from '../lib/supabase';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const { error } = await auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-confirm`, // where user will be redirected after clicking the email link
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMessage('Check your email for a password reset link.');
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you a reset link.
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              {message && (
                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                  {message}
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
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
                </button>
              </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Remembered your password?{' '}
              <Link to={ROUTES.LOGIN} className="font-medium text-blue-600 hover:text-blue-500">
                Back to login
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

export default ResetPassword;
