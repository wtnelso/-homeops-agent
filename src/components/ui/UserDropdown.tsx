import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, HelpCircle, User, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

interface UserDropdownProps {
  showAccountSettings?: boolean;
  onAccountSettings?: () => void;
  className?: string;
}

const UserDropdown: React.FC<UserDropdownProps> = ({ 
  showAccountSettings = true, 
  onAccountSettings,
  className = ""
}) => {
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, userData, signOut } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const dropdownElement = document.querySelector('[data-dropdown-portal]');
        if (!dropdownElement || !dropdownElement.contains(event.target as Node)) {
          setDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    if (!userData?.user) return null;
    // Prioritize user-provided avatar, then database avatar_url, then OAuth metadata
    return userData.user.avatar_user_provided || 
           userData.user.avatar_url || 
           user?.user_metadata?.avatar_url || 
           user?.user_metadata?.picture || 
           null;
  };

  const toggleDropdown = () => {
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setDropdownOpen(!dropdownOpen);
  };

  const handleDashboard = () => {
    console.log('Dashboard clicked');
    setDropdownOpen(false);
    navigate(ROUTES.DASHBOARD_HOME);
  };

  const handleAccountSettings = () => {
    console.log('Account Settings clicked');
    setDropdownOpen(false);
    if (onAccountSettings) {
      onAccountSettings();
    } else {
      navigate(ROUTES.DASHBOARD_SETTINGS_ACCOUNT);
    }
  };

  const handleSupport = () => {
    console.log('Support clicked');
    setDropdownOpen(false);
    window.open('mailto:support@homeops.example.com', '_blank');
  };

  const handleLogoutClick = async () => {
    console.log('Logout clicked');
    setDropdownOpen(false);
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className={`relative z-[99998] ${className}`} ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="flex items-center p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-all duration-200 hover:shadow-sm"
      >
        {getUserAvatar() ? (
          <img
            src={getUserAvatar()!}
            alt={getUserDisplayName()}
            className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
          />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-slate-600 rounded-full flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-600">
            <span className="text-white text-sm font-medium">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </button>

      {/* Portal Dropdown Menu */}
      {dropdownOpen && dropdownPosition && createPortal(
        <div 
          data-dropdown-portal
          className="fixed w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2"
          style={{ 
            top: dropdownPosition.top,
            right: dropdownPosition.right,
            zIndex: 999999
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* User info */}
          <div className="px-4 py-3 border-b border-blue-200/30 dark:border-gray-700/50 bg-gradient-to-r from-blue-50 to-slate-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-t-xl">
            <div className="flex items-center space-x-3">
              {getUserAvatar() ? (
                <img
                  src={getUserAvatar()!}
                  alt={getUserDisplayName()}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-slate-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-medium">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{getUserDisplayName()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'Guest'}</p>
              </div>
            </div>
          </div>

          {/* Dropdown items */}
          <div className="py-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDashboard();
              }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-all duration-200 rounded-lg mx-1 hover:shadow-sm"
            >
              <Home className="w-4 h-4 mr-3" />
              Dashboard
            </button>
            
            {showAccountSettings && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAccountSettings();
                }}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-all duration-200 rounded-lg mx-1 hover:shadow-sm"
              >
                <User className="w-4 h-4 mr-3" />
                Account Settings
              </button>
            )}
            
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSupport();
              }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-all duration-200 rounded-lg mx-1 hover:shadow-sm"
            >
              <HelpCircle className="w-4 h-4 mr-3" />
              Support
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLogoutClick();
              }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 rounded-lg mx-1 hover:shadow-sm font-medium"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UserDropdown;