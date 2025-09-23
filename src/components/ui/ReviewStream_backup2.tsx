import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  CheckCircle,
  XCircle,
  Mail,
  Clock,
  RefreshCw,
  Edit3,
  ArrowLeft,
  Save,
  User,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { profileSuggestionsService, ProfileSuggestion } from '../../services/profileSuggestionsService';

interface ReviewStreamProps {
  className?: string;
}

const ReviewStream: React.FC<ReviewStreamProps> = ({ className = '' }) => {
  const { userData } = useAuth();
  const { showToast } = useToast();
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'confidence-high' | 'confidence-low' | 'type'>('newest');
  const [removingCards, setRemovingCards] = useState<Set<string>>(new Set());
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
  const [newCards, setNewCards] = useState<Set<string>>(new Set());
  const [animatingCards, setAnimatingCards] = useState<Set<string>>(new Set());
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    if (userData?.account?.id) {
      fetchSuggestions();
    }
  }, [userData?.account?.id]);

  const fetchSuggestions = async () => {
    console.log('🔄 fetchSuggestions called - editingCard:', editingCard);
    if (!userData?.account?.id) return;

    // Prevent fetching while in edit mode to avoid disrupting the user
    if (editingCard) {
      console.log('🛑 Blocking fetchSuggestions - user is editing card:', editingCard);
      return;
    }
    try {
      setLoading(true);
      const result = await profileSuggestionsService.getPendingSuggestions(
        userData.account.id,
        10
      );

      if (result.success) {
        const prevSuggestionIds = new Set(suggestions.map(s => s.id));
        const newSuggestionIds = result.suggestions
          .filter(s => !prevSuggestionIds.has(s.id))
          .map(s => s.id);

        // Mark new cards for entrance animation
        if (newSuggestionIds.length > 0) {
          setNewCards(new Set(newSuggestionIds));
          // Remove new card markers after animation
          setTimeout(() => {
            setNewCards(new Set());
          }, 600);
        }

        setSuggestions(result.suggestions);
      } else {
        showToast('Failed to load suggestions', 'error');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      showToast('Failed to load suggestions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (suggestion: ProfileSuggestion) => {
    console.log('🎯 EDIT BUTTON CLICKED - Suggestion ID:', suggestion.id);
    console.log('🎯 Current editingCard state:', editingCard);
    console.log('🎯 Setting editingCard to:', suggestion.id);

    setEditingCard(suggestion.id);

    // Initialize edit data with suggestion data and smart defaults
    const editInitialData = {
      ...suggestion.suggested_data,
      saveAs: determineSaveType(suggestion.suggestion_type, suggestion.suggested_data),
      expirationDate: getDefaultExpiration(suggestion.suggestion_type),
      customExpiration: ''
    };

    console.log('🎯 Edit data initialized:', editInitialData);
    setEditData(editInitialData);
  };

  const determineSaveType = (suggestionType: string, data: any): 'profile' | 'context' => {
    // Smart defaults based on suggestion type and content
    switch (suggestionType) {
      case 'family_info':
        // Names, birthdays -> Profile; activities, temp schedules -> Context
        if (data.birthday || data.member_name) return 'profile';
        if (data.activity || data.temporary) return 'context';
        return 'profile';

      case 'contact_add':
        // Healthcare, emergency -> Profile; temporary contacts -> Context
        if (data.role?.toLowerCase().includes('doctor') ||
            data.role?.toLowerCase().includes('emergency')) return 'profile';
        return 'context';

      case 'preference_update':
        // Core preferences -> Profile; seasonal/temporary -> Context
        if (data.preference_type === 'dietary_restrictions' ||
            data.preference_type === 'emergency_contact') return 'profile';
        return 'context';

      default:
        return 'context';
    }
  };

  const getDefaultExpiration = (suggestionType: string): string => {
    switch (suggestionType) {
      case 'family_info': return 'school-year';
      case 'preference_update': return '1-year';
      case 'contact_add': return 'never';
      default: return '6-months';
    }
  };

  const handleCancelEdit = () => {
    setEditingCard(null);
    setEditData(null);
  };

  const handleSaveEdit = async (suggestionId: string) => {
    if (!userData?.account?.id || !editData) return;

    try {
      setActionLoading(suggestionId);
      setAnimatingCards(prev => new Set(prev).add(suggestionId));

      // Process the edited suggestion with user modifications
      const result = await profileSuggestionsService.approveSuggestionWithEdits(
        suggestionId,
        userData.account.id,
        editData
      );

      if (result.success) {
        setRemovingCards(prev => new Set(prev).add(suggestionId));
        showToast('Suggestion saved!', 'success');
        setEditingCard(null);
        setEditData(null);

        setTimeout(() => {
          setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
          setRemovingCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(suggestionId);
            return newSet;
          });
          setAnimatingCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(suggestionId);
            return newSet;
          });
        }, 600);
      } else {
        showToast(result.error || 'Failed to save suggestion', 'error');
        setAnimatingCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(suggestionId);
          return newSet;
        });
      }
    } catch (error) {
      showToast('Failed to save suggestion', 'error');
      setAnimatingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (suggestionId: string) => {
    if (!userData?.account?.id) return;

    try {
      setActionLoading(suggestionId);
      setAnimatingCards(prev => new Set(prev).add(suggestionId));

      // Brief delay to show the action loading state
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = await profileSuggestionsService.approveSuggestion(suggestionId, userData.account.id);

      if (result.success) {
        // Start removal animation
        setRemovingCards(prev => new Set(prev).add(suggestionId));
        showToast('Suggestion approved!', 'success');

        // Wait for animation to complete before removing from state
        setTimeout(() => {
          setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
          setRemovingCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(suggestionId);
            return newSet;
          });
          setAnimatingCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(suggestionId);
            return newSet;
          });
        }, 600); // Slightly longer for smoother animation
      } else {
        showToast(result.error || 'Failed to approve suggestion', 'error');
        // Remove from animating set if failed
        setAnimatingCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(suggestionId);
          return newSet;
        });
      }
    } catch (error) {
      showToast('Failed to approve suggestion', 'error');
      setAnimatingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (suggestionId: string) => {
    if (!userData?.account?.id) return;

    try {
      setActionLoading(suggestionId);
      setAnimatingCards(prev => new Set(prev).add(suggestionId));

      // Brief delay to show the action loading state
      await new Promise(resolve => setTimeout(resolve, 150));

      const result = await profileSuggestionsService.rejectSuggestion(suggestionId, userData.account.id);

      if (result.success) {
        // Start removal animation
        setRemovingCards(prev => new Set(prev).add(suggestionId));
        showToast('Suggestion rejected', 'success');

        // Wait for animation to complete before removing from state
        setTimeout(() => {
          setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
          setRemovingCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(suggestionId);
            return newSet;
          });
          setAnimatingCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(suggestionId);
            return newSet;
          });
        }, 600); // Slightly longer for smoother animation
      } else {
        showToast(result.error || 'Failed to reject suggestion', 'error');
        // Remove from animating set if failed
        setAnimatingCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(suggestionId);
          return newSet;
        });
      }
    } catch (error) {
      showToast('Failed to reject suggestion', 'error');
      setAnimatingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(suggestionId);
        return newSet;
      });
    } finally {
      setActionLoading(null);
    }
  };


  const formatSuggestionData = (suggestion: ProfileSuggestion) => {
    const data = suggestion.suggested_data;

    switch (suggestion.suggestion_type) {
      case 'family_info':
        if (data.member_name && data.activity) {
          return `Add ${data.activity} for ${data.member_name}`;
        }
        if (data.member_name && data.school) {
          return `Add school ${data.school} for ${data.member_name}`;
        }
        return 'Update family information';

      case 'preference_update':
        if (data.preference_type && data.value) {
          return `Update ${data.preference_type}: ${data.value}`;
        }
        return 'Update preferences';

      case 'contact_add':
        if (data.name && data.role) {
          return `Add contact: ${data.name} (${data.role})`;
        }
        return 'Add new contact';

      default:
        return 'Profile update';
    }
  };

  const getConfidenceDisplay = (score: number) => {
    return profileSuggestionsService.getConfidenceLevel(score);
  };

  const sortSuggestions = (suggestions: ProfileSuggestion[]) => {
    const sorted = [...suggestions];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'confidence-high':
        return sorted.sort((a, b) => b.confidence_score - a.confidence_score);
      case 'confidence-low':
        return sorted.sort((a, b) => a.confidence_score - b.confidence_score);
      case 'type':
        return sorted.sort((a, b) => a.suggestion_type.localeCompare(b.suggestion_type));
      default:
        return sorted;
    }
  };

  if (!userData?.account?.id) {
    return null;
  }

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            AI Suggestions
          </h2>
        </div>
        <div className="flex-1 animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            AI Suggestions
          </h2>
          <button
            onClick={fetchSuggestions}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">All caught up! No pending suggestions.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-6 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            AI Suggestions ({suggestions.length})
          </h2>
          <button
            onClick={fetchSuggestions}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="confidence-high">High Confidence</option>
            <option value="confidence-low">Low Confidence</option>
            <option value="type">Suggestion Type</option>
          </select>
        </div>
      </div>

      {/* Suggestions List */}
      <div className="flex-1 overflow-y-auto">
        <div className="transition-all duration-300 ease-in-out">
          {sortSuggestions(suggestions).map((suggestion, index) => {
            const confidence = getConfidenceDisplay(suggestion.confidence_score);
            const isLoading = actionLoading === suggestion.id;
            const isNew = newCards.has(suggestion.id);
            const isAnimating = animatingCards.has(suggestion.id);
            const isRemoving = removingCards.has(suggestion.id);
            const isEditing = editingCard === suggestion.id;

            if (isEditing) {
              console.log(`📋 RENDERING EDIT MODE for suggestion ${suggestion.id}`, {
                editingCard,
                isEditing,
                hasEditData: !!editData
              });
            }

            return (
              <div
                key={suggestion.id}
                className={`overflow-hidden transition-all duration-600 ease-in-out mb-3 ${
                  isRemoving
                    ? 'max-h-0 opacity-0 transform scale-95'
                    : isNew
                    ? 'max-h-96 opacity-100 animate-slide-in-from-right'
                    : isEditing
                    ? 'max-h-[500px] opacity-100'
                    : 'max-h-96 opacity-100'
                }`}
                style={{
                  animationDelay: isNew ? `${index * 100}ms` : '0ms'
                }}
              >
                <div className={`relative border rounded-lg transition-all duration-300 ease-in-out border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md ${
                  isAnimating ? 'ring-2 ring-blue-200 dark:ring-blue-800 shadow-lg transform scale-[1.02]' : ''
                } ${
                  isLoading ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                } ${
                  isEditing ? 'shadow-lg ring-2 ring-blue-300 dark:ring-blue-600' : ''
                }`}>
                  {/* Normal View */}
                  <div className={`p-3 transition-all duration-300 ease-in-out ${
                    isEditing ? 'transform -translate-x-full opacity-0 absolute inset-0 pointer-events-none' : 'transform translate-x-0 opacity-100'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Suggestion Content */}
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {profileSuggestionsService.getSuggestionTypeDisplay(suggestion.suggestion_type)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${confidence.bgColor} ${confidence.color} flex-shrink-0`}>
                            {confidence.level}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                          {formatSuggestionData(suggestion)}
                        </p>

                        {/* Source Information */}
                        <div className="space-y-1">
                          {suggestion.source_email_subject && (
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{suggestion.source_email_subject}</span>
                            </div>
                          )}
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span>{new Date(suggestion.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleEdit(suggestion);
                          }}
                          disabled={isLoading}
                          className="suggestion-button p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md disabled:opacity-50"
                          title="Edit this suggestion before saving"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            console.log('✅ APPROVE BUTTON CLICKED - Card will be approved and removed');
                            handleApprove(suggestion.id);
                          }}
                          disabled={isLoading}
                          className="suggestion-button p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md disabled:opacity-50"
                          title={`Quick approve - save to ${determineSaveType(suggestion.suggestion_type, suggestion.suggested_data)}`}
                        >
                          {isLoading ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            console.log('❌ REJECT BUTTON CLICKED - Card will be rejected and removed');
                            handleReject(suggestion.id);
                          }}
                          disabled={isLoading}
                          className="suggestion-button p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50"
                          title={`Reject this ${profileSuggestionsService.getSuggestionTypeDisplay(suggestion.suggestion_type).toLowerCase()} suggestion`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Edit Mode - Slides over */}
                  {isEditing && editData && (
                    <div className={`absolute inset-0 bg-white dark:bg-gray-800 p-3 transition-all duration-300 ease-in-out z-50 ${
                      isEditing ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'
                    }`}>
                      <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit Suggestion
                            </h3>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Save As Selection */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Save as:</label>
                            <div className="flex space-x-6">
                              <label className="flex items-center cursor-pointer group">
                                <input
                                  type="radio"
                                  name={`saveAs-${suggestion.id}`}
                                  value="profile"
                                  checked={editData.saveAs === 'profile'}
                                  onChange={(e) => setEditData({ ...editData, saveAs: e.target.value as 'profile' | 'context' })}
                                  className="mr-2"
                                />
                                <User className="h-4 w-4 mr-2 text-blue-600" />
                                <span
                                  className="text-sm font-medium"
                                  title="Permanent family information - names, contacts, core details that don't change"
                                >
                                  Profile
                                </span>
                              </label>
                              <label className="flex items-center cursor-pointer group">
                                <input
                                  type="radio"
                                  name={`saveAs-${suggestion.id}`}
                                  value="context"
                                  checked={editData.saveAs === 'context'}
                                  onChange={(e) => setEditData({ ...editData, saveAs: e.target.value as 'profile' | 'context' })}
                                  className="mr-2"
                                />
                                <Calendar className="h-4 w-4 mr-2 text-green-600" />
                                <span
                                  className="text-sm font-medium"
                                  title="Temporary information - schedules, activities, seasonal details with expiration dates"
                                >
                                  Context
                                </span>
                              </label>
                            </div>
                          </div>

                          {/* Expiration for Context */}
                          {editData.saveAs === 'context' && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Valid until:</label>
                              <select
                                value={editData.expirationDate}
                                onChange={(e) => setEditData({ ...editData, expirationDate: e.target.value })}
                                className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="1-month">1 Month</option>
                                <option value="3-months">3 Months</option>
                                <option value="6-months">6 Months</option>
                                <option value="school-year">School Year</option>
                                <option value="1-year">1 Year</option>
                                <option value="custom">Custom Date</option>
                              </select>
                              {editData.expirationDate === 'custom' && (
                                <input
                                  type="date"
                                  value={editData.customExpiration}
                                  onChange={(e) => setEditData({ ...editData, customExpiration: e.target.value })}
                                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              )}
                            </div>
                          )}

                          {/* Editable Fields */}
                          <div className="space-y-3">
                            {Object.entries(editData)
                              .filter(([key]) => !['saveAs', 'expirationDate', 'customExpiration'].includes(key))
                              .map(([key, value]) => (
                                <div key={key} className="space-y-1">
                                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                    {key.replace(/_/g, ' ')}:
                                  </label>
                                  <input
                                    type="text"
                                    value={value as string}
                                    onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                                    className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                  />
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Action Buttons - Fixed at bottom */}
                        <div className="border-t dark:border-gray-700 pt-3 mt-3">
                          <div className="flex items-center justify-between">
                            <button
                              onClick={handleCancelEdit}
                              className="flex items-center text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            >
                              <ArrowLeft className="h-4 w-4 mr-1" />
                              Back
                            </button>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleReject(suggestion.id)}
                                disabled={isLoading}
                                className="px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md disabled:opacity-50 transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleSaveEdit(suggestion.id)}
                                disabled={isLoading}
                                className="flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 transition-colors"
                              >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ReviewStream;