import React, { useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';

interface DefaultPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
  onSuggestionsClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  suggestionsCount?: number | null;
  loadingCount?: boolean;
}

const DefaultPrompts: React.FC<DefaultPromptsProps> = ({
  prompts,
  onPromptClick,
  onSuggestionsClick,
  loading = false,
  disabled = false,
  suggestionsCount = null,
  loadingCount = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handlePromptClick = (prompt: string) => {
    if (loading || disabled) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      onPromptClick(prompt);
      setIsAnimating(false);
    }, 200);
  };

  const handleSuggestionsClick = () => {
    if (loading || disabled || !onSuggestionsClick) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      onSuggestionsClick();
      setIsAnimating(false);
    }, 200);
  };

  // Determine if we should show the suggestions button
  const showSuggestionsButton = (suggestionsCount !== null && suggestionsCount > 0) || loadingCount;
  
  // Calculate how many prompts to show (4 if no suggestions, 3 if showing suggestions button)
  const promptsToShow = showSuggestionsButton ? prompts.slice(1, 4) : prompts.slice(0, 4);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-full px-2 sm:px-0">
      {/* Show Profile Suggestions button if there are suggestions or loading */}
      {showSuggestionsButton && (
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
      )}

      {/* Show regular prompts */}
      {promptsToShow.map((prompt, index) => (
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