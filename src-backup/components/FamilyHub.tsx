import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  AlertTriangle,
  Clock,
  MapPin,
  Heart,
  TrendingUp
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  type: 'family' | 'work' | 'school' | 'health' | 'social';
  priority: 'high' | 'medium' | 'low';
}

interface EmotionalLoad {
  level: number;
  description: string;
  factors: string[];
}

const FamilyHub: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [emotionalLoad, setEmotionalLoad] = useState<EmotionalLoad>({
    level: 2,
    description: 'Light load',
    factors: []
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadCalendarEvents = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/calendar-events/family@homeops.com');
      const data = await response.json();
      if (data.success && data.events) {
        setEvents(data.events);
      } else {
        // Mock data for demonstration
        setEvents([
          {
            id: '1',
            title: 'Soccer Practice',
            date: 'Today',
            time: '4:00 PM',
            location: 'Community Park',
            type: 'family',
            priority: 'medium'
          },
          {
            id: '2',
            title: 'Parent-Teacher Conference',
            date: 'Tomorrow',
            time: '2:30 PM',
            location: 'Lincoln Elementary',
            type: 'school',
            priority: 'high'
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load calendar events:', error);
    }
    setIsLoading(false);
  };

  const loadEmotionalForecast = async () => {
    try {
      const response = await fetch('/api/emotional-load-forecast/family@homeops.com');
      const data = await response.json();
      if (data.success && data.forecast) {
        setEmotionalLoad(data.forecast.today);
      }
    } catch (error) {
      console.error('Failed to load emotional forecast:', error);
    }
  };

  useEffect(() => {
    loadCalendarEvents();
    loadEmotionalForecast();
  }, []);

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'family': return <Users size={14} />;
      case 'school': return <Calendar size={14} />;
      case 'health': return <Heart size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'rgba(239, 68, 68, 0.3)';
      case 'medium': return 'rgba(251, 191, 36, 0.3)';
      case 'low': return 'rgba(34, 197, 94, 0.3)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  };

  const getLoadLevelColor = (level: number) => {
    if (level <= 2) return '#10b981'; // Green
    if (level <= 3) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="family-hub">
      {/* Family Status Overview */}
      <div className="family-status-card">
        <div className="status-header">
          <div className="status-title">
            <Users className="status-icon" />
            <span>Family Operations Status</span>
          </div>
          <div className="sync-indicator" />
        </div>
        
        <div className="overview-grid">
          <div className="overview-item">
            <Calendar size={20} />
            <div className="overview-content">
              <div className="overview-value">{events.length}</div>
              <div className="overview-label">Today's Events</div>
            </div>
          </div>
          
          <div className="overview-item">
            <AlertTriangle size={20} />
            <div className="overview-content">
              <div className="overview-value">
                {events.filter(e => e.priority === 'high').length}
              </div>
              <div className="overview-label">High Priority</div>
            </div>
          </div>
          
          <div className="overview-item">
            <TrendingUp size={20} />
            <div className="overview-content">
              <div 
                className="overview-value"
                style={{ color: getLoadLevelColor(emotionalLoad.level) }}
              >
                {emotionalLoad.level}/5
              </div>
              <div className="overview-label">Mental Load</div>
            </div>
          </div>
        </div>
      </div>

      {/* Emotional Load Forecast */}
      <div className="emotional-load-card">
        <div className="section-title">
          <Heart size={20} />
          <span>Today's Emotional Load</span>
        </div>
        
        <div className="load-indicator">
          <div className="load-level">
            <div className="load-dots">
              {[1, 2, 3, 4, 5].map((dot) => (
                <div
                  key={dot}
                  className={`load-dot ${dot <= emotionalLoad.level ? 'active' : ''}`}
                  style={{
                    backgroundColor: dot <= emotionalLoad.level 
                      ? getLoadLevelColor(emotionalLoad.level)
                      : 'rgba(255, 255, 255, 0.2)'
                  }}
                />
              ))}
            </div>
            <div className="load-description">{emotionalLoad.description}</div>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="schedule-section">
        <div className="section-title">
          <Calendar size={20} />
          <span>Today's Schedule</span>
        </div>

        {isLoading ? (
          <div className="loading-events">
            <div className="typing-dots">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <div>Loading family events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="no-events-placeholder">
            <Calendar size={48} />
            <div className="placeholder-title">No Events Today</div>
            <div className="placeholder-subtitle">
              Your family calendar is clear. Perfect time to relax or plan something fun!
            </div>
          </div>
        ) : (
          <div className="event-list">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="event-card"
                style={{ 
                  borderLeft: `4px solid ${getPriorityColor(event.priority).replace('0.3', '0.8')}` 
                }}
              >
                <div className="event-header">
                  <div className="event-type">
                    {getEventTypeIcon(event.type)}
                  </div>
                  <div className="event-time">{event.time}</div>
                </div>
                
                <div className="event-content">
                  <div className="event-title">{event.title}</div>
                  {event.location && (
                    <div className="event-location">
                      <MapPin size={12} />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
                
                <div className={`priority-badge priority-${event.priority}`}>
                  {event.priority}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="action-button primary"
          onClick={loadCalendarEvents}
        >
          <Calendar size={18} />
          <span>Refresh Calendar</span>
        </button>
        
        <button 
          className="action-button secondary"
          onClick={loadEmotionalForecast}
        >
          <TrendingUp size={18} />
          <span>Update Load Forecast</span>
        </button>
      </div>
    </div>
  );
};

export default FamilyHub;