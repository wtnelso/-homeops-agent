import React from 'react';
import { 
  Mail, 
  Calendar, 
  Users, 
  Home,
  ArrowUp,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

const OverviewPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Emails Processed */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Emails Processed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
              <div className="flex items-center space-x-1 mt-1">
                <ArrowUp className="w-4 h-4 text-success-500" />
                <span className="text-sm text-success-500">+12%</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">vs last week</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        {/* Calendar Events */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Calendar Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">23</p>
              <div className="flex items-center space-x-1 mt-1">
                <ArrowUp className="w-4 h-4 text-success-500" />
                <span className="text-sm text-success-500">+3</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">this week</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        {/* Family Members */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Family Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">4</p>
              <div className="flex items-center space-x-1 mt-1">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span className="text-sm text-success-500">All active</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
        </div>

        {/* Home Status */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Home Status</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">All Good</p>
              <div className="flex items-center space-x-1 mt-1">
                <CheckCircle className="w-4 h-4 text-success-500" />
                <span className="text-sm text-success-500">Systems online</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            <button className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">View all</button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-success-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white font-medium">Email intelligence processed Amazon delivery update</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white font-medium">New priority email from School District</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1 hour ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white font-medium">Calendar event added: Parent-Teacher Conference</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">3 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-error-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white font-medium">Alert: Internet connectivity issue resolved</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">5 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          </div>
          
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between px-4 py-3 bg-brand-50 dark:bg-brand-900/10 hover:bg-brand-100 dark:hover:bg-brand-900/20 rounded-lg transition-colors duration-200 group">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Process New Emails</span>
              </div>
              <div className="w-6 h-6 bg-brand-600 dark:bg-brand-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUp className="w-3 h-3 text-white rotate-45" />
              </div>
            </button>
            
            <button className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-lg transition-colors duration-200 group">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">View Calendar</span>
              </div>
              <div className="w-6 h-6 bg-orange-600 dark:bg-orange-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUp className="w-3 h-3 text-white rotate-45" />
              </div>
            </button>
            
            <button className="w-full flex items-center justify-between px-4 py-3 bg-success-50 dark:bg-success-900/10 hover:bg-success-100 dark:hover:bg-success-900/20 rounded-lg transition-colors duration-200 group">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Manage Tasks</span>
              </div>
              <div className="w-6 h-6 bg-success-600 dark:bg-success-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUp className="w-3 h-3 text-white rotate-45" />
              </div>
            </button>
            
            <button className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 group">
              <div className="flex items-center space-x-3">
                <Home className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Home Automation</span>
              </div>
              <div className="w-6 h-6 bg-gray-600 dark:bg-gray-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUp className="w-3 h-3 text-white rotate-45" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Overview</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>Last 7 days</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-success-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">94%</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Email Processing Accuracy</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-primary-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">2.3s</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Response Time</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-brand-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">99.8%</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">System Uptime</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPage;