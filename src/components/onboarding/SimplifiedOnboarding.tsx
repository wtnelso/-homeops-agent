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
              <div className="space-y-6 text-center">
                <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  You're all set! 🎉
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  Connect Gmail and start chatting with your AI assistant
                </p>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    What happens next?
                  </h3>
                  <div className="space-y-2 text-left max-w-md mx-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">1</div>
                      <span className="text-gray-700 dark:text-gray-300">Connect your Gmail account securely</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">2</div>
                      <span className="text-gray-700 dark:text-gray-300">Start chatting immediately with your AI assistant</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm">3</div>
                      <span className="text-gray-700 dark:text-gray-300">AI learns and improves through conversation</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="w-full max-w-md px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all transform hover:scale-105"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Setting up...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      Connect Gmail & Start Chatting
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </button>
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

              {currentStep < 3 && (
                <button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {currentStep === 1 ? 'Add Context' : 'Connect & Chat'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedOnboarding;