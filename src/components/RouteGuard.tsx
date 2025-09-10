import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IS_LIVE } from '../config/routes';
import { useAuth } from '../contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Skip checks while auth is loading
    if (loading) return;

    // If not live and trying to access any route other than home, redirect to home
    if (!IS_LIVE && location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [location, navigate, user, loading]);

  // If auth is loading, show loading state
  if (loading) {
    return null;
  }

  // If not live and not on home page, don't render anything while redirecting
  if (!IS_LIVE && location.pathname !== '/') {
    return null;
  }

  return <>{children}</>;
};

export default RouteGuard;