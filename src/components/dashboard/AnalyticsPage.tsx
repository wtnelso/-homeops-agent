import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Download,
  RefreshCw,
  Mail,
  Users,
  Clock,
  Target
} from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('emails');

  const metrics = [
    { id: 'emails', label: 'Email Analytics', icon: Mail, color: 'primary' },
    { id: 'family', label: 'Family Activity', icon: Users, color: 'brand' },
    { id: 'tasks', label: 'Task Performance', icon: Target, color: 'success' },
    { id: 'system', label: 'System Health', icon: BarChart3, color: 'orange' }
  ];

  const timeRanges = [
    { id: '24h', label: 'Last 24 hours' },
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Dashboard</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Detailed insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            {timeRanges.map(range => (
              <option key={range.id} value={range.id}>{range.label}</option>
            ))}
          </select>
          
          {/* Action Buttons */}
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const isSelected = selectedMetric === metric.id;
          
          return (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200
                ${isSelected
                  ? `border-${metric.color}-500 bg-${metric.color}-50 dark:bg-${metric.color}-900/20`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center
                  ${isSelected 
                    ? `bg-${metric.color}-500 text-white`
                    : `bg-${metric.color}-100 dark:bg-${metric.color}-900/20 text-${metric.color}-600 dark:text-${metric.color}-400`
                  }
                `}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-sm font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {metric.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Chart Area */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {metrics.map(metric => {
              if (metric.id === selectedMetric) {
                const Icon = metric.icon;
                return (
                  <div key={metric.id} className="flex items-center space-x-2">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{metric.label}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>{timeRanges.find(r => r.id === timeRange)?.label}</span>
          </div>
        </div>
        
        {/* Mock Chart Visualization */}
        <div className="h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Interactive charts coming soon</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Integration with ApexCharts or Chart.js planned
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Email Processing Stats */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div className="flex items-center space-x-1 text-success-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+12%</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">1,247</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Emails Processed</p>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex items-center space-x-1 text-success-500">
              <TrendingDown className="w-4 h-4" />
              <span className="text-sm font-medium">-0.5s</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">2.3s</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</p>
          </div>
        </div>

        {/* Task Completion */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <div className="flex items-center space-x-1 text-success-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+8%</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">94%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Task Success Rate</p>
          </div>
        </div>

        {/* Family Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex items-center space-x-1 text-orange-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+2</span>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">4</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Members</p>
          </div>
        </div>
      </div>

      {/* Detailed Analytics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Email Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Email Categories</h3>
            <button className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">View all</button>
          </div>
          
          <div className="space-y-3">
            {[
              { category: 'School Communications', count: 234, percentage: 45, color: 'primary' },
              { category: 'Amazon Deliveries', count: 189, percentage: 36, color: 'orange' },
              { category: 'Banking & Finance', count: 87, percentage: 17, color: 'success' },
              { category: 'Healthcare', count: 56, percentage: 11, color: 'error' },
              { category: 'Other', count: 23, percentage: 4, color: 'gray' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`w-3 h-3 rounded-full bg-${item.color}-500`} />
                  <span className="text-sm text-gray-900 dark:text-white">{item.category}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`bg-${item.color}-500 h-2 rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Trends</h3>
            <button className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">Export data</button>
          </div>
          
          <div className="space-y-4">
            {[
              { metric: 'Email Processing Speed', value: '+12%', trend: 'up', color: 'success' },
              { metric: 'Calendar Accuracy', value: '+8%', trend: 'up', color: 'success' },
              { metric: 'Response Time', value: '-15%', trend: 'down', color: 'success' },
              { metric: 'Error Rate', value: '-23%', trend: 'down', color: 'success' },
              { metric: 'User Satisfaction', value: '+6%', trend: 'up', color: 'success' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-900 dark:text-white">{item.metric}</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium text-${item.color}-500`}>{item.value}</span>
                  {item.trend === 'up' ? (
                    <TrendingUp className={`w-4 h-4 text-${item.color}-500`} />
                  ) : (
                    <TrendingDown className={`w-4 h-4 text-${item.color}-500`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;