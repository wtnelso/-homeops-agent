import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { IntegrationDisplay } from '../../data/integrations';
import IntegrationDetailsModal from './IntegrationDetailsModal';
import { useToast } from '../../contexts/ToastContext';

interface IntegrationCardProps {
  integration: IntegrationDisplay;
  onConnect: (integrationId: string) => void;
  onSettings: (integrationId: string) => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConnect
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();

  // Use database properties directly
  const isConnected = integration.isConnected ?? false;
  const title = isConnected ? `${integration.name} Connected!` : `Connect ${integration.name}`;
  const buttonText = isConnected ? 'Disconnect' : 'Connect';

  const renderIcon = () => {
    if (integration.image_url) {
      return (
        <img
          src={integration.image_url}
          alt={`${integration.name} icon`}
          className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
        />
      );
    } else {
      // Fallback icon
      return (
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400 font-semibold text-xs sm:text-lg text-center">
            {integration.name}
          </div>
        </div>
      );
    }
  };


  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 sm:p-6 hover:shadow-lg transition-all duration-500 relative transform hover:scale-105 ${
        isConnected
          ? 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
          : 'border-gray-200 dark:border-gray-700'
      }`}>

        {/* Success Animation Badge */}
        {isConnected && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 animate-pulse">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        )}


        {/* Icon */}
        <div className="flex justify-center mb-3 sm:mb-4">
          <div className={`${isConnected ? 'animate-pulse' : ''}`}>
            {renderIcon()}
          </div>
        </div>

        {/* Integration Name */}
        <div className="text-center mb-2">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
            {integration.name}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">
            {title}
          </p>
        </div>

        {/* Value Proposition */}
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-3 sm:mb-4 font-medium">
          {integration.description}
        </p>

        {/* Connected Success Message */}
        {isConnected && (
          <div className="text-center mb-3 sm:mb-4">
            <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              Connected!
            </span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Details Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            Learn More
          </button>

          {/* Connect/Disconnect Button with fun styling */}
          <button
            onClick={() => onConnect(integration.id)}
            className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 transform hover:scale-105 ${
              isConnected
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
            }`}
          >
            {isConnected ? 'Disconnect' : buttonText}
          </button>
        </div>
      </div>

      {/* Integration Details Modal */}
      <IntegrationDetailsModal
        integration={integration}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={undefined}
      />
    </>
  );
};

export default IntegrationCard;