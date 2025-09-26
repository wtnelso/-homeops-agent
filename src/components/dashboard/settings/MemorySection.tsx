import React, { useState, useEffect } from 'react';
import { Brain, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import AgentMemoryManager from '../../ui/AgentMemoryManager';

interface MemoryStats {
  total_memories: number;
  active_memories: number;
  expired_memories: number;
  confirmed_memories: number;
  email_derived_memories: number;
  memory_types_count: number;
  avg_confidence_score: number;
}

const MemorySection: React.FC = () => {
  const { user, userData } = useAuth();
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (userData?.account?.id) {
      fetchMemoryStats();
    }
  }, [userData?.account?.id, refreshKey]);

  const fetchMemoryStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/agent-memory/stats?accountId=${userData?.account?.id}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch memory statistics');
      }
    } catch (err) {
      setError('Failed to fetch memory statistics');
      console.error('Error fetching memory stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupExpired = async () => {
    if (!confirm('Are you sure you want to delete all expired memories? This action cannot be undone.')) {
      return;
    }

    try {
      setCleanupLoading(true);
      const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/agent-memory/cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        alert(`Successfully cleaned up ${data.deletedCount} expired memories`);
        handleMemoryUpdate();
      } else {
        setError(data.error || 'Failed to cleanup expired memories');
      }
    } catch (err) {
      setError('Failed to cleanup expired memories');
      console.error('Error cleaning up memories:', err);
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleMemoryUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(1) + '%';
  };


  if (!user || !userData?.account?.id) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Please log in to access memory management</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Brain className="h-5 w-5 mr-2" />
          Agent Memory
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          AI-extracted insights and information from your family communications
        </p>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleMemoryUpdate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4 mr-2 inline" />
            Refresh
          </button>
          {stats && stats.expired_memories > 0 && (
            <button
              onClick={handleCleanupExpired}
              disabled={cleanupLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4 mr-2 inline" />
              {cleanupLoading ? 'Cleaning...' : `Cleanup ${stats.expired_memories} Expired`}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Memory Statistics */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <div className="text-lg font-bold text-blue-600 mb-1">
              {stats.total_memories}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <div className="text-lg font-bold text-green-600 mb-1">
              {stats.active_memories}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <div className="text-lg font-bold text-orange-600 mb-1">
              {stats.confirmed_memories}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Confirmed</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <div className="text-lg font-bold text-purple-600 mb-1">
              {stats.email_derived_memories}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">From Email</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <div className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
              {stats.memory_types_count}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Types</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <div className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-1">
              {formatPercentage(stats.avg_confidence_score || 0)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Confidence</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 text-center">
            <div className="text-lg font-bold text-red-600 mb-1">
              {stats.expired_memories}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Expired</div>
          </div>
        </div>
      ) : null}

      {/* Memory Manager */}
      <AgentMemoryManager
        accountId={userData.account.id}
        onMemoryUpdate={handleMemoryUpdate}
      />

    </div>
  );
};

export default MemorySection;