import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Home, 
  BarChart3, 
  FileText, 
  Settings, 
  Menu,
  X,
  ChevronDown,
  LogOut,
  HelpCircle,
  User,
  MessageCircle,
  Calendar,
  Mail
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Dashboard page components
import HomePage from './dashboard/HomePage';
import CalendarPage from './dashboard/CalendarPage';
import EmailPage from './dashboard/EmailPage';
import OverviewPage from './dashboard/OverviewPage';
import AnalyticsPage from './dashboard/AnalyticsPage';
import ReportsPage from './dashboard/ReportsPage';
import SettingsPage from './dashboard/SettingsPage';

interface DashboardPage {
  id: string;
  title: string;
  icon: React.ElementType;
  component: React.ComponentType;
  description: string;
}

const Dashboard: React.FC = () => {
  const [activePage, setActivePage] = useState<string>('home');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { user, signOut } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the button (which has the dropdownRef)
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Also check if click is not on the portal dropdown itself
        const dropdownElement = document.querySelector('[data-dropdown-portal]');
        if (!dropdownElement || !dropdownElement.contains(event.target as Node)) {
          setDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dashboardPages: DashboardPage[] = [
    {
      id: 'home',
      title: 'Home',
      icon: MessageCircle,
      component: HomePage,
      description: 'AI Assistant and quick actions'
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: Calendar,
      component: CalendarPage,
      description: 'Interactive calendar and events'
    },
    {
      id: 'email',
      title: 'Email',
      icon: Mail,
      component: EmailPage,
      description: 'Email management and intelligence'
    },
    {
      id: 'overview',
      title: 'Overview',
      icon: Home,
      component: OverviewPage,
      description: 'Dashboard overview and key metrics'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: BarChart3,
      component: AnalyticsPage,
      description: 'Detailed analytics and insights'
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: FileText,
      component: ReportsPage,
      description: 'Generate and view reports'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      component: SettingsPage,
      description: 'Dashboard and system settings'
    }
  ];

  const renderActivePage = () => {
    const currentPage = dashboardPages.find(page => page.id === activePage);
    if (currentPage) {
      const Component = currentPage.component;
      return (
        <div 
          key={activePage} 
          className={`transition-opacity duration-300 ease-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Component />
        </div>
      );
    }
    return <HomePage />;
  };


  const handleAccountSettings = () => {
    console.log('Account Settings clicked');
    setDropdownOpen(false); // Close dropdown first
    if ('settings' !== activePage) {
      setIsTransitioning(true);
      setTimeout(() => {
        setActivePage('settings');
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    }
  };

  const handleSupport = () => {
    console.log('Support clicked');
    setDropdownOpen(false); // Close dropdown first
    window.open('mailto:support@homeops.example.com', '_blank');
  };

  const handleLogoutClick = async () => {
    console.log('Logout clicked');
    setDropdownOpen(false); // Close dropdown first
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  };

  const toggleDropdown = () => {
    if (!dropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right // Distance from right edge
      });
    }
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex font-family-inter">
      {/* Mobile Sidebar Overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
      </div>

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-xl dark:bg-gray-800/95 border-r border-blue-200/50 dark:border-gray-700/50 shadow-xl
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-blue-200/30 dark:border-gray-700/50 bg-gradient-to-r from-blue-600 to-slate-600">
          <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity duration-200" onClick={() => window.location.href = '/'}>
            <img 
              src="/favicon.ico" 
              alt="HomeOps Logo" 
              className="w-8 h-8 rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">HomeOps</h1>
              <p className="text-xs text-blue-100">Family Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-blue-200 hover:text-white transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-1">
          {dashboardPages.map((page) => {
            const Icon = page.icon;
            const isActive = activePage === page.id;
            
            return (
              <button
                key={page.id}
                onClick={() => {
                  if (page.id !== activePage) {
                    setIsTransitioning(true);
                    setTimeout(() => {
                      setActivePage(page.id);
                      setTimeout(() => setIsTransitioning(false), 50);
                    }, 200);
                  }
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ease-out
                  ${isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm'
                  }
                `}
              >
                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1">
                  <span className={`font-semibold tracking-wide ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>{page.title}</span>
                </div>
              </button>
            );
          })}
        </nav>

      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 flex flex-col">
        {/* Header Bar - Always visible */}
        <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border-b border-blue-200/30 dark:border-gray-700/50 px-4 lg:px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors duration-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Page title - hidden on mobile */}
              <div className="hidden lg:block">
                {dashboardPages.map((page) => {
                  if (page.id === activePage) {
                    return (
                      <div key={page.id}>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{page.title}</h1>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Right side with status and user menu */}
            <div className="flex items-center space-x-4">

              {/* User Profile Dropdown */}
              <div className="relative z-[99998]" ref={dropdownRef}>
                <button
                  ref={buttonRef}
                  onClick={toggleDropdown}
                  className="flex items-center space-x-3 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center space-x-2">
                    {getUserAvatar() ? (
                      <img
                        src={getUserAvatar()!}
                        alt={getUserDisplayName()}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-slate-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-sm font-medium">
                          {getUserDisplayName().charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'Guest'}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Mobile Page Header - Only shown on mobile */}
          <div className="lg:hidden mb-6">
            {dashboardPages.map((page) => {
              if (page.id === activePage) {
                const Icon = page.icon;
                return (
                  <div key={page.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-slate-100 dark:bg-gradient-to-br dark:from-blue-900/40 dark:to-slate-900/40 rounded-xl flex items-center justify-center shadow-md">
                      <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{page.title}</h2>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Active Page Content */}
          <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-blue-200/30 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
            {renderActivePage()}
          </div>
        </main>

      </div>

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
                handleAccountSettings();
              }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-all duration-200 rounded-lg mx-1 hover:shadow-sm"
            >
              <User className="w-4 h-4 mr-3" />
              Account Settings
            </button>
            
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

export default Dashboard;