import React, { useState } from 'react';
import { Brain, CheckCircle } from 'lucide-react';
import { OnboardingData } from '../Onboarding';

interface CalibrationStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const CalibrationStep: React.FC<CalibrationStepProps> = ({ data, onUpdate, onNext }) => {
  const [currentEmail, setCurrentEmail] = useState(0);
  
  // Mock email data for calibration
  const mockEmails = [
    {
      id: '1',
      from: 'school@district.edu',
      subject: 'Parent-Teacher Conference Scheduling',
      snippet: 'Please schedule your conference for next week...',
      category: 'school'
    },
    {
      id: '2', 
      from: 'promotions@store.com',
      subject: '50% Off Sale - Limited Time!',
      snippet: 'Huge savings on everything in store...',
      category: 'commerce'
    }
  ];

  const handleClassification = (label: 'important' | 'noise' | 'later') => {
    // Handle email classification logic here
    if (currentEmail < mockEmails.length - 1) {
      setCurrentEmail(prev => prev + 1);
    } else {
      onUpdate({ calibrationComplete: true });
      // Don't auto-advance - let user click Continue button
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Calibrate Your Preferences
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Help us learn your preferences by classifying a few emails.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide">Progress</span>
            <span className="text-xs text-gray-400">{currentEmail + 1} of {mockEmails.length}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-green-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${((currentEmail + 1) / mockEmails.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Email Card */}
        {mockEmails[currentEmail] && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-3">
              <span className="text-xs text-gray-400 uppercase tracking-wide">From: {mockEmails[currentEmail].from}</span>
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
              {mockEmails[currentEmail].subject}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">
              {mockEmails[currentEmail].snippet}
            </p>
          </div>
        )}

        {/* Classification Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() => handleClassification('important')}
            className="group p-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <div className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">Important</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">High priority</div>
          </button>
          <button
            onClick={() => handleClassification('later')}
            className="group p-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <div className="text-amber-700 dark:text-amber-400 font-medium text-sm">Later</div>
            <div className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Review later</div>
          </button>
          <button
            onClick={() => handleClassification('noise')}
            className="group p-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <div className="text-gray-700 dark:text-gray-400 font-medium text-sm">Noise</div>
            <div className="text-xs text-gray-600 dark:text-gray-500 mt-0.5">Low priority</div>
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
              Your classifications help HomeOps learn your preferences for future email prioritization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalibrationStep;