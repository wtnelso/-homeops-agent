import React from 'react';
import { CheckCircle, TrendingUp, Mail, AlertTriangle, Package } from 'lucide-react';
import { OnboardingData } from '../Onboarding';

interface ResultsStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const ResultsStep: React.FC<ResultsStepProps> = ({ data, onUpdate, onNext }) => {
  // Mock analysis results
  const analysisResults = {
    totalEmails: 247,
    categories: {
      school: { count: 45, percentage: 18 },
      commerce: { count: 89, percentage: 36 },
      personal: { count: 67, percentage: 27 },
      work: { count: 46, percentage: 19 }
    },
    insights: [
      {
        icon: AlertTriangle,
        title: 'Important School Communications',
        description: '3 urgent school forms requiring attention',
        priority: 'high'
      },
      {
        icon: Package,
        title: 'Package Deliveries',
        description: '2 packages arriving this week',
        priority: 'medium'
      },
      {
        icon: TrendingUp,
        title: 'Bill Due Soon',
        description: 'Electric bill due in 3 days',
        priority: 'high'
      }
    ]
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Analysis Complete!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Here's what we found in your email account.
          </p>
        </div>

        {/* Email Summary */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {analysisResults.totalEmails}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              emails analyzed from the last 30 days
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(analysisResults.categories).map(([category, data]) => (
              <div key={category} className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {data.count}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {category} ({data.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Insights */}
        <div className="space-y-3 mb-8">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Key Insights Found
          </h3>
          {analysisResults.insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.priority === 'high' 
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10' 
                    : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    insight.priority === 'high'
                      ? 'bg-red-100 dark:bg-red-900/20'
                      : 'bg-yellow-100 dark:bg-yellow-900/20'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      insight.priority === 'high'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-start space-x-2">
            <Mail className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong className="text-blue-900 dark:text-blue-100">Ready to launch!</strong>
              <br />Your HomeOps dashboard will use these insights to keep you organized and never miss important communications.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsStep;