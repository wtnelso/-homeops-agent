import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { IntegrationsDataService, IntegrationWithStatus } from '../../../services/integrationsData';
import { AccountIntegrationsService } from '../../../services/accountIntegrationsService';
import { OAuthCoordinator } from '../../../config/oauth';
import IntegrationCard from '../../ui/IntegrationCard';

const IntegrationsSection: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [integrationsWithStatus, setIntegrationsWithStatus] = useState<IntegrationWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrationsData();
  }, [userData]);

  const loadIntegrationsData = async () => {
    console.log('Loading integrations data...', { 
      userEmail: userData?.user?.email, 
      accountId: userData?.account?.id 
    });
    
    setLoading(true);
    try {
      if (!userData?.account?.id) {
        console.warn('No account ID available');
        setIntegrationsWithStatus([]);
        return;
      }

      // Use new account-based integration service
      const integrations = await IntegrationsDataService.getIntegrationsForAccount(userData.account.id);
      console.log('Account integrations:', integrations);
      
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
    if (!integration || !userData?.account?.id || !userData?.user?.id) {
      console.error('Missing integration, account, or user data');
      return;
    }

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
        const result = await AccountIntegrationsService.uninstallIntegration({
          accountId: userData.account.id,
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
          const result = await AccountIntegrationsService.installIntegration({
            accountId: userData.account.id,
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
    }
  };

  const handleSettings = (integrationId: string) => {
    console.log('Opening settings for:', integrationId);
    // TODO: Open integration settings modal or navigate to settings
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Integrations</h3>
      </div>

      {/* Integrations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-48"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            
            console.log(`Integration ${integration.id}:`, {
              isConnected: integration.isConnected
            });
            
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
    </div>
  );
};

export default IntegrationsSection;