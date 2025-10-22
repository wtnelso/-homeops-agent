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
import { AUTH_IMAGES } from '../config/authImages';
import HomeOpsLogo from './ui/HomeOpsLogo';
import UserDropdown from './ui/UserDropdown';
import OnboardingModal from './ui/OnboardingModal';
import { isDemoMode } from '../demo/config/demoConfig';
import DemoBanner from '../demo/components/DemoBanner';
import { demoChatService } from '../demo/services/demoChatService';
// import { useSessionTimeout } from '../lib/sessionTimeout';
// import { useToast } from '../contexts/ToastContext';

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
      id: 'mental-load',
      title: 'Mental Load Manager',
      icon: Target,
      description: 'Manage mental load with calendar and signals',
      path: '/dashboard/mental-load'
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
      (page.id === 'family' && currentPath.startsWith('/dashboard/family')) ||
      (page.id === 'mental-load' && currentPath.startsWith('/dashboard/mental-load'))
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
    <div className="min-h-screen bg-white dark:bg-gray-900 font-family-inter">
      {/* Demo Banner - only show in demo mode when not in staging */}
      {isCurrentlyInDemo && import.meta.env.VITE_APP_ENV !== 'STAGING' && (
        <DemoBanner onResetDemo={handleResetDemo} />
      )}

      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo/Title */}
          <div className="flex items-center space-x-2">
            <HomeOpsLogo width={24} height={24} variant="icon" />
            <span className="text-lg font-semibold text-gray-900 dark:text-white">HomeOps</span>
          </div>

          {/* Right side - could add user menu, notifications, etc. */}
          <div className="w-9 h-9"></div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className={`lg:hidden fixed inset-0 z-40 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
      </div>

      {/* Collapsible Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        pt-14 lg:pt-0
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-blue-200/30 dark:border-gray-700/50 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity duration-200" onClick={() => window.location.href = '/'}>
            <HomeOpsLogo 
              width={32} 
              height={32} 
              variant="icon" 
              className=""
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">HomeOps</h1>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
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
                    {page.subItems?.map((subItem) => {
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
      <div className="flex-1 flex flex-col pt-14 lg:pt-0">

        {/* Page Content */}
        <main className="flex-1 overflow-hidden">
          {/* Active Page Content */}
          <div className="h-full w-full overflow-hidden">
            <Outlet />
          </div>
        </main>

        {/* Onboarding Modal */}
        <OnboardingModal
          isOpen={onboardingModalOpen}
          onClose={handleOnboardingComplete}
        />
      </div>
    </div>
  );
};

export default DashboardLayout;