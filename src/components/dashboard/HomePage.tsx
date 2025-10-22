import React from 'react';
import ChatInterface from '../ui/ChatInterface';

const HomePage: React.FC = () => {

  const initialPrompts = [
    'What\'s on my kid\'s schedule next week?',
    'What\'s going on this week?',
    'What are the upcoming school events I need to know about?',
    'Are there any important appointments coming up?',
    'Help me organize my family calendar',
    'What activities does my child have this week?',
    'Do I need to coordinate any pickups or dropoffs?',
    'Are there any travel plans I should know about?'
  ];

  return (
    <div className="h-full w-full bg-white dark:bg-gray-900 overflow-hidden">
      {/* Full-width chat interface with embedded suggestions */}
      <ChatInterface
        showConversationList={false}
        initialPrompts={initialPrompts}
        className="h-full w-full"
        triggerMessage={null}
      />
    </div>
  );
};

export default HomePage;