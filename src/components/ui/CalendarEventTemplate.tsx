/**
 * Calendar Event Template Component
 * Renders structured calendar and family activities data
 */

import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { StructuredData } from '../../services/streamingChatService';

interface CalendarEventTemplateProps {
  data: StructuredData;
}

interface CalendarEventData {
  id: string;
  title: string;
  start: string;
  end?: string;
  location?: string;
  allDay: boolean;
  attendees?: string[];
}

interface FamilyActivityData {
  id: string;
  name: string;
  type: string;
  schedule?: string;
  location?: string;
  days?: string[];
}

interface AllEvent extends Partial<CalendarEventData>, Partial<FamilyActivityData> {
  itemType: 'calendar' | 'activity';
  sortDate: Date;
  currentDay?: string;
}

export const CalendarEventTemplate: React.FC<CalendarEventTemplateProps> = ({ data }) => {
  const calendarData = data.data.calendar;
  const familyActivitiesData = data.data.family_activities;

  // Merge and sort all events chronologically
  const allEvents: AllEvent[] = [];

  // Add calendar events
  if (calendarData?.events) {
    calendarData.events.forEach((event: CalendarEventData) => {
      allEvents.push({
        ...event,
        itemType: 'calendar',
        sortDate: new Date(event.start)
      });
    });
  }

  // Add family activities - expand multi-day activities into separate entries
  if (familyActivitiesData?.activities) {
    // Extract date range from calendar data or parse from dateRange string
    let queryStartDate = null;
    let queryEndDate = null;

    if (calendarData?.dateRange) {
      // Parse date range from string like "Mon Oct 13 2025 to Sun Oct 19 2025"
      const dateRangeMatch = calendarData.dateRange.match(/(\w{3} \w{3} \d{2} \d{4}) to (\w{3} \w{3} \d{2} \d{4})/);
      if (dateRangeMatch) {
        queryStartDate = new Date(dateRangeMatch[1]);
        queryEndDate = new Date(dateRangeMatch[2]);
      }
    } else if (calendarData?.events && calendarData.events.length > 0) {
      // Fallback: use actual event dates
      const eventDates = calendarData.events.map((event: CalendarEventData) => new Date(event.start));
      queryStartDate = new Date(Math.min(...eventDates));
      queryEndDate = new Date(Math.max(...eventDates));
    }

    familyActivitiesData.activities.forEach((activity: FamilyActivityData) => {
      if (activity.days && activity.days.length > 0) {
        // Create separate entries for each day within the query range
        activity.days.forEach((day: string) => {
          const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);

          if (queryStartDate && queryEndDate) {
            // Find the first occurrence of this day within the query range
            let searchDate = new Date(queryStartDate);
            let foundDate = null;

            // Search through the query range to find the first matching day
            while (searchDate <= queryEndDate && !foundDate) {
              if (searchDate.getDay() === dayIndex) {
                foundDate = new Date(searchDate);
              } else {
                searchDate.setDate(searchDate.getDate() + 1);
              }
            }

            if (foundDate) {
              allEvents.push({
                ...activity,
                itemType: 'activity',
                sortDate: foundDate,
                currentDay: day
              });
            }
          } else {
            // Fallback if no calendar events - use current calculation
            const today = new Date();
            const currentDay = today.getDay();
            let daysBack = (currentDay - dayIndex + 7) % 7;
            if (daysBack === 0) daysBack = 7;

            const activityDate = new Date(today);
            activityDate.setDate(today.getDate() - daysBack);

            allEvents.push({
              ...activity,
              itemType: 'activity',
              sortDate: activityDate,
              currentDay: day
            });
          }
        });
      } else {
        // Activity without specific days - use middle of query range or current date
        const fallbackDate = queryStartDate && queryEndDate
          ? new Date((queryStartDate.getTime() + queryEndDate.getTime()) / 2)
          : new Date();

        allEvents.push({
          ...activity,
          itemType: 'activity',
          sortDate: fallbackDate
        });
      }
    });
  }

  // Sort all events by date
  allEvents.sort((a, b) => a.sortDate - b.sortDate);

  const formatEventTime = (start: string, end?: string, allDay: boolean = false) => {
    if (allDay) return 'All day';

    const startDate = new Date(start);
    const timeFormat: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };

    let timeStr = startDate.toLocaleTimeString('en-US', timeFormat);

    if (end) {
      const endDate = new Date(end);
      timeStr += ` - ${endDate.toLocaleTimeString('en-US', timeFormat)}`;
    }

    return timeStr;
  };

  const formatEventDate = (start: string) => {
    const date = new Date(start);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {data.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {calendarData?.dateRange}
        </p>
      </div>

      {/* All Events - Unified List */}
      {allEvents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Events & Activities ({allEvents.length})
            </h4>
          </div>

          <div className="space-y-2">
            {allEvents.map((item, index) => (
              <div
                key={item.id || index}
                className={`p-2.5 bg-white dark:bg-gray-700/30 rounded border-l-4 shadow-sm ${
                  item.itemType === 'calendar' ? 'border-blue-500' : 'border-green-500'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {item.title || item.name}
                    </h5>

                    {item.itemType === 'calendar' ? (
                      // Calendar event layout
                      <>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatEventDate(item.start)}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatEventTime(item.start, item.end, item.allDay)}</span>
                          </div>
                        </div>

                        {item.location && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      // Family activity layout
                      <>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-300">
                          <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-medium">
                            {item.type}
                          </span>

                          {item.schedule && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{item.schedule}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {item.currentDay ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatEventDate(item.sortDate.toISOString())}</span>
                            </div>
                          ) : item.days && item.days.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{item.days.join(', ')}</span>
                            </div>
                          ) : null}

                          {item.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{item.location}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {item.attendees && item.attendees.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                      <Users className="h-3 w-3" />
                      <span>{item.attendees.length}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {allEvents.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No events or activities found for this time period.</p>
        </div>
      )}
    </div>
  );
};

export default CalendarEventTemplate;