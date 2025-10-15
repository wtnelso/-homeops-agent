import React, { useState, useEffect } from 'react';
import { Filter, CheckCircle, Clock, AlertCircle, Sparkles, Trash2, Eye, Heart, Calendar, Users, Target, Utensils, Hospital, GraduationCap, Briefcase, Palette, MessageCircle, Brain } from 'lucide-react';
import { apiService } from '../../services/authenticatedApiService';
import { ENDPOINTS } from '../../config/apiConfig';

interface Memory {
  id: string;
  memory_text: string;
  memory_type: string;
  confidence_score: number;
  is_active: boolean;
  is_confirmed: boolean;
  created_at: string;
  expires_at: string | null;
  derived_from_source: string;
  entity_name?: string;
  last_referenced_at: string | null;
}

interface AgentMemoryManagerProps {
  userId: string;
  onMemoryUpdate: () => void;
}

const AgentMemoryManager: React.FC<AgentMemoryManagerProps> = ({ userId, onMemoryUpdate }) => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    fetchMemories();
  }, [userId]);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      console.log('🔍 FRONTEND DEBUG: Fetching memories for userId:', userId);
      const response = await apiService.get(`${ENDPOINTS.agentMemory}?userId=${userId}`);

      console.log('🔍 FRONTEND DEBUG: API response:', response);

      if (response.error) {
        setError(response.error || 'Failed to fetch memories');
        return;
      }

      const data = response.data;
      console.log('🔍 FRONTEND DEBUG: Response data:', data);

      if (data?.success) {
        // Transform backend data format to frontend format
        const transformedMemories = (data.memories || []).map((memory: any) => ({
          id: memory.id,
          memory_text: typeof memory.value === 'object' ? JSON.stringify(memory.value) : String(memory.value || ''),
          memory_type: memory.memory_type,
          confidence_score: memory.confidence_score,
          is_active: memory.expires_at === null || new Date(memory.expires_at) > new Date(),
          is_confirmed: memory.is_user_confirmed || false,
          created_at: memory.created_at,
          expires_at: memory.expires_at,
          derived_from_source: memory.source_type || 'unknown',
          entity_name: memory.key,
          last_referenced_at: memory.updated_at
        }));

        console.log('🔍 FRONTEND DEBUG: Transformed memories:', transformedMemories);
        setMemories(transformedMemories);
      } else {
        setError(data?.error || 'Failed to fetch memories');
      }
    } catch (err) {
      setError('Failed to fetch memories');
      console.error('Error fetching memories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (memoryId: string, currentStatus: boolean) => {
    try {
      const response = await apiService.put(`${ENDPOINTS.agentMemory}/${memoryId}/toggle`, {
        is_active: !currentStatus
      });

      if (response.error) {
        setError(response.error || 'Failed to update memory');
        return;
      }

      const data = response.data;
      if (data?.success) {
        await fetchMemories();
        onMemoryUpdate();
      } else {
        setError(data?.error || 'Failed to update memory');
      }
    } catch (err) {
      setError('Failed to update memory');
      console.error('Error updating memory:', err);
    }
  };

  const handleConfirmMemory = async (memoryId: string) => {
    try {
      const response = await apiService.post(`${ENDPOINTS.agentMemory}/confirm`, {
        memoryId,
        userId
      });

      if (response.error) {
        setError(response.error || 'Failed to confirm memory');
        return;
      }

      const data = response.data;
      if (data?.success) {
        await fetchMemories();
        onMemoryUpdate();
      } else {
        setError(data?.error || 'Failed to confirm memory');
      }
    } catch (err) {
      setError('Failed to confirm memory');
      console.error('Error confirming memory:', err);
    }
  };

  const handleDeleteMemory = async (memoryId: string) => {
    if (!confirm('Are you sure you want to delete this memory? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiService.request(ENDPOINTS.agentMemory, {
        method: 'DELETE',
        body: { memoryId, userId }
      });

      if (response.error) {
        setError(response.error || 'Failed to delete memory');
        return;
      }

      const data = response.data;
      if (data?.success) {
        await fetchMemories();
        onMemoryUpdate();
      } else {
        setError(data?.error || 'Failed to delete memory');
      }
    } catch (err) {
      setError('Failed to delete memory');
      console.error('Error deleting memory:', err);
    }
  };

  const getMemoryTypeIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'preference': <Heart className="w-4 h-4 text-red-500" />,
      'schedule': <Calendar className="w-4 h-4 text-blue-500" />,
      'family_member': <Users className="w-4 h-4 text-green-500" />,
      'activity': <Target className="w-4 h-4 text-purple-500" />,
      'food': <Utensils className="w-4 h-4 text-orange-500" />,
      'health': <Hospital className="w-4 h-4 text-red-500" />,
      'school': <GraduationCap className="w-4 h-4 text-blue-500" />,
      'work': <Briefcase className="w-4 h-4 text-gray-600" />,
      'hobby': <Palette className="w-4 h-4 text-pink-500" />,
      'general': <MessageCircle className="w-4 h-4 text-gray-500" />
    };
    return iconMap[type] || <MessageCircle className="w-4 h-4 text-gray-500" />;
  };

  const getStatusBadge = (memory: Memory) => {
    if (!memory.is_active) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
          <Clock className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }
    if (memory.is_confirmed) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Confirmed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
        <Sparkles className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredMemories = memories.filter(memory => {
    if (selectedType !== 'all' && memory.memory_type !== selectedType) {
      return false;
    }
    if (selectedStatus === 'active' && !memory.is_active) {
      return false;
    }
    if (selectedStatus === 'confirmed' && !memory.is_confirmed) {
      return false;
    }
    if (selectedStatus === 'expired' && memory.is_active) {
      return false;
    }
    return true;
  });

  const memoryTypes = [...new Set(memories.map(m => m.memory_type))];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex space-x-4 mb-6">
          {[1, 2].map(i => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-40 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-40"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All Types</option>
            {memoryTypes.map(type => (
              <option key={type} value={type}>
                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="confirmed">Confirmed</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Memory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMemories.map((memory) => (
          <div
            key={memory.id}
            className={`bg-white dark:bg-gray-800 rounded-2xl border p-4 hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${
              memory.is_confirmed
                ? 'border-green-200 dark:border-green-700 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900'
                : memory.is_active
                ? 'border-blue-200 dark:border-blue-700'
                : 'border-gray-200 dark:border-gray-700 opacity-75'
            }`}
          >
            {/* Memory Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getMemoryTypeIcon(memory.memory_type)}
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 capitalize">
                  {memory.memory_type.replace('_', ' ')}
                </span>
              </div>
              {getStatusBadge(memory)}
            </div>

            {/* Memory Content */}
            <div className="mb-4">
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed line-clamp-3">
                {memory.memory_text}
              </p>
              {memory.entity_name && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  About: {memory.entity_name}
                </p>
              )}
            </div>

            {/* Memory Metadata */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">Confidence</span>
                <span className={`font-bold ${getConfidenceColor(memory.confidence_score)}`}>
                  {Math.round(memory.confidence_score * 100)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">Created</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {formatDate(memory.created_at)}
                </span>
              </div>
              {memory.expires_at && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Expires</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatDate(memory.expires_at)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex space-x-2">
                {memory.is_active && !memory.is_confirmed && (
                  <button
                    onClick={() => handleConfirmMemory(memory.id)}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700 rounded-md transition-colors"
                  >
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    Confirm
                  </button>
                )}
                <button
                  onClick={() => handleToggleActive(memory.id, memory.is_active)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    memory.is_active
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-100 dark:hover:bg-blue-700'
                  }`}
                >
                  {memory.is_active ? (
                    <>
                      <Eye className="w-3 h-3 inline mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 inline mr-1" />
                      Reactivate
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => handleDeleteMemory(memory.id)}
                className="px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 rounded-md transition-colors"
              >
                <Trash2 className="w-3 h-3 inline mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMemories.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No memories found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {selectedType !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your filters to see more memories.'
              : 'Your AI assistant will start learning about your family as you interact with it.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentMemoryManager;