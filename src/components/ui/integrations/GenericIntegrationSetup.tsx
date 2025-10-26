import React from 'react';
import { IntegrationDisplay } from '../../../data/integrations';

interface GenericIntegrationSetupProps {
  integration: IntegrationDisplay;
  onConnect: (integrationId: string) => void;
}

const GenericIntegrationSetup: React.FC<GenericIntegrationSetupProps> = ({
  integration,
  onConnect
}) => {
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
          {integration.isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Setup Instructions */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Setup Instructions
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            {integration.setup_instructions ||
              'Setup instructions will be available once configured for this integration.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenericIntegrationSetup;