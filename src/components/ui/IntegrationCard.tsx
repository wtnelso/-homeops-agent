import React, { useState } from 'react';
import { IntegrationDisplay } from '../../data/integrations';
import IntegrationDetailsModal from './IntegrationDetailsModal';
import CompactIntegrationTile from './integrations/CompactIntegrationTile';

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

  return (
    <>
      <CompactIntegrationTile
        integration={integration}
        onClick={() => setIsModalOpen(true)}
      />

      {/* Integration Details Modal */}
      <IntegrationDetailsModal
        integration={integration}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnect={onConnect}
      />
    </>
  );
};

export default IntegrationCard;