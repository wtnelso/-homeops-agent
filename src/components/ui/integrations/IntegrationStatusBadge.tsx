import React from 'react';
import { CheckCircle } from 'lucide-react';

interface IntegrationStatusBadgeProps {
  isConnected: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const IntegrationStatusBadge: React.FC<IntegrationStatusBadgeProps> = ({
  isConnected,
  size = 'sm',
  className = ''
}) => {
  if (!isConnected) return null;

  const sizeClasses = {
    sm: {
      container: 'w-5 h-5',
      icon: 'w-3 h-3'
    },
    md: {
      container: 'w-6 h-6 sm:w-8 sm:h-8',
      icon: 'w-4 h-4 sm:w-5 sm:h-5'
    }
  };

  return (
    <div className={`animate-pulse ${className}`}>
      <div className={`${sizeClasses[size].container} bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center shadow-lg`}>
        <CheckCircle className={`${sizeClasses[size].icon} text-green-600 dark:text-green-400`} />
      </div>
    </div>
  );
};

export default IntegrationStatusBadge;