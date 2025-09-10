import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { IntegrationDisplay } from '../../data/integrations';
import IntegrationDetailsModal from './IntegrationDetailsModal';

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
  const renderIcon = () => {
    if (integration.image_url) {
      return (
        <img 
          src={integration.image_url} 
          alt={`${integration.name} icon`}
          className="w-16 h-16 object-contain"
        />
      );
    } else {
      // Fallback icon
      return (
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400 font-semibold text-lg">
            {integration.name}
          </div>
        </div>
      );
    }
  };

  const isConnected = integration.isConnected;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 relative">
        {/* Installed Check Icon */}
        {isConnected && (
          <div className="absolute top-4 left-4 w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
        )}
      {/* Icon */}
      <div className="flex justify-center mb-6">
        {renderIcon()}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-3">
        {integration.name}
      </h3>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-8">
        {integration.description}
      </p>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Details Button - moved to bottom left */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Details
          </button>

          {/* Connect/Disconnect Button */}
          <button
            onClick={() => onConnect(integration.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isConnected
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>

      {/* Integration Details Modal */}
      <IntegrationDetailsModal
        integration={integration}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default IntegrationCard;