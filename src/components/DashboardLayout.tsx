import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Menu,
  X,
  MessageCircle,
  Calendar,
  Mail
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../config/routes';
import UserDropdown from './ui/UserDropdown';

interface DashboardPage {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  path: string;
}

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const { userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect /dashboard to /dashboard/home
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      navigate('/dashboard/home', { replace: true });
    }
  }, [location.pathname, navigate]);

  const dashboardPages: DashboardPage[] = [
    {
      id: 'home',
      title: 'Home',
      icon: MessageCircle,
      description: 'AI Assistant and quick actions',
      path: '/dashboard/home'
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: Calendar,
      description: 'Interactive calendar and events',
      path: '/dashboard/calendar'
    },
    {
      id: 'email',
      title: 'Email',
      icon: Mail,
      description: 'Email management and intelligence',
      path: '/dashboard/email'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      description: 'Dashboard and system settings',
      path: '/dashboard/settings'
    }
  ];

  const getCurrentPage = (): DashboardPage | undefined => {
    const currentPath = location.pathname;
    return dashboardPages.find(page => 
      currentPath === page.path || 
      (page.id === 'settings' && currentPath.startsWith('/dashboard/settings'))
    );
  };

  const handleAccountSettings = () => {
    navigate(ROUTES.DASHBOARD_SETTINGS_ACCOUNT);
  };

  const currentPage = getCurrentPage();

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
              <p className="text-xs text-blue-100">{userData?.account?.account_name || 'Family Dashboard'}</p>
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
            const isActive = location.pathname === page.path || 
              (page.id === 'settings' && location.pathname.startsWith('/dashboard/settings'));
            
            return (
              <button
                key={page.id}
                onClick={() => {
                  navigate(page.path);
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
        {/* Header Bar */}
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
                {currentPage && (
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{currentPage.title}</h1>
                  </div>
                )}
              </div>
            </div>

            {/* Right side with user menu */}
            <div className="flex items-center space-x-4">
              <UserDropdown onAccountSettings={handleAccountSettings} />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Mobile Page Header */}
          <div className="lg:hidden mb-6">
            {currentPage && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-slate-100 dark:bg-gradient-to-br dark:from-blue-900/40 dark:to-slate-900/40 rounded-xl flex items-center justify-center shadow-md">
                  <currentPage.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{currentPage.title}</h2>
                </div>
              </div>
            )}
          </div>

          {/* Active Page Content */}
          <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-blue-200/30 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;