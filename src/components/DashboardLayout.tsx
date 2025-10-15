import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  MessageSquare,
  Calendar,
  Mail,
  Settings,
  Users,
  Brain,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Target
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAdminStatus } from '../hooks/useAdminStatus';
import { ROUTES } from '../config/routes';
import UserDropdown from './ui/UserDropdown';
import CalendarInviteDemo from './ui/CalendarInviteDemo';
import OnboardingModal from './ui/OnboardingModal';
import { isDemoMode } from '../demo/config/demoConfig';
import DemoBanner from '../demo/components/DemoBanner';
import { demoChatService } from '../demo/services/demoChatService';
import { useSessionTimeout } from '../lib/sessionTimeout';
import { useToast } from '../contexts/ToastContext';

interface DashboardPage {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  description: string;
  path: string;
  subItems?: DashboardSubItem[];
}

interface DashboardSubItem {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  path: string;
}

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const { userData } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
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
      icon: MessageSquare,
      description: 'AI Assistant and quick actions',
      path: '/dashboard/home'
    },
    {
      id: 'family',
      title: 'Family Profile',
      icon: Users,
      description: 'Manage family members and profiles',
      path: '/dashboard/family',
      subItems: [
        {
          id: 'family-members',
          title: 'Members',
          icon: Users,
          path: '/dashboard/family/members'
        },
        {
          id: 'family-activities',
          title: 'Activities',
          icon: Target,
          path: '/dashboard/family/activities'
        },
        {
          id: 'family-contacts',
          title: 'Contacts',
          icon: UserPlus,
          path: '/dashboard/family/contacts'
        }
      ]
    },
    {
      id: 'memory',
      title: 'Agent Memory',
      icon: Brain,
      description: 'AI-extracted insights and information',
      path: '/dashboard/memory'
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
      (page.id === 'settings' && currentPath.startsWith('/dashboard/settings')) ||
      (page.id === 'family' && currentPath.startsWith('/dashboard/family'))
    );
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleAccountSettings = () => {
    navigate(ROUTES.DASHBOARD_SETTINGS_ACCOUNT);
  };

  const handleLaunchOnboarding = () => {
    setOnboardingModalOpen(true);
  };

  const handleOnboardingComplete = () => {
    setOnboardingModalOpen(false);
    // Mark demo onboarding as completed if in demo mode
    if (isCurrentlyInDemo) {
      demoChatService.markOnboardingCompleted();
    }
  };

  const handleResetDemo = () => {
    demoChatService.resetDemo();
    // Relaunch onboarding immediately
    setOnboardingModalOpen(true);
  };

  // Check if current user is in demo mode
  const isCurrentlyInDemo = isDemoMode(userData?.user?.email);

  // Auto-launch onboarding for demo users on first visit
  useEffect(() => {
    if (isCurrentlyInDemo && demoChatService.shouldLaunchOnboarding()) {
      // Small delay to ensure UI is ready
      setTimeout(() => {
        setOnboardingModalOpen(true);
      }, 500);
    }
  }, [isCurrentlyInDemo]);

  const currentPage = getCurrentPage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-slate-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col font-family-inter">
      {/* Demo Banner - only show in demo mode when not in staging */}
      {isCurrentlyInDemo && import.meta.env.VITE_APP_ENV !== 'STAGING' && (
        <DemoBanner onResetDemo={handleResetDemo} />
      )}

      {/* Main Dashboard Layout */}
      <div className="flex flex-1">
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
              <p className="text-xs text-blue-100">{userData?.user?.account_name || 'Family Dashboard'}</p>
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
            const isPageActive = location.pathname === page.path ||
              (page.id === 'settings' && location.pathname.startsWith('/dashboard/settings')) ||
              (page.id === 'family' && location.pathname.startsWith('/dashboard/family'));
            const IconComponent = page.icon;
            const hasSubItems = page.subItems && page.subItems.length > 0;
            const isExpanded = expandedSections[page.id];

            // For pages with sub-items, auto-expand if currently on a sub-route
            const shouldAutoExpand = hasSubItems && page.id === 'family' && location.pathname.startsWith('/dashboard/family');
            if (shouldAutoExpand && !isExpanded) {
              expandedSections[page.id] = true;
            }

            return (
              <div key={page.id} className={`${(page.id === 'calendar' || page.id === 'email') ? 'hidden' : ''}`}>
                {/* Main navigation item */}
                <button
                  onClick={() => {
                    if (hasSubItems) {
                      toggleSection(page.id);
                    } else {
                      // Close all expanded sections when navigating to a non-expandable page
                      setExpandedSections({});
                      navigate(page.path);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ease-out
                    ${isPageActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm'
                    }
                  `}
                >
                  <IconComponent className="w-5 h-5" />
                  <div className="flex-1">
                    <span className={`font-semibold tracking-wide ${isPageActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {page.title}
                    </span>
                  </div>
                  {hasSubItems && (
                    <div className="transition-transform duration-200">
                      {isExpanded || shouldAutoExpand ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </button>

                {/* Sub-items */}
                {hasSubItems && (isExpanded || shouldAutoExpand) && (
                  <div className="ml-4 mt-1 space-y-1">
                    {page.subItems.map((subItem) => {
                      const isSubItemActive = location.pathname === subItem.path;
                      const SubIconComponent = subItem.icon;

                      return (
                        <button
                          key={subItem.id}
                          onClick={() => {
                            // Keep the parent section expanded when clicking sub-items
                            navigate(subItem.path);
                            setSidebarOpen(false);
                          }}
                          className={`
                            w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-all duration-200 ease-out text-sm
                            ${isSubItemActive
                              ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                            }
                          `}
                        >
                          <SubIconComponent className="w-4 h-4" />
                          <span className="font-medium tracking-wide">{subItem.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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
              
              {/* Page title - visible on all devices */}
              <div>
                {currentPage && (
                  <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{currentPage.title}</h1>
                  </div>
                )}
              </div>
            </div>

            {/* Right side with user menu */}
            <div className="flex items-center space-x-4">
              {/* Calendar Demo button - only show on Home page and for admins */}
              {currentPage?.id === 'home' && isAdmin && !adminLoading && <CalendarInviteDemo />}

              {/* Admin-only onboarding launch button */}
              {isAdmin && !adminLoading && (
                <button
                  onClick={handleLaunchOnboarding}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Launch Onboarding (Admin Only)"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Onboarding</span>
                </button>
              )}

              <UserDropdown onAccountSettings={handleAccountSettings} />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-hidden">
          {/* Active Page Content */}
          <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-blue-200/30 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
            <Outlet />
          </div>
        </main>
      </div>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={onboardingModalOpen}
        onClose={handleOnboardingComplete}
      />
    </div>
  );
};

export default DashboardLayout;