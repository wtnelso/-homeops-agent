import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Users, X, ExternalLink, Edit2, Save, Send } from 'lucide-react';

export interface CalendarInviteData {
  title: string;
  date: string; // ISO date string
  time: string; // e.g., "2:00 PM - 3:00 PM"
  location?: string;
  description?: string;
  attendees?: string[];
  meetingLink?: string;
  duration?: string; // e.g., "1 hour"
}

interface CalendarInviteMessageProps {
  inviteData: CalendarInviteData;
  onAccept?: () => void;
  onEdit?: (updatedData: CalendarInviteData) => void;
  showActions?: boolean;
  allowEditing?: boolean;
}

const CalendarInviteMessage: React.FC<CalendarInviteMessageProps> = ({
  inviteData,
  onAccept,
  onEdit,
  showActions = true,
  allowEditing = true
}) => {
  const [status, setStatus] = useState<'pending' | 'accepted' | 'declined' | 'sent'>('pending');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<CalendarInviteData>(inviteData);

  // Update edit data when props change
  React.useEffect(() => {
    setEditData(inviteData);
  }, [inviteData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAccept = () => {
    setStatus('sent');
    onAccept?.();
  };


  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onEdit?.(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(inviteData);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof CalendarInviteData, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className={`w-full max-w-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden transition-all duration-500 ${
      status === 'sent' ? 'animate-collapse opacity-60 scale-95' : 'animate-unfurl'
    }`}>
      {/* Header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium text-blue-900 dark:text-blue-100">
            {isEditing ? 'Edit Calendar Invite' : 'Calendar Invite'}
          </h3>
          {allowEditing && status === 'pending' && !isEditing && (
            <button
              onClick={handleEdit}
              className="ml-auto p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded text-blue-600 dark:text-blue-400 transition-colors"
              title="Edit event"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {status !== 'pending' && !isEditing && (
            <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
              status === 'sent'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                : status === 'accepted'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {status === 'sent' ? 'Sent!' : status === 'accepted' ? 'Accepted' : 'Declined'}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <>
            {/* Edit Form */}
            <div className="space-y-3">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editData.date.split('T')[0]}
                  onChange={(e) => handleInputChange('date', e.target.value + 'T' + editData.date.split('T')[1])}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="text"
                  value={editData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  placeholder="e.g. 3:00 PM - 5:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Meeting Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={editData.meetingLink || ''}
                  onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Display Mode - Compact Horizontal Layout */}
            <div className="space-y-3">
              {/* Title */}
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                {inviteData.title}
              </h4>

              {/* Main Details - Horizontal Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date & Time */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{formatDate(inviteData.date)}</div>
                    <div className="text-xs">{inviteData.time}</div>
                  </div>
                </div>

                {/* Location */}
                {inviteData.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{inviteData.location}</span>
                  </div>
                )}

                {/* Meeting Link */}
                {inviteData.meetingLink && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                    <a
                      href={inviteData.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                    >
                      Join Meeting
                    </a>
                  </div>
                )}
              </div>

              {/* Secondary Details Row */}
              <div className="flex flex-wrap gap-4 items-center">
                {/* Attendees */}
                {inviteData.attendees && inviteData.attendees.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{inviteData.attendees.length} attendee{inviteData.attendees.length > 1 ? 's' : ''}</span>
                    <span className="text-xs text-gray-500">({inviteData.attendees.slice(0, 2).join(', ')}{inviteData.attendees.length > 2 ? '...' : ''})</span>
                  </div>
                )}

                {/* Duration */}
                {inviteData.duration && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    • {inviteData.duration}
                  </div>
                )}
              </div>

              {/* Description */}
              {inviteData.description && (
                <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  {inviteData.description}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      {showActions && status === 'pending' && (
        <div className="px-4 pb-4 flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </>
          )}
        </div>
      )}

      {/* Status message for non-pending states */}
      {status !== 'pending' && (
        <div className={`px-4 pb-4 text-center text-sm ${
          status === 'sent'
            ? 'text-blue-600 dark:text-blue-400'
            : status === 'accepted'
            ? 'text-green-600 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {status === 'sent'
            ? '📧 Calendar invite sent successfully!'
            : status === 'accepted'
            ? '✓ You have accepted this invite'
            : '✗ You have declined this invite'
          }
        </div>
      )}
    </div>
  );
};

export default CalendarInviteMessage;