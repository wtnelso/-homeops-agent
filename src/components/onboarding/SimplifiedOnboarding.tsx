import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  ArrowLeft,
  User,
  Heart,
  Mail,
  MessageCircle,
  CheckCircle,
  Plus,
  X,
  Calendar,
  MapPin,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { ROUTES, OAUTH_RETURN_URLS } from '../../config/routes';
import TimezoneSelect from '../ui/TimezoneSelect';
import { OnboardingService } from '../../services/onboardingService';
import { IntegrationsDataService, IntegrationWithStatus } from '../../services/integrationsData';
import IntegrationDetailsModal from '../ui/IntegrationDetailsModal';
import { OAuthCoordinator } from '../../config/oauth';
import { OAuthRedirectHandler } from '../../services/oauthRedirectHandler';

// Simplified onboarding data structure
export interface SimplifiedOnboardingData {
  // Step 1: Welcome & Family
  userName: string;
  timezone: string;
  familyMembers: Array<{
    name: string;
    relationship: 'partner' | 'child' | 'pet' | 'parent' | 'sibling' | 'grandparent' | 'other';
    age?: number;
    grade?: string;
    email?: string;
  }>;

  // Step 2: Key Context
  schools: string[];
  activities: string[];
  emailDomains: string[];
  importantPlaces: string[];
}

const RELATIONSHIP_OPTIONS = [
  { value: 'partner', label: 'Spouse/Partner', icon: Heart },
  { value: 'child', label: 'Child', icon: User },
  { value: 'pet', label: 'Pet', icon: Heart },
  { value: 'parent', label: 'Parent', icon: User },
  { value: 'sibling', label: 'Sibling', icon: User },
  { value: 'grandparent', label: 'Grandparent', icon: User },
  { value: 'other', label: 'Other', icon: User }
];

const ACTIVITY_SUGGESTIONS = [
  'Soccer', 'Piano', 'Basketball', 'Dance', 'Swimming', 'Guitar',
  'Tennis', 'Art', 'Chess', 'Karate', 'Baseball', 'Violin',
  'Gymnastics', 'Track', 'Drama', 'Coding', 'Photography', 'Cooking'
];

const STEPS = [
  { id: 1, title: 'Welcome', icon: User, description: 'Your family' },
  { id: 2, title: 'Context', icon: Heart, description: 'Important details' },
  { id: 3, title: 'Connect', icon: MessageCircle, description: 'Start chatting' }
];

interface SimplifiedOnboardingProps {
  onComplete?: () => void; // Optional callback for when onboarding is completed
  inModal?: boolean; // Flag to indicate if it's being used in a modal
}

