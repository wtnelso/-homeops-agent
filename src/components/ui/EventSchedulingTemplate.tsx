/**
 * Event Scheduling Template Component
 * Displays event scheduling responses with appropriate actions and status
 */

import React, { useState } from 'react';
import { Calendar, Clock, Users, CheckCircle, Send, ExternalLink } from 'lucide-react';
import { StructuredData } from '../../services/streamingChatService';
import { useToast } from '../../contexts/ToastContext';

interface EventSchedulingTemplateProps {
  data: StructuredData;
  onSendInvite?: (eventData: {
    eventId: string;
    title: string;
    startTime: string;
    endTime?: string;
    attendees: string[];
  }) => Promise<any>;
}

export const EventSchedulingTemplate: React.FC<EventSchedulingTemplateProps> = ({ data, onSendInvite }) => {
  const eventData = data.data.event_scheduling;
  const { showToast } = useToast();
  const [emailInput, setEmailInput] = useState(
    eventData.attendees?.map((a: any) => a.email).filter(Boolean).join(', ') || ''
  );
  const [isInviteSending, setIsInviteSending] = useState(false);
  const [isInviteCreated, setIsInviteCreated] = useState(false);
  const [eventHtmlLink, setEventHtmlLink] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState(
    eventData.event_title || data.title || ''
  );

  // State for selected date/time
  const [selectedDateTime, setSelectedDateTime] = useState<string | null>(
    eventData.start_time || null
  );
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(
    eventData.end_time || (eventData.start_time ? new Date(new Date(eventData.start_time).getTime() + 60 * 60 * 1000).toISOString() : null)
  );
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState('');
  const [pickerTime, setPickerTime] = useState('');
  const [pickerEndDate, setPickerEndDate] = useState('');
  const [pickerEndTime, setPickerEndTime] = useState('');

  // Function to open calendar picker with prepopulated values
  const openCalendarPicker = () => {
    // Prepopulate with current values or defaults
    const startDate = selectedDateTime ? new Date(selectedDateTime) : new Date();
    const endDate = selectedEndTime ? new Date(selectedEndTime) : new Date(startDate.getTime() + 60 * 60 * 1000);

    // Format for date inputs (YYYY-MM-DD)
    setPickerDate(startDate.toISOString().split('T')[0]);
    setPickerEndDate(endDate.toISOString().split('T')[0]);

    // Format for time inputs (HH:MM)
    setPickerTime(startDate.toTimeString().slice(0, 5));
    setPickerEndTime(endDate.toTimeString().slice(0, 5));

    setShowCalendarPicker(true);
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Time TBD';
    // Convert ISO string to user-friendly format
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };


  // Handle clicking on suggested time buttons
  const handleTimeSelection = (suggestion: any, time: string) => {
    // Create datetime string from suggestion date + selected time
    const date = new Date(suggestion.date);

    // Parse time like "10:00 AM" or "9:00 AM"
    const timeMatch = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) {
      console.error('Invalid time format:', time);
      return;
    }

    const [, hoursStr, minutesStr, period] = timeMatch;
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    let hour24 = hours;
    if (period.toUpperCase() === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period.toUpperCase() === 'AM' && hours === 12) {
      hour24 = 0;
    }

    date.setHours(hour24, minutes, 0, 0);
    const startTime = date.toISOString();
    const endTime = new Date(date.getTime() + 60 * 60 * 1000).toISOString(); // Default 1 hour duration

    console.log('Selected time:', startTime);
    setSelectedDateTime(startTime);
    setSelectedEndTime(endTime);
  };

  // Validate that end time is after start time
  const isEndTimeValid = () => {
    if (!pickerDate || !pickerTime) return true; // No validation if start time not set
    if (!pickerEndDate || !pickerEndTime) return true; // No validation if end time not set (will default)

    const startDateTime = new Date(`${pickerDate}T${pickerTime}:00`);
    const endDateTime = new Date(`${pickerEndDate}T${pickerEndTime}:00`);

    return endDateTime > startDateTime;
  };

  // Handle custom date/time selection from calendar picker
  const handleCustomTimeSelection = () => {
    if (pickerDate && pickerTime) {
      const startDateTime = new Date(`${pickerDate}T${pickerTime}:00`);
      const endDateTime = (pickerEndDate && pickerEndTime)
        ? new Date(`${pickerEndDate}T${pickerEndTime}:00`)
        : new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default 1 hour if no end time

      // Validate end time is after start time
      if (endDateTime <= startDateTime) {
        alert('End time must be after start time');
        return;
      }

      setSelectedDateTime(startDateTime.toISOString());
      setSelectedEndTime(endDateTime.toISOString());
      setShowCalendarPicker(false);
      setPickerDate('');
      setPickerTime('');
      setPickerEndDate('');
      setPickerEndTime('');
    }
  };

  const handleSendInvite = async () => {
    setIsInviteSending(true);
    try {
      const attendees = emailInput.split(',').map((email: string) => email.trim()).filter(Boolean);

      if (onSendInvite && selectedDateTime) {
        // selectedDateTime is now an ISO string, use directly
        const startTime = selectedDateTime;
        const endTime = new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

        const result = await onSendInvite({
          eventId: eventData.event_id,
          title: eventTitle,
          startTime,
          endTime: selectedEndTime || endTime,
          attendees
        });

        // Handle the response which should include htmlLink
        if (result && result.event && result.event.htmlLink) {
          setEventHtmlLink(result.event.htmlLink);
          setIsInviteCreated(true);
          showToast('Calendar invite sent successfully!', 'success');
        } else {
          setIsInviteCreated(true);
          showToast('Calendar invite sent successfully!', 'success');
        }
      }
    } catch (error) {
      console.error('Failed to send invite:', error);
      showToast('Failed to send invite. Please try again.', 'error');
    } finally {
      setIsInviteSending(false);
    }
  };

  // Show collapsed success state if invite is created
  if (isInviteCreated) {
    return (
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-full">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
            Calendar invite sent
          </span>
        </div>
        {eventHtmlLink && (
          <button
            onClick={() => window.open(eventHtmlLink, '_blank')}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0 ml-2"
            title="Open in Google Calendar"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="hidden sm:inline">View</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 max-w-full overflow-hidden">
      {/* Event Details */}
      <div className="space-y-3">
        {/* Event Title */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Event title"
            />
          </div>
        </div>

        {/* Time Information */}
        <div className="flex items-start gap-2">
          <button
            onClick={openCalendarPicker}
            className="mt-0.5"
          >
            <Clock className="h-4 w-4 text-blue-600 hover:text-blue-700 cursor-pointer transition-colors" />
          </button>
          <div className="flex-1 min-w-0">
            {selectedDateTime ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Start</span>
                  <button
                    onClick={openCalendarPicker}
                    className="text-gray-700 dark:text-gray-300 font-medium hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer underline decoration-transparent hover:decoration-current transition-all text-sm"
                  >
                    {formatTime(selectedDateTime)}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">End</span>
                  <button
                    onClick={openCalendarPicker}
                    className="text-gray-700 dark:text-gray-300 font-medium hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer underline decoration-transparent hover:decoration-current transition-all text-sm"
                  >
                    {selectedEndTime ? formatTime(selectedEndTime) : 'Set end time'}
                  </button>
                </div>
              </div>
            ) : eventData.start_time ? (
              <button
                onClick={openCalendarPicker}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer underline decoration-transparent hover:decoration-current transition-all"
              >
                {eventData.start_time}
              </button>
            ) : (
              <button
                onClick={openCalendarPicker}
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer underline decoration-transparent hover:decoration-current transition-all"
              >
                {eventData.timeframe || 'Click to set time'}
              </button>
            )}
          </div>
        </div>

        {/* Attendees */}
        {((eventData.attendees && eventData.attendees.length > 0) || eventData.start_time) && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <input
                type="email"
                placeholder="Enter email addresses (separate multiple with commas)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Time Suggestions */}
        {eventData.time_suggestions && eventData.time_suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Suggested Times ({eventData.time_suggestions.length})
              </h4>
            </div>
            <div className="space-y-3">
              {eventData.time_suggestions.map((suggestion: any, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-white dark:bg-gray-700/30 rounded border-l-4 border-blue-500 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 w-32 flex-shrink-0">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {suggestion.day}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(suggestion.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 flex-1 justify-start">
                      {suggestion.times.map((time: string, timeIndex: number) => (
                        <button
                          key={timeIndex}
                          onClick={() => handleTimeSelection(suggestion, time)}
                          className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-md text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors cursor-pointer border border-blue-200 dark:border-blue-700"
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Invite Button */}
        {selectedDateTime && (
          <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={handleSendInvite}
              disabled={isInviteSending}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {isInviteSending ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        )}

        {/* Calendar Picker Modal */}
        {showCalendarPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90vw]">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Select Date & Time</h3>

              <div className="space-y-6">
                {/* Start Date & Time */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Start</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={pickerDate}
                        onChange={(e) => setPickerDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={pickerTime}
                        onChange={(e) => setPickerTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* End Date & Time */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">End</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={pickerEndDate}
                        onChange={(e) => setPickerEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={pickerEndTime}
                        onChange={(e) => setPickerEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Validation Error */}
                {pickerDate && pickerTime && pickerEndDate && pickerEndTime && !isEndTimeValid() && (
                  <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>End time must be after start time</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCalendarPicker(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomTimeSelection}
                  disabled={!pickerDate || !pickerTime || !isEndTimeValid()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select Time
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EventSchedulingTemplate;