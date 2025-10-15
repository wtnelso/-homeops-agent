import React, { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle,
  RefreshCw,
  User,
  Cake,
  GraduationCap,
  Phone,
  Heart,
  Sparkles,
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [reviewData, setReviewData] = useState<any>(null);

  // Initialize review data for current suggestion
  const initializeReviewData = (suggestion: ProfileSuggestion) => {
    setReviewData({
      ...suggestion.suggested_data,
      saveAs: determineSaveType(suggestion.suggestion_type, suggestion.suggested_data),
      selectedMemberId: '',
      expirationDate: suggestion.suggested_data.default_expiration || getDefaultExpiration(suggestion.suggestion_type, suggestion.suggested_data),
      customExpiration: ''
    });
  };

  useEffect(() => {
    if (userData?.account?.id) {
      fetchSuggestions();
    }
  }, [userData?.account?.id]);

  const fetchSuggestions = async () => {
    console.log('🔍 ReviewStream: fetchSuggestions called');
    console.log('🔍 ReviewStream: userData?.user?.id:', userData?.user?.id);

    if (!userData?.user?.id) {
      console.log('🔍 ReviewStream: No user ID found, returning early');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 ReviewStream: Calling getPendingSuggestions...');
      const result = await profileSuggestionsService.getPendingSuggestions(
        userData.user.id,
        10
      );
      console.log('🔍 ReviewStream: Result received:', result);

      if (result.success) {
        setSuggestions(result.suggestions);

        // Initialize review data for first suggestion if available
        if (result.suggestions.length > 0 && currentIndex < result.suggestions.length) {
          initializeReviewData(result.suggestions[currentIndex]);
        }
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

  const getDefaultExpiration = (suggestionType: string, suggestionData?: any): string => {
    switch (suggestionType) {
      case 'family_info': return 'school-year';
      case 'preference_update':
        // Never expire critical preferences
        if (suggestionData?.preference_type) {
          const prefType = suggestionData.preference_type.toLowerCase();
          if (prefType === 'allergy' ||
              prefType === 'allergies' ||
              prefType === 'dietary_restriction' ||
              prefType === 'dietary_restrictions' ||
              prefType === 'emergency_contact') {
            return 'never';
          }
        }
        return '1-year';
      case 'contact_add': return 'never';
      default: return '6-months';
    }
  };

  // Helper function to get visual context icons for different content types
  const getContextIcon = (suggestion: ProfileSuggestion): JSX.Element => {
    const data = suggestion.suggested_data;
    switch (suggestion.suggestion_type) {
      case 'family_info':
        if (data.birthday || data.age) return <Cake className="h-4 w-4 text-pink-500" />;
        if (data.school || data.grade) return <GraduationCap className="h-4 w-4 text-blue-500" />;
        if (data.activity) return <Calendar className="h-4 w-4 text-green-500" />;
        return <User className="h-4 w-4 text-purple-500" />;
      case 'contact_add': return <Phone className="h-4 w-4 text-orange-500" />;
      case 'preference_update': return <Heart className="h-4 w-4 text-red-500" />;
      default: return <Sparkles className="h-4 w-4 text-indigo-500" />;
    }
  };

  // Smart confidence display with dynamic phrasing based on card type
  const getSmartConfidenceDisplay = (suggestion: ProfileSuggestion): JSX.Element => {
    const percentage = Math.round(suggestion.confidence_score * 100);
    const data = suggestion.suggested_data;

    let phrasing = '';
    switch (suggestion.suggestion_type) {
      case 'family_info':
        const memberName = data.member_name || data.name || 'family member';
        phrasing = `AI is ${percentage}% sure this belongs to ${memberName}'s profile`;
        break;
      case 'preference_update':
        phrasing = `AI is ${percentage}% sure this is a new preference`;
        break;
      case 'contact_add':
        phrasing = `AI is ${percentage}% sure this is a new contact`;
        break;
      default:
        phrasing = `AI is ${percentage}% confident`;
    }

    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2">
        <div className="flex items-center text-xs text-gray-700 dark:text-gray-300">
          <Sparkles className="h-3 w-3 mr-1 text-blue-500" />
          <span>{phrasing}</span>
        </div>
      </div>
    );
  };




  const handleApprove = async () => {
    console.log('🔍 ReviewStream: handleApprove called');
    if (!userData?.user?.id || currentIndex >= suggestions.length) {
      console.log('🔍 ReviewStream: No user ID or invalid index, returning early');
      return;
    }

    const suggestion = suggestions[currentIndex];
    if (!suggestion || !reviewData) return;

    try {
      setActionLoading(suggestion.id);
      setSwipeDirection('right');

      console.log('🔍 ReviewStream: Calling approveSuggestionWithEdits...');
      const result = await profileSuggestionsService.approveSuggestionWithEdits(
        suggestion.id,
        userData.user.id,
        reviewData,
        suggestion.suggestion_type,
        userData.family?.id || ''
      );

      if (result.success) {
        showToast('Suggestion approved!', 'success');

        // Remove current suggestion and move to next
        setTimeout(() => {
          setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
          setSwipeDirection(null);

          // Reset index if we're at the end
          if (currentIndex >= suggestions.length - 1) {
            setCurrentIndex(0);
          }

          // Initialize review data for new current suggestion
          const remainingSuggestions = suggestions.filter(s => s.id !== suggestion.id);
          if (remainingSuggestions.length > 0) {
            const nextIndex = currentIndex >= remainingSuggestions.length ? 0 : currentIndex;
            if (remainingSuggestions[nextIndex]) {
              initializeReviewData(remainingSuggestions[nextIndex]);
            }
          }
        }, 300);
      } else {
        showToast(result.error || 'Failed to approve suggestion', 'error');
        setSwipeDirection(null);
      }
    } catch (error) {
      showToast('Failed to approve suggestion', 'error');
      setSwipeDirection(null);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async () => {
    console.log('🔍 ReviewStream: handleDismiss called');
    if (!userData?.user?.id || currentIndex >= suggestions.length) {
      console.log('🔍 ReviewStream: No user ID or invalid index, returning early');
      return;
    }

    const suggestion = suggestions[currentIndex];
    if (!suggestion) return;

    try {
      setActionLoading(suggestion.id);
      setSwipeDirection('left');

      console.log('🔍 ReviewStream: Calling rejectSuggestion...');
      const result = await profileSuggestionsService.rejectSuggestion(suggestion.id, userData.user.id);
      console.log('🔍 ReviewStream: rejectSuggestion result:', result);

      if (result.success) {
        showToast('Suggestion dismissed', 'success');

        // Remove current suggestion and move to next
        setTimeout(() => {
          setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
          setSwipeDirection(null);

          // Reset index if we're at the end
          if (currentIndex >= suggestions.length - 1) {
            setCurrentIndex(0);
          }

          // Initialize review data for new current suggestion
          const remainingSuggestions = suggestions.filter(s => s.id !== suggestion.id);
          if (remainingSuggestions.length > 0) {
            const nextIndex = currentIndex >= remainingSuggestions.length ? 0 : currentIndex;
            if (remainingSuggestions[nextIndex]) {
              initializeReviewData(remainingSuggestions[nextIndex]);
            }
          }
        }, 300);
      } else {
        showToast(result.error || 'Failed to reject suggestion', 'error');
        setSwipeDirection(null);
      }
    } catch (error) {
      showToast('Failed to reject suggestion', 'error');
      setSwipeDirection(null);
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
        return '';

      case 'contact_add':
        if (data.name && data.role) {
          return `Add contact: ${data.name} (${data.role})`;
        }
        return 'Add new contact';

      default:
        return 'Profile update';
    }
  };

  // Get current suggestion
  const currentSuggestion = suggestions[currentIndex];

  // Update review data when currentIndex changes
  React.useEffect(() => {
    if (currentSuggestion) {
      initializeReviewData(currentSuggestion);
    }
  }, [currentIndex, currentSuggestion]);

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

  if (!currentSuggestion) {
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
            <RefreshCw className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Loading suggestions...</p>
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
            AI Suggestions
          </h2>
          <button
            onClick={fetchSuggestions}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentIndex + 1} of {suggestions.length}
            </span>
            <div className="flex space-x-1">
              {suggestions.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? 'bg-blue-600'
                      : index < currentIndex
                      ? 'bg-green-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={() => setCurrentIndex(Math.min(suggestions.length - 1, currentIndex + 1))}
              disabled={currentIndex === suggestions.length - 1}
              className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Single Card Display */}
      <div className="flex-1 flex items-center justify-center">
        <div className={`w-full max-w-2xl transition-all duration-300 ease-in-out transform ${
          swipeDirection === 'left'
            ? '-translate-x-full opacity-0'
            : swipeDirection === 'right'
            ? 'translate-x-full opacity-0'
            : 'translate-x-0 opacity-100'
        }`}>

          <div className={`relative border rounded-2xl shadow-xl transition-all duration-300 ease-in-out border-gray-200 dark:border-gray-600 min-h-[400px] ${
            actionLoading ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'
          }`}>

            {/* Card Content */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Suggestion Content */}
                  <div className="mb-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={`p-2.5 rounded-lg ${
                          currentSuggestion.suggestion_type === 'family_info'
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                            : currentSuggestion.suggestion_type === 'contact_add'
                            ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
                            : currentSuggestion.suggestion_type === 'preference_update'
                            ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {getContextIcon(currentSuggestion)}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {profileSuggestionsService.getSuggestionTypeDisplay(currentSuggestion.suggestion_type)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                    {formatSuggestionData(currentSuggestion)}
                  </p>

                  {/* Source Information */}
                  <div className="space-y-1">
                    {currentSuggestion.source_email_subject && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="mr-1">📧</span>
                        <span className="truncate">{currentSuggestion.source_email_subject}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Date in top right corner */}
                <div className="ml-4 flex-shrink-0">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="mr-1">📅</span>
                    <span>{new Date(currentSuggestion.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

              </div>

              {/* Confidence Display - With highlight */}
              <div className="mb-3">
                {getSmartConfidenceDisplay(currentSuggestion)}
              </div>

            </div>

            {/* Editable Form Fields */}
            {reviewData && (
              <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700">
                <div className="pt-4 space-y-4">

                  {/* Dynamic form fields based on suggestion type */}
                  {currentSuggestion.suggestion_type === 'family_info' && (
                    <div className="space-y-3">
                      {reviewData.birthday && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Cake className="h-4 w-4 mr-1 inline text-gray-500" />
                            Birthday:
                          </label>
                          <input
                            type="date"
                            value={reviewData.birthday || ''}
                            onChange={(e) => setReviewData({ ...reviewData, birthday: e.target.value })}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      )}
                      {reviewData.school && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <GraduationCap className="h-4 w-4 mr-1 inline text-gray-500" />
                            School:
                          </label>
                          <input
                            type="text"
                            value={reviewData.school || ''}
                            onChange={(e) => setReviewData({ ...reviewData, school: e.target.value })}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter school name"
                          />
                        </div>
                      )}
                      {reviewData.age && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <User className="h-4 w-4 mr-1 inline text-gray-500" />
                            Age:
                          </label>
                          <input
                            type="number"
                            value={reviewData.age || ''}
                            onChange={(e) => setReviewData({ ...reviewData, age: e.target.value })}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter age"
                          />
                        </div>
                      )}
                      {reviewData.grade && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <GraduationCap className="h-4 w-4 mr-1 inline text-gray-500" />
                            Grade:
                          </label>
                          <input
                            type="text"
                            value={reviewData.grade || ''}
                            onChange={(e) => setReviewData({ ...reviewData, grade: e.target.value })}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter grade"
                          />
                        </div>
                      )}
                      {reviewData.activity && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Calendar className="h-4 w-4 mr-1 inline text-gray-500" />
                            Activity:
                          </label>
                          <input
                            type="text"
                            value={reviewData.activity || ''}
                            onChange={(e) => setReviewData({ ...reviewData, activity: e.target.value })}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter activity"
                          />
                        </div>
                      )}
                      {reviewData.activity_type && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Calendar className="h-4 w-4 mr-1 inline text-gray-500" />
                            Activity Type:
                          </label>
                          <input
                            type="text"
                            value={reviewData.activity_type || ''}
                            onChange={(e) => setReviewData({ ...reviewData, activity_type: e.target.value })}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter activity type"
                          />
                        </div>
                      )}
                      {reviewData.schedule && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            <Calendar className="h-4 w-4 mr-1 inline text-gray-500" />
                            Schedule:
                          </label>
                          <input
                            type="text"
                            value={reviewData.schedule || ''}
                            onChange={(e) => setReviewData({ ...reviewData, schedule: e.target.value })}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter schedule"
                          />
                        </div>
                      )}

                      {/* Expiration for Family Info */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          📅 Valid until:
                        </label>
                        <select
                          value={reviewData.expirationDate || 'school-year'}
                          onChange={(e) => setReviewData({ ...reviewData, expirationDate: e.target.value })}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="never">No Expiration</option>
                          <option value="1-month">1 Month ({new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                          <option value="3-months">3 Months ({new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                          <option value="6-months">6 Months ({new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                          <option value="school-year">School Year ({new Date(new Date().getFullYear() + (new Date().getMonth() >= 5 ? 1 : 0), 5, 30).toLocaleDateString()})</option>
                          <option value="1-year">1 Year ({new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                          <option value="custom">Custom Date</option>
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Set expiration for temporary information like schedules and activities. Permanent details like birthdays have no expiration.
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                          🧠 AI smartly determined the valid by date
                        </p>
                        {reviewData.expirationDate === 'custom' && (
                          <input
                            type="date"
                            value={reviewData.customExpiration || ''}
                            onChange={(e) => setReviewData({ ...reviewData, customExpiration: e.target.value })}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {currentSuggestion.suggestion_type === 'contact_add' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          <User className="h-4 w-4 mr-1 inline text-gray-500" />
                          Name:
                        </label>
                        <input
                          type="text"
                          value={reviewData.name || ''}
                          onChange={(e) => setReviewData({ ...reviewData, name: e.target.value })}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter contact name"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          <Phone className="h-4 w-4 mr-1 inline text-gray-500" />
                          Phone:
                        </label>
                        <input
                          type="tel"
                          value={reviewData.phone || ''}
                          onChange={(e) => setReviewData({ ...reviewData, phone: e.target.value })}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Email:
                        </label>
                        <input
                          type="email"
                          value={reviewData.email || ''}
                          onChange={(e) => setReviewData({ ...reviewData, email: e.target.value })}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          <User className="h-4 w-4 mr-1 inline text-gray-500" />
                          Role:
                        </label>
                        <input
                          type="text"
                          value={reviewData.role || ''}
                          onChange={(e) => setReviewData({ ...reviewData, role: e.target.value })}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Doctor, Teacher, Emergency Contact"
                        />
                      </div>
                    </div>
                  )}

                  {currentSuggestion.suggestion_type === 'preference_update' && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span className="mr-1">🏷️</span>
                          Preference Type:
                        </label>
                        <select
                          value={reviewData.preference_type || 'other'}
                          onChange={(e) => setReviewData({ ...reviewData, preference_type: e.target.value })}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="dietary_restrictions">Dietary Restrictions</option>
                          <option value="allergies">Allergies</option>
                          <option value="communication_preference">Communication Preference</option>
                          <option value="bedtime">Bedtime Schedule</option>
                          <option value="screen_time">Screen Time Limits</option>
                          <option value="transportation">Transportation</option>
                          <option value="homework_schedule">Homework Schedule</option>
                          <option value="chore_schedule">Chore Schedule</option>
                          <option value="extracurricular">Extracurricular Activities</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span className="mr-1">⚡</span>
                          Value:
                        </label>
                        <input
                          type="text"
                          value={reviewData.preference_value || ''}
                          onChange={(e) => setReviewData({ ...reviewData, preference_value: e.target.value })}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., text for urgent, email for general"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span className="mr-1">📝</span>
                          Description:
                        </label>
                        <textarea
                          value={reviewData.preference_text || ''}
                          onChange={(e) => setReviewData({ ...reviewData, preference_text: e.target.value })}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., We prefer text messages for urgent school notifications"
                          rows={2}
                        />
                      </div>

                      {/* Expiration for Preference Update */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          📅 Valid until:
                        </label>
                        <select
                          value={reviewData.expirationDate || 'school-year'}
                          onChange={(e) => setReviewData({ ...reviewData, expirationDate: e.target.value })}
                          className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="never">No Expiration</option>
                          <option value="1-month">1 Month ({new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                          <option value="3-months">3 Months ({new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                          <option value="6-months">6 Months ({new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                          <option value="school-year">School Year ({new Date(new Date().getFullYear() + (new Date().getMonth() >= 5 ? 1 : 0), 5, 30).toLocaleDateString()})</option>
                          <option value="1-year">1 Year ({new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                          <option value="custom">Custom Date</option>
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Set expiration for temporary information like schedules and activities. Permanent details like birthdays have no expiration.
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                          🧠 AI smartly determined the valid by date
                        </p>
                        {reviewData.expirationDate === 'custom' && (
                          <input
                            type="date"
                            value={reviewData.customExpiration || ''}
                            onChange={(e) => setReviewData({ ...reviewData, customExpiration: e.target.value })}
                            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Action Buttons - Fixed at Bottom */}
      <div className="mt-6 flex space-x-4">
        <button
          onClick={handleDismiss}
          disabled={actionLoading !== null}
          className={`flex-1 py-4 px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none ${
            actionLoading ? 'cursor-not-allowed' : ''
          }`}
        >
          {actionLoading && swipeDirection === 'left' ? (
            <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
          ) : (
            <>🚫 No</>
          )}
        </button>

        <button
          onClick={handleApprove}
          disabled={actionLoading !== null}
          className={`flex-1 py-4 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none ${
            actionLoading ? 'cursor-not-allowed' : ''
          }`}
        >
          {actionLoading && swipeDirection === 'right' ? (
            <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
          ) : (
            <>✅ Yes</>
          )}
        </button>
      </div>

    </div>
  );
};

export default ReviewStream;