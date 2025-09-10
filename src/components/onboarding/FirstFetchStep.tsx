import React, { useState, useEffect } from 'react';
import { Zap, Mail, Users, ShoppingCart, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { OnboardingData } from '../Onboarding';
import { useAuth } from '../../contexts/AuthContext';
import { EmailAnalysisService, AnalysisResults } from '../../services/emailAnalysisService';

interface FirstFetchStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const FirstFetchStep: React.FC<FirstFetchStepProps> = ({ data, onUpdate, onNext }) => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults>({
    success: false,
    status: 'not_started',
    themes: [],
    actionable_insights: [],
    sender_patterns: []
  });
  const [error, setError] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const { userData } = useAuth();

  useEffect(() => {
    if (!userData) {
      // Still loading user data, don't show error yet
      console.log('⏳ User data still loading...');
      return;
    }

    if (!userData.account?.id) {
      setError('Account information not available. Please try refreshing the page.');
      return;
    }

    // Clear any previous errors
    setError('');
    
    // Check if there's already an ongoing analysis
    checkExistingAnalysis();
  }, [userData]);

  const checkExistingAnalysis = async () => {
    console.log('🔍 Checking existing analysis. UserData:', userData);
    
    if (!userData?.account?.id) {
      console.log('❌ No account ID available:', {
        userData: !!userData,
        account: !!userData?.account,
        accountId: userData?.account?.id
      });
      return;
    }

    console.log('✅ Account ID found:', userData.account.id);

    const result = await EmailAnalysisService.getAnalysisStatus(userData.account.id);
    setAnalysisResults(result);

    if (result.error) {
      setError(result.error);
    }

    // If analysis is in progress, start polling
    if (['pending', 'syncing', 'analyzing'].includes(result.status)) {
      startPolling();
    } else if (result.status === 'completed') {
      handleAnalysisComplete(result);
    }
  };

  const startEmailAnalysis = async () => {
    if (!userData?.account?.id) {
      setError('Account information not available');
      return;
    }

    setIsStarting(true);
    setError('');

    const result = await EmailAnalysisService.startAnalysis(
      userData.account.id,
      data.importantKeywords || []
    );

    if (result.success && result.batch_id) {
      // Update state and start polling
      setAnalysisResults(prev => ({
        ...prev,
        status: 'pending',
        batch_id: result.batch_id
      }));
      startPolling();
    } else {
      setError(result.error || 'Failed to start email analysis');
    }

    setIsStarting(false);
  };

  const startPolling = () => {
    if (isPolling || !userData?.account?.id) return;

    setIsPolling(true);
    
    EmailAnalysisService.pollUntilComplete(
      userData.account.id,
      analysisResults.batch_id,
      (status) => {
        setAnalysisResults(status);
        if (status.error) {
          setError(status.error);
        }
      }
    ).then((finalResult) => {
      setAnalysisResults(finalResult);
      setIsPolling(false);
      
      if (finalResult.status === 'completed') {
        handleAnalysisComplete(finalResult);
      } else if (finalResult.error) {
        setError(finalResult.error);
      }
    });
  };

  const handleAnalysisComplete = (result: AnalysisResults) => {
    // Store analysis results in onboarding data for later use
    onUpdate({
      emailAnalysisComplete: true,
      analysisResults: {
        themes: result.themes,
        insights: result.actionable_insights,
        senderPatterns: result.sender_patterns,
        summary: result.summary
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'education': 
      case 'family': 
      case 'scheduling': return Users;
      case 'shopping':
      case 'financial':
      case 'commerce': return ShoppingCart;
      case 'health':
      case 'priority': return AlertCircle;
      case 'travel': return Mail; // Could add a plane icon
      default: return Mail;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'education':
      case 'family':
      case 'scheduling': return 'from-green-500 to-emerald-600';
      case 'shopping':
      case 'financial':
      case 'commerce': return 'from-blue-500 to-cyan-600';
      case 'health':
      case 'priority': return 'from-red-500 to-pink-600';
      case 'travel': return 'from-purple-500 to-indigo-600';
      default: return 'from-gray-500 to-slate-600';
    }
  };


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusMessage = () => {
    return EmailAnalysisService.getStatusMessage(
      analysisResults.status,
      analysisResults.summary?.total_emails,
      analysisResults.summary?.total_emails // processed emails not separately tracked in summary
    );
  };

  const getProgressPercentage = () => {
    return EmailAnalysisService.getProgressPercentage(
      analysisResults.status,
      analysisResults.summary?.total_emails,
      analysisResults.summary?.total_emails
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analyzing Your Email
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            We're fetching your recent emails and generating intelligent insights.
          </p>
        </div>

        {!userData ? (
          /* Loading User Data */
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Loading Account Information
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please wait while we prepare your email analysis...
            </p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Analysis Failed
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4">
              {error}
            </p>
            <button
              onClick={startEmailAnalysis}
              disabled={isStarting}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isStarting ? 'Starting...' : 'Try Again'}
            </button>
          </div>
        ) : analysisResults.status === 'not_started' ? (
          /* Initial State - Show Start Button */
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Ready to Analyze Your Emails
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We'll fetch your last 1,000 emails and use AI to identify patterns that help your family operate better.
            </p>
            <button
              onClick={startEmailAnalysis}
              disabled={isStarting}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium text-lg"
            >
              {isStarting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Starting Analysis...</span>
                </div>
              ) : (
                'Start Email Analysis'
              )}
            </button>
          </div>
        ) : analysisResults.status !== 'completed' ? (
          /* Loading State */
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Analyzing Your Emails
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {getStatusMessage()}
            </p>
            <div className="mt-6 bg-gray-100 dark:bg-gray-700 rounded-full h-2 max-w-xs mx-auto">
              <div 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>
        ) : (
          /* Results */
          <div>
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Analysis Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We analyzed {analysisResults.summary?.total_emails || 0} emails and found key insights for your family.
              </p>
            </div>

            {/* Themes Section */}
            {analysisResults.themes.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Email Themes We Discovered
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysisResults.themes.slice(0, 6).map((theme) => {
                    const Icon = getCategoryIcon(theme.category);
                    const colorClass = getCategoryColor(theme.category);

                    return (
                      <div
                        key={theme.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200"
                      >
                        <div className={`bg-gradient-to-r ${colorClass} p-3`}>
                          <div className="flex items-center justify-between text-white">
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4" />
                              <span className="font-medium text-sm">{theme.title}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">{theme.email_count} emails</span>
                              <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(theme.priority)}`}>
                                {theme.priority}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {theme.description}
                          </p>
                          {theme.examples.length > 0 && (
                            <div className="space-y-1">
                              {theme.examples.slice(0, 2).map((example, index) => (
                                <div key={index} className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                  • {example}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actionable Insights Section */}
            {analysisResults.actionable_insights.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Key Insights for Your Family
                </h4>
                <div className="space-y-3">
                  {analysisResults.actionable_insights.slice(0, 5).map((insight) => (
                    <div
                      key={insight.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900 dark:text-white">
                          {insight.title}
                        </h5>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                          {insight.priority}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {insight.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-6 border border-green-200/50 dark:border-green-800/50 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                Your Email Intelligence is Ready!
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                We've analyzed your emails and identified patterns that will help HomeOps assist your family better.
              </p>
              <button
                onClick={onNext}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Continue to Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FirstFetchStep;