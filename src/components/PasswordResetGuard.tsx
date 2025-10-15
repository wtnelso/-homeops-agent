import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import usePasswordResetSession from '../hooks/usePasswordResetSession';
import { useToast } from '../contexts/ToastContext';

interface PasswordResetGuardProps {
  children: React.ReactNode;
}

const PasswordResetGuard: React.FC<PasswordResetGuardProps> = ({ children }) => {
  const { isPasswordResetSession, sessionType } = usePasswordResetSession();
  const location = useLocation();
  const { showToast } = useToast();

  // Don't block if we're still loading session state - just render children
  if (sessionType === 'loading') {
    return <>{children}</>;
  }

  // Don't block if this is not a password reset session
  if (!isPasswordResetSession) {
    return <>{children}</>;
  }

  // Allow access to password reset confirmation page
  if (location.pathname === ROUTES.RESET_PASSWORD_CONFIRM) {
    return <>{children}</>;
  }

  // Allow access to other auth pages (login, signup, etc.)
  const allowedDuringReset = [
    ROUTES.LOGIN,
    ROUTES.SIGNUP,
    ROUTES.RESET_PASSWORD,
    ROUTES.HOME,
    ROUTES.PRIVACY,
    ROUTES.TERMS
  ];

  if (allowedDuringReset.includes(location.pathname as any)) {
    return <>{children}</>;
  }

  // Block access to dashboard and other protected routes during password reset
  // Show toast notification explaining the restriction
  React.useEffect(() => {
    if (isPasswordResetSession) {
      showToast(
        'Please complete your password reset before accessing the dashboard.',
        'warning'
      );
    }
  }, [isPasswordResetSession, showToast]);

  // Redirect to password reset confirmation page
  return <Navigate to={ROUTES.RESET_PASSWORD_CONFIRM} replace />;
};

export default PasswordResetGuard;