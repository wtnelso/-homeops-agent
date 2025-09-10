import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, 
  Database,
  Building
} from 'lucide-react';
import { ROUTES } from '../config/routes';

interface SettingsTab {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const SettingsLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect /dashboard/settings to /dashboard/settings/profile
  React.useEffect(() => {
    if (location.pathname === ROUTES.DASHBOARD_SETTINGS) {
      navigate(ROUTES.DASHBOARD_SETTINGS_PROFILE, { replace: true });
    }
  }, [location.pathname, navigate]);

  const settingsTabs: SettingsTab[] = [
    { id: 'profile', label: 'Profile', icon: User, path: ROUTES.DASHBOARD_SETTINGS_PROFILE },
    { id: 'account', label: 'Account', icon: Building, path: ROUTES.DASHBOARD_SETTINGS_ACCOUNT },
    { id: 'integrations', label: 'Integrations', icon: Database, path: ROUTES.DASHBOARD_SETTINGS_INTEGRATIONS }
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = location.pathname === tab.path;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                      ${isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;