import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { auth } from '../lib/supabase';
import { AuthValidator } from '../lib/validation';
import { useToast } from '../contexts/ToastContext';
import { AUTH_IMAGES } from '../config/authImages';
import MobileAuthHeader from './ui/MobileAuthHeader';
import MobileAuthFooter from './ui/MobileAuthFooter';

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  const { showToast } = useToast();

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const newFieldErrors: {[key: string]: boolean} = {};
    let priorityError: string | null = null;

    // Priority 1: Email validation
    const emailValidation = AuthValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      newFieldErrors.email = true;
      priorityError = emailValidation.errors[0]; // Show first email error
      showToast(priorityError, 'error');
    }

    // Only show one error at a time
    if (priorityError) {
      errors.push(priorityError);
    }

    setValidationErrors(errors);
    setFieldErrors(newFieldErrors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setValidationErrors([]);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD_CONFIRM}`,
      });

      if (error) {
        // Check if this is a provider mismatch error (OAuth user trying to reset password)
        if ((error as any).provider) {
          setError(error.message);
          showToast(error.message, 'error');
          return;
        }

        setError('Unable to send reset email. Please verify your email address and try again.');
        showToast('Unable to send reset email. Please try again.', 'error');
        return;
      }

      setMessage('If an account with this email exists, you will receive a password reset link.');
      showToast('If an account exists, a reset link has been sent!', 'success');
    } catch (err) {
      console.error('Reset password error:', err);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Form Panel - Full width on mobile, half on desktop */}
      <div className="flex-1 flex flex-col lg:w-1/2 relative">
        <MobileAuthHeader />

        {/* Desktop back button - positioned at top left */}
        <div className="hidden lg:block absolute top-6 left-6 z-10">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Return home
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 pt-16 lg:pt-0 bg-gray-50">
          <div className="mx-auto w-full max-w-sm lg:w-96">

          <div>
            {/* Hero favicon */}
            <div className="flex justify-center mb-6">
              <img src={AUTH_IMAGES.hero.favicon} alt="HomeOps" className="w-16 h-16" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-600 text-center">
              Enter your email address. If an account is found, we'll send you a reset link.
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
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

              {validationErrors.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600">
                      {error}
                    </div>
                  ))}
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors(prev => ({ ...prev, email: false }));
                      }
                    }}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm ${
                      fieldErrors.email
                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="info@gmail.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5"
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

        <MobileAuthFooter />
      </div>

      {/* Right Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:block relative lg:w-1/2">
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url('${AUTH_IMAGES.backgrounds.resetPassword}')`,
            backgroundPosition: AUTH_IMAGES.backgroundPositions.resetPassword,
          }}
        >
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
