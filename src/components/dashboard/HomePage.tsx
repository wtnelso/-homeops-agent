import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import ChatInterface from '../ui/ChatInterface';

const HomePage: React.FC = () => {
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);

  const predefinedPrompts = [
    {
      id: '1',
      text: 'Summarize my upcoming week',
      category: 'Family Operations'
    },
    {
      id: '2', 
      text: 'Help me plan dinner for the family this week',
      category: 'Meal Planning'
    },
    {
      id: '3',
      text: 'What are the upcoming school events I need to know about?',
      category: 'School & Kids'
    },
    {
      id: '4',
      text: 'Create a grocery list for this week\'s meals',
      category: 'Shopping'
    },
    {
      id: '5',
      text: 'Help me organize my family calendar',
      category: 'Calendar Management'
    },
    {
      id: '6',
      text: 'Draft a message to coordinate with other parents',
      category: 'Communication'
    }
  ];

  // Extract just the text for the ChatInterface
  const initialPrompts = predefinedPrompts.map(prompt => prompt.text);

  // Handle prompt selection
  const handlePromptClick = (promptText: string) => {
    setTriggerMessage(promptText);
    // Reset after a brief delay to allow ChatInterface to pick it up
    setTimeout(() => setTriggerMessage(null), 100);
  };

  return (
    <div className="h-full flex gap-6 p-6 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Predefined Prompts Sidebar */}
      <div className="w-80 flex-shrink-0">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Quick Prompts</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Click on any prompt to get started
            </p>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {predefinedPrompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => handlePromptClick(prompt.text)}
                  className="w-full p-3 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-brand-600 dark:text-brand-400 uppercase tracking-wide">
                      {prompt.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {prompt.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 min-w-0">
        <ChatInterface 
          showConversationList={false}
          initialPrompts={initialPrompts}
          className="h-full"
          triggerMessage={triggerMessage}
        />
      </div>
    </div>
  );
};

export default HomePage;