import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ROUTES } from '../config/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}


const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, userData, userDataLoading, isOnboardingRequired } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();

  // Show toast when redirecting to onboarding from dashboard routes
  useEffect(() => {
    if (userData && isOnboardingRequired() && location.pathname !== ROUTES.ONBOARDING) {
      // Only show toast if user is trying to access dashboard routes
      // Don't show if they're coming from auth callback or other routes
      if (location.pathname.startsWith(ROUTES.DASHBOARD)) {
        showToast('Please complete onboarding before using HomeOps', 'warning');
      }
    }
  }, [userData, isOnboardingRequired, location.pathname, showToast]);

  if (loading || (user && userDataLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Redirect to onboarding if user needs to complete setup
  // BUT only if we're not already on the onboarding page (prevent infinite redirect)
  if (userData && isOnboardingRequired() && location.pathname !== ROUTES.ONBOARDING) {
    return <Navigate to={ROUTES.ONBOARDING} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;