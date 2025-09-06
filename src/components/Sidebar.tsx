import React from 'react';
import { 
  Users, 
  FolderOpen, 
  Calendar, 
  FileText, 
  BarChart3, 
  MessageCircle, 
  Mail 
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onViewChange }) => {
  const navigationItems = [
    { key: 'chat', label: 'Chat', icon: MessageCircle },
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'family', label: 'Family Hub', icon: Users },
    { key: 'projects', label: 'Projects', icon: FolderOpen },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const teams = [
    { key: 'heroicons', label: 'Heroicons', initial: 'H' },
    { key: 'tailwind', label: 'Tailwind Labs', initial: 'T' },
    { key: 'workcation', label: 'Workcation', initial: 'W' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="flex-shrink-0 p-6">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path>
            </svg>
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-900">HomeOps</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-6">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onViewChange(item.key)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeView === item.key
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Teams Section */}
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Your teams
          </h3>
          <ul className="mt-3 space-y-1">
            {teams.map((team) => (
              <li key={team.key}>
                <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
                  <span className="mr-3 h-5 w-5 bg-gray-300 rounded text-xs flex items-center justify-center text-white font-medium flex-shrink-0">
                    {team.initial}
                  </span>
                  <span className="truncate">{team.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User Profile */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200">
        <div className="flex items-center min-w-0">
          <img
            className="h-8 w-8 rounded-full flex-shrink-0"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="User avatar"
          />
          <div className="ml-3 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">Tom Cook</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;