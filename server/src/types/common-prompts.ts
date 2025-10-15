/**
 * Common Prompts Type Definitions
 *
 * These interfaces define the structure for the common-prompts.json file
 * to ensure consistency and make it easy to add new prompt patterns.
 */

export interface ToolParams {
  [key: string]: any;
}

export interface GmailParams extends ToolParams {
  query: string;
  maxResults?: number;
}

export interface CalendarParams extends ToolParams {
  action: 'list_events' | 'create_event' | 'search_events';
  query?: string;
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}

export interface FamilyActivitiesParams extends ToolParams {
  query: string;
  dateRange?: string;
  activity_type?: string;
  member_name?: string;
}

export interface AgentMemoryParams extends ToolParams {
  query: string;
}

// Unified Structured Response for all template responses
export interface StructuredResponse {
  type: 'structured_data';
  template_name: string;
  title: string;
  data: {
    [toolName: string]: any; // Raw tool results - frontend decides how to render
  };
  metadata?: {
    query: string;
    timestamp: string;
    tools_used: string[];
    [key: string]: any;
  };
}

export interface PromptConfig {
  tools: string[];
  dateRange?: string;
  query?: string | null;
  params: {
    gmail?: GmailParams;
    calendar?: CalendarParams;
    family_activities?: FamilyActivitiesParams;
    agent_memory?: AgentMemoryParams;
    [toolName: string]: ToolParams | undefined;
  };
  response_template?: string | StructuredResponse;
  bypass_llm?: boolean;
}

export interface DatePattern {
  type: 'single_day' | 'week' | 'range' | 'dynamic_range';
  offset?: number;
  days?: number;
  variable?: string;
}

export interface CommonPromptsConfig {
  exact_matches: {
    [prompt: string]: string[] | PromptConfig;
  };
  pattern_matches: {
    [pattern: string]: PromptConfig;
  };
  date_patterns: {
    [pattern: string]: DatePattern;
  };
}

/**
 * Helper type for creating new prompt entries
 */
export type NewPromptEntry = {
  prompt: string;
  tools: string[];
  params?: {
    gmail?: Partial<GmailParams>;
    calendar?: Partial<CalendarParams>;
    family_activities?: Partial<FamilyActivitiesParams>;
    agent_memory?: Partial<AgentMemoryParams>;
    [toolName: string]: Partial<ToolParams> | undefined;
  };
};

/**
 * Utility functions for creating prompt entries
 */
export class PromptBuilder {
  /**
   * Create a simple prompt that uses one or more tools with default params
   */
  static simple(tools: string[]): string[] {
    return tools;
  }

  /**
   * Create a calendar prompt with specific date range
   */
  static calendar(dateRange: string, query?: string): PromptConfig {
    return {
      tools: ['calendar'],
      params: {
        calendar: {
          action: 'list_events',
          dateRange,
          ...(query && { query })
        }
      }
    };
  }

  /**
   * Create a Gmail prompt with specific query
   */
  static gmail(query: string, maxResults?: number): PromptConfig {
    return {
      tools: ['gmail'],
      params: {
        gmail: {
          query,
          ...(maxResults && { maxResults })
        }
      }
    };
  }

  /**
   * Create a family activities prompt
   */
  static familyActivities(query: string, dateRange?: string): PromptConfig {
    return {
      tools: ['family_activities'],
      params: {
        family_activities: {
          query,
          ...(dateRange && { dateRange })
        }
      }
    };
  }

  /**
   * Create an agent memory prompt
   */
  static agentMemory(query: string): PromptConfig {
    return {
      tools: ['agent_memory'],
      params: {
        agent_memory: { query }
      }
    };
  }

  /**
   * Create a multi-tool prompt (schedule queries)
   */
  static schedule(dateRange: string): PromptConfig {
    return {
      tools: ['calendar', 'family_activities'],
      params: {
        calendar: {
          action: 'list_events',
          dateRange
        },
        family_activities: {
          query: dateRange === 'today' ? 'activities' : 'this week',
          dateRange
        }
      }
    };
  }

  /**
   * Create a school events prompt (multi-tool)
   */
  static schoolEvents(): PromptConfig {
    return {
      tools: ['gmail', 'calendar'],
      params: {
        gmail: {
          query: 'from:school OR subject:school OR school events'
        },
        calendar: {
          action: 'list_events',
          query: 'school events',
          dateRange: 'next_30_days'
        }
      }
    };
  }

  /**
   * Create a pattern match for emails from a person
   */
  static emailFromPerson(): PromptConfig {
    return {
      tools: ['gmail'],
      params: {
        gmail: {
          query: 'from:{name}'
        }
      }
    };
  }

  /**
   * Create a pattern match for emails about a subject
   */
  static emailAboutSubject(): PromptConfig {
    return {
      tools: ['gmail'],
      params: {
        gmail: {
          query: 'subject:{subject}'
        }
      }
    };
  }

  /**
   * Create a dynamic calendar prompt for X days
   */
  static calendarNextDays(): PromptConfig {
    return {
      tools: ['calendar'],
      params: {
        calendar: {
          action: 'list_events',
          dateRange: 'next_{number}_days'
        }
      }
    };
  }
}

/**
 * Example usage:
 *
 * const newPrompts = {
 *   "what's my schedule today": PromptBuilder.schedule('today'),
 *   "check recent emails": PromptBuilder.gmail('recent emails', 10),
 *   "who is my dentist": PromptBuilder.agentMemory('dentist'),
 *   "what activities this week": PromptBuilder.familyActivities('this week', 'this_week')
 * };
 */