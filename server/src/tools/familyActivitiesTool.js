/**
 * Family Activities LangChain Tool
 *
 * Provides access to family activities stored in the Supabase family_activities table.
 * Handles recurring activities, schedules, and family member activity assignments.
 */

import { Tool } from '@langchain/core/tools';
import { createClient } from '@supabase/supabase-js';
import { TOOLS_CONFIG } from '../config/chatConfig.js';

class FamilyActivitiesTool extends Tool {
  name = 'family_activities';
  description = `ALWAYS use this tool when the user asks about family activities, schedules, or recurring events.

  This tool searches the family activities database containing:
  - Recurring activities (sports, music lessons, classes)
  - Family member activity assignments
  - Activity schedules and timing
  - Activity details (location, coach, etc.)

  MUST USE for these queries:
  - "what activities" / "activities" / "what does my child do"
  - "schedule" / "weekly schedule" / "what's happening this week"
  - Sports, music, classes ("soccer", "piano", "dance", "swimming")
  - Activity-specific questions ("when is practice", "who is the coach")

  Input format: {"query": "search terms", "member_name": "optional_member", "activity_type": "optional_type"}

  Example inputs:
  - {"query": "activities"}
  - {"query": "soccer practice"}
  - {"query": "music lessons", "activity_type": "music"}
  - {"query": "weekly schedule"}

  Activity types: sports, music, education, arts, fitness, clubs, other`;

  schema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search terms for activities (e.g., "soccer", "activities", "schedule")'
      },
      member_name: {
        type: 'string',
        description: 'Optional family member name to filter activities'
      },
      activity_type: {
        type: 'string',
        description: 'Optional activity type filter',
        enum: ['sports', 'music', 'education', 'arts', 'fitness', 'clubs', 'other']
      }
    },
    required: ['query']
  };

  constructor({ userId }) {
    super();
    console.log(`🚨 FAMILY ACTIVITIES TOOL CONSTRUCTOR: userId=${userId}`);
    this.userId = userId;
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );
  }

  /**
   * Execute family activities search
   */
  async _call(input) {
    console.log(`🏃‍♀️ FAMILY ACTIVITIES TOOL _call() EXECUTED!`);
    console.log(`🏃‍♀️ Input received:`, JSON.stringify(input, null, 2));

    try {
      const { query, temporalRange } = input || {};

      // First get the user's family_id
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .select('family_id')
        .eq('id', this.userId)
        .single();

      if (userError || !userData?.family_id) {
        console.log(`🏃‍♀️ No family_id found for user ${this.userId}:`, userError);
        return JSON.stringify({
          success: true,
          source: 'family_activities',
          total_results: 0,
          activities: []
        });
      }

      console.log(`🏃‍♀️ Found family_id ${userData.family_id} for user ${this.userId}`);

      // Query family activities using the family_id
      let activitiesQuery = this.supabase
        .from('family_activities')
        .select(`
          *,
          family_members (
            name,
            family_relationship
          )
        `)
        .eq('family_id', userData.family_id);

      // Add text search if query provided
      if (query) {
        console.log(`🏃‍♀️ Adding text search filter for query: "${query}"`);
        activitiesQuery = activitiesQuery.or(`activity_name.ilike.%${query}%,activity_type.ilike.%${query}%,schedule_details.ilike.%${query}%`);
      }

      // Add temporal filtering if provided
      if (temporalRange?.startDate) {
        const queryStartDate = temporalRange.startDate.split('T')[0];
        console.log(`🏃‍♀️ Adding temporal filter: end_date >= ${queryStartDate} OR end_date IS NULL`);
        activitiesQuery = activitiesQuery.or(`end_date.gte.${queryStartDate},end_date.is.null`);
      } else {
        console.log(`🏃‍♀️ No temporal range provided, querying all activities for family ${userData.family_id}`);
      }

      const { data: activities, error: activitiesError } = await activitiesQuery.order('activity_name');

      if (activitiesError) {
        return JSON.stringify({
          success: false,
          error: 'Failed to fetch family activities'
        });
      }

      // Format results
      const formattedActivities = (activities || []).map(activity => ({
        id: activity.id,
        name: activity.activity_name,
        type: activity.activity_type,
        member: activity.family_members?.name,
        schedule: activity.schedule_details || activity.frequency,
        location: activity.location,
        days: activity.days
      }));

      return JSON.stringify({
        success: true,
        source: 'family_activities',
        total_results: formattedActivities.length,
        activities: formattedActivities
      });

    } catch (error) {
      console.error('🏃‍♀️ Family activities tool error:', error);
      return JSON.stringify({
        success: false,
        error: 'Family activities search failed'
      });
    }
  }

  /**
   * Calculate specific occurrences of a recurring activity within a date range
   */
  calculateOccurrences(activity, temporalRange) {
    const occurrences = [];
    const { days, end_date } = activity;

    if (!days || !Array.isArray(days) || days.length === 0) {
      return occurrences;
    }

    const activityEndDate = end_date ? new Date(end_date) : null;
    const rangeStart = temporalRange.start;
    const rangeEnd = temporalRange.end;

    // Day name to number mapping (Sunday = 0, Monday = 1, etc.)
    const dayMap = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };

    // Convert activity days to day numbers
    const activityDayNumbers = days.map(day => dayMap[day.toLowerCase()]).filter(num => num !== undefined);

    if (activityDayNumbers.length === 0) {
      return occurrences;
    }

    // Iterate through each day in the range
    const currentDate = new Date(rangeStart);

    while (currentDate <= rangeEnd) {
      const dayOfWeek = currentDate.getDay();

      // Check if this day matches one of the activity days
      if (activityDayNumbers.includes(dayOfWeek)) {
        // Check if this occurrence is before the activity end date
        if (!activityEndDate || currentDate <= activityEndDate) {
          occurrences.push({
            date: new Date(currentDate).toISOString().split('T')[0], // YYYY-MM-DD format
            dayName: currentDate.toLocaleDateString('en-US', { weekday: 'long' })
          });
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return occurrences;
  }
}

export default FamilyActivitiesTool;