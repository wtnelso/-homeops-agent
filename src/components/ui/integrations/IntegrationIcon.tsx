import React from 'react';
import { IntegrationWithStatus } from '../../../services/integrationsData';
import { IntegrationDisplay } from '../../../data/integrations';

interface IntegrationIconProps {
  integration: IntegrationWithStatus | IntegrationDisplay;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const IntegrationIcon: React.FC<IntegrationIconProps> = ({
  integration,
  size = 'md',
  animate = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12 sm:w-16 sm:h-16'
  };

  const fallbackSizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 sm:w-16 sm:h-16 text-xs sm:text-lg'
  };

  if (integration.image_url) {
    return (
      <div className={`${animate ? 'animate-pulse' : ''} ${className}`}>
        <img
          src={integration.image_url}
          alt={`${integration.name} icon`}
          className={`${sizeClasses[size]} object-contain`}
        />
      </div>
    );
  }

  // Fallback icon
  return (
    <div className={`${animate ? 'animate-pulse' : ''} ${className}`}>
      <div className={`${fallbackSizeClasses[size]} bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center`}>
        <div className="text-gray-600 dark:text-gray-400 font-semibold text-center">
          {integration.name}
        </div>
      </div>
    </div>
  );
};

export default IntegrationIcon;