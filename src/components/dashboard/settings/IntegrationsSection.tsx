import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { IntegrationsDataService, IntegrationWithStatus } from '../../../services/integrationsData';
import { UserIntegrationsService } from '../../../services/userIntegrationsService';
import { OAuthCoordinator } from '../../../config/oauth';
import IntegrationCard from '../../ui/IntegrationCard';
import Loader from '../../ui/Loader';

const IntegrationsSection: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [integrationsWithStatus, setIntegrationsWithStatus] = useState<IntegrationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIntegration, setProcessingIntegration] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrationsData();
  }, [userData]);

  const loadIntegrationsData = async () => {
    setLoading(true);
    try {
      if (!userData?.user?.id) {
        setIntegrationsWithStatus([]);
        return;
      }

      // Use user-based integration service (migrated from account-based)
      const integrations = await IntegrationsDataService.getIntegrationsForUser(userData.user.id);

      setIntegrationsWithStatus(integrations);
    } catch (error) {
      console.error('Error loading integrations:', error);
      setIntegrationsWithStatus([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (integrationId: string) => {
    const integration = integrationsWithStatus.find(i => i.id === integrationId);
    if (!integration || !userData?.user?.id) {
      console.error('Missing integration or user data');
      return;
    }

    // Set processing state
    setProcessingIntegration(integrationId);

    try {
      if (integration.isConnected) {
        // Uninstall/Disconnect integration
        console.log('Uninstalling integration:', integrationId);
        
        if (OAuthCoordinator.requiresOAuth(integrationId)) {
          // For OAuth integrations, revoke tokens first
          const result = await OAuthCoordinator.disconnect(integrationId);
          if (!result.success) {
            console.error('OAuth disconnect failed:', result.error);
          }
        }
        
        // Update database to disconnected state
        const result = await UserIntegrationsService.uninstallIntegration({
          userId: userData.user.id,
          integrationId: integrationId
        });
        
        if (result.success) {
          console.log('Integration uninstalled successfully');
          await refreshUserData();
        } else {
          console.error('Failed to uninstall integration:', result.error);
        }
      } else {
        // Install/Connect integration
        console.log('Installing integration:', integrationId);
        
        if (OAuthCoordinator.requiresOAuth(integrationId)) {
          // OAuth flow will handle the connection and call our callback
          OAuthCoordinator.startFlow(integrationId);
        } else {
          // Handle non-OAuth connection
          const result = await UserIntegrationsService.installIntegration({
            userId: userData.user.id,
            integrationId: integrationId,
            installedByUserId: userData.user.id
          });
          
          if (result.success) {
            console.log('Integration installed successfully');
            await refreshUserData();
          } else {
            console.error('Failed to install integration:', result.error);
          }
        }
      }
    } catch (error) {
      console.error('Error handling integration connection:', error);
    } finally {
      // Clear processing state
      setProcessingIntegration(null);
    }
  };

  const handleSettings = (integrationId: string) => {
    console.log('Opening settings for:', integrationId);
    // TODO: Open integration settings modal or navigate to settings
  };

  return (
    <div className="h-[44rem] flex flex-col space-y-4 px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <Link className="w-5 h-5" />
          <span className="text-sm sm:text-lg">Unlock Your Family Superpowers</span>
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
          Connect your favorite apps to make family life effortless and organized
        </p>
      </div>

      {/* Integrations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {integrationsWithStatus.map((integration) => {
            const integrationProps = {
              id: integration.id,
              name: integration.name,
              description: integration.description,
              long_description: integration.long_description,
              platform_url: integration.platform_url,
              how_it_works: integration.how_it_works,
              image_url: integration.image_url,
              category: integration.category,
              required_scopes: integration.required_scopes,
              isConnected: integration.isConnected
            };

            return (
              <IntegrationCard
                key={integration.id}
                integration={integrationProps}
                onConnect={handleConnect}
                onSettings={handleSettings}
              />
            );
          })}
        </div>
      )}

      {/* Full-page processing overlay using Portal */}
      {processingIntegration && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              <Loader size="lg" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default IntegrationsSection;