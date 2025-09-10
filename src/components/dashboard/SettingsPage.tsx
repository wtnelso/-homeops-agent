import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Database,
  CreditCard,
  Save
} from 'lucide-react';
import ProfileSection from './settings/ProfileSection';
import NotificationsSection from './settings/NotificationsSection';
import IntegrationsSection from './settings/IntegrationsSection';
import PlanSection from './settings/PlanSection';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'plan', label: 'Plan & Billing', icon: CreditCard }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSection />;

      case 'notifications':
        return <NotificationsSection />;

      case 'integrations':
        return <IntegrationsSection />;

      case 'plan':
        return <PlanSection />;

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id !== activeTab) {
                        setIsTransitioning(true);
                        setTimeout(() => {
                          setActiveTab(tab.id);
                          setTimeout(() => setIsTransitioning(false), 50);
                        }, 200);
                      }
                    }}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ease-out
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-sm'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
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
            <div 
              key={activeTab} 
              className={`transition-opacity duration-300 ease-out ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {renderTabContent()}
            </div>
            
            {/* Save Button - Hidden for Integrations and Plan tabs */}
            {activeTab !== 'integrations' && activeTab !== 'plan' && (
              <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;