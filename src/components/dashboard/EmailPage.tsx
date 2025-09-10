import React, { useState } from 'react';
import { Mail, Search, Star, Archive, Trash2, Reply, Forward, MoreHorizontal } from 'lucide-react';

interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
}

const EmailPage: React.FC = () => {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [emails, setEmails] = useState<Email[]>([
    {
      id: '1',
      sender: 'John Smith',
      senderEmail: 'john.smith@example.com',
      subject: 'Project Update - Q3 Review',
      preview: 'Hi there! I wanted to give you a quick update on the Q3 project status. We\'ve made significant progress...',
      timestamp: new Date(2025, 8, 6, 14, 30),
      isRead: false,
      isStarred: true,
      isImportant: true
    },
    {
      id: '2',
      sender: 'Sarah Johnson',
      senderEmail: 'sarah.j@company.com',
      subject: 'Meeting Confirmation - Tomorrow 2PM',
      preview: 'Just confirming our meeting scheduled for tomorrow at 2 PM. Please let me know if you need to reschedule...',
      timestamp: new Date(2025, 8, 6, 11, 15),
      isRead: true,
      isStarred: false,
      isImportant: false
    },
    {
      id: '3',
      sender: 'HomeOps System',
      senderEmail: 'noreply@homeops.com',
      subject: 'Weekly Home Intelligence Report',
      preview: 'Your weekly summary of home activities, energy usage, and upcoming maintenance reminders...',
      timestamp: new Date(2025, 8, 5, 9, 0),
      isRead: true,
      isStarred: false,
      isImportant: false
    },
    {
      id: '4',
      sender: 'Amazon',
      senderEmail: 'shipment-tracking@amazon.com',
      subject: 'Your package has been delivered',
      preview: 'Great news! Your package was delivered today at 3:47 PM. It was left at your front door...',
      timestamp: new Date(2025, 8, 5, 15, 47),
      isRead: false,
      isStarred: false,
      isImportant: false
    },
    {
      id: '5',
      sender: 'Family Calendar',
      senderEmail: 'calendar@familyops.com',
      subject: 'Reminder: Soccer Practice Tomorrow',
      preview: 'Don\'t forget! Emma has soccer practice tomorrow at 4:00 PM at Riverside Park...',
      timestamp: new Date(2025, 8, 4, 18, 0),
      isRead: true,
      isStarred: true,
      isImportant: true
    }
  ]);

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleStar = (emailId: string) => {
    setEmails(prev => prev.map(email =>
      email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
    ));
  };

  const markAsRead = (emailId: string) => {
    setEmails(prev => prev.map(email =>
      email.id === emailId ? { ...email, isRead: true } : email
    ));
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="h-full flex bg-white dark:bg-gray-800">
      {/* Email List Sidebar */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => {
                setSelectedEmail(email);
                markAsRead(email.id);
              }}
              className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedEmail?.id === email.id ? 'bg-brand-50 dark:bg-brand-900/20 border-l-4 border-l-brand-500' : ''
              } ${!email.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-medium truncate ${
                      !email.isRead ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {email.sender}
                    </p>
                    <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(email.id);
                        }}
                        className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded ${
                          email.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                        }`}
                      >
                        <Star className="w-3 h-3" fill={email.isStarred ? 'currentColor' : 'none'} />
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(email.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm mb-1 truncate ${
                    !email.isRead ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {email.subject}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {email.preview}
                  </p>
                </div>
                {!email.isRead && (
                  <div className="w-2 h-2 bg-brand-600 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 flex flex-col">
        {selectedEmail ? (
          <>
            {/* Email Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedEmail.subject}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{selectedEmail.sender}</span>
                    <span>&lt;{selectedEmail.senderEmail}&gt;</span>
                    <span>{selectedEmail.timestamp.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleStar(selectedEmail.id)}
                    className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${
                      selectedEmail.isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                    }`}
                  >
                    <Star className="w-5 h-5" fill={selectedEmail.isStarred ? 'currentColor' : 'none'} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Archive className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedEmail.preview}
                </p>
                <br />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <br />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <br />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Best regards,<br />
                  {selectedEmail.sender}
                </p>
              </div>
            </div>

            {/* Email Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <Reply className="w-4 h-4" />
                  <span>Reply</span>
                </button>
                <button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <Forward className="w-4 h-4" />
                  <span>Forward</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No email selected</h3>
              <p className="text-gray-500 dark:text-gray-400">Select an email from the list to read its content</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailPage;