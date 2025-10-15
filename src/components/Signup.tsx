import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { auth } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { Eye, EyeOff } from 'lucide-react';
import { AuthValidator } from '../lib/validation';
import { AUTH_IMAGES } from '../config/authImages';
import PasswordStrengthChecker from './ui/PasswordStrengthChecker';
import MobileAuthHeader from './ui/MobileAuthHeader';
import MobileAuthFooter from './ui/MobileAuthFooter';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  const navigate = useNavigate();
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
    // Priority 2: Password validation (only if email is valid)
    else {
      const passwordValidation = AuthValidator.validatePassword(password);
      if (!passwordValidation.isValid) {
        newFieldErrors.password = true;
        priorityError = 'Password does not meet security requirements';
        showToast(priorityError, 'error');
      }
      // Priority 3: Password confirmation (only if email and password are valid)
      else {
        const confirmValidation = AuthValidator.validatePasswordConfirmation(password, confirmPassword);
        if (!confirmValidation.isValid) {
          newFieldErrors.confirmPassword = true;
          priorityError = 'Passwords do not match';
          showToast(priorityError, 'error');
        }
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
    setValidationErrors([]);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await auth.signUp(email, password);

      if (error) {
        // Check if this is a provider mismatch error
        if ((error as any).provider) {
          setError(error.message);
          showToast(error.message, 'error');
          return;
        }

        setError(error.message);
        showToast(error.message, 'error');
        return;
      }

      if (data?.user) {
        showToast('Account created successfully! Please check your email to verify your account.', 'success');
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
            <div className="flex justify-center mb-4">
              <img src={AUTH_IMAGES.hero.favicon} alt="HomeOps" className="w-12 h-12" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 text-center">Sign Up</h2>
            <p className="mt-1 text-sm text-gray-600 text-center">
              Create your account to get started!
            </p>
          </div>

          <div className="mt-4">
            {/* Social Login Buttons */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 gap-1.5 mb-2"
                style={{ textTransform: 'none' }}
              >
                <img src={AUTH_IMAGES.logos.google} alt="Google" style={{ width: 18, height: 18 }} />
                Continue with Google
              </button>
            </div>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit} noValidate>
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

        <MobileAuthFooter />
      </div>

      {/* Right Panel - Branding (hidden on mobile) */}
      <div className="hidden lg:block relative lg:w-1/2">
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-no-repeat"
          style={{
            backgroundImage: `url('${AUTH_IMAGES.backgrounds.signup}')`,
            backgroundPosition: AUTH_IMAGES.backgroundPositions.signup,
          }}
        >
        </div>
      </div>
    </div>
  );
};

export default Signup;