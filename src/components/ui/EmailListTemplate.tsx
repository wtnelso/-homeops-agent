/**
 * Email List Template Component
 * Renders structured Gmail search results
 */

import React from 'react';
import { Mail, User } from 'lucide-react';
import { StructuredData } from '../../services/streamingChatService';

interface EmailListTemplateProps {
  data: StructuredData;
}

interface EmailData {
  id: string;
  subject: string;
  from_name: string;
  from_email: string;
  from_display: string;
  date: string;
  timestamp: string;
  snippet?: string;
  relevance_score: number;
}

export const EmailListTemplate: React.FC<EmailListTemplateProps> = ({ data }) => {
  const gmailData = data.data.gmail_search;

  if (!gmailData || !gmailData.success) {
    return (
      <div className="space-y-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Unable to fetch emails at this time.</p>
        </div>
      </div>
    );
  }

  const emails: EmailData[] = gmailData.results || [];

  const formatEmailDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } else if (diffInDays === 1) {
        return 'Yesterday';
      } else if (diffInDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: diffInDays > 365 ? 'numeric' : undefined
        });
      }
    } catch (error) {
      return 'Unknown date';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="space-y-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {data.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {emails.length} email{emails.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Email List */}
      {emails.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Recent Emails ({emails.length})
            </h4>
          </div>

          <div className="space-y-2">
            {emails.map((email, index) => (
              <div
                key={email.id || index}
                className="p-3 bg-white dark:bg-gray-700/30 rounded border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      {getInitials(email.from_name)}
                    </span>
                  </div>

                  {/* Email Content */}
                  <div className="flex-1 min-w-0">
                    {/* Subject and Date */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h5 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {email.subject || 'No Subject'}
                      </h5>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {formatEmailDate(email.timestamp || email.date)}
                      </span>
                    </div>

                    {/* From */}
                    <div className="flex items-center gap-1 mb-2">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {email.from_name || email.from_email}
                      </span>
                      {email.from_name && email.from_email && (
                        <span className="text-xs text-gray-400">
                          &lt;{email.from_email}&gt;
                        </span>
                      )}
                    </div>

                    {/* Snippet */}
                    {email.snippet && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {email.snippet}
                      </p>
                    )}
                  </div>

                  {/* Relevance indicator */}
                  {email.relevance_score > 0.8 && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="High relevance"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {emails.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No emails found matching your search.</p>
          <p className="text-xs mt-1">Try a different search term or check your Gmail integration.</p>
        </div>
      )}

      {/* Footer with source info */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Source: Gmail API • Query: {gmailData.query}
        </p>
      </div>
    </div>
  );
};

export default EmailListTemplate;