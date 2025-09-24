import React from 'react';
import ChatInterface from '../ui/ChatInterface';
import ReviewStream from '../ui/ReviewStream';

const HomePage: React.FC = () => {

  const initialPrompts = [
    'What\'s on my kid\'s schedule next week?',
    'Do I have any bills due soon?',
    'What are the upcoming school events I need to know about?',
    'Are there any important appointments coming up?',
    'Help me organize my family calendar',
    'What activities does my child have this week?',
    'Do I need to coordinate any pickups or dropoffs?',
    'Are there any travel plans I should know about?'
  ];

  return (
    <div className="h-full bg-white dark:bg-gray-900 flex flex-col lg:flex-row overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 min-w-0 min-h-0">
        <ChatInterface
          showConversationList={false}
          initialPrompts={initialPrompts}
          className="h-full"
          triggerMessage={null}
        />
      </div>

      {/* Right sidebar for suggestions - responsive */}
      <div className="w-full lg:w-96 xl:w-[28rem] 2xl:w-[32rem] border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col max-h-96 lg:max-h-none" style={{height: '85vh'}}>
        <div className="flex-1 overflow-y-auto">
          <ReviewStream className="h-full" />
        </div>
      </div>
    </div>
  );
};

export default HomePage;