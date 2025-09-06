import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { auth } from '../lib/supabase';
import Layout from './Layout';

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
    <Layout>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Link to={ROUTES.HOME} className="flex justify-center">
              <div className="text-2xl font-bold">
                <span className="text-slate-800">Home</span>
                <span className="text-slate-500">Ops</span>
              </div>
            </Link>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-800">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Enter your email address and we’ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending reset link...' : 'Send reset link'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Remembered your password?{' '}
            <Link to={ROUTES.LOGIN} className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;
