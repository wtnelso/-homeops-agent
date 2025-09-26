import React, { useState } from 'react';
import CalendarInviteMessage from './CalendarInviteMessage';
import { CalendarInviteData } from './CalendarInviteMessage';

const CalendarInviteDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [animateKey, setAnimateKey] = useState(0);

  const sampleCalendarData: CalendarInviteData = {
    title: "Family Dinner Planning",
    date: "2025-09-25T18:00:00.000Z",
    time: "6:00 PM - 8:00 PM",
    location: "Mario's Italian Restaurant",
    description: "Let's discuss the upcoming family vacation plans over dinner. Please bring any travel brochures or ideas you've been considering.",
    attendees: ["john@family.com", "jane@family.com", "kiddo@family.com"],
    meetingLink: "https://maps.google.com/mario-restaurant",
    duration: "2 hours"
  };

  const handleShowDemo = () => {
    setShowDemo(true);
    setAnimateKey(prev => prev + 1); // Trigger animation
  };

  if (!showDemo) {
    return (
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={handleShowDemo}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          📅 Demo Calendar Invite UI
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Calendar Invite Preview (Demo)
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnimateKey(prev => prev + 1)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
          >
            🎬 Replay Animation
          </button>
          <button
            onClick={() => setShowDemo(false)}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ✕ Close
          </button>
        </div>
      </div>

      <div className="flex gap-3 justify-start">
        {/* Assistant Avatar */}
        <div className="flex items-center justify-center w-8 h-8 bg-brand-100 dark:bg-brand-900/20 rounded-full border border-brand-200 dark:border-brand-700 flex-shrink-0">
          🤖
        </div>

        {/* Calendar Component */}
        <div className="w-full max-w-[90%]">
          <CalendarInviteMessage
            key={animateKey} // Force re-render to trigger animation
            inviteData={sampleCalendarData}
            onAccept={() => {
              console.log('Calendar invite accepted (demo)');
              alert('Calendar invite accepted! 🎉');
            }}
            onEdit={(updatedData) => {
              console.log('Calendar invite edited (demo):', updatedData);
              alert(`Event updated!\nTitle: ${updatedData.title}\nTime: ${updatedData.time}`);
            }}
            allowEditing={true}
          />
          <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
            Just now
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
          <strong>How it works:</strong> When the AI agent creates a calendar invite, it will send a message with
          <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-xs ml-1">metadata.type: 'calendar_invite'</code>
          and the calendar data in <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded text-xs">metadata.calendarData</code>.
        </p>
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>✨ New:</strong> Click the edit icon (✏️) in the header to modify event details! Users can now easily adjust time, location, and other details before accepting.
        </p>
      </div>
    </div>
  );
};

export default CalendarInviteDemo;