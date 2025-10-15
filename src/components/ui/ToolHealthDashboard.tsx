import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Zap,
  XCircle
} from 'lucide-react';
import { InlineLoader } from './Loader';
import { apiService } from '../../services/authenticatedApiService';
import { ENDPOINTS } from '../../config/apiConfig';

interface ToolHealth {
  health_score: number;
  success_rate: number;
  avg_response_time: number;
  total_executions: number;
  recent_failures: number;
  status: 'healthy' | 'degraded' | 'warning' | 'critical';
}

interface ToolHealthData {
  [toolName: string]: ToolHealth;
}

interface ToolHealthDashboardProps {
  onRefresh?: () => void;
}

const ToolHealthDashboard: React.FC<ToolHealthDashboardProps> = ({ onRefresh }) => {
  const [healthData, setHealthData] = useState<ToolHealthData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    loadHealthData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.get(ENDPOINTS.chatHealth);

      if (response.error) {
        throw new Error(response.error);
      }

      const data = response.data || {};

      if (data.success) {
        setHealthData(data.tools_health || {});
        setLastUpdated(new Date());
      } else {
        throw new Error(data.error || 'Failed to load health data');
      }
    } catch (err) {
      console.error('Failed to load tool health data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load health data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadHealthData();
    onRefresh?.();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'warning':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 0.4) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatToolName = (toolName: string) => {
    return toolName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const overallHealth = Object.values(healthData).length > 0 ?
    Object.values(healthData).reduce((sum, tool) => sum + tool.health_score, 0) / Object.values(healthData).length :
    0;

  const totalExecutions = Object.values(healthData).reduce((sum, tool) => sum + tool.total_executions, 0);
  const totalFailures = Object.values(healthData).reduce((sum, tool) => sum + tool.recent_failures, 0);

  if (loading && Object.keys(healthData).length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center py-8">
          <InlineLoader size="sm" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading tool health data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Tool Health Monitoring
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Performance and reliability metrics for AI tools
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? <InlineLoader size="xs" /> : <RefreshCw className="w-4 h-4 mr-1" />}
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {error ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : Object.keys(healthData).length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">No tool health data available</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Tools will appear here after first execution</p>
          </div>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overall Health</p>
                    <p className={`text-2xl font-bold ${getHealthScoreColor(overallHealth)}`}>
                      {(overallHealth * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-right">
                    {overallHealth >= 0.8 ? (
                      <TrendingUp className="w-6 h-6 text-green-500" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Executions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalExecutions}</p>
                  </div>
                  <Zap className="w-6 h-6 text-blue-500" />
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Failures</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalFailures}</p>
                  </div>
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </div>

            {/* Tool Details */}
            <div className="space-y-4">
              {Object.entries(healthData)
                .sort(([, a], [, b]) => b.health_score - a.health_score)
                .map(([toolName, health]) => (
                <div
                  key={toolName}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(health.status)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {formatToolName(toolName)}
                        </h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}>
                          {health.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getHealthScoreColor(health.health_score)}`}>
                        {(health.health_score * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">health score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Success Rate</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {(health.success_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Avg Response</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatResponseTime(health.avg_response_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Executions</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {health.total_executions}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Recent Failures</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {health.recent_failures}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ToolHealthDashboard;