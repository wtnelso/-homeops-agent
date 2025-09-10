import React, { useState } from 'react';
import { Clock, Zap, Tag, Plus, X } from 'lucide-react';
import { OnboardingData } from '../Onboarding';
import { HOUSEHOLD_TYPES } from '../../config/constants';
import TimezoneSelect from '../ui/TimezoneSelect';

const WelcomeStep: React.FC<WelcomeStepProps> = ({ data, onUpdate, onNext }) => {
  const [newKeyword, setNewKeyword] = useState('');

  const handleNext = () => {
    const keywords = data.importantKeywords || [];
    if (data.name && data.timezone && data.householdType && keywords.length > 0) {
      onNext();
    }
  };

  const addKeyword = () => {
    const trimmed = newKeyword.trim();
    const keywords = data.importantKeywords || [];
    if (trimmed && !keywords.includes(trimmed)) {
      onUpdate({ 
        importantKeywords: [...keywords, trimmed] 
      });
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword: string) => {
    const keywords = data.importantKeywords || [];
    onUpdate({ 
      importantKeywords: keywords.filter(k => k !== keyword) 
    });
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="max-w-2xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Welcome to HomeOps!
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Let's set up your AI-powered family operations center. This will take about 5 minutes.
          </p>
        </div>

        <div className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              What should we call you?
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Enter your name"
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 text-sm"
            />
          </div>

          {/* Timezone Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              <Clock className="w-3 h-3 inline mr-1" />
              Your timezone
            </label>
            <TimezoneSelect
              value={data.timezone}
              onChange={(value) => onUpdate({ timezone: value })}
              placeholder="Select your timezone"
            />
          </div>

          {/* Household Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              What type of household are you managing?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {HOUSEHOLD_TYPES.map(type => {
                const Icon = type.icon;
                const isSelected = data.householdType === type.id;
                
                return (
                  <button
                    key={type.id}
                    onClick={() => onUpdate({ householdType: type.id as OnboardingData['householdType'] })}
                    className={`
                      p-3 rounded-lg border text-left transition-all duration-200 hover:scale-105
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center
                        ${isSelected
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`
                          font-medium text-sm
                          ${isSelected
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-gray-900 dark:text-white'
                          }
                        `}>
                          {type.label}
                        </h3>
                        <p className={`
                          text-xs truncate
                          ${isSelected
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-500 dark:text-gray-400'
                          }
                        `}>
                          {type.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Important Keywords/Phrases */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">
              <Tag className="w-3 h-3 inline mr-1" />
              Important Keywords & Phrases
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Add keywords or phrases that are important to track in your emails (e.g., "Woods Academy", "country club", "sports practice")
            </p>
            
            {/* Tag Input */}
            <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200">
              {/* Existing Tags */}
              {data.importantKeywords?.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full border border-blue-200 dark:border-blue-800"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              
              {/* Input for new tags */}
              <div className="flex items-center gap-2 flex-1 min-w-[120px]">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={handleKeywordKeyPress}
                  placeholder={(data.importantKeywords?.length || 0) === 0 ? "Type and press Enter to add..." : "Add another..."}
                  className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
                />
                {newKeyword.trim() && (
                  <button
                    onClick={addKeyword}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Helper text */}
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {(data.importantKeywords?.length || 0) === 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  Add at least one keyword to continue
                </span>
              )}
              {(data.importantKeywords?.length || 0) > 0 && (
                <span>
                  {data.importantKeywords?.length || 0} keyword{(data.importantKeywords?.length || 0) !== 1 ? 's' : ''} added
                </span>
              )}
            </div>
          </div>

          {/* Next Steps Preview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-lg p-4 border border-blue-100 dark:border-blue-800/50">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
              What happens next?
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                Connect your Gmail for intelligent email processing
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                Calibrate your preferences with a quick email triage
              </li>
              <li className="flex items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                Configure your AI assistant's personality
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WelcomeStep;