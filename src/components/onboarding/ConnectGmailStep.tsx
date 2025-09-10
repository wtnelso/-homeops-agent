import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Shield, Zap, Brain } from 'lucide-react';
import { OnboardingData } from '../Onboarding';
import { useAuth } from '../../contexts/AuthContext';
import { OAuthCoordinator } from '../../config/oauth';

interface ConnectGmailStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const ConnectGmailStep: React.FC<ConnectGmailStepProps> = ({ onUpdate }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const { userData } = useAuth();

  // Check if Gmail is already connected
  useEffect(() => {
    const checkGmailConnection = async () => {
      if (!userData?.integrations) return;
      
      try {
        const gmailIntegration = userData.integrations.find(i => i.integration_id === 'gmail');
        
        if (gmailIntegration?.status === 'connected') {
          setConnectionStatus('connected');
          onUpdate({ gmailConnected: true });
        }
      } catch (error) {
        console.error('Error checking Gmail connection:', error);
      }
    };

    checkGmailConnection();
  }, [userData, onUpdate]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    try {
      // Use the real OAuth flow
      OAuthCoordinator.startFlow('gmail');
      // The OAuth flow will handle the rest via callback
      // We'll check the connection status when the user returns
    } catch (error) {
      console.error('Gmail connection error:', error);
      setConnectionStatus('error');
      setIsConnecting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Connect Your Gmail
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            HomeOps needs access to your Gmail to provide intelligent email insights and management.
          </p>
        </div>

        {/* Connection Status */}
        {connectionStatus === 'connecting' && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              <span className="text-yellow-700 dark:text-yellow-300 text-sm">Connecting...</span>
            </div>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-green-700 dark:text-green-300 text-sm">Gmail Connected!</span>
            </div>
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300 text-sm">Connection failed. Try again.</span>
            </div>
          </div>
        )}

        {/* Features - Condensed */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Smart Categorization</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Instant Insights</p>
            </div>
            <div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Privacy First</p>
            </div>
          </div>
        </div>

        {/* Privacy Notice - Condensed */}
        <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left">
          <div className="flex items-start space-x-2">
            <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">Your Privacy Matters</strong>
              <br />• Emails analyzed securely, never stored permanently
              <br />• Disconnect anytime from settings
              <br />• Only access what's needed for functionality
            </div>
          </div>
        </div>

        {/* Connect Button */}
        {connectionStatus !== 'connected' && (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full flex items-center justify-center py-3 px-4 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <img src="/google-logo.svg" alt="Google" className="w-5 h-5 mr-3" />
            <span className="font-medium">{isConnecting ? 'Connecting...' : 'Connect with Google'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectGmailStep;