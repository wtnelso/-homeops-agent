/**
 * Error Logger Service
 * 
 * Comprehensive error logging and performance monitoring system for
 * the email embedding and semantic search architecture.
 * 
 * Integrates with Supabase MCP-created logging tables for:
 * - Real-time error tracking and alerting
 * - Performance metrics monitoring 
 * - Cost usage tracking and optimization
 * - User experience analytics
 * - Production debugging and optimization
 * 
 * @author HomeOps Agent
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for logging
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Log severity levels for filtering and alerting
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info', 
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Log categories for organized monitoring
 */
export enum LogCategory {
  EMBEDDING_PROCESSING = 'embedding_processing',
  SEARCH_QUERY = 'search_query',
  PATTERN_ANALYSIS = 'pattern_analysis',
  API_PERFORMANCE = 'api_performance',
  USER_EXPERIENCE = 'user_experience',
  COST_MONITORING = 'cost_monitoring',
  DATABASE_OPERATIONS = 'database_operations',
  EXTERNAL_API = 'external_api',
  AUTHENTICATION = 'authentication',
  SYSTEM_HEALTH = 'system_health'
}

/**
 * Error context for comprehensive debugging
 */
interface ErrorContext {
  user_id?: string;
  account_id?: string;
  job_id?: string;
  request_id?: string;
  function_name?: string;
  operation?: string;
  
  // Performance data
  execution_time_ms?: number;
  memory_usage_mb?: number;
  api_calls_made?: number;
  cost_estimate_cents?: number;
  
  // Request/Response data
  request_data?: any;
  response_data?: any;
  stack_trace?: string;
  
  // Business context
  email_count?: number;
  search_query?: string;
  processing_stage?: string;
  
  // Technical details
  user_agent?: string;
  ip_address?: string;
  timestamp?: string;
}

/**
 * Performance tracking interface
 */
interface PerformanceMetrics {
  operation_name: string;
  duration_ms: number;
  success: boolean;
  user_id?: string;
  metadata?: Record<string, any>;
}

/**
 * Main Error Logger Service Class
 */
export class ErrorLogger {
  
  /**
   * Log error with full context and automatic alerting
   * 
   * @param level - Severity level for filtering and alerts
   * @param category - Category for organized analysis
   * @param message - Human-readable error description
   * @param error - Error object with stack trace
   * @param context - Additional debugging context
   */
  static async logError(
    level: LogLevel,
    category: LogCategory,
    message: string,
    error?: Error | any,
    context: ErrorContext = {}
  ): Promise<void> {
    try {
      // Prepare comprehensive log entry
      const logEntry = {
        level,
        category,
        message,
        error_details: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        } : null,
        context: {
          ...context,
          timestamp: context.timestamp || new Date().toISOString(),
          environment: process.env.VITE_APP_ENV || 'development',
          function_version: '1.0.0'
        }
      };

      // Console logging for immediate visibility
      const logColor = this.getLogColor(level);
      console.log(`${logColor}[${level.toUpperCase()}] [${category}] ${message}`, {
        error: error?.message,
        context: this.sanitizeContext(context)
      });

      // Store in Supabase for analysis and monitoring
      const { error: dbError } = await supabase
        .from('error_logs')
        .insert([logEntry]);

      if (dbError) {
        console.error('❌ Failed to store error log:', dbError);
        // Could implement fallback logging here (e.g., external service)
      }

      // Automatic alerting for critical issues
      if (level === LogLevel.CRITICAL || level === LogLevel.ERROR) {
        await this.triggerErrorAlert(level, category, message, context);
      }

    } catch (loggingError) {
      // Never let logging errors break the main application
      console.error('🚨 Logging system failure:', loggingError);
    }
  }

  /**
   * Track performance metrics for optimization
   * 
   * @param metrics - Performance data to monitor
   */
  static async logPerformance(metrics: PerformanceMetrics): Promise<void> {
    try {
      const performanceEntry = {
        operation_name: metrics.operation_name,
        duration_ms: metrics.duration_ms,
        success: metrics.success,
        user_id: metrics.user_id,
        metadata: metrics.metadata || {},
        timestamp: new Date().toISOString(),
        environment: process.env.VITE_APP_ENV || 'development'
      };

      // Store performance data
      const { error } = await supabase
        .from('performance_logs')
        .insert([performanceEntry]);

      if (error) {
        console.warn('⚠️ Failed to store performance log:', error);
      }

      // Check for performance degradation
      await this.monitorPerformanceThresholds(metrics);

    } catch (error) {
      console.error('Performance logging failed:', error);
    }
  }

  /**
   * Track email embedding processing with detailed metrics
   */
  static async logEmbeddingJob(
    jobId: string,
    userId: string,
    stage: string,
    success: boolean,
    metrics: {
      emails_processed?: number;
      processing_time_ms?: number;
      llm_calls_made?: number;
      cost_cents?: number;
      error_message?: string;
      batch_number?: number;
    }
  ): Promise<void> {
    await this.logError(
      success ? LogLevel.INFO : LogLevel.ERROR,
      LogCategory.EMBEDDING_PROCESSING,
      `Email embedding ${stage}: ${success ? 'completed' : 'failed'}${metrics.batch_number ? ` (batch ${metrics.batch_number})` : ''}`,
      success ? undefined : new Error(metrics.error_message || 'Processing failed'),
      {
        user_id: userId,
        job_id: jobId,
        processing_stage: stage,
        email_count: metrics.emails_processed,
        execution_time_ms: metrics.processing_time_ms,
        api_calls_made: metrics.llm_calls_made,
        cost_estimate_cents: metrics.cost_cents,
        request_data: {
          batch_number: metrics.batch_number
        }
      }
    );
  }

  /**
   * Track search queries and user behavior patterns
   */
  static async logSearch(
    userId: string,
    query: string,
    success: boolean,
    metrics: {
      search_time_ms?: number;
      results_count?: number;
      enhancement_used?: boolean;
      filters_applied?: any;
      cost_cents?: number;
      error_message?: string;
      similarity_threshold?: number;
    }
  ): Promise<void> {
    await this.logError(
      success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.SEARCH_QUERY,
      `Search: "${query.slice(0, 100)}..." - ${success ? `${metrics.results_count} results` : 'failed'}`,
      success ? undefined : new Error(metrics.error_message || 'Search failed'),
      {
        user_id: userId,
        search_query: query,
        execution_time_ms: metrics.search_time_ms,
        cost_estimate_cents: metrics.cost_cents,
        request_data: {
          enhancement_used: metrics.enhancement_used,
          filters_applied: metrics.filters_applied,
          results_count: metrics.results_count,
          similarity_threshold: metrics.similarity_threshold
        }
      }
    );
  }

  /**
   * Monitor API endpoint performance with automatic alerts
   */
  static async logApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    userId?: string,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    const success = statusCode < 400;
    
    // Log performance metrics
    await this.logPerformance({
      operation_name: `${method} ${endpoint}`,
      duration_ms: responseTime,
      success,
      user_id: userId,
      metadata: {
        status_code: statusCode,
        ...additionalContext
      }
    });

    // Log errors for failed requests
    if (!success) {
      await this.logError(
        statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN,
        LogCategory.API_PERFORMANCE,
        `API ${method} ${endpoint} returned ${statusCode}`,
        undefined,
        {
          user_id: userId,
          function_name: endpoint,
          execution_time_ms: responseTime,
          response_data: { 
            status_code: statusCode,
            ...additionalContext
          }
        }
      );
    }
  }

  /**
   * Track cost usage with automatic budget alerts
   */
  static async logCostUsage(
    userId: string,
    operation: string,
    costCents: number,
    details: {
      openai_calls?: number;
      embedding_calls?: number;
      llm_calls?: number;
      operation_type?: string;
      email_count?: number;
    }
  ): Promise<void> {
    await this.logError(
      LogLevel.INFO,
      LogCategory.COST_MONITORING,
      `💰 Cost: ${operation} - $${(costCents/100).toFixed(3)}`,
      undefined,
      {
        user_id: userId,
        operation,
        cost_estimate_cents: costCents,
        api_calls_made: (details.openai_calls || 0) + (details.embedding_calls || 0) + (details.llm_calls || 0),
        email_count: details.email_count,
        request_data: details
      }
    );

    // Budget alerts
    if (costCents > 500) { // > $5.00
      await this.logError(
        LogLevel.WARN,
        LogCategory.COST_MONITORING,
        `🚨 High cost alert: ${operation} cost $${(costCents/100).toFixed(2)}`,
        undefined,
        { 
          user_id: userId, 
          operation, 
          cost_estimate_cents: costCents,
          request_data: details
        }
      );
    }
  }

  /**
   * Track external API calls (OpenAI, Gmail, etc.) with rate limit monitoring
   */
  static async logExternalApi(
    provider: string,
    endpoint: string,
    success: boolean,
    responseTime: number,
    error?: Error,
    context: {
      user_id?: string;
      cost_cents?: number;
      rate_limited?: boolean;
      retry_count?: number;
      response_size?: number;
    } = {}
  ): Promise<void> {
    const level = success ? LogLevel.INFO : 
                 context.rate_limited ? LogLevel.WARN : LogLevel.ERROR;

    await this.logError(
      level,
      LogCategory.EXTERNAL_API,
      `${provider} ${endpoint}: ${success ? 'success' : 'failed'}${context.rate_limited ? ' (rate limited)' : ''}`,
      error,
      {
        ...context,
        function_name: `${provider}_${endpoint}`,
        execution_time_ms: responseTime,
        request_data: {
          rate_limited: context.rate_limited,
          retry_count: context.retry_count,
          response_size: context.response_size
        }
      }
    );
  }

  /**
   * Create performance timer for easy operation tracking
   */
  static createTimer(operationName: string, userId?: string) {
    const startTime = Date.now();
    
    return {
      /**
       * Finish timing and log performance
       */
      finish: async (success: boolean = true, metadata?: Record<string, any>) => {
        const duration = Date.now() - startTime;
        await this.logPerformance({
          operation_name: operationName,
          duration_ms: duration,
          success,
          user_id: userId,
          metadata
        });
        return duration;
      },

      /**
       * Get current elapsed time without finishing
       */
      elapsed: () => Date.now() - startTime
    };
  }

  /**
   * Wrapper for async operations with automatic error logging
   */
  static async withErrorLogging<T>(
    operation: string,
    category: LogCategory,
    fn: () => Promise<T>,
    context: ErrorContext = {}
  ): Promise<T> {
    const timer = this.createTimer(operation, context.user_id);
    
    try {
      const result = await fn();
      await timer.finish(true, { operation });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await timer.finish(false, { operation, error: errorMessage });
      await this.logError(
        LogLevel.ERROR,
        category,
        `Operation failed: ${operation}`,
        error,
        context
      );
      throw error; // Re-throw to maintain original error handling
    }
  }

  /**
   * Log user experience events for product insights
   */
  static async logUserExperience(
    userId: string,
    event: string,
    success: boolean,
    context: {
      feature_used?: string;
      time_to_complete_ms?: number;
      user_satisfaction?: number; // 1-5 scale
      abandonment_point?: string;
      error_encountered?: string;
    } = {}
  ): Promise<void> {
    await this.logError(
      success ? LogLevel.INFO : LogLevel.WARN,
      LogCategory.USER_EXPERIENCE,
      `UX Event: ${event} - ${success ? 'completed' : 'failed'}`,
      success ? undefined : new Error(context.error_encountered || 'User experience issue'),
      {
        user_id: userId,
        execution_time_ms: context.time_to_complete_ms,
        request_data: {
          feature_used: context.feature_used,
          user_satisfaction: context.user_satisfaction,
          abandonment_point: context.abandonment_point
        }
      }
    );
  }

  /**
   * Helper methods for internal use
   */

  private static getLogColor(level: LogLevel): string {
    const colors = {
      [LogLevel.DEBUG]: '🔍',
      [LogLevel.INFO]: '📝',
      [LogLevel.WARN]: '⚠️',
      [LogLevel.ERROR]: '❌',
      [LogLevel.CRITICAL]: '🚨'
    };
    return colors[level] || '📝';
  }

  private static sanitizeContext(context: ErrorContext): ErrorContext {
    const sanitized = { ...context };
    
    // Remove sensitive data from logs
    if (sanitized.request_data) {
      delete sanitized.request_data.password;
      delete sanitized.request_data.access_token;
      delete sanitized.request_data.api_key;
    }
    
    return sanitized;
  }

  private static async triggerErrorAlert(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context: ErrorContext
  ): Promise<void> {
    try {
      if (level === LogLevel.CRITICAL) {
        console.error('🚨 CRITICAL SYSTEM ALERT 🚨', {
          category,
          message,
          user_id: context.user_id,
          operation: context.operation,
          timestamp: new Date().toISOString()
        });
      }

      // Future: Implement external alerting
      // - Email notifications
      // - Slack/Discord webhooks
      // - PagerDuty integration
      // - SMS alerts for critical issues

    } catch (alertError) {
      console.error('Alert system failed:', alertError);
    }
  }

  private static async monitorPerformanceThresholds(metrics: PerformanceMetrics): Promise<void> {
    try {
      // Define performance SLAs
      const performanceSLAs = {
        'GET /api/search/semantic': 2000,           // 2 second SLA
        'POST /api/email-embeddings/start': 1000,  // 1 second SLA
        'GET /api/email-embeddings/status': 500,   // 500ms SLA
        'embedding_processing_batch': 30000,       // 30 seconds per batch
        'pattern_analysis': 120000,                // 2 minutes max
        'query_enhancement': 2000                  // 2 seconds max
      };

      const sla = performanceSLAs[metrics.operation_name as keyof typeof performanceSLAs];
      if (sla && metrics.duration_ms > sla) {
        await this.logError(
          LogLevel.WARN,
          LogCategory.API_PERFORMANCE,
          `⚡ Performance SLA breach: ${metrics.operation_name} took ${metrics.duration_ms}ms (SLA: ${sla}ms)`,
          undefined,
          {
            user_id: metrics.user_id,
            operation: metrics.operation_name,
            execution_time_ms: metrics.duration_ms,
            request_data: {
              sla_threshold: sla,
              breach_amount: metrics.duration_ms - sla,
              metadata: metrics.metadata
            }
          }
        );
      }
    } catch (error) {
      console.error('Performance monitoring failed:', error);
    }
  }

  /**
   * Get error statistics for monitoring dashboard
   */
  static async getErrorStats(timeRange: 'hour' | 'day' | 'week' = 'day') {
    try {
      const timeAgo = new Date();
      const timeRangeHours = { hour: 1, day: 24, week: 168 }[timeRange];
      timeAgo.setHours(timeAgo.getHours() - timeRangeHours);

      const { data: errorStats } = await supabase
        .from('error_logs')
        .select('level, category')
        .gte('created_at', timeAgo.toISOString());

      const { data: perfStats } = await supabase
        .from('performance_logs')
        .select('operation_name, duration_ms, success')
        .gte('timestamp', timeAgo.toISOString());

      return {
        error_summary: this.aggregateStats(errorStats || []),
        performance_summary: this.aggregatePerformanceStats(perfStats || [])
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return null;
    }
  }

  private static aggregateStats(errorLogs: any[]) {
    const stats = {
      total_errors: errorLogs.length,
      by_level: {} as Record<string, number>,
      by_category: {} as Record<string, number>
    };

    errorLogs.forEach(log => {
      stats.by_level[log.level] = (stats.by_level[log.level] || 0) + 1;
      stats.by_category[log.category] = (stats.by_category[log.category] || 0) + 1;
    });

    return stats;
  }

  private static aggregatePerformanceStats(perfLogs: any[]) {
    const stats = {
      total_operations: perfLogs.length,
      success_rate: perfLogs.filter(log => log.success).length / perfLogs.length,
      avg_duration_ms: perfLogs.reduce((sum, log) => sum + log.duration_ms, 0) / perfLogs.length,
      slowest_operations: perfLogs
        .sort((a, b) => b.duration_ms - a.duration_ms)
        .slice(0, 5)
        .map(log => ({ operation: log.operation_name, duration: log.duration_ms }))
    };

    return stats;
  }
}