const SimplifiedOnboarding: React.FC<SimplifiedOnboardingProps> = ({
  onComplete,
  inModal = false,
}) => {
  const { showToast } = useToast();
  // Load saved onboarding data from localStorage on mount
  const loadSavedData = (): SimplifiedOnboardingData => {
    try {
      const saved = localStorage.getItem('onboarding_data');
      if (saved) {
        console.log('📋 Loading saved onboarding data from localStorage');
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('❌ Error loading saved onboarding data:', error);
    }

    // Return default data if nothing saved or error
    return {
      userName: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      familyMembers: [],
      schools: [],
      activities: [],
      emailDomains: [],
      importantPlaces: []
    };
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<SimplifiedOnboardingData>(loadSavedData);

  const [newMember, setNewMember] = useState({ name: '', relationship: 'partner' as const, age: '', grade: '', email: '' });
  const [newSchool, setNewSchool] = useState('');
  const [newActivity, setNewActivity] = useState('');
  const [newEmailDomain, setNewEmailDomain] = useState('');
  const [newPlace, setNewPlace] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gmailIntegration, setGmailIntegration] = useState<IntegrationWithStatus | null>(null);
  const [calendarIntegration, setCalendarIntegration] = useState<IntegrationWithStatus | null>(null);
  const [loadingIntegration, setLoadingIntegration] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [processingIntegration, setProcessingIntegration] = useState<string | null>(null);

  // Debug log for processing state changes
  useEffect(() => {
    console.log('🔍 Processing integration state changed:', processingIntegration);
  }, [processingIntegration]);

  // Debug log for gmail integration state changes
  useEffect(() => {
    console.log('📧 Gmail integration state changed:', {
      id: gmailIntegration?.id,
      isConnected: gmailIntegration?.isConnected,
      fullObject: gmailIntegration
    });
  }, [gmailIntegration]);
  const { userData, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();


  // Auto-populate user name from auth data
  useEffect(() => {
    if (userData?.user?.name && !data.userName) {
      updateData({ userName: userData.user.name || '' });
    }
  }, [userData]);


  // Load Gmail integration data
  useEffect(() => {
    const loadGmailIntegration = async () => {
      setLoadingIntegration(true);
      try {
        if (!userData?.user?.id) {
          setGmailIntegration(null);
          return;
        }

        // Get integrations data for the user
        const integrations = await IntegrationsDataService.getIntegrationsForUser(userData.user.id);

        // Find Gmail-forwarding and Google Calendar integrations
        const gmail = integrations.find(integration => integration.id === 'gmail-forwarding');
        const calendar = integrations.find(integration => integration.id === 'google-calendar');
        setGmailIntegration(gmail || null);
        setCalendarIntegration(calendar || null);
      } catch (error) {
        console.error('Error loading Gmail integration data:', error);
        setGmailIntegration(null);
      } finally {
        setLoadingIntegration(false);
      }
    };

    loadGmailIntegration();
  }, [userData]);

  // Check for OAuth return and refresh integration status
  useEffect(() => {
    const checkOAuthReturn = () => {
      console.log('🔍 OAuth Return Check - Starting...');
      console.log('📊 localStorage contents:', {
        oauth_from_onboarding: localStorage.getItem('oauth_from_onboarding'),
        oauth_integration_pending: localStorage.getItem('oauth_integration_pending'),
        oauth_return_url: localStorage.getItem('oauth_return_url')
      });
      console.log('🌐 Current URL:', window.location.href);
      console.log('📍 Current step before check:', currentStep);

      // Check if user just returned from OAuth flow
      const wasFromOnboarding = OAuthRedirectHandler.clearOnboardingFlag();
      console.log('❓ Was from onboarding?', wasFromOnboarding);

      if (wasFromOnboarding) {
        console.log('✅ DETECTED: User returned from OAuth to onboarding!');

        // Jump to step 3 since OAuth integrations are on step 3
        console.log('📍 EXECUTING: Jumping to step 3 after OAuth return');
        console.log('📍 Current step before setCurrentStep:', currentStep);
        setCurrentStep(3);
        console.log('📍 setCurrentStep(3) called');

        // Reload integration data after a short delay to ensure server has processed
        setTimeout(async () => {
          if (userData?.user?.id) {
            try {
              // Refresh global user data (like IntegrationsSection does)
              await refreshUserData();
              // Also refresh local integration data
              const integrations = await IntegrationsDataService.getIntegrationsForUser(userData.user.id);
              const gmail = integrations.find(integration => integration.id === 'gmail-forwarding');
              const calendar = integrations.find(integration => integration.id === 'google-calendar');
              setGmailIntegration(gmail || null);
              setCalendarIntegration(calendar || null);
              console.log('✅ Refreshed Gmail integration status after OAuth return');
            } catch (error) {
              console.error('Error refreshing Gmail integration after OAuth:', error);
            }
          }
        }, 1000);
      } else {
        console.log('❌ No oauth_from_onboarding flag found - not returning from OAuth');
      }
    };

    console.log('🚀 OAuth Return Check useEffect triggered');
    checkOAuthReturn();
    console.log('✅ OAuth Return Check useEffect completed');
  }, []); // Run once on component mount

  // Check URL parameter for onboarding step
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const onboardingStep = urlParams.get('onboardingStep');

    if (onboardingStep) {
      const stepNumber = parseInt(onboardingStep, 10);
      if (stepNumber >= 1 && stepNumber <= 3 && stepNumber !== currentStep) {
        console.log('🎯 URL STEP: Jumping to step', stepNumber, 'from URL parameter');
        setCurrentStep(stepNumber);

        // Clean up URL parameter after setting step
        navigate(location.pathname, { replace: true });
      }
    }
  }, [location.search, currentStep, navigate, location.pathname]);

  // Debug: Track currentStep changes
  useEffect(() => {
    console.log('📍 STEP CHANGED:', currentStep);
  }, [currentStep]);

  // Save data to localStorage whenever it changes
  const saveDataToLocalStorage = (newData: SimplifiedOnboardingData) => {
    try {
      localStorage.setItem('onboarding_data', JSON.stringify(newData));
      console.log('💾 Saved onboarding data to localStorage');
    } catch (error) {
      console.error('❌ Error saving onboarding data to localStorage:', error);
    }
  };

  const updateData = (updates: Partial<SimplifiedOnboardingData>) => {
    setData(prev => {
      const newData = { ...prev, ...updates };
      saveDataToLocalStorage(newData);
      return newData;
    });
  };

  const addFamilyMember = () => {
    if (!newMember.name.trim()) return;

    const member: any = {
      name: newMember.name.trim(),
      relationship: newMember.relationship
    };

    if (newMember.age) member.age = parseInt(newMember.age);
    if (newMember.grade) member.grade = newMember.grade;
    if (newMember.email) member.email = newMember.email;

    updateData({ familyMembers: [...data.familyMembers, member] });
    setNewMember({ name: '', relationship: 'partner', age: '', grade: '', email: '' });
  };

  const removeFamilyMember = (index: number) => {
    const updated = data.familyMembers.filter((_, i) => i !== index);
    updateData({ familyMembers: updated });
  };

  const addToList = (listName: keyof SimplifiedOnboardingData, value: string) => {
    if (!value.trim()) return;
    const currentList = data[listName] as string[];
    if (!currentList.includes(value.trim())) {
      updateData({ [listName]: [...currentList, value.trim()] });
    }
    // Clear the appropriate input field
    switch (listName) {
      case 'schools':
        setNewSchool('');
        break;
      case 'activities':
        setNewActivity('');
        break;
      case 'emailDomains':
        setNewEmailDomain('');
        break;
      case 'importantPlaces':
        setNewPlace('');
        break;
    }
  };

  const removeFromList = (listName: keyof SimplifiedOnboardingData, value: string) => {
    const currentList = data[listName] as string[];
    updateData({ [listName]: currentList.filter(item => item !== value) });
  };

  const handleIntegrationConnect = async (integrationId: string) => {
    console.log('🚀 handleIntegrationConnect called with integrationId:', integrationId);
    console.log('🔍 OAuthCoordinator.requiresOAuth result:', OAuthCoordinator.requiresOAuth(integrationId));

    // Add debug info to localStorage so we can track it through OAuth
    const debugInfo = {
      timestamp: new Date().toISOString(),
      integrationId,
      requiresOAuth: OAuthCoordinator.requiresOAuth(integrationId),
      step: 'handleIntegrationConnect_called'
    };
    localStorage.setItem('onboarding_debug', JSON.stringify(debugInfo));

    // Set processing state
    console.log('⏳ Setting processing state for:', integrationId);
    setProcessingIntegration(integrationId);
    console.log('✅ Processing state set, should show overlay now');

    try {
      // Handle integration connection/disconnection with special handling for Gmail-forwarding
      const { OAuthCoordinator } = await import('../../config/oauth');
      const { UserIntegrationsService } = await import('../../services/userIntegrationsService');

      if (!userData?.family?.id || !userData?.user?.id) {
        console.error('Missing account or user data');
        return;
      }

      // Determine current integration status
      const currentIntegration = integrationId === 'gmail-forwarding' ? gmailIntegration : calendarIntegration;
      const isConnected = currentIntegration?.isConnected || false;

      console.log('🔍 Debug handleGmailConnect:', {
        integrationId,
        currentIntegration,
        isConnected,
        gmailIntegration,
        calendarIntegration
      });
      if (isConnected) {
        // Uninstall/Disconnect integration
        console.log('🔓 Uninstalling integration:', integrationId);

        console.log('🔍 Checking OAuth requirement for:', integrationId);
        const requiresOAuth = OAuthCoordinator.requiresOAuth(integrationId);
        console.log('🔍 Requires OAuth:', requiresOAuth);

        if (requiresOAuth) {
          // For OAuth integrations, revoke tokens first
          console.log('🔄 Starting OAuth disconnect for:', integrationId);
          const oauthResult = await OAuthCoordinator.disconnect(integrationId);
          console.log('🔄 OAuth disconnect result:', oauthResult);
          if (!oauthResult.success) {
            console.error('❌ OAuth disconnect failed:', oauthResult.error);
          }
        }

        // Update database to disconnected state
        console.log('🗄️ Calling UserIntegrationsService.uninstallIntegration with:', {
          userId: userData.user.id,
          integrationId: integrationId
        });

        const result = await UserIntegrationsService.uninstallIntegration({
          userId: userData.user.id,
          integrationId: integrationId
        });

        console.log('🗄️ Uninstall result:', result);

        if (result.success) {
          console.log('✅ Integration uninstalled successfully');
          // Refresh global user data (like IntegrationsSection does)
          await refreshUserData();
          // Reload local integration data
          const integrations = await IntegrationsDataService.getIntegrationsForUser(userData.user.id);
          const gmail = integrations.find(integration => integration.id === 'gmail-forwarding');
          const calendar = integrations.find(integration => integration.id === 'google-calendar');
          console.log('🔄 Reloaded integrations after disconnect:', {
            gmail: gmail ? { id: gmail.id, isConnected: gmail.isConnected } : null,
            calendar: calendar ? { id: calendar.id, isConnected: calendar.isConnected } : null
          });
          console.log('💾 Setting new state for gmail integration:', gmail);
          setGmailIntegration(gmail || null);
          setCalendarIntegration(calendar || null);
          console.log('✅ State update calls completed');
        } else {
          console.error('❌ Failed to uninstall integration:', result.error);
        }
      } else {
        // Install/Connect integration
        console.log('Installing integration:', integrationId);

        if (integrationId === 'gmail-forwarding') {
          // Use specialized Gmail-forwarding service
          const { GmailForwardingService } = await import('../../services/gmailForwardingService');

          const result = await GmailForwardingService.installGmailForwarding({
            userId: userData.user.id,
            installedByUserId: userData.user.id
          });

          if (result.success) {
            console.log('Gmail-forwarding integration installed successfully:', result);
            // Refresh global user data (like IntegrationsSection does)
            await refreshUserData();
            // Reload integration data to get the generated email address
            const integrations = await IntegrationsDataService.getIntegrationsForUser(userData.user.id);
            const gmail = integrations.find(integration => integration.id === 'gmail-forwarding');
            const calendar = integrations.find(integration => integration.id === 'google-calendar');
            console.log('Reloaded Gmail integration data:', gmail);
            setGmailIntegration(gmail || null);
            setCalendarIntegration(calendar || null);
          } else {
            console.error('Failed to install Gmail-forwarding integration:', result.error);
          }
        } else if (OAuthCoordinator.requiresOAuth(integrationId)) {

          // OAuth flow will handle the connection and call our callback
          OAuthCoordinator.startFlow(integrationId, OAUTH_RETURN_URLS.ONBOARDING_STEP_3);
        } else {
          // Handle other non-OAuth connections
          const result = await UserIntegrationsService.installIntegration({
            userId: userData.user.id,
            integrationId: integrationId,
            installedByUserId: userData.user.id
          });

          if (result.success) {
            console.log('Integration installed successfully');
            // Reload integration data
            const integrations = await IntegrationsDataService.getIntegrationsForUser(userData.user.id);
            const gmail = integrations.find(integration => integration.id === 'gmail-forwarding');
            const calendar = integrations.find(integration => integration.id === 'google-calendar');
            setGmailIntegration(gmail || null);
            setCalendarIntegration(calendar || null);
          } else {
            console.error('Failed to install integration:', result.error);
          }
        }
      }
    } catch (error) {
      console.error('Error handling integration connection:', error);
    } finally {
      // Clear processing state
      console.log('🔄 Clearing processing state');
      setProcessingIntegration(null);
      console.log('✅ Processing state cleared');
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // Get session token from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.access_token) {
        throw new Error('User authentication token not found');
      }

      console.log('💾 Starting comprehensive onboarding completion...', data);

      // Use the new comprehensive onboarding service
      if (!userData?.user?.id) {
        throw new Error('User ID is required');
      }
      if (!userData.user.family_id) {
        throw new Error('Family ID is required');
      }
      const result = await OnboardingService.completeOnboarding(data, userData.user.family_id, userData.user.id);

      // Generate user-friendly message
      const message = OnboardingService.getCompletionMessage(result);

      if (result.success) {
        // Show success/warning toast
        showToast(message.message, message.type);

        // Clean up localStorage after successful completion
        OnboardingService.cleanupOnboardingData();

        // Refresh user data to include newly created family members and data
        console.log('🔄 Refreshing user data after onboarding completion');
        try {
          await refreshUserData();
          console.log('✅ User data refreshed successfully after onboarding');
        } catch (error) {
          console.error('❌ Error refreshing user data after onboarding:', error);
        }

        // Handle completion based on context
        if (inModal && onComplete) {
          onComplete();
        } else {
          // Navigate to dashboard with chat ready
          navigate(ROUTES.DASHBOARD);
        }
      } else {
        // Show error toast
        showToast(message.message, message.type);
      }

    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      showToast(
        'Sorry, there was an error saving your information. Please try again.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.userName.trim().length > 0;
      case 2:
        return true; // Context is optional
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${currentStep >= step.id
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                  }
                `}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-4 transition-all
                    ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map(step => (
              <div key={step.id} className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{step.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 animate-fade-in">

            {/* Step 1: Welcome & Family */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome to HomeOps!
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Let's set up your AI assistant with some basic info about your family
                  </p>
                </div>

                {/* User Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={data.userName}
                    onChange={(e) => updateData({ userName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g. Sarah Johnson"
                  />
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Timezone
                  </label>
                  <TimezoneSelect
                    value={data.timezone}
                    onChange={(timezone) => updateData({ timezone })}
                    className="w-full"
                  />
                </div>

                {/* Family Members */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Family Members <span className="text-gray-500">(optional)</span>
                  </label>

                  {/* Add Family Member Form */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Name"
                        value={newMember.name}
                        onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <select
                        value={newMember.relationship}
                        onChange={(e) => setNewMember(prev => ({ ...prev, relationship: e.target.value as any }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      >
                        {RELATIONSHIP_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Age"
                        value={newMember.age}
                        onChange={(e) => setNewMember(prev => ({ ...prev, age: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={addFamilyMember}
                        disabled={!newMember.name.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Grade (optional)"
                        value={newMember.grade}
                        onChange={(e) => setNewMember(prev => ({ ...prev, grade: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={newMember.email}
                        onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Family Members List */}
                  {data.familyMembers.length > 0 && (
                    <div className="space-y-2">
                      {data.familyMembers.map((member, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {member.name}
                            </span>
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                              ({member.relationship}{member.age ? `, age ${member.age}` : ''}{member.grade ? `, ${member.grade}` : ''})
                            </span>
                          </div>
                          <button
                            onClick={() => removeFamilyMember(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Key Context */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Heart className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Tell us what's important
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Help your AI assistant understand your family's world (all optional)
                  </p>
                </div>

                {/* Quick Setup Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Schools */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Schools
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Lincoln Elementary"
                        value={newSchool}
                        onChange={(e) => setNewSchool(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addToList('schools', newSchool)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => addToList('schools', newSchool)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.schools.map(school => (
                        <span key={school} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                          {school}
                          <button onClick={() => removeFromList('schools', school)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Activities & Sports
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Soccer, Piano"
                        value={newActivity}
                        onChange={(e) => setNewActivity(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addToList('activities', newActivity)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => addToList('activities', newActivity)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Activity Suggestions */}
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITY_SUGGESTIONS.slice(0, 8).map(activity => (
                        <button
                          key={activity}
                          onClick={() => addToList('activities', activity)}
                          disabled={data.activities.includes(activity)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-md transition-colors"
                        >
                          {activity}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.activities.map(activity => (
                        <span key={activity} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">
                          {activity}
                          <button onClick={() => removeFromList('activities', activity)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Important Email Domains */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-orange-600" />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Important Email Domains
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. @school.edu, @work.com"
                        value={newEmailDomain}
                        onChange={(e) => setNewEmailDomain(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addToList('emailDomains', newEmailDomain)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => addToList('emailDomains', newEmailDomain)}
                        className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.emailDomains.map(domain => (
                        <span key={domain} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-md text-sm">
                          {domain}
                          <button onClick={() => removeFromList('emailDomains', domain)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Important Places */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-purple-600" />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Important Places
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Community Center, Dance Studio"
                        value={newPlace}
                        onChange={(e) => setNewPlace(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addToList('importantPlaces', newPlace)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => addToList('importantPlaces', newPlace)}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {data.importantPlaces.map(place => (
                        <span key={place} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-sm">
                          {place}
                          <button onClick={() => removeFromList('importantPlaces', place)}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Connect & Chat */}
            {currentStep === 3 && (
              <div className="space-y-4 text-center">
                <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  You're almost there! 🎉
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400 mb-4">
                  Connect Gmail and Google Calendar to start chatting with your AI assistant
                </p>

                {/* Integration Tiles Container - Responsive Grid */}
                <div className="max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

                    {/* Gmail Integration Tile */}
                    {loadingIntegration ? (
                      <div className="mx-auto">
                        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-36"></div>
                      </div>
                    ) : gmailIntegration ? (
                      <div className="mx-auto">
                    {/* Compact Integration Card with same structure as IntegrationCard */}
                    <div
                      onClick={() => {
                        console.log('📱 Gmail tile clicked, current state:', {
                          id: gmailIntegration?.id,
                          isConnected: gmailIntegration?.isConnected,
                          name: gmailIntegration?.name
                        });
                        setSelectedIntegration(gmailIntegration);
                        setIsModalOpen(true);
                      }}
                      className={`w-full bg-white dark:bg-gray-800 rounded-xl border p-3 hover:shadow-lg transition-all duration-500 relative transform hover:scale-105 h-full flex flex-col cursor-pointer text-left ${
                        (gmailIntegration?.isConnected ?? false)
                          ? 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >

                      {/* Success Animation Badge */}
                      {gmailIntegration.isConnected && (
                        <div className="absolute top-2 right-2 animate-pulse">
                          <div className="w-5 h-5 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                      )}

                      {/* Icon - Use Gmail logo or fallback */}
                      <div className="flex justify-center mb-2">
                        <div className={`${gmailIntegration.isConnected ? 'animate-pulse' : ''}`}>
                          {gmailIntegration.image_url ? (
                            <img
                              src={gmailIntegration.image_url}
                              alt="Gmail icon"
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <div className="text-gray-600 dark:text-gray-400 font-semibold text-xs text-center">
                                Gmail
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Integration Name */}
                      <div className="text-center mb-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {gmailIntegration.name}
                        </h3>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {gmailIntegration.isConnected ? `${gmailIntegration.name} Connected!` : `Connect ${gmailIntegration.name}`}
                        </p>
                      </div>

                      {/* Value Proposition */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-2 font-medium">
                        {gmailIntegration.description}
                      </p>

                      {/* Connected Success Message */}
                      {gmailIntegration.isConnected && (
                        <div className="text-center mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Connected!
                          </span>
                        </div>
                      )}


                    </div>
                  </div>
                ) : (
                  <div className="mx-auto p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <p className="text-center text-yellow-700 dark:text-yellow-300 text-xs">
                      Gmail integration data not available.
                    </p>
                  </div>
                )}

                    {/* Google Calendar Integration Tile */}
                    {calendarIntegration && (
                      <div className="mx-auto">
                    <div
                      onClick={() => {
                        setSelectedIntegration(calendarIntegration);
                        setIsModalOpen(true);
                      }}
                      className={`w-full bg-white dark:bg-gray-800 rounded-xl border p-3 hover:shadow-lg transition-all duration-500 relative transform hover:scale-105 h-full flex flex-col cursor-pointer text-left ${
(calendarIntegration?.isConnected ?? false)
                          ? 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >

                      {/* Success Animation Badge */}
                      {calendarIntegration.isConnected && (
                        <div className="absolute top-2 right-2 animate-pulse">
                          <div className="w-5 h-5 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                      )}

                      {/* Icon */}
                      <div className="flex justify-center mb-2">
                        <div className={`${calendarIntegration.isConnected ? 'animate-pulse' : ''}`}>
                          {calendarIntegration.image_url ? (
                            <img
                              src={calendarIntegration.image_url}
                              alt="Google Calendar icon"
                              className="w-10 h-10 object-contain"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                              <div className="text-gray-600 dark:text-gray-400 font-semibold text-xs text-center">
                                Calendar
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Integration Name */}
                      <div className="text-center mb-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          {calendarIntegration.name}
                        </h3>
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {calendarIntegration.isConnected ? `${calendarIntegration.name} Connected!` : `Connect ${calendarIntegration.name}`}
                        </p>
                      </div>

                      {/* Value Proposition */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center leading-relaxed mb-2 font-medium">
                        {calendarIntegration.description}
                      </p>

                      {/* Connected Success Message */}
                      {calendarIntegration.isConnected && (
                        <div className="text-center mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            Connected!
                          </span>
                        </div>
                      )}

                    </div>
                  </div>
                    )}

                  </div>
                </div>

              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              {currentStep > 1 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {currentStep === 1 ? 'Add Context' : 'Connect & Chat'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                !loadingIntegration && gmailIntegration?.isConnected && (
                  <button
                    onClick={handleComplete}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Start chatting with HomeOps
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Integration Details Modal */}
      {selectedIntegration && (
        <IntegrationDetailsModal
          integration={{
            id: selectedIntegration.id,
            name: selectedIntegration.name,
            description: selectedIntegration.description,
            long_description: selectedIntegration.long_description,
            platform_url: selectedIntegration.platform_url,
            how_it_works: selectedIntegration.how_it_works,
            setup_instructions: selectedIntegration.setup_instructions,
            why_setup: selectedIntegration.why_setup,
            image_url: selectedIntegration.image_url,
            category: selectedIntegration.category,
            required_scopes: selectedIntegration.required_scopes,
            // Use current state instead of stale selectedIntegration
            isConnected: selectedIntegration.id === 'gmail-forwarding'
              ? (gmailIntegration?.isConnected ?? false)
              : selectedIntegration.id === 'google-calendar'
              ? (calendarIntegration?.isConnected ?? false)
              : selectedIntegration.isConnected
          }}
          userData={userData}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedIntegration(null);
          }}
          onConnect={handleIntegrationConnect}
        />
      )}

      {/* Processing Loading Overlay */}
      {processingIntegration && (
        console.log('🎭 Rendering overlay for:', processingIntegration),
        createPortal(
          <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center" style={{ zIndex: 999999 }}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {processingIntegration === 'gmail-forwarding' ? 'Processing Gmail connection...' : 'Processing connection...'}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
};

export default SimplifiedOnboarding;