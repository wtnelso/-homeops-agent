import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Clipboard, Settings, Lock, Wrench, Sparkles, Mail } from 'lucide-react';
import { IntegrationDisplay } from '../../data/integrations';
import { useToast } from '../../contexts/ToastContext';

interface IntegrationDetailsModalProps {
  integration: IntegrationDisplay;
  userData?: any;
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (integrationId: string) => void;
}

const IntegrationDetailsModal: React.FC<IntegrationDetailsModalProps> = ({
  integration,
  userData,
  isOpen,
  onClose,
  onConnect
}) => {
  const [activeTab, setActiveTab] = useState<'setup' | 'details'>('setup');
  const { showToast } = useToast();

  // Get live integration data from userData.integrations
  const getLiveIntegrationData = () => {
    if (!userData?.integrations) return null;
    return userData.integrations.find((int: any) => int.integration_id === integration.id);
  };

  const liveIntegration = getLiveIntegrationData();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderIcon = () => {
    if (integration.image_url) {
      return (
        <img 
          src={integration.image_url} 
          alt={`${integration.name} icon`}
          className="w-12 h-12 object-contain"
        />
      );
    } else {
      return (
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400 font-semibold text-sm">
            {integration.name.charAt(0)}
          </div>
        </div>
      );
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4"
      style={{ margin: 0, zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full h-[80vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3 sm:gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              {renderIcon()}
            </div>

            {/* Title and Description */}
            <div className="flex-grow min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {integration.name}
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                {integration.long_description || integration.description}
              </p>
            </div>
          </div>
        </div>


        {/* Tab Navigation */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 sm:px-6">
            <nav className="flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('setup')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'setup'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Setup
                </div>
              </button>
              <button
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clipboard className="w-4 h-4" />
                  Details
                </div>
              </button>
            </nav>

            {/* Connection Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
              liveIntegration?.status === 'connected'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                liveIntegration?.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
              }`} />
              {liveIntegration?.status === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'setup' && (
            <div className="space-y-4 sm:space-y-6">

              {/* Gmail-forwarding Email Address Display */}
              {integration.id === 'gmail-forwarding' && liveIntegration?.status === 'connected' && liveIntegration?.config?.email_address && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Your Forwarding Email Address</span>
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Forward emails from your Gmail account to this address:
                    </p>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <code className="text-sm font-mono text-gray-900 dark:text-white flex-1 break-all">
                        {liveIntegration.config.email_address}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(liveIntegration.config.email_address);
                          showToast('Email address copied to clipboard', 'success');
                        }}
                        className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md"
                        title="Copy email address"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}



              {/* Setup Instructions */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Setup Instructions</span>
                </h3>
                <div>
                  {integration.setup_instructions ? (
                    <div
                      className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-gray-900 [&_h1]:dark:text-white [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-gray-900 [&_h2]:dark:text-white [&_h2]:inline [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:text-gray-800 [&_h3]:dark:text-gray-200 [&_h3]:inline [&_p]:mb-3 [&_p]:leading-relaxed [&_ol]:mb-3 [&_ol]:pl-0 [&_ol]:list-none [&_ol_li]:mb-4 [&_ol_li:before]:content-[counter(list-item)'.'] [&_ol_li:before]:font-semibold [&_ol_li:before]:mr-2 [&_ol_li:before]:text-gray-900 [&_ol_li:before]:dark:text-white [&_ul]:mb-3 [&_ul]:pl-4 [&_ul]:list-disc [&_ul_li]:mb-2 [&_code]:bg-gray-100 [&_code]:dark:bg-gray-800 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-gray-800 [&_code]:dark:text-gray-200 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_strong]:dark:text-white [&_em]:italic [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-700 [&_a:hover]:dark:text-blue-300"
                      dangerouslySetInnerHTML={{ __html: integration.setup_instructions }}
                    />
                  ) : (
                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Setup instructions will be available once configured for this integration.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Why Set Up Connector */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Why Set Up Connector?</span>
                </h3>
                <div
                  className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-gray-900 [&_h1]:dark:text-white [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-gray-900 [&_h2]:dark:text-white [&_h2]:inline [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:text-gray-800 [&_h3]:dark:text-gray-200 [&_h3]:inline [&_p]:mb-3 [&_p]:leading-relaxed [&_ol]:mb-3 [&_ol]:pl-0 [&_ol]:list-none [&_ol_li]:mb-4 [&_ol_li:before]:content-[counter(list-item)'.'] [&_ol_li:before]:font-semibold [&_ol_li:before]:mr-2 [&_ol_li:before]:text-gray-900 [&_ol_li:before]:dark:text-white [&_ul]:mb-3 [&_ul]:pl-4 [&_ul]:list-disc [&_ul_li]:mb-2 [&_code]:bg-gray-100 [&_code]:dark:bg-gray-800 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-gray-800 [&_code]:dark:text-gray-200 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_strong]:dark:text-white [&_em]:italic [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-700 [&_a:hover]:dark:text-blue-300"
                  dangerouslySetInnerHTML={{ __html: integration.why_setup || '' }}
                />
              </div>

              {/* How It Works */}
              {integration.how_it_works && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>How It Works</span>
                  </h3>
                  <div
                    className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-gray-900 [&_h1]:dark:text-white [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:text-gray-900 [&_h2]:dark:text-white [&_h2]:inline [&_h3]:text-sm [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:text-gray-800 [&_h3]:dark:text-gray-200 [&_h3]:inline [&_p]:mb-3 [&_p]:leading-relaxed [&_ol]:mb-3 [&_ol]:pl-0 [&_ol]:list-none [&_ol_li]:mb-4 [&_ol_li:before]:content-[counter(list-item)'.'] [&_ol_li:before]:font-semibold [&_ol_li:before]:mr-2 [&_ol_li:before]:text-gray-900 [&_ol_li:before]:dark:text-white [&_ul]:mb-3 [&_ul]:pl-4 [&_ul]:list-disc [&_ul_li]:mb-2 [&_code]:bg-gray-100 [&_code]:dark:bg-gray-800 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono [&_code]:text-gray-800 [&_code]:dark:text-gray-200 [&_strong]:font-semibold [&_strong]:text-gray-900 [&_strong]:dark:text-white [&_em]:italic [&_a]:text-blue-600 [&_a]:dark:text-blue-400 [&_a]:underline [&_a:hover]:text-blue-700 [&_a:hover]:dark:text-blue-300"
                    dangerouslySetInnerHTML={{ __html: integration.how_it_works }}
                  />
                </div>
              )}

              {/* Integration Details */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Clipboard className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Integration Details</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Category
                    </label>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white capitalize">
                      {integration.category}
                    </p>
                  </div>
                  {integration.platform_url && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Link
                      </label>
                      <a
                        href={integration.platform_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm sm:text-base text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                      >
                        {integration.name}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Required Permissions */}
              {integration.required_scopes && integration.required_scopes.length > 0 && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Required Permissions</span>
                  </h3>
                  <div className="space-y-2">
                    {integration.required_scopes.map((scope, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2 sm:p-3">
                        <code className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 break-all">
                          {scope}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          {/* Action Button - Connect/Disconnect */}
          {onConnect ? (
            liveIntegration?.status === 'connected' ? (
              <button
                onClick={() => onConnect(integration.id)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20 rounded-lg transition-colors text-xs sm:text-sm font-medium"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => onConnect(integration.id)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 rounded-lg transition-colors text-xs sm:text-sm font-medium shadow-lg"
              >
                Connect
              </button>
            )
          ) : (
            <div></div>
          )}

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-gray-400 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700/50 rounded-lg transition-colors text-xs sm:text-sm font-medium justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};


export default IntegrationDetailsModal;