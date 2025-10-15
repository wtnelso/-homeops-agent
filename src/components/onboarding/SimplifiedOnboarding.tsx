import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ROUTES } from '../../config/routes';
import TimezoneSelect from '../ui/TimezoneSelect';
import { saveOnboardingToMemory, completeOnboarding } from '../../services/onboardingService';
import { isDemoMode, DEMO_CONFIG } from '../../demo/config/demoConfig';
import { IntegrationsDataService, IntegrationWithStatus } from '../../services/integrationsData';
import IntegrationDetailsModal from '../ui/IntegrationDetailsModal';

// Simplified onboarding data structure
export interface SimplifiedOnboardingData {
  // Step 1: Welcome & Family
  userName: string;
  timezone: string;
  familyMembers: Array<{
    name: string;
    relationship: 'spouse' | 'partner' | 'child';
    age?: number;
    grade?: string;
  }>;

  // Step 2: Key Context
  schools: string[];
  activities: string[];
  emailDomains: string[];
  importantPlaces: string[];
}

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: 'Spouse', icon: Heart },
  { value: 'partner', label: 'Partner', icon: Heart },
  { value: 'child', label: 'Child', icon: User }
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
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<SimplifiedOnboardingData>({
    userName: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    familyMembers: [],
    schools: [],
    activities: [],
    emailDomains: [],
    importantPlaces: []
  });

  const [newMember, setNewMember] = useState({ name: '', relationship: 'child' as const, age: '', grade: '' });
  const [newItem, setNewItem] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gmailIntegration, setGmailIntegration] = useState<IntegrationWithStatus | null>(null);
  const [loadingIntegration, setLoadingIntegration] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { userData } = useAuth();
  const navigate = useNavigate();

  // Check if user is in demo mode
  const isCurrentlyInDemo = isDemoMode(userData?.user?.email);

  // Auto-populate user name from auth data
  useEffect(() => {
    if (userData?.user?.name && !data.userName && !isCurrentlyInDemo) {
      setData(prev => ({ ...prev, userName: userData.user.name || '' }));
    }
  }, [userData, data.userName, isCurrentlyInDemo]);

  // Pre-populate with demo data if in demo mode
  useEffect(() => {
    if (isCurrentlyInDemo) {
      setData({
        userName: DEMO_CONFIG.DEMO_ONBOARDING_DATA.step1.userName,
        timezone: DEMO_CONFIG.DEMO_ONBOARDING_DATA.step1.timezone,
        familyMembers: DEMO_CONFIG.DEMO_ONBOARDING_DATA.step2.familyMembers.map(member => ({
          name: member.name,
          relationship: member.relationship as 'spouse' | 'partner' | 'child',
          age: member.age,
          grade: member.grade || ''
        })),
        schools: [...DEMO_CONFIG.DEMO_ONBOARDING_DATA.step3.schools],
        activities: [...DEMO_CONFIG.DEMO_ONBOARDING_DATA.step3.activities],
        emailDomains: [...DEMO_CONFIG.DEMO_ONBOARDING_DATA.step3.emailDomains],
        importantPlaces: [...DEMO_CONFIG.DEMO_ONBOARDING_DATA.step3.importantPlaces]
      });
    }
  }, [isCurrentlyInDemo]);

  // Load Gmail integration data
  useEffect(() => {
    const loadGmailIntegration = async () => {
      setLoadingIntegration(true);
      try {
        if (!userData?.family?.id) {
          setGmailIntegration(null);
          return;
        }

        // Get integrations data for the account
        const integrations = await IntegrationsDataService.getIntegrationsForAccount(userData.family!.id);

        // Find Gmail integration
        const gmail = integrations.find(integration => integration.id === 'gmail');
        setGmailIntegration(gmail || null);
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
      // Check if user just returned from OAuth flow
      const wasFromOnboarding = localStorage.getItem('oauth_from_onboarding');
      if (wasFromOnboarding) {
        console.log('🔄 User returned from OAuth to onboarding, refreshing integration status');
        localStorage.removeItem('oauth_from_onboarding');

        // Reload integration data after a short delay to ensure server has processed
        setTimeout(() => {
          if (userData?.family?.id) {
            IntegrationsDataService.getIntegrationsForAccount(userData.family!.id)
              .then(integrations => {
                const gmail = integrations.find(integration => integration.id === 'gmail');
                setGmailIntegration(gmail || null);
                console.log('✅ Refreshed Gmail integration status after OAuth return');
              })
              .catch(error => {
                console.error('Error refreshing Gmail integration after OAuth:', error);
              });
          }
        }, 1000);
      }
    };

    checkOAuthReturn();
  }, []); // Run once on component mount

  const updateData = (updates: Partial<SimplifiedOnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const addFamilyMember = () => {
    if (!newMember.name.trim()) return;

    const member: any = {
      name: newMember.name.trim(),
      relationship: newMember.relationship
    };

    if (newMember.age) member.age = parseInt(newMember.age);
    if (newMember.grade) member.grade = newMember.grade;

    updateData({ familyMembers: [...data.familyMembers, member] });
    setNewMember({ name: '', relationship: 'child', age: '', grade: '' });
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
    setNewItem('');
  };

  const removeFromList = (listName: keyof SimplifiedOnboardingData, value: string) => {
    const currentList = data[listName] as string[];
    updateData({ [listName]: currentList.filter(item => item !== value) });
  };

  const handleGmailConnect = async (integrationId: string) => {
    // Handle Gmail connection using the same logic as IntegrationsSection
    const { OAuthCoordinator } = await import('../../config/oauth');
    const { UserIntegrationsService } = await import('../../services/userIntegrationsService');

    if (!userData?.family?.id || !userData?.user?.id) {
      console.error('Missing account or user data');
      return;
    }

    try {
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
          // Reload integration data
          const integrations = await IntegrationsDataService.getIntegrationsForAccount(userData.family!.id);
          const gmail = integrations.find(integration => integration.id === 'gmail');
          setGmailIntegration(gmail || null);
        } else {
          console.error('Failed to install integration:', result.error);
        }
      }
    } catch (error) {
      console.error('Error handling integration connection:', error);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      if (!userData?.user?.id) {
        throw new Error('User account ID not found');
      }

      console.log('💾 Saving onboarding data to agent memory...', data);

      // Save onboarding data to agent memory system
      const saveResult = await saveOnboardingToMemory(userData.user.id, data);
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save onboarding data');
      }

      console.log('✅ Onboarding data saved successfully');

      // Mark onboarding as complete
      const completeResult = await completeOnboarding(userData.user.id);
      if (!completeResult.success) {
        console.warn('⚠️ Failed to mark onboarding as complete:', completeResult.error);
        // Don't fail the whole process if this step fails
      }

      // Handle completion based on context
      if (inModal && onComplete) {
        onComplete();
      } else {
        // Navigate to dashboard with chat ready
        navigate(ROUTES.DASHBOARD);
      }
    } catch (error) {
      console.error('❌ Error completing onboarding:', error);
      // Show user-friendly error message
      alert('Sorry, there was an error saving your information. Please try again.');
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
                    {['child', 'son', 'daughter'].includes(newMember.relationship) && (
                      <input
                        type="text"
                        placeholder="Grade (optional)"
                        value={newMember.grade}
                        onChange={(e) => setNewMember(prev => ({ ...prev, grade: e.target.value }))}
                        className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                      />
                    )}
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
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addToList('schools', newItem)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => addToList('schools', newItem)}
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
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addToList('activities', newItem)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => addToList('activities', newItem)}
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
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addToList('emailDomains', newItem)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => addToList('emailDomains', newItem)}
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
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addToList('importantPlaces', newItem)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <button
                        onClick={() => addToList('importantPlaces', newItem)}
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
                  You're all set! 🎉
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400 mb-4">
                  Connect Gmail and start chatting with your AI assistant
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 mb-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                    What happens next?
                  </h3>
                  <div className="space-y-1 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">1</div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Connect your Gmail account securely</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">2</div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Start chatting immediately with your AI assistant</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">3</div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">AI learns and improves through conversation</span>
                    </div>
                  </div>
                </div>

                {/* Gmail Integration Tile - Compact IntegrationCard styling */}
                {loadingIntegration ? (
                  <div className="max-w-xs mx-auto mb-3">
                    <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl h-36"></div>
                  </div>
                ) : gmailIntegration ? (
                  <div className="max-w-xs mx-auto mb-3">
                    {/* Compact Integration Card with same structure as IntegrationCard */}
                    <div className={`bg-white dark:bg-gray-800 rounded-xl border p-3 hover:shadow-lg transition-all duration-500 relative transform hover:scale-105 ${
                      gmailIntegration.isConnected
                        ? 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}>

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

                      {/* Bottom Actions */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                        {/* Learn More Button */}
                        <button
                          onClick={() => setIsModalOpen(true)}
                          className="w-full px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                        >
                          Learn More
                        </button>

                        {/* Connect/Disconnect Button */}
                        <button
                          onClick={() => handleGmailConnect(gmailIntegration.id)}
                          className={`w-full px-2 py-1 rounded-md font-medium text-xs transition-all duration-200 transform hover:scale-105 ${
                            gmailIntegration.isConnected
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
                          }`}
                        >
                          {gmailIntegration.isConnected ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-xs mx-auto mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                    <p className="text-center text-yellow-700 dark:text-yellow-300 text-xs">
                      Gmail integration data not available.
                    </p>
                  </div>
                )}

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
      {gmailIntegration && (
        <IntegrationDetailsModal
          integration={{
            id: gmailIntegration.id,
            name: gmailIntegration.name,
            description: gmailIntegration.description,
            long_description: gmailIntegration.long_description,
            platform_url: gmailIntegration.platform_url,
            how_it_works: gmailIntegration.how_it_works,
            image_url: gmailIntegration.image_url,
            category: gmailIntegration.category,
            required_scopes: gmailIntegration.required_scopes,
            isConnected: gmailIntegration.isConnected
          }}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default SimplifiedOnboarding;