import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  date: Date;
  time?: string;
  description?: string;
}

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([
    {
      id: '1',
      title: 'Family Dinner',
      date: new Date(2025, 8, 15, 18, 0),
      time: '6:00 PM',
      description: 'Weekly family dinner'
    },
    {
      id: '2',
      title: 'Doctor Appointment',
      date: new Date(2025, 8, 20, 10, 30),
      time: '10:30 AM',
      description: 'Annual checkup'
    }
  ]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-7 gap-4">
          {/* Days of week header */}
          {daysOfWeek.map(day => (
            <div key={day} className="text-center py-2 font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map((date, index) => (
            <div
              key={index}
              className={`min-h-[120px] p-2 border border-gray-200 dark:border-gray-700 rounded-lg ${
                date ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700' : 'bg-gray-50 dark:bg-gray-900'
              } ${date && isToday(date) ? 'ring-2 ring-brand-500' : ''}`}
            >
              {date && (
                <>
                  <div className={`text-sm font-medium ${
                    isToday(date) 
                      ? 'text-brand-600 dark:text-brand-400' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="mt-1 space-y-1">
                    {getEventsForDate(date).map(event => (
                      <div
                        key={event.id}
                        className="text-xs bg-brand-100 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 px-2 py-1 rounded truncate"
                        title={`${event.title}${event.time ? ` - ${event.time}` : ''}`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;