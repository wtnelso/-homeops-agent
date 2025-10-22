import { createClient } from '@supabase/supabase-js';

interface MentalLoadSignal {
  id: string;
  type: 'overwhelm' | 'stress' | 'fatigue' | 'anxiety' | 'excitement' | 'calm';
  intensity: number; // 1-10 scale
  timestamp: Date;
  source: 'calendar' | 'email' | 'memory' | 'user';
  description: string;
  actionable: boolean;
  userId: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: 'appointment' | 'deadline' | 'reminder' | 'event';
  priority: 'low' | 'medium' | 'high';
  mentalLoad: number; // 1-10 scale
  userId: string;
}

class MentalLoadService {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Analyze calendar events and generate mental load signals
   */
  async analyzeCalendarForSignals(userId: string): Promise<MentalLoadSignal[]> {
    try {
      // Get events from the next 7 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      // Query agent memory for calendar-related events
      const { data: memories, error } = await this.supabase
        .from('agent_memory')
        .select('*')
        .eq('user_id', userId)
        .eq('memory_type', 'calendar')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) {
        console.error('Error fetching calendar memories:', error);
        return [];
      }

      const signals: MentalLoadSignal[] = [];

      // Analyze event density
      const eventCount = memories?.length || 0;
      if (eventCount > 5) {
        signals.push({
          id: `density-${Date.now()}`,
          type: 'overwhelm',
          intensity: Math.min(10, eventCount * 1.5),
          timestamp: new Date(),
          source: 'calendar',
          description: `High event density: ${eventCount} events in the next 7 days`,
          actionable: true,
          userId
        });
      }

      // Analyze high-priority events
      const highPriorityEvents = memories?.filter(memory => {
        const value = typeof memory.value === 'string' ? JSON.parse(memory.value) : memory.value;
        return value?.priority === 'high' || value?.mentalLoad > 7;
      }) || [];

      if (highPriorityEvents.length > 2) {
        signals.push({
          id: `priority-${Date.now()}`,
          type: 'stress',
          intensity: 8,
          timestamp: new Date(),
          source: 'calendar',
          description: `Multiple high-priority events: ${highPriorityEvents.length} urgent items`,
          actionable: true,
          userId
        });
      }

      // Analyze deadline clustering
      const deadlines = memories?.filter(memory => {
        const value = typeof memory.value === 'string' ? JSON.parse(memory.value) : memory.value;
        return value?.type === 'deadline';
      }) || [];

      if (deadlines.length > 1) {
        signals.push({
          id: `deadlines-${Date.now()}`,
          type: 'anxiety',
          intensity: 7,
          timestamp: new Date(),
          source: 'calendar',
          description: `Multiple deadlines approaching: ${deadlines.length} due soon`,
          actionable: true,
          userId
        });
      }

      return signals;
    } catch (error) {
      console.error('Error analyzing calendar for signals:', error);
      return [];
    }
  }

  /**
   * Analyze email patterns for mental load signals
   */
  async analyzeEmailForSignals(userId: string): Promise<MentalLoadSignal[]> {
    try {
      // Get recent email memories
      const { data: memories, error } = await this.supabase
        .from('agent_memory')
        .select('*')
        .eq('user_id', userId)
        .eq('memory_type', 'email')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) {
        console.error('Error fetching email memories:', error);
        return [];
      }

      const signals: MentalLoadSignal[] = [];

      // Analyze urgent email patterns
      const urgentEmails = memories?.filter(memory => {
        const value = typeof memory.value === 'string' ? JSON.parse(memory.value) : memory.value;
        return value?.urgency === 'high' || value?.requires_immediate_response === true;
      }) || [];

      if (urgentEmails.length > 3) {
        signals.push({
          id: `urgent-emails-${Date.now()}`,
          type: 'stress',
          intensity: 6,
          timestamp: new Date(),
          source: 'email',
          description: `High volume of urgent emails: ${urgentEmails.length} requiring immediate attention`,
          actionable: true,
          userId
        });
      }

      // Analyze email volume
      const emailCount = memories?.length || 0;
      if (emailCount > 20) {
        signals.push({
          id: `email-volume-${Date.now()}`,
          type: 'overwhelm',
          intensity: Math.min(10, emailCount / 3),
          timestamp: new Date(),
          source: 'email',
          description: `High email volume: ${emailCount} emails in the last 24 hours`,
          actionable: true,
          userId
        });
      }

      return signals;
    } catch (error) {
      console.error('Error analyzing email for signals:', error);
      return [];
    }
  }

  /**
   * Generate contextual signals based on user patterns
   */
  async generateContextualSignals(userId: string): Promise<MentalLoadSignal[]> {
    try {
      // Get user's historical patterns
      const { data: patterns, error } = await this.supabase
        .from('agent_memory')
        .select('*')
        .eq('user_id', userId)
        .eq('memory_type', 'user_patterns')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching user patterns:', error);
        return [];
      }

      const signals: MentalLoadSignal[] = [];

      // Analyze stress patterns
      const stressPatterns = patterns?.filter(pattern => {
        const value = typeof pattern.value === 'string' ? JSON.parse(pattern.value) : pattern.value;
        return value?.stress_level > 7;
      }) || [];

      if (stressPatterns.length > 2) {
        signals.push({
          id: `stress-pattern-${Date.now()}`,
          type: 'stress',
          intensity: 6,
          timestamp: new Date(),
          source: 'memory',
          description: 'Elevated stress levels detected in recent patterns',
          actionable: true,
          userId
        });
      }

      // Check for positive patterns
      const positivePatterns = patterns?.filter(pattern => {
        const value = typeof pattern.value === 'string' ? JSON.parse(pattern.value) : pattern.value;
        return value?.mood === 'positive' || value?.productivity > 8;
      }) || [];

      if (positivePatterns.length > 3) {
        signals.push({
          id: `positive-pattern-${Date.now()}`,
          type: 'excitement',
          intensity: 4,
          timestamp: new Date(),
          source: 'memory',
          description: 'Positive momentum detected in recent activities',
          actionable: false,
          userId
        });
      }

      return signals;
    } catch (error) {
      console.error('Error generating contextual signals:', error);
      return [];
    }
  }

  /**
   * Get all mental load signals for a user
   */
  async getMentalLoadSignals(userId: string): Promise<MentalLoadSignal[]> {
    try {
      const [calendarSignals, emailSignals, contextualSignals] = await Promise.all([
        this.analyzeCalendarForSignals(userId),
        this.analyzeEmailForSignals(userId),
        this.generateContextualSignals(userId)
      ]);

      return [...calendarSignals, ...emailSignals, ...contextualSignals];
    } catch (error) {
      console.error('Error getting mental load signals:', error);
      return [];
    }
  }

  /**
   * Store a mental load signal in agent memory
   */
  async storeSignal(signal: MentalLoadSignal): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('agent_memory')
        .insert({
          user_id: signal.userId,
          memory_type: 'mental_load_signal',
          key: signal.type,
          value: JSON.stringify({
            intensity: signal.intensity,
            source: signal.source,
            description: signal.description,
            actionable: signal.actionable,
            timestamp: signal.timestamp.toISOString()
          }),
          priority: signal.intensity > 7 ? 'high' : signal.intensity > 4 ? 'medium' : 'low',
          tags: [signal.type, signal.source, signal.actionable ? 'actionable' : 'informational']
        });

      if (error) {
        console.error('Error storing mental load signal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error storing mental load signal:', error);
      return false;
    }
  }

  /**
   * Get calendar events with mental load analysis
   */
  async getCalendarEvents(userId: string): Promise<CalendarEvent[]> {
    try {
      const { data: memories, error } = await this.supabase
        .from('agent_memory')
        .select('*')
        .eq('user_id', userId)
        .eq('memory_type', 'calendar')
        .gte('created_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching calendar events:', error);
        return [];
      }

      return memories?.map(memory => {
        const value = typeof memory.value === 'string' ? JSON.parse(memory.value) : memory.value;
        return {
          id: memory.id,
          title: value.title || 'Untitled Event',
          date: new Date(value.date || memory.created_at),
          time: value.time,
          type: value.type || 'event',
          priority: value.priority || 'medium',
          mentalLoad: value.mentalLoad || 5,
          userId: memory.user_id
        };
      }) || [];
    } catch (error) {
      console.error('Error getting calendar events:', error);
      return [];
    }
  }
}

export default MentalLoadService;
