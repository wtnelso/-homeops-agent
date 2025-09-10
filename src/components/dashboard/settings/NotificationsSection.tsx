import React, { useState } from 'react';
import { Mail, Calendar, Users } from 'lucide-react';

const NotificationsSection: React.FC = () => {
  const [notifications, setNotifications] = useState({
    email: true,
    calendar: true,
    family: true
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          {[
            { id: 'email', label: 'Email Intelligence Alerts', description: 'Get notified about important emails and summaries', icon: Mail },
            { id: 'calendar', label: 'Calendar Reminders', description: 'Receive notifications for upcoming events and conflicts', icon: Calendar },
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

    </div>
  );
};

export default NotificationsSection;