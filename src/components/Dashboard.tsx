import React, { useState, useRef, useEffect } from 'react';
import { 
  Home, 
  BarChart3, 
  FileText, 
  Settings, 
  Users, 
  Calendar,
  TrendingUp,
  PieChart,
  Activity,
  Menu,
  X,
  ChevronDown,
  LogOut,
  HelpCircle,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Dashboard page components
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
  const [activePage, setActivePage] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dashboardPages: DashboardPage[] = [
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
      return <Component />;
    }
    return <OverviewPage />;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleAccountSettings = () => {
    setActivePage('settings');
    setDropdownOpen(false);
  };

  const handleSupport = () => {
    window.open('mailto:support@homeops.example.com', '_blank');
    setDropdownOpen(false);
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile Sidebar Overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
      </div>

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.href = '/'}>
            <img 
              src="/favicon.ico" 
              alt="HomeOps Logo" 
              className="w-8 h-8 rounded-lg"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">HomeOps</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-2">
          {dashboardPages.map((page) => {
            const Icon = page.icon;
            const isActive = activePage === page.id;
            
            return (
              <button
                key={page.id}
                onClick={() => {
                  setActivePage(page.id);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200
                  ${isActive
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-l-2 border-brand-500'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <div className="flex-1">
                  <span className="font-medium">{page.title}</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{page.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Quick Stats in Sidebar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-success-100 dark:bg-success-900/20 rounded-md flex items-center justify-center">
                <Activity className="w-3 h-3 text-success-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-900 dark:text-white">System Status</p>
                <p className="text-xs text-success-600 dark:text-success-400">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 flex flex-col">
        {/* Header Bar - Always visible */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Page title - hidden on mobile */}
              <div className="hidden lg:block">
                {dashboardPages.map((page) => {
                  if (page.id === activePage) {
                    return (
                      <div key={page.id}>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{page.title}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{page.description}</p>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Right side with status and user menu */}
            <div className="flex items-center space-x-4">
              {/* System Status */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Activity className="w-4 h-4" />
                <span>System Online</span>
              </div>

              {/* User Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-2">
                    {getUserAvatar() ? (
                      <img
                        src={getUserAvatar()!}
                        alt={getUserDisplayName()}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-primary-600 rounded-full flex items-center justify-center">
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

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        {getUserAvatar() ? (
                          <img
                            src={getUserAvatar()!}
                            alt={getUserDisplayName()}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-primary-600 rounded-full flex items-center justify-center">
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
                        onClick={handleAccountSettings}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Account Settings
                      </button>
                      
                      <button
                        onClick={handleSupport}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <HelpCircle className="w-4 h-4 mr-3" />
                        Support
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {/* Mobile Page Header - Only shown on mobile */}
          <div className="lg:hidden mb-6">
            {dashboardPages.map((page) => {
              if (page.id === activePage) {
                const Icon = page.icon;
                return (
                  <div key={page.id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{page.title}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{page.description}</p>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>

          {/* Active Page Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {renderActivePage()}
          </div>
        </main>

        {/* Footer Stats - Hidden on Mobile */}
        <div className="hidden lg:block bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8">
          <div className="px-8 py-4">
            <div className="grid grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-success-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Active Tasks</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">12 running</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-primary-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Data Processed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1.2k items</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Family Members</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">4 active</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-brand-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Upcoming Events</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">8 this week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;