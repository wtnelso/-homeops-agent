import React from 'react';
import { Settings, Mail, AlertTriangle, Package, GraduationCap, CreditCard } from 'lucide-react';
import { OnboardingData } from '../Onboarding';

interface EmailPoliciesStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const EmailPoliciesStep: React.FC<EmailPoliciesStepProps> = ({ data, onUpdate }) => {
  const updatePolicy = (key: keyof OnboardingData['emailPolicies'], value: boolean) => {
    onUpdate({
      emailPolicies: {
        ...data.emailPolicies,
        [key]: value
      }
    });
  };

  const policies = [
    {
      key: 'autoCollapsePromotions' as const,
      title: 'Auto-collapse Promotions',
      description: 'Automatically minimize promotional emails and newsletters',
      icon: Mail,
      color: 'blue'
    },
    {
      key: 'highlightSchoolBills' as const,
      title: 'Highlight School & Bills', 
      description: 'Surface school communications and bill notifications',
      icon: GraduationCap,
      color: 'green'
    },
    {
      key: 'surfaceShipments' as const,
      title: 'Surface Shipments',
      description: 'Show package tracking and delivery notifications prominently',
      icon: Package,
      color: 'purple'
    },
    {
      key: 'alertBillsDue' as const,
      title: 'Bills Due Soon Alert',
      description: 'Get notified when bills are due within 7 days',
      icon: CreditCard,
      color: 'red'
    },
    {
      key: 'alertSchoolForms' as const,
      title: 'School Forms Alert',
      description: 'Alert when school forms need attention',
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      key: 'alertOrderDelays' as const,
      title: 'Order Delays Alert',
      description: 'Notify when shipments are delayed or have issues',
      icon: Package,
      color: 'orange'
    }
  ];

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configure Email Intelligence
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Customize how HomeOps processes and prioritizes your emails.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {policies.map((policy) => {
            const Icon = policy.icon;
            const isEnabled = data.emailPolicies[policy.key];
            
            return (
              <div
                key={policy.key}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`
                      w-10 h-10 rounded-lg flex items-center justify-center
                      ${isEnabled
                        ? `bg-${policy.color}-100 dark:bg-${policy.color}-900/20`
                        : 'bg-gray-100 dark:bg-gray-700'
                      }
                    `}>
                      <Icon className={`
                        w-5 h-5
                        ${isEnabled
                          ? `text-${policy.color}-600 dark:text-${policy.color}-400`
                          : 'text-gray-400'
                        }
                      `} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {policy.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {policy.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePolicy(policy.key, !isEnabled)}
                    className={`
                      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      ${isEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}
                    `}
                  >
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                        ${isEnabled ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-xl p-6 border border-indigo-200/50 dark:border-indigo-800/50">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            How it works
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• HomeOps analyzes your emails using AI to detect patterns</li>
            <li>• Policies are applied in real-time as new emails arrive</li>
            <li>• You'll see "Why this surfaced" explanations for each insight</li>
            <li>• All settings can be adjusted anytime in your preferences</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmailPoliciesStep;