import React from 'react';
import { Copy } from 'lucide-react';
import { IntegrationDisplay } from '../../../data/integrations';

interface GmailForwardingSetupProps {
  integration: IntegrationDisplay;
  onConnect: (integrationId: string) => void;
}

const GmailForwardingSetup: React.FC<GmailForwardingSetupProps> = ({
  integration,
  onConnect
}) => {
  const handleCopyEmail = () => {
    if (integration.config?.email_address) {
      navigator.clipboard.writeText(integration.config.email_address);
      // TODO: Add toast notification for successful copy
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Connection Status */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Connection Status
        </h3>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
          <div className={`w-3 h-3 rounded-full ${
            integration.isConnected ? 'bg-green-500' : 'bg-gray-400'
          }`} />
          <span className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">
            {integration.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Email Address Display (when connected) */}
      {integration.isConnected && integration.config?.email_address && (
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
            Your Forwarding Email Address
          </h3>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Forward emails to this address:
            </p>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md px-3 py-2 flex items-center justify-between gap-2">
              <code className="text-sm text-blue-600 dark:text-blue-400 font-mono font-medium break-all flex-1">
                {integration.config.email_address}
              </code>
              <button
                onClick={handleCopyEmail}
                className="flex-shrink-0 p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Copy email address"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connect/Disconnect Button */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          {integration.isConnected ? 'Manage Connection' : 'Get Started'}
        </h3>
        <button
          onClick={() => onConnect(integration.id)}
          className={`w-full px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 ${
            integration.isConnected
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
          }`}
        >
          {integration.isConnected ? 'Disconnect' : 'Generate Email Address'}
        </button>
      </div>

      {/* Setup Instructions */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Setup Instructions
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          {integration.isConnected ? (
            <div className="space-y-3">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                ✅ Your email forwarding is now set up!
              </p>
              <div className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                <p className="mb-2">To forward emails from Gmail:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Open Gmail and go to Settings → Forwarding and POP/IMAP</li>
                  <li>Click "Add a forwarding address" and enter your generated email</li>
                  <li>Verify the forwarding address when prompted</li>
                  <li>Set up filters to forward specific emails automatically</li>
                </ol>
              </div>
            </div>
          ) : (
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              Click "Generate Email Address" above to create your unique forwarding email address.
              Once generated, you'll receive instructions on how to set up email forwarding in Gmail.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GmailForwardingSetup;