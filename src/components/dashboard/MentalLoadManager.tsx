import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Target, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: 'appointment' | 'deadline' | 'reminder' | 'event';
  priority: 'low' | 'medium' | 'high';
  mentalLoad: number; // 1-10 scale
}

interface MentalLoadSignal {
  id: string;
  type: 'overwhelm' | 'stress' | 'fatigue' | 'anxiety' | 'excitement' | 'calm';
  intensity: number; // 1-10 scale
  timestamp: Date;
  source: 'calendar' | 'email' | 'memory' | 'user';
  description: string;
  actionable: boolean;
}

const MentalLoadManager: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [signals, setSignals] = useState<MentalLoadSignal[]>([]);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    type: 'event' as const,
    priority: 'medium' as const,
    mentalLoad: 5
  });

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          console.log('No session available, using sample data');
          loadSampleData();
          return;
        }

        // Fetch calendar events
        const eventsResponse = await fetch('http://localhost:10000/api/mental-load/calendar', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json();
          if (eventsData.success) {
            setEvents(eventsData.data.events.map((event: any) => ({
              ...event,
              date: new Date(event.date)
            })));
          }
        }

        // Fetch mental load signals
        const signalsResponse = await fetch('http://localhost:10000/api/mental-load/signals', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (signalsResponse.ok) {
          const signalsData = await signalsResponse.json();
          if (signalsData.success) {
            setSignals(signalsData.data.signals.map((signal: any) => ({
              ...signal,
              timestamp: new Date(signal.timestamp)
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching mental load data:', error);
        loadSampleData();
      }
    };

    const loadSampleData = () => {
      const sampleEvents: CalendarEvent[] = [
        {
          id: 'event-1',
          title: 'Doctor Appointment',
          date: new Date(2024, 11, 20, 10, 0),
          time: '10:00 AM',
          type: 'appointment',
          priority: 'high',
          mentalLoad: 7
        },
        {
          id: 'event-2',
          title: 'Project Deadline',
          date: new Date(2024, 11, 25, 17, 0),
          time: '5:00 PM',
          type: 'deadline',
          priority: 'high',
          mentalLoad: 9
        },
        {
          id: 'event-3',
          title: 'School Event',
          date: new Date(2024, 11, 22, 18, 0),
          time: '6:00 PM',
          type: 'event',
          priority: 'medium',
          mentalLoad: 4
        }
      ];

      const sampleSignals: MentalLoadSignal[] = [
        {
          id: 'signal-1',
          type: 'overwhelm',
          intensity: 8,
          timestamp: new Date(),
          source: 'calendar',
          description: 'Multiple high-priority deadlines this week',
          actionable: true
        },
        {
          id: 'signal-2',
          type: 'stress',
          intensity: 6,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          source: 'email',
          description: 'Urgent emails requiring immediate response',
          actionable: true
        },
        {
          id: 'signal-3',
          type: 'calm',
          intensity: 3,
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          source: 'memory',
          description: 'Completed important task ahead of schedule',
          actionable: false
        }
      ];

      setEvents(sampleEvents);
      setSignals(sampleSignals);
    };

    fetchData();
  }, []);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleAddEvent = () => {
    setShowAddEventModal(true);
  };

  const handleSaveEvent = () => {
    if (!newEvent.title || !newEvent.date) return;

    const event: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: newEvent.title,
      date: new Date(newEvent.date),
      time: newEvent.time,
      type: newEvent.type,
      priority: newEvent.priority,
      mentalLoad: newEvent.mentalLoad
    };

    setEvents(prev => [...prev, event]);
    setShowAddEventModal(false);
    setNewEvent({
      title: '',
      date: '',
      time: '',
      type: 'event',
      priority: 'medium',
      mentalLoad: 5
    });
  };

  const handleCancelEvent = () => {
    setShowAddEventModal(false);
    setNewEvent({
      title: '',
      date: '',
      time: '',
      type: 'event',
      priority: 'medium',
      mentalLoad: 5
    });
  };

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
    
    // Add days of the month
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

  const getMentalLoadColor = (load: number) => {
    if (load <= 3) return 'bg-green-100 text-green-800';
    if (load <= 6) return 'bg-yellow-100 text-yellow-800';
    if (load <= 8) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getSignalColor = (type: string) => {
    const colors = {
      overwhelm: 'bg-red-100 text-red-800',
      stress: 'bg-orange-100 text-orange-800',
      fatigue: 'bg-yellow-100 text-yellow-800',
      anxiety: 'bg-purple-100 text-purple-800',
      excitement: 'bg-blue-100 text-blue-800',
      calm: 'bg-green-100 text-green-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Mental Load Manager
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Track your mental load with calendar events and AI-powered signals
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => navigateMonth('prev')}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={() => navigateMonth('next')}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={handleAddEvent}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Event
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {dayNames.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
                {days.map((day, index) => {
                  if (!day) {
                    return <div key={index} className="h-20"></div>;
                  }
                  
                  const dayEvents = getEventsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate?.toDateString() === day.toDateString();
                  
                  return (
                    <div
                      key={day.getDate()}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        h-20 p-2 border border-gray-200 dark:border-gray-700 cursor-pointer
                        hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                        ${isToday ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' : ''}
                        ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                          {day.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <div className="flex gap-1">
                            {dayEvents.slice(0, 2).map(event => (
                              <div
                                key={event.id}
                                className={`w-2 h-2 rounded-full ${getMentalLoadColor(event.mentalLoad)}`}
                                title={`${event.title} (Load: ${event.mentalLoad}/10)`}
                              />
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="w-2 h-2 rounded-full bg-gray-400" title={`+${dayEvents.length - 2} more events`} />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${getMentalLoadColor(event.mentalLoad)}`}
                            title={event.title}
                          >
                            {event.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Mental Load Signals */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Mental Load Signals
                </h3>
              </div>

              <div className="space-y-4">
                {signals.map(signal => (
                  <div
                    key={signal.id}
                    className={`p-4 rounded-lg border ${getSignalColor(signal.type)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">
                          {signal.type}
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < Math.ceil(signal.intensity / 2) ? 'bg-current' : 'bg-current/30'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs opacity-75">
                        {signal.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm opacity-90 mb-2">
                      {signal.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs opacity-75 capitalize">
                        Source: {signal.source}
                      </span>
                      {signal.actionable && (
                        <button className="text-xs font-medium underline hover:no-underline">
                          Take Action
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Quick Stats
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {events.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Total Events
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {signals.filter(s => s.actionable).length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Actionable Signals
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Event Modal */}
        {showAddEventModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Add New Event
                  </h3>
                  <button
                    onClick={handleCancelEvent}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Time (optional)
                    </label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Type
                      </label>
                      <select
                        value={newEvent.type}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="event">Event</option>
                        <option value="appointment">Appointment</option>
                        <option value="deadline">Deadline</option>
                        <option value="reminder">Reminder</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={newEvent.priority}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mental Load (1-10)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newEvent.mentalLoad}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, mentalLoad: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {newEvent.mentalLoad}/10
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleCancelEvent}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEvent}
                    disabled={!newEvent.title || !newEvent.date}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentalLoadManager;
