import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminService } from '../services/adminService';
import { BETA_MODE } from '../config/routes';
import { LogOut, Mail, Shield } from 'lucide-react';

interface BetaGateProps {
  children: React.ReactNode;
}

const BetaGate: React.FC<BetaGateProps> = ({ children }) => {
  const { user, signOut, loading: authLoading } = useAuth();
  const [betaLoading, setBetaLoading] = useState(true);
  const [hasBetaAccess, setHasBetaAccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // If beta mode is disabled, allow all users through
  if (!BETA_MODE) {
    return <>{children}</>;
  }

  useEffect(() => {
    const checkBetaAccess = async () => {
      if (authLoading) {
        return; // Wait for auth to finish loading
      }

      if (!user?.email) {
        setBetaLoading(false);
        return; // Will be handled by auth redirect
      }

      try {
        setBetaLoading(true);
        
        // Check both admin status and beta access
        const [adminCheck, betaCheck] = await Promise.all([
          AdminService.checkCurrentUserAdminStatus(),
          AdminService.checkBetaAccess(user.email)
        ]);

        setIsAdmin(adminCheck.isAdmin);
        setHasBetaAccess(betaCheck.isAdmin); // Using isAdmin field for beta access check

        // Admins automatically have beta access
        if (adminCheck.isAdmin) {
          setHasBetaAccess(true);
        }
      } catch (error) {
        console.error('Error checking beta access:', error);
        setHasBetaAccess(false);
        setIsAdmin(false);
      } finally {
        setBetaLoading(false);
      }
    };

    checkBetaAccess();
  }, [user, authLoading]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading state while checking authentication and beta access
  if (authLoading || betaLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, let the auth system handle redirect
  if (!user) {
    return <>{children}</>;
  }

  // If user doesn't have beta access and isn't an admin, show access denied
  if (!hasBetaAccess && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Beta Access Required
          </h2>
          
          <div className="mb-6 text-gray-600 dark:text-gray-400 space-y-3">
            <p>
              HomeOps is currently in private beta. Your account needs to be added to the beta users list to access the platform.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {user.email}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                This email address needs beta access
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              To request beta access, please contact the HomeOps team or ask an admin to add your email address.
            </p>
            
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-lg font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              HomeOps Private Beta
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User has beta access (or is admin), render the children
  return <>{children}</>;
};

export default BetaGate;