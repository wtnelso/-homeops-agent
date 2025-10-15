import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { AuthValidator } from '../lib/validation';
import { clearPasswordResetSession } from '../hooks/usePasswordResetSession';
import { AUTH_IMAGES } from '../config/authImages';
import { AUTH_PROVIDERS } from '../config/authProviders';
import PasswordStrengthChecker from './ui/PasswordStrengthChecker';
import MobileAuthHeader from './ui/MobileAuthHeader';
import MobileAuthFooter from './ui/MobileAuthFooter';

const ResetPasswordConfirm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Check for required parameters and validate user provider
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    // Set the session with the tokens from the URL
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    }).then(async ({ data, error }) => {
      if (error) {
        console.error('Error setting session:', error);
        setError('Invalid reset link. Please request a new password reset.');
        return;
      }

      // Check if user is OAuth user (shouldn't be setting passwords)
      if (data?.user) {
        const userMetadata = data.user.app_metadata;
        const provider = userMetadata?.provider;

        // If user signed up with OAuth, block password creation
        if (provider && provider !== 'email') {
          const providerConfig = AUTH_PROVIDERS[provider];
          const providerName = providerConfig?.displayName || provider;
          setError(`This account is registered with ${providerName}. Please sign in with ${providerName} instead of creating a password.`);
          return;
        }
      }
    }).catch((err) => {
      console.error('Error setting session:', err);
      setError('Invalid reset link. Please request a new password reset.');
    });
  }, [searchParams]);

  const validateForm = (): boolean => {
    const errors: string[] = [];
    const newFieldErrors: {[key: string]: boolean} = {};
    let priorityError: string | null = null;

    // Priority 1: Password validation
    const passwordValidation = AuthValidator.validatePassword(password);
    if (!passwordValidation.isValid) {
      newFieldErrors.password = true;
      priorityError = 'Password does not meet security requirements';
      showToast(priorityError, 'error');
    }
    // Priority 2: Password confirmation (only if password is valid)
    else {
      const confirmValidation = AuthValidator.validatePasswordConfirmation(password, confirmPassword);
      if (!confirmValidation.isValid) {
        newFieldErrors.confirmPassword = true;
        priorityError = 'Passwords do not match';
        showToast(priorityError, 'error');
      }
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

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
        showToast(error.message, 'error');
        return;
      }

      // Clear password reset session
      await clearPasswordResetSession();

      setIsSuccess(true);
      showToast('Password updated successfully!', 'success');

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 3000);

    } catch (error) {
      console.error('Password update error:', error);
      const errorMessage = 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="flex-1 flex flex-col lg:w-1/2 relative">
          <MobileAuthHeader />

          {/* Desktop back button - positioned at top left */}
          <div className="hidden lg:block absolute top-6 left-6 z-10">
            <Link
              to={ROUTES.HOME}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 2px 8px 0 rgba(99, 102, 241, 0.3)',
                fontWeight: 600
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(99, 102, 241, 0.3)';
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Return home
            </Link>
          </div>

          <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 pt-16 lg:pt-0 bg-gray-50">
            <div className="mx-auto w-full max-w-sm lg:w-96 text-center">
              <div className="mb-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900">Password Updated!</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Your password has been successfully updated. You will be redirected to the login page shortly.
                </p>
              </div>

              <Link
                to={ROUTES.LOGIN}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Continue to Login
              </Link>
            </div>
          </div>
        </div>

        <MobileAuthFooter />

        <div className="hidden lg:block relative lg:w-1/2">
          <div
            className="absolute inset-0 h-full w-full bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url('${AUTH_IMAGES.backgrounds.resetPasswordConfirm}')`,
              backgroundPosition: AUTH_IMAGES.backgroundPositions.resetPasswordConfirm,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col lg:w-1/2 relative">
        <MobileAuthHeader />

        {/* Desktop back button - positioned at top left */}
        <div className="hidden lg:block absolute top-6 left-6 z-10">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              boxShadow: '0 2px 8px 0 rgba(99, 102, 241, 0.3)',
              fontWeight: 600
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(99, 102, 241, 0.3)';
            }}
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

              <h2 className="text-2xl font-bold text-gray-900 text-center">Set New Password</h2>
              <p className="mt-2 text-sm text-gray-600 text-center">
                Please enter your new password below.
              </p>
            </div>

            <div className="mt-8">
              <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                {error && (
                  <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                    {error}
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
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    New Password<span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors(prev => ({ ...prev, password: false }));
                        }
                      }}
                      className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm ${
                        fieldErrors.password
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Enter your new password"
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
                    Confirm New Password<span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirmPassword) {
                          setFieldErrors(prev => ({ ...prev, confirmPassword: false }));
                        }
                      }}
                      className={`appearance-none block w-full px-3 py-2 pr-10 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm ${
                        fieldErrors.confirmPassword
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Confirm your new password"
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

                <PasswordStrengthChecker password={password} confirmPassword={confirmPassword} />

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      boxShadow: '0 2px 8px 0 rgba(99, 102, 241, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(99, 102, 241, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(99, 102, 241, 0.3)';
                    }}
                  >
                    {isLoading ? 'Updating password...' : 'Update Password'}
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link to={ROUTES.LOGIN} className="font-medium text-blue-600 hover:text-blue-500">
                  Back to login
                </Link>
              </p>
            </div>
          </div>
        </div>

        <MobileAuthFooter />
      </div>

      <div className="hidden lg:block relative lg:w-1/2">
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url('${AUTH_IMAGES.backgrounds.resetPasswordConfirm}')`,
            backgroundPosition: AUTH_IMAGES.backgroundPositions.resetPasswordConfirm,
          }}
        />
      </div>
    </div>
  );
};

export default ResetPasswordConfirm;