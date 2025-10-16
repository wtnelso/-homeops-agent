/**
 * Default Prompts Component
 * Renders the initial conversation starter prompts with animations
 */

import React, { useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';

interface DefaultPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  onSuggestionsClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  suggestionsCount?: number | null;
  loadingCount?: boolean;
  showAnimated?: boolean;
  animationDelay?: number;
}

const DefaultPrompts: React.FC<DefaultPromptsProps> = ({
  prompts,
  onPromptClick,
  onSuggestionsClick,
  loading = false,
  disabled = false,
  suggestionsCount = null,
  loadingCount = false,
  showAnimated = false,
  animationDelay = 0
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePromptClick = (prompt: string) => {
    if (loading || disabled) return;

    // Trigger animation
    setIsAnimating(true);

    // Slight delay for visual feedback, then execute
    setTimeout(() => {
      onPromptClick(prompt);
    }, animationDelay);
  };

  const handleSuggestionsClick = () => {
    if (loading || disabled) return;
    onSuggestionsClick();
  };

  // If showing animated version (during transitions)
  if (showAnimated) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Review Suggestions Button Animation */}
        <div
          className="absolute"
          style={{
            left: '25%',
            top: '60%',
            transform: 'translate(-50%, -50%)',
            animation: 'flyToHeader1 0.6s ease-out forwards'
          }}
        >
          <button className="p-4 text-left bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-600 ease-out">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Brain className="w-5 h-5 text-blue-600" />
                {suggestionsCount !== null && suggestionsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {suggestionsCount > 9 ? '9+' : suggestionsCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-gray-900 font-medium text-sm">Review Profile Suggestions</p>
                <p className="text-gray-500 text-xs">AI found updates for your family profile</p>
              </div>
            </div>
          </button>
        </div>

        {/* Other Prompts Animation */}
        {prompts.slice(1, 4).map((prompt, index) => (
          <div
            key={index + 1}
            className="absolute"
            style={{
              left: index === 0 ? '75%' : index === 1 ? '25%' : '75%',
              top: index === 0 ? '60%' : index === 1 ? '75%' : '75%',
              transform: 'translate(-50%, -50%)',
              animation: `flyToHeader${index + 2} 0.6s ease-out forwards`
            }}
          >
            <button className="p-4 text-left bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-600 ease-out">
              <p className="text-gray-700 text-sm leading-relaxed">{prompt}</p>
            </button>
          </div>
        ))}
      </div>
    );
  }

  // Regular static display
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-full px-2 sm:px-0">
      {/* Review Profile Suggestions - replaces first prompt */}
      <button
        onClick={handleSuggestionsClick}
        disabled={loading || disabled}
        className={`p-4 text-left bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative ${
          isAnimating ? 'animate-pulse' : ''
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <Brain className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
            {/* Notification Badge */}
            {suggestionsCount !== null && suggestionsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse">
                {suggestionsCount > 9 ? '9+' : suggestionsCount}
              </span>
            )}
            {/* Loading Spinner */}
            {loadingCount && (
              <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full h-5 w-5 flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 group-hover:text-gray-800 font-medium text-sm transition-colors">
              Review Profile Suggestions
            </p>
            <p className="text-gray-500 group-hover:text-gray-600 text-xs transition-colors truncate">
              {loadingCount
                ? 'Checking for updates...'
                : suggestionsCount === null
                  ? 'AI found updates for your family profile'
                  : suggestionsCount > 0
                    ? `${suggestionsCount} suggestion${suggestionsCount === 1 ? '' : 's'} waiting`
                    : 'All caught up!'
              }
            </p>
          </div>
        </div>

        {/* Visual Enhancement */}
        <div className="flex items-center gap-1 text-blue-600 group-hover:text-blue-700 transition-colors">
          <Sparkles className="w-3 h-3" />
          <span className="text-xs font-medium">Smart Review</span>
        </div>
      </button>

      {/* Remaining 3 prompts */}
      {prompts.slice(1, 4).map((prompt, index) => (
        <button
          key={index + 1}
          onClick={() => handlePromptClick(prompt)}
          disabled={loading || disabled}
          className={`p-4 text-left bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${
            isAnimating ? 'animate-pulse' : ''
          }`}
        >
          <p className="text-gray-700 text-sm leading-relaxed group-hover:text-gray-900 transition-colors">
            {prompt}
          </p>
        </button>
      ))}
    </div>
  );
};

export default DefaultPrompts;