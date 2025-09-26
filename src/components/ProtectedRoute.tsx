import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../config/routes';
import { PageLoader } from './ui/Loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}


const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Removed onboarding redirect logic

  if (loading) {
    return <PageLoader text="Loading your account..." />;
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  // Removed onboarding redirect check

  return <>{children}</>;
};

export default ProtectedRoute;