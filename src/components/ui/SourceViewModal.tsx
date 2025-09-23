import React from 'react';
import { X, MessageSquare, Mail, Calendar, User } from 'lucide-react';
import { DataSource } from '../../services/accountProfileService';

interface SourceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: DataSource;
}

const SourceViewModal: React.FC<SourceViewModalProps> = ({
  isOpen,
  onClose,
  source
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (source.type) {
      case 'chat':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'email':
        return <Mail className="w-5 h-5 text-green-500" />;
      default:
        return <User className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTitle = () => {
    switch (source.type) {
      case 'chat':
        return 'Chat Conversation';
      case 'email':
        return source.email_subject || 'Email';
      default:
        return 'Source Information';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center space-x-3">
              {getIcon()}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {getTitle()}
                </h3>
                {source.timestamp && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(source.timestamp).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {source.type === 'chat' && source.content && (
              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Conversation Content
                  </h4>
                  <div className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                    {source.content}
                  </div>
                </div>
                {source.confidence && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        AI Confidence Score
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {Math.round(source.confidence * 100)}%
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      This information was automatically extracted from the conversation above
                    </div>
                  </div>
                )}
              </div>
            )}

            {source.type === 'email' && (
              <div className="space-y-4">
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4">
                  <h4 className="mb-2 text-sm font-medium text-green-700 dark:text-green-300">
                    Email Information
                  </h4>
                  {source.email_subject && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject: </span>
                      <span className="text-sm text-gray-900 dark:text-white">{source.email_subject}</span>
                    </div>
                  )}
                  {source.reference_id && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email ID: </span>
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{source.reference_id}</span>
                    </div>
                  )}
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        // TODO: Navigate to email view or open in email client
                        console.log('Navigate to email:', source.reference_id);
                      }}
                      className="inline-flex items-center space-x-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <Mail className="w-4 h-4" />
                      <span>View Full Email</span>
                    </button>
                  </div>
                </div>
                {source.confidence && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        AI Confidence Score
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        {Math.round(source.confidence * 100)}%
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      This information was automatically extracted from the email
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SourceViewModal;