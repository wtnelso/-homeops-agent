import React, { useState } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
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

  // Helper function to get playful copy and value props for each integration
  const getIntegrationCopy = (id: string, isConnected: boolean) => {
    const copies: Record<string, { title: string; valueProp: string; buttonText: string; connectedText: string }> = {
      'gmail': {
        title: isConnected ? '📧 Smart Inbox Active!' : '📧 Unlock Smart Inbox',
        valueProp: 'Transform email chaos into organized family tasks and reminders',
        buttonText: 'Activate Superpower',
        connectedText: 'You\'re synced! ✨'
      },
      'google-calendar': {
        title: isConnected ? '📅 Family Calendar Synced!' : '📅 Sync Family Calendar',
        valueProp: 'Stay ahead of school schedules, activities, and family events',
        buttonText: 'Connect Calendar',
        connectedText: 'Schedule mastered! 🎯'
      },
      'default': {
        title: isConnected ? `✅ ${integration.name} Connected!` : `🚀 Connect ${integration.name}`,
        valueProp: 'Enhance your family\'s productivity and organization',
        buttonText: 'Unlock Power',
        connectedText: 'Connected! 🎉'
      }
    };

    return copies[id] || copies['default'];
  };

  const copy = getIntegrationCopy(integration.id, integration.isConnected);
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
      <div className={`bg-white dark:bg-gray-800 rounded-2xl border p-6 hover:shadow-lg transition-all duration-500 relative transform hover:scale-105 ${
        isConnected
          ? 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
          : 'border-gray-200 dark:border-gray-700'
      }`}>

        {/* Success Animation Badge */}
        {isConnected && (
          <div className="absolute top-4 right-4 animate-pulse">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        )}

        {/* Sparkles for connected state */}
        {isConnected && (
          <div className="absolute top-2 left-2 animate-bounce">
            <Sparkles className="w-4 h-4 text-yellow-400" />
          </div>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`${isConnected ? 'animate-pulse' : ''}`}>
            {renderIcon()}
          </div>
        </div>

        {/* Integration Name */}
        <div className="text-center mb-2">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {integration.name}
          </h3>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {copy.title}
          </p>
        </div>

        {/* Value Proposition */}
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-4 font-medium">
          {copy.valueProp}
        </p>

        {/* Connected Success Message */}
        {isConnected && (
          <div className="text-center mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              {copy.connectedText}
            </span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          {/* Details Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            Learn More
          </button>

          {/* Connect/Disconnect Button with fun styling */}
          <button
            onClick={() => onConnect(integration.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
              isConnected
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
            }`}
          >
            {isConnected ? 'Disconnect' : copy.buttonText}
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