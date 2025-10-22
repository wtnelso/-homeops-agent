/**
 * Email List Template Component
 * Renders structured Gmail search results
 */

import React, { useState, useEffect } from 'react';
import { Mail, User, ExternalLink, X } from 'lucide-react';
import { StructuredData } from '../../services/streamingChatService';
import { supabase } from '../../lib/supabase';

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
  email_record_id?: string;
}

export const EmailListTemplate: React.FC<EmailListTemplateProps> = ({ data }) => {
  const gmailData = data.data.gmail_search;
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    getSession();
  }, []);

  const fetchEmailContent = async (emailId: string) => {
    if (!session?.access_token) {
      console.error('No session token available');
      return;
    }
    
    console.log('Fetching email content for:', emailId);
    setLoading(true);
    try {
        const response = await fetch(`http://localhost:10000/api/email/${emailId}/full?token=${session.access_token}&gmail_token=${session.provider_token}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const htmlContent = await response.text();
        console.log('Email content loaded successfully, length:', htmlContent.length);
        setEmailContent(htmlContent);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch email content:', response.status, errorText);
        setEmailContent(null);
      }
    } catch (error) {
      console.error('Error fetching email content:', error);
      setEmailContent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReadMore = (emailId: string) => {
    console.log('Read More clicked for email:', emailId);
    setSelectedEmailId(emailId);
    fetchEmailContent(emailId);
  };

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
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {data.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {emails.length} email{emails.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
        </div>

        {/* Email List */}
        {emails.length > 0 && (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {emails.map((email, index) => (
              <div
                key={email.id || index}
                className="px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {getInitials(email.from_name)}
                    </span>
                  </div>

                  {/* Email Content */}
                  <div className="flex-1 min-w-0">
                    {/* Subject and Date */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h5 className="font-semibold text-base text-gray-900 dark:text-white leading-tight">
                        {email.subject || 'No Subject'}
                      </h5>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                        {formatEmailDate(email.timestamp || email.date)}
                      </span>
                    </div>

                    {/* From */}
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        {email.from_name || email.from_email}
                      </span>
                      {email.from_name && email.from_email && (
                        <span className="text-sm text-gray-400 hidden sm:inline">
                          &lt;{email.from_email}&gt;
                        </span>
                      )}
                    </div>

                    {/* Snippet */}
                    {email.snippet && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 line-clamp-3">
                        {email.snippet}
                      </p>
                    )}

                    {/* Read More Button */}
                    {(() => {
                      console.log('Email data for Read More check:', {
                        email_record_id: email.email_record_id,
                        id: email.id,
                        gmail_message_id: email.gmail_message_id,
                        subject: email.subject
                      });
                      // Always show Read More button since we have Gmail message ID
                      return true;
                    })() && (
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleReadMore(email.id || email.gmail_message_id)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Read More
                        </button>
                        
                        {/* Relevance indicator */}
                        {email.relevance_score > 0.8 && (
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            High relevance
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {emails.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No emails found</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Try a different search term or check your Gmail integration.
            </p>
          </div>
        )}

        {/* Footer with source info */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Source: Gmail API • Query: {gmailData.query}
          </p>
        </div>
      </div>

      {/* Email Content Modal */}
      {selectedEmailId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Email Content
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedEmailId(null);
                  setEmailContent(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading email content...</p>
                  </div>
                </div>
              ) : emailContent ? (
                <div className="p-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: emailContent }} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load email</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      Unable to fetch the email content. This might be due to an expired session.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => fetchEmailContent(selectedEmailId)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={() => {
                          console.log('Session:', session);
                          console.log('Token:', session?.access_token);
                          alert(`Session: ${session ? 'Available' : 'None'}\nToken: ${session?.access_token ? 'Available' : 'None'}`);
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Debug Info
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailListTemplate;