/**
 * Profile Suggestions Component
 * Handles the review and management of AI-generated profile suggestions
 */

import React, { useState, useEffect } from 'react';
import { Users, User, Heart, Brain, Mail, Sparkles, ChevronLeft, ChevronRight, XCircle, CheckCircle, Cake, GraduationCap, Phone, Calendar, CalendarDays, Type, FileText, Clock, Tag } from 'lucide-react';
import { profileSuggestionsService, ProfileSuggestion } from '../../services/profileSuggestionsService';
import { useAuth } from '../../contexts/AuthContext';

interface ProfileSuggestionsProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuggestionProcessed: () => void; // Callback to refresh count
}

const ProfileSuggestions: React.FC<ProfileSuggestionsProps> = ({
  userId,
  isOpen,
  onClose,
  onSuggestionProcessed
}) => {
  const { userData } = useAuth();
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [reviewData, setReviewData] = useState<any>(null);

  // Load suggestions when component opens
  useEffect(() => {
    if (isOpen && userId) {
      loadSuggestions();
    }
  }, [isOpen, userId]);

  // Initialize review data when current suggestion changes
  useEffect(() => {
    if (suggestions.length > 0 && suggestions[currentIndex] && !isTransitioning) {
      initializeReviewData(suggestions[currentIndex]);
    }
  }, [currentIndex, suggestions, isTransitioning]);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await profileSuggestionsService.getPendingSuggestions(userId);

      if (response.success && response.suggestions) {
        setSuggestions(response.suggestions);
        setCurrentIndex(0);

        if (response.suggestions.length > 0) {
          initializeReviewData(response.suggestions[0]);
        }
      } else {
        setError(response.error || 'Failed to load suggestions');
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const initializeReviewData = (suggestion: ProfileSuggestion) => {
    setReviewData({
      ...suggestion.suggested_data,
      saveAs: determineSaveType(suggestion.suggestion_type, suggestion.suggested_data),
      selectedMemberId: '',
      expirationDate: suggestion.suggested_data.default_expiration || getDefaultExpiration(suggestion.suggestion_type, suggestion.suggested_data),
      customExpiration: '',
      structuredSchedule: {
        days: suggestion.suggested_data.days || [],
        time: suggestion.suggested_data.schedule_time || ''
      }
    });
  };

  const determineSaveType = (suggestionType: string, data: any): 'profile' | 'context' => {
    switch (suggestionType) {
      case 'family_info':
        return data?.birthday || data?.name ? 'profile' : 'context';
      case 'preference_update':
        return data?.preference_type === 'allergy' ? 'profile' : 'context';
      case 'contact_add':
        return 'profile';
      default:
        return 'context';
    }
  };

  const getDefaultExpiration = (suggestionType: string, suggestionData?: any): string => {
    switch (suggestionType) {
      case 'family_info': return 'school-year';
      case 'preference_update':
        if (suggestionData?.preference_type) {
          const prefType = suggestionData.preference_type.toLowerCase();
          if (prefType === 'allergy' || prefType === 'allergies') return 'never';
        }
        return 'one-year';
      case 'contact_add': return 'never';
      default: return 'one-year';
    }
  };

  const handleSuggestionResponse = async (suggestion: ProfileSuggestion, response: 'accept' | 'reject') => {
    try {
      setError(null);
      let result;

      if (response === 'accept') {
        result = await profileSuggestionsService.approveSuggestionWithEdits(
          suggestion.id,
          userId,
          reviewData,
          suggestion.suggestion_type,
          userData?.family?.id || ''
        );
      } else {
        result = await profileSuggestionsService.rejectSuggestion(suggestion.id, userId);
      }

      if (result.success) {
        // Remove processed suggestion
        const updatedSuggestions = suggestions.filter(s => s.id !== suggestion.id);
        setSuggestions(updatedSuggestions);

        // Notify parent to refresh count
        onSuggestionProcessed();

        // Adjust current index if needed
        if (currentIndex >= updatedSuggestions.length && updatedSuggestions.length > 0) {
          setCurrentIndex(updatedSuggestions.length - 1);
        }

        // Close if no more suggestions
        if (updatedSuggestions.length === 0) {
          handleClose();
        }
      } else {
        setError(result.error || `Failed to ${response} suggestion`);
      }
    } catch (error) {
      console.error(`Error ${response}ing suggestion:`, error);
      setError(`Failed to ${response} suggestion`);
    }
  };

  const navigateToSuggestion = (direction: 'next' | 'prev') => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setTimeout(() => {
      if (direction === 'prev' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (direction === 'next' && currentIndex < suggestions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
      setIsTransitioning(false);
    }, 150);
  };

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      onClose();
      setExiting(false);
    }, 300);
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading suggestions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Suggestions</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">All Caught Up!</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No pending suggestions to review.</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue Chatting
          </button>
        </div>
      </div>
    );
  }

  const currentSuggestion = suggestions[currentIndex];

  return (
    <div className={`fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col ${exiting ? 'animate-fade-out' : 'animate-fade-in'}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review Profile Suggestions</h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full px-4 py-4">
        {/* Current Suggestion Card */}
        <div className={`flex-1 flex flex-col min-h-0 mb-4 ${isTransitioning ? 'opacity-50' : 'opacity-100'} transition-opacity duration-150`}>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex-1 overflow-y-auto">
            {/* Suggestion Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {currentSuggestion.suggestion_type === 'family_info' && <Users className="w-6 h-6 text-blue-500" />}
                {currentSuggestion.suggestion_type === 'contact_add' && <User className="w-6 h-6 text-green-500" />}
                {currentSuggestion.suggestion_type === 'preference_update' && <Heart className="w-6 h-6 text-pink-500" />}
                {!['family_info', 'contact_add', 'preference_update'].includes(currentSuggestion.suggestion_type) && <Brain className="w-6 h-6 text-orange-500" />}

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {currentSuggestion.suggestion_type.replace('_', ' ')}
                </h3>
              </div>

              {/* Family Member Name - Top Right */}
              {currentSuggestion.suggestion_type === 'family_info' && reviewData?.member_name && (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{reviewData.member_name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Suggestion Details */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Suggestion Details</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  {currentSuggestion.source_email_subject && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-0.5 text-blue-600" />
                      <div>
                        <span className="font-bold">Source:</span>
                        <p className="text-xs mt-1">{currentSuggestion.source_email_subject}</p>
                      </div>
                    </div>
                  )}
                  {currentSuggestion.confidence_score && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-blue-500" />
                      <span>AI is {Math.round(currentSuggestion.confidence_score * 100)}% confident</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Form Fields */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Review & Edit</h4>

                {/* Dynamic form fields based on suggestion type */}
                {currentSuggestion.suggestion_type === 'family_info' && reviewData && (
                  <div className="space-y-3">
                    {/* Name Field */}
                    {reviewData.member_name && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">Name:</label>
                        <input
                          type="text"
                          value={reviewData.member_name || ''}
                          onChange={(e) => setReviewData({ ...reviewData, member_name: e.target.value })}
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Birthday Field */}
                    {reviewData.birthday && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0 flex items-center gap-1">
                          <Cake className="h-3 w-3" />
                          Birthday:
                        </label>
                        <input
                          type="date"
                          value={reviewData.birthday || ''}
                          onChange={(e) => setReviewData({ ...reviewData, birthday: e.target.value })}
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* School Field */}
                    {reviewData.school && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0 flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" />
                          School:
                        </label>
                        <input
                          type="text"
                          value={reviewData.school || ''}
                          onChange={(e) => setReviewData({ ...reviewData, school: e.target.value })}
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {/* Save As and Expiration */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600 space-y-3">
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">Save as:</label>
                        <select
                          value={reviewData.saveAs || 'profile'}
                          onChange={(e) => setReviewData({ ...reviewData, saveAs: e.target.value })}
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="profile">Profile (Permanent)</option>
                          <option value="context">Context (Temporary)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">Expires:</label>
                        <select
                          value={reviewData.expirationDate || getDefaultExpiration(currentSuggestion.suggestion_type, reviewData)}
                          onChange={(e) => setReviewData({ ...reviewData, expirationDate: e.target.value })}
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="never">Never</option>
                          <option value="school-year">End of School Year</option>
                          <option value="one-year">One Year</option>
                          <option value="custom">Custom Date</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Contact Add Fields */}
                {currentSuggestion.suggestion_type === 'contact_add' && reviewData && (
                  <div className="space-y-3">
                    {reviewData.name && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">Name:</label>
                        <input
                          type="text"
                          value={reviewData.name || ''}
                          onChange={(e) => setReviewData({ ...reviewData, name: e.target.value })}
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {reviewData.email && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">Email:</label>
                        <input
                          type="email"
                          value={reviewData.email || ''}
                          onChange={(e) => setReviewData({ ...reviewData, email: e.target.value })}
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {reviewData.phone && (
                      <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Phone:
                        </label>
                        <input
                          type="tel"
                          value={reviewData.phone || ''}
                          onChange={(e) => setReviewData({ ...reviewData, phone: e.target.value })}
                          className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Preference Update Fields */}
                {currentSuggestion.suggestion_type === 'preference_update' && reviewData && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">Type:</label>
                      <input
                        type="text"
                        value={reviewData.preference_type || ''}
                        onChange={(e) => setReviewData({ ...reviewData, preference_type: e.target.value })}
                        className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-start gap-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0 pt-2">Details:</label>
                      <textarea
                        value={reviewData.preference_details || ''}
                        onChange={(e) => setReviewData({ ...reviewData, preference_details: e.target.value })}
                        rows={3}
                        className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handleSuggestionResponse(currentSuggestion, 'reject')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
              >
                <XCircle className="w-4 h-4" />
                Skip
              </button>
              <button
                onClick={() => handleSuggestionResponse(currentSuggestion, 'accept')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Accept
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateToSuggestion('prev')}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              {currentIndex + 1} of {suggestions.length}
            </span>
            <div className="flex gap-1">
              {suggestions.slice(0, 8).map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
              {suggestions.length > 8 && (
                <span className="text-xs text-gray-500 ml-1">+{suggestions.length - 8}</span>
              )}
            </div>
          </div>

          <button
            onClick={() => navigateToSuggestion('next')}
            disabled={currentIndex === suggestions.length - 1}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSuggestions;