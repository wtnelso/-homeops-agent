/**
 * Tool Health Monitoring Service
 *
 * Tracks performance, success rates, and error patterns for LangChain tools.
 * Provides health scoring and fallback recommendations.
 */

import { createClient } from '@supabase/supabase-js';

export class ToolHealthMonitor {
  constructor(supabaseUrl, supabaseServiceKey) {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    this.healthCache = new Map(); // In-memory cache for recent health scores
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Log tool execution result
   */
  async logExecution({
    toolName,
    toolCallId,
    userId,
    success,
    executionTimeMs,
    errorType = null,
    errorMessage = null,
    errorDetails = null,
    queryContext = null,
    toolInput = null,
    responseSize = null
  }) {
    try {
      const healthScore = await this.calculateHealthScore(toolName, userId);

      const { error } = await this.supabase
        .from('tool_health_logs')
        .insert({
          tool_name: toolName,
          tool_call_id: toolCallId,
          user_id: userId,
          success,
          execution_time_ms: executionTimeMs,
          error_type: errorType,
          error_message: errorMessage,
          error_details: errorDetails,
          query_context: queryContext,
          tool_input: toolInput,
          response_size_bytes: responseSize,
          health_score: healthScore
        });

      if (error) {
        console.error('Failed to log tool health:', error);
      } else {
        console.log(`📊 HEALTH: Logged ${toolName} execution - success: ${success}, time: ${executionTimeMs}ms`);

        // Update cache
        this.updateHealthCache(toolName, userId, success, executionTimeMs);
      }
    } catch (error) {
      console.error('Tool health logging error:', error);
    }
  }

  /**
   * Calculate current health score for a tool
   */
  async calculateHealthScore(toolName, userId) {
    try {
      // Get recent executions (last 24 hours)
      const { data: recentLogs, error } = await this.supabase
        .from('tool_health_logs')
        .select('success, execution_time_ms')
        .eq('tool_name', toolName)
        .eq('user_id', userId)
        .gte('executed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('executed_at', { ascending: false })
        .limit(20);

      if (error || !recentLogs || recentLogs.length === 0) {
        return 1.0; // Default score for new tools
      }

      // Calculate success rate
      const successCount = recentLogs.filter(log => log.success).length;
      const successRate = successCount / recentLogs.length;

      // Calculate average response time factor
      const avgResponseTime = recentLogs.reduce((sum, log) => sum + log.execution_time_ms, 0) / recentLogs.length;
      const responseTimeFactor = Math.max(0, 1 - (avgResponseTime - 1000) / 10000); // Penalize if > 1s

      // Combined health score (weighted)
      const healthScore = (successRate * 0.8) + (responseTimeFactor * 0.2);

      return Math.max(0, Math.min(1, healthScore));
    } catch (error) {
      console.error('Health score calculation error:', error);
      return 0.5; // Default middle score on error
    }
  }

  /**
   * Get health status for a tool
   */
  async getToolHealth(toolName, userId) {
    const cacheKey = `${toolName}:${userId}`;
    const cached = this.healthCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.health;
    }

    try {
      // Get recent statistics
      const { data: stats, error } = await this.supabase
        .rpc('get_tool_health_stats', {
          tool_name_param: toolName,
          user_id_param: userId,
          hours_back: 24
        });

      if (error) {
        console.error('Failed to get tool health stats:', error);
        return this.getDefaultHealth();
      }

      const health = stats[0] || this.getDefaultHealth();

      // Cache the result
      this.healthCache.set(cacheKey, {
        health,
        timestamp: Date.now()
      });

      return health;
    } catch (error) {
      console.error('Tool health query error:', error);
      return this.getDefaultHealth();
    }
  }

  /**
   * Get health status for all tools system-wide
   */
  async getAllToolsHealth() {
    try {
      console.log('📊 Getting system-wide tool health data');

      // Get system-wide health stats using the new RPC function
      const { data: stats, error } = await this.supabase
        .rpc('get_system_tool_health_stats', {
          hours_back: 24
        });

      if (error) {
        console.error('Failed to get system tool health stats:', error);
        return {};
      }

      if (!stats || stats.length === 0) {
        console.log('No tool health data found in system');
        return {};
      }

      console.log(`📊 Found health data for ${stats.length} tools`);

      const healthSummary = {};

      stats.forEach(toolStats => {
        healthSummary[toolStats.tool_name] = {
          health_score: parseFloat(toolStats.health_score),
          success_rate: parseFloat(toolStats.success_rate),
          avg_response_time: parseInt(toolStats.avg_execution_time),
          total_executions: parseInt(toolStats.total_executions),
          recent_failures: parseInt(toolStats.recent_failures),
          status: toolStats.status
        };

        console.log(`✅ Health data for ${toolStats.tool_name}:`, healthSummary[toolStats.tool_name]);
      });

      return healthSummary;
    } catch (error) {
      console.error('System tools health query error:', error);
      return {};
    }
  }

  /**
   * Check if a tool should be skipped due to poor health
   */
  async shouldSkipTool(toolName, userId) {
    const health = await this.getToolHealth(toolName, userId);
    return health.health_score < 0.3; // Skip if health score below 30%
  }

  /**
   * Get recommended fallback tools
   */
  getFallbackTools(failedTool) {
    const fallbacks = {
      'semantic_search': ['gmail_search'],
      'gmail_search': ['semantic_search'],
      'agent_memory': [], // No fallback - critical tool
      'calendar': [] // No fallback currently
    };

    return fallbacks[failedTool] || [];
  }

  /**
   * Update in-memory health cache
   */
  updateHealthCache(toolName, userId, success, executionTime) {
    const cacheKey = `${toolName}:${userId}`;
    const existing = this.healthCache.get(cacheKey);

    if (existing) {
      // Update running averages
      const health = existing.health;
      health.recent_success_rate = this.updateMovingAverage(
        health.recent_success_rate || 1.0,
        success ? 1 : 0,
        0.1
      );
      health.recent_avg_time = this.updateMovingAverage(
        health.recent_avg_time || 1000,
        executionTime,
        0.1
      );
      health.health_score = (health.recent_success_rate * 0.8) +
                           (Math.max(0, 1 - (health.recent_avg_time - 1000) / 10000) * 0.2);
    }
  }

  /**
   * Update moving average
   */
  updateMovingAverage(currentAvg, newValue, alpha) {
    return (alpha * newValue) + ((1 - alpha) * currentAvg);
  }

  /**
   * Get default health object
   */
  getDefaultHealth() {
    return {
      health_score: 1.0,
      success_rate: 1.0,
      avg_response_time: 1000,
      total_executions: 0,
      recent_failures: 0,
      status: 'healthy'
    };
  }

  /**
   * Determine health status from metrics
   */
  getHealthStatus(successRate, avgResponseTime) {
    if (successRate < 0.5) return 'critical';
    if (successRate < 0.8 || avgResponseTime > 5000) return 'warning';
    if (avgResponseTime > 3000) return 'degraded';
    return 'healthy';
  }

  /**
   * Get error categorization from error message
   */
  categorizeError(error) {
    if (!error) return 'unknown';

    const errorStr = error.toString().toLowerCase();

    if (errorStr.includes('auth') || errorStr.includes('unauthorized') || errorStr.includes('token')) {
      return 'auth';
    }
    if (errorStr.includes('network') || errorStr.includes('fetch') || errorStr.includes('connection')) {
      return 'network';
    }
    if (errorStr.includes('timeout')) {
      return 'timeout';
    }
    if (errorStr.includes('parse') || errorStr.includes('json') || errorStr.includes('syntax')) {
      return 'parse';
    }
    if (errorStr.includes('rate') || errorStr.includes('limit') || errorStr.includes('quota')) {
      return 'api_limit';
    }

    return 'unknown';
  }
}

// Create singleton instance
let healthMonitorInstance = null;

export function getHealthMonitor() {
  if (!healthMonitorInstance) {
    healthMonitorInstance = new ToolHealthMonitor(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return healthMonitorInstance;
}

export default ToolHealthMonitor;