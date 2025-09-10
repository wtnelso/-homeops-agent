import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Mail, 
  User, 
  Clock, 
  Home,
  Zap,
  Settings,
  Brain,
  CheckCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../config/routes';
import { supabase } from '../lib/supabase';

// Step Components
import WelcomeStep from './onboarding/WelcomeStep';
import ConnectGmailStep from './onboarding/ConnectGmailStep';
import FirstFetchStep from './onboarding/FirstFetchStep';
import ResultsStep from './onboarding/ResultsStep';
import ReviewStep from './onboarding/ReviewStep';

export interface OnboardingData {
  name: string;
  timezone: string;
  householdType: 'single' | 'couple' | 'family' | 'roommates';
  importantKeywords: string[]; // Keywords/phrases for email analysis
  gmailConnected: boolean;
  calibrationComplete: boolean;
  emailAnalysisComplete?: boolean; // New field for email analysis status
  analysisResults?: {
    themes: any[];
    insights: any[];
    senderPatterns: any[];
    summary: any;
  };
  emailWeights: {
    school: number;
    commerce: number;
    personal: number;
    work: number;
    manipulation: number;
  };
  emailPolicies: {
    autoCollapsePromotions: boolean;
    highlightSchoolBills: boolean;
    surfaceShipments: boolean;
    alertBillsDue: boolean;
    alertSchoolForms: boolean;
    alertOrderDelays: boolean;
  };
  agentProfile: {
    style: {
      directness: number; // 1-5 scale
      concision: number;  // 1-5 scale  
      empathy: number;    // 1-5 scale
    };
    domains: string[];
  };
}

const STEPS = [
  { id: 1, title: 'Welcome', icon: User, description: 'Tell us about yourself' },
  { id: 2, title: 'Connect Gmail', icon: Mail, description: 'Link your email account' },
  { id: 3, title: 'Email Analysis', icon: Zap, description: 'Analyze your emails' },
  { id: 4, title: 'Results', icon: Brain, description: 'Review your insights' },
  { id: 5, title: 'Complete Setup', icon: CheckCircle, description: 'Finalize setup' }
];

const Onboarding: React.FC = () => {
  // Initialize current step from localStorage or start at 1
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem('homeops_onboarding_step');
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  // Initialize onboarding data from localStorage or defaults
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(() => {
    const saved = localStorage.getItem('homeops_onboarding_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.warn('Failed to parse saved onboarding data:', error);
      }
    }
    return {
      name: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      householdType: 'family',
      importantKeywords: [],
      gmailConnected: false,
      calibrationComplete: false,
      emailWeights: {
        school: 1,
        commerce: 1,
        personal: 1,
        work: 1,
        manipulation: -2
      },
      emailPolicies: {
        autoCollapsePromotions: true,
        highlightSchoolBills: true,
        surfaceShipments: true,
        alertBillsDue: true,
        alertSchoolForms: true,
        alertOrderDelays: true
      },
      agentProfile: {
        style: {
          directness: 3,
          concision: 3,
          empathy: 4
        },
        domains: ['school', 'commerce', 'home']
      }
    };
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  // Save onboarding data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('homeops_onboarding_data', JSON.stringify(onboardingData));
  }, [onboardingData]);

  // Save current step to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('homeops_onboarding_step', currentStep.toString());
  }, [currentStep]);

  // Check if user should be in onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      console.log('🔍 Checking onboarding status for user:', !!user, 'auth_id:', user?.id);
      
      if (!user) {
        console.log('❌ No user, redirecting to login');
        navigate(ROUTES.LOGIN);
        return;
      }

      try {
        // Direct database query to check onboarding status
        const { data, error } = await supabase
          .from('users')
          .select('account_id, accounts!inner(onboarded_at)')
          .eq('auth_id', user.id)
          .single();

        console.log('🔍 Database query result:', { data, error });

        if (error && error.code !== 'PGRST116') { // PGRST116 = not found
          console.error('❌ Database error:', error);
          return;
        }

        // If user record not found, they need onboarding
        if (!data) {
          console.log('🚀 No user record found, user needs onboarding');
          return;
        }

        // Check if account has onboarded_at timestamp
        const onboardedAt = data.accounts?.onboarded_at;
        if (onboardedAt) {
          console.log('✅ User already onboarded, redirecting to dashboard');
          navigate(ROUTES.DASHBOARD_HOME);
        } else {
          console.log('🚀 User needs onboarding, staying on onboarding page');
        }
      } catch (error) {
        console.error('❌ Error checking onboarding status:', error);
      }
    };

    checkOnboardingStatus();
  }, [user, navigate]);

  const updateOnboardingData = useCallback((updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  }, []);

  const handleLogout = async () => {
    try {
      // Onboarding data and step are already saved to localStorage via useEffect
      console.log('🚪 Logging out and saving onboarding progress');
      
      // Sign out the user
      await supabase.auth.signOut();
      
      // Navigate to home/login page
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still navigate to login page even if logout fails
      navigate(ROUTES.LOGIN);
    }
  };

  const nextStep = useCallback(() => {
    if (currentStep < STEPS.length) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Welcome
        return onboardingData.name.trim().length > 0 && 
               onboardingData.timezone.length > 0 && 
               onboardingData.householdType.length > 0 &&
               onboardingData.importantKeywords.length > 0;
      case 2: // Connect Gmail
        return onboardingData.gmailConnected;
      case 3: // Email Analysis
        return true; // Can proceed once analysis is complete
      case 4: // Results
        return true; // Can proceed to final step
      case 5: // Complete Setup
        return true; // Final step
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <WelcomeStep
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <ConnectGmailStep
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onNext={nextStep}
          />
        );
      case 3:
        return (
          <FirstFetchStep
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onNext={nextStep}
          />
        );
      case 4:
        return (
          <ResultsStep
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onNext={nextStep}
          />
        );
      case 5:
        return (
          <ReviewStep
            data={onboardingData}
            onUpdate={updateOnboardingData}
            onComplete={() => {
              // Clean up localStorage when onboarding is completed
              localStorage.removeItem('homeops_onboarding_data');
              localStorage.removeItem('homeops_onboarding_step');
              navigate(ROUTES.DASHBOARD_HOME);
            }}
          />
        );
      default:
        return null;
    }
  };

  const currentStepData = STEPS.find(step => step.id === currentStep);

  console.log('🎨 Onboarding render - currentStep:', currentStep, 'user:', !!user);

  // Show loading state while user authentication is being verified
  // Note: Temporarily allowing onboarding to proceed even without user object
  // since auth callbacks may take time to populate the user state
  console.log('🎨 Onboarding render - user state:', !!user, user?.email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Ultra-Minimal Header */}
      <div className="bg-white/90 backdrop-blur-md dark:bg-gray-900/90 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Header with logout button */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                HomeOps Setup
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit & Save</span>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {currentStep} / {STEPS.length}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {Math.round((currentStep / STEPS.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-0.5">
            <div 
              className="bg-blue-500 h-0.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content - Responsive & Spacious */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
          {renderStep()}
        </div>
      </div>

      {/* Navigation Footer - Responsive */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${currentStep === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
            `}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {currentStep === STEPS.length ? 'Ready to finish' : 'Continue when ready'}
            </span>
          </div>

          <button
            onClick={nextStep}
            disabled={!canProceed() || currentStep === STEPS.length}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${canProceed() && currentStep < STEPS.length
                ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800'
              }
            `}
          >
            <span>{currentStep === STEPS.length ? 'Complete' : 'Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;