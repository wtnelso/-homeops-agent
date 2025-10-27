import React from 'react';
import { IntegrationWithStatus } from '../../../services/integrationsData';
import { IntegrationDisplay } from '../../../data/integrations';
import IntegrationIcon from './IntegrationIcon';
import IntegrationStatusBadge from './IntegrationStatusBadge';

interface CompactIntegrationTileProps {
  integration: IntegrationWithStatus | IntegrationDisplay;
  onClick: () => void;
  className?: string;
}

const CompactIntegrationTile: React.FC<CompactIntegrationTileProps> = ({
  integration,
  onClick,
  className = ''
}) => {
  const isConnected = integration.isConnected ?? false;
  const title = isConnected ? `${integration.name} Connected!` : `Connect ${integration.name}`;

  return (
    <div
      onClick={onClick}
      className={`w-full bg-white dark:bg-gray-800 rounded-xl border p-3 hover:shadow-lg transition-all duration-500 relative transform hover:scale-105 h-full flex flex-col cursor-pointer text-left ${
        isConnected
          ? 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
          : 'border-gray-200 dark:border-gray-700'
      } ${className}`}
    >
      {/* Success Animation Badge */}
      <IntegrationStatusBadge
        isConnected={isConnected}
        size="sm"
        className="absolute top-2 right-2"
      />

      {/* Icon */}
      <div className="flex justify-center mb-2">
        <IntegrationIcon
          integration={integration}
          size="md"
          animate={isConnected}
        />
      </div>

      {/* Integration Name */}
      <div className="text-center mb-2">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          {integration.name}
        </h3>
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
          {title}
        </p>
      </div>

      {/* Value Proposition */}
      <p className="text-xs text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-2 font-medium">
        {integration.description}
      </p>

      {/* Connected Success Message */}
      {isConnected && (
        <div className="text-center mb-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Connected!
          </span>
        </div>
      )}
    </div>
  );
};

export default CompactIntegrationTile;