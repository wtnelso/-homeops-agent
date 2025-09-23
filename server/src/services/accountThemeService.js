/**
 * Account Theme Insights Service
 *
 * Provides easy access to account-wide theme analysis and family email patterns.
 * Used by AI agents, dashboards, and API endpoints to understand user's email themes.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export class AccountThemeService {
  /**
   * Get comprehensive theme summary for an account
   */
  static async getAccountThemeProfile(account_id) {
    try {
      const { data: themes, error } = await supabase
        .from('account_theme_summary')
        .select('*')
        .eq('account_id', account_id)
        .order('total_emails', { ascending: false });

      if (error) throw error;

      if (!themes || themes.length === 0) {
        return {
          account_id,
          total_emails: 0,
          unique_themes: 0,
          top_themes: [],
          insights: [],
          status: 'no_data'
        };
      }

      const totalEmails = themes.reduce((sum, theme) => sum + theme.total_emails, 0);

      return {
        account_id,
        total_emails: totalEmails,
        unique_themes: themes.length,
        top_themes: themes.slice(0, 5).map(theme => ({
          name: theme.theme_name,
          count: theme.total_emails,
          percentage: Math.round((theme.total_emails / totalEmails) * 100),
          avg_relevance: theme.average_relevance_score,
          high_relevance_count: theme.high_relevance_count,
          recent_activity: {
            last_7d: theme.recent_7d_count,
            last_30d: theme.recent_30d_count
          },
          first_seen: theme.first_seen_at,
          last_seen: theme.last_seen_at
        })),
        insights: this.generateTextualInsights(themes, totalEmails),
        last_updated: themes[0]?.last_updated_at,
        status: 'active'
      };

    } catch (error) {
      console.error('❌ Failed to get account theme profile:', error);
      return {
        account_id,
        error: error.message,
        status: 'error'
      };
    }
  }

  /**
   * Get trending themes for an account
   */
  static async getTrendingThemes(account_id, days = 7) {
    try {
      const { data: themes, error } = await supabase
        .from('account_theme_summary')
        .select('*')
        .eq('account_id', account_id)
        .gt(days === 7 ? 'recent_7d_count' : 'recent_30d_count', 0)
        .order(days === 7 ? 'recent_7d_count' : 'recent_30d_count', { ascending: false });

      if (error) throw error;

      return themes.map(theme => {
        const recentCount = days === 7 ? theme.recent_7d_count : theme.recent_30d_count;
        const totalCount = theme.total_emails;
        const trendScore = totalCount > 0 ? (recentCount / totalCount) * 100 : 0;

        return {
          theme_name: theme.theme_name,
          recent_count: recentCount,
          total_count: totalCount,
          trend_score: Math.round(trendScore),
          trend_direction: this.calculateTrendDirection(theme, days),
          avg_relevance: theme.average_relevance_score
        };
      });

    } catch (error) {
      console.error('❌ Failed to get trending themes:', error);
      return [];
    }
  }

  /**
   * Get high-priority themes (family_relevance_score > 0.7)
   */
  static async getHighPriorityThemes(account_id) {
    try {
      const { data: themes, error } = await supabase
        .from('account_theme_summary')
        .select('*')
        .eq('account_id', account_id)
        .gt('high_relevance_count', 0)
        .order('high_relevance_count', { ascending: false });

      if (error) throw error;

      return themes.map(theme => ({
        theme_name: theme.theme_name,
        total_emails: theme.total_emails,
        high_relevance_count: theme.high_relevance_count,
        high_relevance_percentage: Math.round((theme.high_relevance_count / theme.total_emails) * 100),
        avg_relevance: theme.average_relevance_score,
        recent_activity: theme.recent_7d_count
      }));

    } catch (error) {
      console.error('❌ Failed to get high priority themes:', error);
      return [];
    }
  }

  /**
   * Get theme comparison between time periods
   */
  static async getThemeComparison(account_id, current_period_days = 30, comparison_period_days = 60) {
    try {
      const { data: themes, error } = await supabase
        .from('account_theme_summary')
        .select('*')
        .eq('account_id', account_id)
        .order('total_emails', { ascending: false });

      if (error) throw error;

      // Note: This is simplified - in production you'd want more sophisticated time-based analysis
      return themes.map(theme => ({
        theme_name: theme.theme_name,
        current_period: theme.recent_30d_count,
        comparison_baseline: Math.max(1, theme.total_emails - theme.recent_30d_count), // Rough historical baseline
        growth_rate: this.calculateGrowthRate(theme),
        status: this.getThemeStatus(theme)
      }));

    } catch (error) {
      console.error('❌ Failed to get theme comparison:', error);
      return [];
    }
  }

  /**
   * Generate human-readable insights from theme data
   */
  static generateTextualInsights(themes, totalEmails) {
    const insights = [];

    if (themes.length === 0) return ['No email themes detected yet'];

    // Top theme insight
    const topTheme = themes[0];
    const topPercentage = Math.round((topTheme.total_emails / totalEmails) * 100);
    insights.push(`${topTheme.theme_name} emails dominate your inbox (${topPercentage}% of processed emails)`);

    // High relevance insight
    const highRelevanceThemes = themes.filter(t => t.high_relevance_count > 0);
    if (highRelevanceThemes.length > 0) {
      insights.push(`${highRelevanceThemes.length} themes generate high-priority family emails`);
    }

    // Recent activity insight
    const recentlyActive = themes.filter(t => t.recent_7d_count > 0);
    if (recentlyActive.length > 0) {
      insights.push(`${recentlyActive.length} themes were active in the past week`);
    }

    // Emerging theme insight
    const emergingThemes = themes.filter(t => {
      const recentRatio = t.recent_7d_count / Math.max(1, t.total_emails);
      return recentRatio > 0.5 && t.total_emails >= 2;
    });

    if (emergingThemes.length > 0) {
      insights.push(`${emergingThemes[0].theme_name} emails are trending up recently`);
    }

    // Diversity insight
    if (themes.length >= 5) {
      insights.push(`Your email patterns span ${themes.length} different life categories`);
    }

    return insights.slice(0, 4); // Limit to top 4 insights
  }

  /**
   * Calculate trend direction for a theme
   */
  static calculateTrendDirection(theme, days) {
    const recent = days === 7 ? theme.recent_7d_count : theme.recent_30d_count;
    const total = theme.total_emails;
    const ratio = recent / Math.max(1, total);

    if (ratio > 0.4) return 'trending_up';
    if (ratio < 0.1) return 'trending_down';
    return 'stable';
  }

  /**
   * Calculate growth rate for theme comparison
   */
  static calculateGrowthRate(theme) {
    const recent = theme.recent_30d_count;
    const historical = Math.max(1, theme.total_emails - recent);
    return Math.round(((recent - historical) / historical) * 100);
  }

  /**
   * Get theme status classification
   */
  static getThemeStatus(theme) {
    if (theme.recent_7d_count > 0) return 'active';
    if (theme.recent_30d_count > 0) return 'recent';
    return 'dormant';
  }

  /**
   * Get account theme summary for AI agent context
   */
  static async getAIContextSummary(account_id) {
    try {
      const profile = await this.getAccountThemeProfile(account_id);

      if (profile.status === 'no_data') {
        return "This account hasn't processed enough emails for theme analysis yet.";
      }

      const summary = [
        `Email theme profile: ${profile.total_emails} emails across ${profile.unique_themes} categories.`,
        `Top themes: ${profile.top_themes.slice(0, 3).map(t => `${t.name} (${t.percentage}%)`).join(', ')}.`,
        `Key insights: ${profile.insights.slice(0, 2).join('. ')}.`
      ].join(' ');

      return summary;

    } catch (error) {
      console.error('❌ Failed to get AI context summary:', error);
      return "Email theme analysis temporarily unavailable.";
    }
  }
}

export default AccountThemeService;