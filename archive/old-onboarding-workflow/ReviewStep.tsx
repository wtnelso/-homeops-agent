import React, { useState } from 'react';
import { CheckCircle, User, Mail, Brain, Zap } from 'lucide-react';
import { OnboardingData } from '../Onboarding';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { generateDefaultAccountName } from '../../config/constants';

interface ReviewStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onComplete: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ data, onComplete }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const { user } = useAuth();

  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      if (!user) {
        throw new Error('No authenticated user found');
      }

      console.log('🚀 Starting onboarding completion for user:', user.id);
      
      // First, get or create the user record and account
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('account_id, accounts!inner(*)')
        .eq('auth_id', user.id)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch user: ${userError.message}`);
      }

      let accountId = userData?.account_id;

      // If no account exists, create one
      if (!accountId) {
        console.log('🏠 Creating new account for user');
        
        // Generate default account name using the configured pattern
        const defaultAccountName = generateDefaultAccountName(data.name);
        console.log('📝 Generated default account name:', defaultAccountName);
        
        const { data: newAccount, error: accountError } = await supabase
          .from('accounts')
          .insert({
            account_name: defaultAccountName,
            household_type: data.householdType,
            timezone: data.timezone,
            onboarded_at: new Date().toISOString()
          })
          .select()
          .single();

        if (accountError) {
          throw new Error(`Failed to create account: ${accountError.message}`);
        }

        accountId = newAccount.id;

        // Update user with account_id if user record exists, otherwise create user record
        if (userData) {
          const { error: updateUserError } = await supabase
            .from('users')
            .update({ 
              account_id: accountId,
              name_user_provided: data.name
            })
            .eq('auth_id', user.id);

          if (updateUserError) {
            throw new Error(`Failed to update user account: ${updateUserError.message}`);
          }
        } else {
          const { error: createUserError } = await supabase
            .from('users')
            .insert({
              auth_id: user.id,
              email: user.email,
              name_auth_provided: user.user_metadata?.full_name || user.email?.split('@')[0],
              name_user_provided: data.name,
              account_id: accountId
            });

          if (createUserError) {
            throw new Error(`Failed to create user: ${createUserError.message}`);
          }
        }
      } else {
        // Update existing account with onboarding completion
        console.log('✅ Updating existing account with onboarding completion');
        
        // Generate default account name if one doesn't exist
        const defaultAccountName = generateDefaultAccountName(data.name);
        console.log('📝 Setting account name for existing account:', defaultAccountName);
        
        const { error: updateAccountError } = await supabase
          .from('accounts')
          .update({
            account_name: defaultAccountName,
            household_type: data.householdType,
            timezone: data.timezone,
            onboarded_at: new Date().toISOString()
          })
          .eq('id', accountId);

        if (updateAccountError) {
          throw new Error(`Failed to update account: ${updateAccountError.message}`);
        }

        // Also update the user's name
        const { error: updateUserNameError } = await supabase
          .from('users')
          .update({ name_user_provided: data.name })
          .eq('auth_id', user.id);

        if (updateUserNameError) {
          throw new Error(`Failed to update user name: ${updateUserNameError.message}`);
        }
      }

      // Save onboarding preferences (you can expand this based on your schema)
      console.log('💾 Saving onboarding preferences');
      const preferences = {
        email_weights: data.emailWeights,
        email_policies: data.emailPolicies,
        agent_profile: data.agentProfile,
        calibration_complete: data.calibrationComplete
      };

      // You might want to save these to a separate preferences table
      // For now, we'll just log them
      console.log('📋 Onboarding preferences:', preferences);

      console.log('🎉 Onboarding completed successfully!');
      onComplete();
    } catch (error) {
      console.error('❌ Failed to complete onboarding:', error);
      setIsCompleting(false);
      // You might want to show an error message to the user
      alert(`Failed to complete setup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Ready to Launch!
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Review your setup and launch your HomeOps command center.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="space-y-4 mb-8">
          {/* Profile Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Profile Setup
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-medium">Name:</span> {data.name}</p>
                  <p><span className="font-medium">Household:</span> {data.householdType}</p>
                  <p><span className="font-medium">Timezone:</span> {data.timezone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gmail Connection */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Gmail Integration
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Connected and ready for intelligent processing
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Email Analysis Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Email Analysis Keywords
                </h3>
                
                {/* User Input Tags */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Important Keywords:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {data.importantKeywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Analysis Found Tags */}
                {data.analysisResults && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Keywords Found in Analysis:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.analysisResults.summary?.keywords_analyzed?.map((keyword: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                        >
                          {keyword}
                        </span>
                      )) || (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Analysis keywords will appear here after email analysis
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps Preview */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200/50 dark:border-green-800/50 mb-8">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>HomeOps will analyze your recent emails and create your first insights</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Your personalized command center will be ready with smart categorization</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>You'll receive intelligent alerts based on your configured preferences</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>All settings can be adjusted anytime from your dashboard</span>
            </li>
          </ul>
        </div>

        {/* Complete Button */}
        <div className="text-center">
          {isCompleting ? (
            <div className="inline-flex items-center px-8 py-3 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 font-semibold rounded-lg border border-green-200 dark:border-green-800">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600 mr-3"></div>
              Setting up your HomeOps...
            </div>
          ) : (
            <button
              onClick={handleComplete}
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Launch HomeOps Command Center
            </button>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            This will complete your setup and take you to your dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;