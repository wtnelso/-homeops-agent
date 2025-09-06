import React, { useState } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  Database,
  Mail,
  Calendar,
  Users,
  Key,
  Globe,
  Monitor,
  Moon,
  Sun,
  Save
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState({
    email: true,
    calendar: true,
    system: false,
    family: true
  });

  const settingsTabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'integrations', label: 'Integrations', icon: Database }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue="John Doe"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    defaultValue="john.doe@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    defaultValue="+1 (555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Zone
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                    <option>Eastern Time (UTC-5)</option>
                    <option>Central Time (UTC-6)</option>
                    <option>Mountain Time (UTC-7)</option>
                    <option>Pacific Time (UTC-8)</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Family Settings</h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Family Members</span>
                  <button className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">Add Member</button>
                </div>
                <div className="space-y-2">
                  {['John Doe (Admin)', 'Jane Doe', 'Alex Doe', 'Sam Doe'].map((member, index) => (
                    <div key={index} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                      <span className="text-sm text-gray-900 dark:text-white">{member}</span>
                      <button className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Edit</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { id: 'email', label: 'Email Intelligence Alerts', description: 'Get notified about important emails and summaries', icon: Mail },
                  { id: 'calendar', label: 'Calendar Reminders', description: 'Receive notifications for upcoming events and conflicts', icon: Calendar },
                  { id: 'system', label: 'System Alerts', description: 'Technical notifications about system health and updates', icon: Monitor },
                  { id: 'family', label: 'Family Activity', description: 'Updates about family member activities and schedules', icon: Users }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{item.description}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                          ${notifications[item.id as keyof typeof notifications] ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                            ${notifications[item.id as keyof typeof notifications] ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Delivery Methods</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-2">
                    <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Email Notifications</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Send notifications to your email address</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">john.doe@example.com</span>
                    <span className="text-xs px-2 py-1 bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400 rounded-full">Active</span>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3 mb-2">
                    <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Push Notifications</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Browser push notifications</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Browser alerts</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">Disabled</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Security</h3>
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Key className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Password</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Last changed 3 months ago</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 border border-brand-600 dark:border-brand-400 rounded">
                      Change
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Shield className="w-5 h-5 text-success-600 dark:text-success-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Add an extra layer of security</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 text-sm text-success-600 hover:text-success-700 dark:text-success-400 border border-success-600 dark:border-success-400 rounded">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Sessions</h3>
              <div className="space-y-3">
                {[
                  { device: 'MacBook Pro', location: 'New York, NY', lastActive: 'Current session', status: 'current' },
                  { device: 'iPhone 14', location: 'New York, NY', lastActive: '2 hours ago', status: 'active' },
                  { device: 'iPad Pro', location: 'Boston, MA', lastActive: '1 day ago', status: 'inactive' }
                ].map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{session.device}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{session.location} • {session.lastActive}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`
                        text-xs px-2 py-1 rounded-full
                        ${session.status === 'current' ? 'bg-brand-100 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' :
                          session.status === 'active' ? 'bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }
                      `}>
                        {session.status === 'current' ? 'This device' : session.status}
                      </span>
                      {session.status !== 'current' && (
                        <button className="text-xs text-error-600 hover:text-error-700 dark:text-error-400">
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <span className="font-medium text-gray-900 dark:text-white">Light Mode</span>
                  </div>
                  <div className="w-full h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded border border-gray-200"></div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <Moon className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-gray-900 dark:text-white">Dark Mode</span>
                  </div>
                  <div className="w-full h-16 bg-gradient-to-br from-gray-800 to-gray-900 rounded border border-gray-600"></div>
                </div>

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center space-x-3 mb-3">
                    <Monitor className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">System</span>
                  </div>
                  <div className="w-full h-16 bg-gradient-to-r from-blue-100 via-white to-gray-800 rounded border border-gray-300"></div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Color Scheme</h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {[
                  { name: 'Brand Blue', color: 'bg-brand-500' },
                  { name: 'Primary', color: 'bg-primary-500' },
                  { name: 'Success', color: 'bg-success-500' },
                  { name: 'Orange', color: 'bg-orange-500' },
                  { name: 'Purple', color: 'bg-purple-500' },
                  { name: 'Pink', color: 'bg-pink-500' }
                ].map((scheme) => (
                  <div key={scheme.name} className="text-center">
                    <div className={`w-12 h-12 ${scheme.color} rounded-lg mx-auto mb-2 cursor-pointer hover:scale-105 transition-transform`}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{scheme.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Display Options</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Compact Mode</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Reduce spacing and padding for more content</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-600 transition-colors duration-200">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 translate-x-1" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Animations</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Enable smooth transitions and animations</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-brand-600 transition-colors duration-200">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 translate-x-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Connected Services</h3>
              <div className="space-y-4">
                {[
                  { name: 'Gmail', description: 'Email intelligence and processing', icon: Mail, status: 'connected', color: 'success' },
                  { name: 'Google Calendar', description: 'Calendar events and scheduling', icon: Calendar, status: 'connected', color: 'success' },
                  { name: 'Slack', description: 'Team communication and notifications', icon: Globe, status: 'disconnected', color: 'gray' },
                  { name: 'Microsoft Outlook', description: 'Alternative email service', icon: Mail, status: 'available', color: 'brand' }
                ].map((integration) => {
                  const Icon = integration.icon;
                  return (
                    <div key={integration.name} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 bg-${integration.color}-100 dark:bg-${integration.color}-900/20 rounded-lg flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 text-${integration.color}-600 dark:text-${integration.color}-400`} />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{integration.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{integration.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`
                          text-xs px-2 py-1 rounded-full
                          ${integration.status === 'connected' ? 'bg-success-100 dark:bg-success-900/20 text-success-600 dark:text-success-400' :
                            integration.status === 'disconnected' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                            'bg-brand-100 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                          }
                        `}>
                          {integration.status}
                        </span>
                        <button className={`
                          px-3 py-1 text-sm rounded transition-colors
                          ${integration.status === 'connected' 
                            ? 'text-error-600 hover:text-error-700 dark:text-error-400 border border-error-600 dark:border-error-400' 
                            : 'text-brand-600 hover:text-brand-700 dark:text-brand-400 border border-brand-600 dark:border-brand-400'
                          }
                        `}>
                          {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">API Configuration</h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Endpoint
                    </label>
                    <input
                      type="url"
                      defaultValue="https://api.homeops.example.com/v1"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      API Key
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="password"
                        defaultValue="hops_1234567890abcdef"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                        readOnly
                      />
                      <button className="px-3 py-2 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 border border-brand-600 dark:border-brand-400 rounded-lg">
                        Regenerate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

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
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors duration-200
                      ${isActive 
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
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
            {renderTabContent()}
            
            {/* Save Button */}
            <div className="flex justify-end pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
              <button className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors duration-200">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;