import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar,
  Search,
  Eye,
  Share,
  Clock,
  Mail,
  BarChart3,
  Users,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

const ReportsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const reportCategories = [
    { id: 'all', label: 'All Reports', count: 12 },
    { id: 'email', label: 'Email Analytics', count: 4 },
    { id: 'family', label: 'Family Activity', count: 3 },
    { id: 'system', label: 'System Health', count: 2 },
    { id: 'custom', label: 'Custom Reports', count: 3 }
  ];

  const reports = [
    {
      id: 1,
      title: 'Weekly Email Intelligence Summary',
      description: 'Comprehensive analysis of processed emails and key insights',
      category: 'email',
      type: 'automated',
      lastGenerated: '2 hours ago',
      size: '2.4 MB',
      format: 'PDF',
      icon: Mail,
      status: 'ready'
    },
    {
      id: 2,
      title: 'Family Calendar Activity Report',
      description: 'Overview of family schedules, events, and conflicts',
      category: 'family',
      type: 'scheduled',
      lastGenerated: '1 day ago',
      size: '1.8 MB',
      format: 'PDF',
      icon: Calendar,
      status: 'ready'
    },
    {
      id: 3,
      title: 'System Performance Analytics',
      description: 'Detailed system health metrics and performance trends',
      category: 'system',
      type: 'manual',
      lastGenerated: '3 days ago',
      size: '5.2 MB',
      format: 'Excel',
      icon: BarChart3,
      status: 'ready'
    },
    {
      id: 4,
      title: 'Monthly Family Statistics',
      description: 'Family activity patterns and engagement metrics',
      category: 'family',
      type: 'automated',
      lastGenerated: '1 week ago',
      size: '3.1 MB',
      format: 'PDF',
      icon: Users,
      status: 'generating'
    },
    {
      id: 5,
      title: 'Email Sender Analysis',
      description: 'Top senders, categories, and priority classifications',
      category: 'email',
      type: 'custom',
      lastGenerated: '2 weeks ago',
      size: '900 KB',
      format: 'CSV',
      icon: TrendingUp,
      status: 'ready'
    }
  ];

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf': return FileText;
      case 'excel': return FileSpreadsheet;
      case 'csv': return FileSpreadsheet;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'success';
      case 'generating': return 'orange';
      case 'error': return 'error';
      default: return 'gray';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reports Center</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Generate and manage your HomeOps reports</p>
        </div>
        
        <button className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors duration-200">
          <FileText className="w-4 h-4 mr-2" />
          Create New Report
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reports</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-success-100 dark:bg-success-900/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Auto Generated</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">8</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Downloads</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">47</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/20 rounded-lg flex items-center justify-center">
              <Share className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Shared</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">23</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        >
          {reportCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.label} ({category.count})
            </option>
          ))}
        </select>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredReports.map((report) => {
          const Icon = report.icon;
          const FormatIcon = getFormatIcon(report.format);
          const statusColor = getStatusColor(report.status);
          
          return (
            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                      {report.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {report.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{report.lastGenerated}</span>
                      </span>
                      <span>{report.size}</span>
                      <div className="flex items-center space-x-1">
                        <FormatIcon className="w-3 h-3" />
                        <span>{report.format}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 dark:bg-${statusColor}-900/20 text-${statusColor}-600 dark:text-${statusColor}-400`}>
                  {report.status}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400`}>
                    {report.type}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400`}>
                    {reportCategories.find(c => c.id === report.category)?.label}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    disabled={report.status !== 'ready'}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <Share className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No reports found</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {searchTerm ? 'Try adjusting your search terms' : 'Create your first report to get started'}
          </p>
        </div>
      )}

      {/* Report Templates */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Templates</h3>
          <button className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400">View all</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-gray-900 dark:text-white">Email Intelligence</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Comprehensive email analysis and insights
            </p>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="font-medium text-gray-900 dark:text-white">Family Activity</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Family engagement and activity patterns
            </p>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3 mb-2">
              <BarChart3 className="w-5 h-5 text-success-600 dark:text-success-400" />
              <span className="font-medium text-gray-900 dark:text-white">System Health</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Performance metrics and system status
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;