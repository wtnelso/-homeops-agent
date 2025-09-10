import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IntegrationDisplay } from '../../data/integrations';

interface IntegrationDetailsModalProps {
  integration: IntegrationDisplay;
  isOpen: boolean;
  onClose: () => void;
}

const IntegrationDetailsModal: React.FC<IntegrationDetailsModalProps> = ({
  integration,
  isOpen,
  onClose
}) => {
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      style={{ margin: 0, zIndex: 99999 }}
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              {renderIcon()}
            </div>
            
            {/* Title and Description */}
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {integration.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {integration.long_description || integration.description}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Integration Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Integration Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Category
                </label>
                <p className="text-gray-900 dark:text-white capitalize">
                  {integration.category}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Status
                </label>
                <p className="text-gray-900 dark:text-white">
                  {integration.isConnected ? 'Connected' : 'Disconnected'}
                </p>
              </div>
              {integration.platform_url && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Platform
                  </label>
                  <a 
                    href={integration.platform_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                  >
                    Visit Platform
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* How It Works */}
          {integration.how_it_works && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                How It Works
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {integration.how_it_works}
              </p>
            </div>
          )}


          {/* Required Permissions */}
          {integration.required_scopes && integration.required_scopes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Required Permissions
              </h3>
              <div className="space-y-2">
                {integration.required_scopes.map((scope, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <code className="text-sm text-gray-800 dark:text-gray-200">
                      {scope}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
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