import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, AlertCircle, Sparkles, X, CheckCircle, XCircle, Users, User, Heart, Brain, ChevronLeft, ChevronRight, Cake, GraduationCap, Phone, Calendar, Mail, CalendarDays, Type, FileText } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ConversationList from './ConversationList';
import { RenderChatService } from '../../services/edgeFunctionChatService';
import { useAuth } from '../../contexts/AuthContext';
import { profileSuggestionsService, ProfileSuggestion } from '../../services/profileSuggestionsService';

// Import types from service
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

interface ChatInterfaceProps {
  showConversationList?: boolean;
  initialPrompts?: string[];
  className?: string;
  triggerMessage?: string | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  showConversationList = true,
  initialPrompts = [],
  className = '',
  triggerMessage = null
}) => {
  // Get user data for avatar
  const { userData } = useAuth();
  
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [typingMessage, setTypingMessage] = useState<string>('');

  // Suggestion mode state
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [suggestionMode, setSuggestionMode] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [reviewData, setReviewData] = useState<any>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typewriterRef = useRef<NodeJS.Timeout | null>(null);

  // Typewriter effect hook
  const typewriterEffect = (text: string, speed: number = 8) => {
    return new Promise<void>((resolve) => {
      let index = 0;

      // Clear typing message first and wait for React to process
      setTypingMessage('');

      const typeChar = () => {
        if (index < text.length) {
          setTypingMessage(prev => prev + text.charAt(index));
          index++;
          typewriterRef.current = setTimeout(typeChar, speed);
        } else {
          resolve();
        }
      };

      // Add a small delay to ensure React state has updated
      typewriterRef.current = setTimeout(typeChar, speed + 50);
    });
  };
  
  // Get user avatar URL (prioritize user-provided avatar over auth avatar)
  const userAvatarUrl = userData?.user?.avatar_user_provided || userData?.user?.avatar_url;
  
  // Services - Authentication handled by RenderChatService
  const [chatService] = useState(() => {
    try {
      return new RenderChatService();
    } catch (error) {
      console.error('Failed to initialize Edge Function Chat Service:', error);
      return null;
    }
  });

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    if (chatService) {
      loadConversations();
    }
  }, [chatService]);

  // Handle trigger message from parent
  useEffect(() => {
    if (triggerMessage) {
      handleSendMessage(triggerMessage);
    }
  }, [triggerMessage]);

  // Cleanup typewriter timeout on unmount
  useEffect(() => {
    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
      }
    };
  }, []);

  // Load suggestions count on mount
  useEffect(() => {
    loadSuggestionsCount();
  }, []);

  // Update review data when current suggestion changes
  useEffect(() => {
    if (suggestions.length > 0 && suggestions[currentSuggestionIndex]) {
      initializeReviewData(suggestions[currentSuggestionIndex]);
    }
  }, [currentSuggestionIndex, suggestions]);

  // Business logic functions from ReviewStream
  const initializeReviewData = (suggestion: ProfileSuggestion) => {
    setReviewData({
      ...suggestion.suggested_data,
      saveAs: determineSaveType(suggestion.suggestion_type, suggestion.suggested_data),
      selectedMemberId: '',
      expirationDate: suggestion.suggested_data.default_expiration || getDefaultExpiration(suggestion.suggestion_type, suggestion.suggested_data),
      customExpiration: ''
    });
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

  // Suggestion mode functions
  const loadSuggestionsCount = async () => {
    if (!userData?.account?.id) return;

    try {
      const response = await profileSuggestionsService.getPendingSuggestions(userData.account.id, 100);
      if (response.success) {
        setPendingSuggestionsCount(response.total_count);
      }
    } catch (error) {
      console.error('Error loading suggestions count:', error);
    }
  };

  const enterSuggestionMode = async () => {
    console.log('🔍 Debug: enterSuggestionMode called');
    console.log('🔍 Debug: userData?.account?.id:', userData?.account?.id);

    if (!userData?.account?.id) {
      console.log('🔍 Debug: No account ID found, returning early');
      return;
    }

    setLoadingSuggestions(true);
    console.log('🔍 Debug: Loading suggestions...');

    try {
      const response = await profileSuggestionsService.getPendingSuggestions(userData.account.id);
      console.log('🔍 Debug: Response received:', response);

      if (response.success) {
        console.log('🔍 Debug: Setting suggestions:', response.suggestions);
        setSuggestions(response.suggestions);
        setSuggestionMode(true);
        setCurrentSuggestionIndex(0);

        // Initialize review data for first suggestion if available
        if (response.suggestions.length > 0) {
          initializeReviewData(response.suggestions[0]);
        }

        console.log('🔍 Debug: Suggestion mode enabled');
      } else {
        console.log('🔍 Debug: Response failed:', response.error);
        setError(response.error || 'Failed to load suggestions');
      }
    } catch (error) {
      console.error('🔍 Debug: Error loading suggestions:', error);
      setError('Failed to load suggestions');
    } finally {
      setLoadingSuggestions(false);
      console.log('🔍 Debug: Loading finished');
    }
  };

  const exitSuggestionMode = () => {
    setSuggestionMode(false);
    setSuggestions([]);
    setCurrentSuggestionIndex(0);
    setShowExitConfirmation(false);
    loadSuggestionsCount(); // Refresh count
  };

  const navigateToSuggestion = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentSuggestionIndex > 0) {
      setCurrentSuggestionIndex(currentSuggestionIndex - 1);
    } else if (direction === 'next' && currentSuggestionIndex < suggestions.length - 1) {
      setCurrentSuggestionIndex(currentSuggestionIndex + 1);
    }
  };

  const handleSuggestionResponse = async (suggestion: ProfileSuggestion, response: 'accept' | 'reject') => {
    if (!userData?.account?.id) return;

    try {
      let result;
      if (response === 'accept') {
        // Use approveSuggestionWithEdits to include form data
        result = await profileSuggestionsService.approveSuggestionWithEdits(
          suggestion.id,
          userData.account.id,
          reviewData
        );
      } else {
        result = await profileSuggestionsService.rejectSuggestion(suggestion.id, userData.account.id);
      }

      if (result.success) {
        // Remove the suggestion from the list
        const updatedSuggestions = suggestions.filter(s => s.id !== suggestion.id);
        setSuggestions(updatedSuggestions);

        // Adjust current index if necessary
        if (currentSuggestionIndex >= updatedSuggestions.length && updatedSuggestions.length > 0) {
          setCurrentSuggestionIndex(updatedSuggestions.length - 1);
        }

        // If no more suggestions, exit suggestion mode
        if (updatedSuggestions.length === 0) {
          exitSuggestionMode();
        }
      } else {
        setError(result.error || 'Failed to respond to suggestion');
      }
    } catch (error) {
      console.error('Error responding to suggestion:', error);
      setError('Failed to respond to suggestion');
    }
  };

  // Helper function to render suggestion content
  const renderSuggestionContent = (suggestion: ProfileSuggestion) => {
    const data = suggestion.suggested_data;

    if (suggestion.suggestion_type === 'family_info') {
      return (
        <div className="space-y-2">
          {data.name && <p><span className="font-medium">Name:</span> {data.name}</p>}
          {data.relationship && <p><span className="font-medium">Relationship:</span> {data.relationship}</p>}
          {data.age && <p><span className="font-medium">Age:</span> {data.age}</p>}
          {data.school && <p><span className="font-medium">School:</span> {data.school}</p>}
          {data.details && <p><span className="font-medium">Details:</span> {data.details}</p>}
        </div>
      );
    }

    if (suggestion.suggestion_type === 'contact_add') {
      return (
        <div className="space-y-2">
          {data.name && <p><span className="font-medium">Name:</span> {data.name}</p>}
          {data.email && <p><span className="font-medium">Email:</span> {data.email}</p>}
          {data.phone && <p><span className="font-medium">Phone:</span> {data.phone}</p>}
          {data.organization && <p><span className="font-medium">Organization:</span> {data.organization}</p>}
          {data.notes && <p><span className="font-medium">Notes:</span> {data.notes}</p>}
        </div>
      );
    }

    if (suggestion.suggestion_type === 'preference_update') {
      return (
        <div className="space-y-2">
          {data.preference_type && <p><span className="font-medium">Type:</span> {data.preference_type}</p>}
          {data.value && <p><span className="font-medium">Value:</span> {data.value}</p>}
          {data.description && <p><span className="font-medium">Description:</span> {data.description}</p>}
        </div>
      );
    }

    // Fallback for unknown types
    return (
      <pre className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  const loadConversations = async () => {
    if (!chatService) return;

    setLoadingConversations(true);
    try {
      const result = await chatService.getConversations();
      if (result.success && result.conversations) {
        setConversations(result.conversations);
      } else {
        setError(result.error || 'Failed to load conversations');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversationMessages = async () => {
    if (!chatService) return;

    try {
      // Messages will be loaded when we send the first message to this conversation
      // For now, clear current messages
      setMessages([]);
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    setMessages([]);
    setError(null);
  };

  const handleConversationSelect = (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      loadConversationMessages();
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!chatService) {
      setError('Chat service not available');
      return;
    }

    setLoading(true);
    setError(null);
    setLoadingStatus('Processing your message...');
    setTypingMessage('');

    // Clear any existing typewriter
    if (typewriterRef.current) {
      clearTimeout(typewriterRef.current);
    }

    // Immediately add user message to UI for better UX
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`, // Temporary ID, will be replaced by server response
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      metadata: { temporary: true }
    };

    // Add user message immediately to current messages
    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      // Update status to show AI is working
      setLoadingStatus('Analyzing your message...');

      // Brief delay to show the first status
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoadingStatus('Searching for relevant information...');

      await new Promise(resolve => setTimeout(resolve, 800));
      setLoadingStatus('Generating response...');

      const result = await chatService.sendMessage(
        messageText,
        currentConversation?.id
      );

      if (result.success && result.conversationId && result.messages) {
        // Debug: Log conversation state
        console.log('🔄 Chat Response:', {
          conversationId: result.conversationId,
          currentConversationId: currentConversation?.id,
          messageCount: result.messages.length,
          messages: result.messages.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' }))
        });

        // Get the latest AI response
        const latestAiMessage = result.messages?.find(
          (msg, index) => msg.role === 'assistant' && index === result.messages!.length - 1
        );

        if (latestAiMessage) {
          // Show messages without the AI response first
          const messagesWithoutLatestAi = result.messages.slice(0, -1);
          setMessages(messagesWithoutLatestAi);

          // Show typing status
          setLoadingStatus('');
          setLoading(false);

          // Add the AI message that will be typed out
          const typingAiMessage: ChatMessage = {
            id: latestAiMessage.id,
            role: 'assistant',
            content: latestAiMessage.content, // Full content, but we'll show it progressively
            timestamp: latestAiMessage.timestamp,
            metadata: { ...latestAiMessage.metadata, typing: true }
          };

          setMessages(prev => [...prev, typingAiMessage]);

          // Start typewriter effect
          await typewriterEffect(latestAiMessage.content);

          // Mark typing as complete
          setTypingMessage('');
          const finalMessages = result.messages.map(msg =>
            msg.id === latestAiMessage.id
              ? { ...msg, metadata: { ...msg.metadata, typing: false } }
              : msg
          );
          setMessages(finalMessages);
        } else {
          // Fallback: just set all messages
          setMessages(result.messages);
        }

        // If new conversation was created, refresh conversations list and set current conversation
        if (!currentConversation || currentConversation.id !== result.conversationId) {
          console.log('🔄 Creating/switching to new conversation:', result.conversationId);

          // Create a temporary conversation object to set immediately
          const newConversation: Conversation = {
            id: result.conversationId,
            title: messageText.substring(0, 50) + (messageText.length > 50 ? '...' : ''),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            message_count: result.messages.length
          };

          // Set the current conversation immediately
          setCurrentConversation(newConversation);

          // Refresh conversations list in the background
          loadConversations();
        } else {
          console.log('🔄 Continuing existing conversation:', result.conversationId);
          // Refresh the conversation list to update timestamps
          loadConversations();
        }
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setLoadingStatus('');
      setTypingMessage('');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!chatService) return;

    try {
      const result = await chatService.deleteConversation(conversationId);
      if (result.success) {
        await loadConversations();
        
        if (currentConversation?.id === conversationId) {
          handleNewConversation();
        }
      } else {
        setError(result.error || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError('Failed to delete conversation');
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    if (!chatService) return;

    try {
      const result = await chatService.renameConversation(conversationId, newTitle);
      
      if (result.success) {
        await loadConversations();
        
        if (currentConversation?.id === conversationId) {
          const updatedConversation = conversations.find(c => c.id === conversationId);
          if (updatedConversation) {
            setCurrentConversation(updatedConversation);
          }
        }
      } else {
        setError(result.error || 'Failed to rename conversation');
      }
    } catch (error) {
      console.error('Error renaming conversation:', error);
      setError('Failed to rename conversation');
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    // Could show toast notification here
  };

  const handleMessageFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    // Could implement feedback storage here
    console.log(`Message ${messageId} feedback:`, feedback);
  };

  if (!chatService) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Chat Service Unavailable</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please check your configuration and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex bg-white dark:bg-gray-900 ${className}`}>
      {/* Conversation Sidebar */}
      {showConversationList && (
        <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversation?.id}
            onConversationSelect={handleConversationSelect}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            onRenameConversation={handleRenameConversation}
            loading={loadingConversations}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-700 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div
          className={`p-3 sm:p-4 min-h-0 ${
            suggestionMode
              ? 'h-[70vh] overflow-y-auto'
              : 'flex-1 overflow-y-auto space-y-3 sm:space-y-4 chat-scrollbar'
          }`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f9fafb'
          }}
        >
          {messages.length === 0 && !loading && !suggestionMode && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4 max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-medium text-gray-900 dark:text-white mb-8">
                HomeOps AI
              </h1>

              {initialPrompts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {initialPrompts.slice(0, 4).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={loading}
                      className="p-4 text-left bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <p className="text-gray-700 text-sm leading-relaxed group-hover:text-gray-900">{prompt}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Suggestion Mode Prompt */}
              {(pendingSuggestionsCount > 0 || true) && (
                <div className="mt-8 w-full max-w-md mx-auto">
                  <button
                    onClick={enterSuggestionMode}
                    disabled={loading || loadingSuggestions}
                    className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900 group-hover:text-blue-900">
                          Review Profile Suggestions
                        </h3>
                        <p className="text-sm text-gray-600 group-hover:text-blue-700">
                          {pendingSuggestionsCount > 0
                            ? `${pendingSuggestionsCount} pending suggestion${pendingSuggestionsCount === 1 ? '' : 's'}`
                            : 'See what we\'ve learned about you'
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="fixed top-0 right-0 bg-black text-white p-2 text-xs z-50">
              <div>suggestionMode: {suggestionMode.toString()}</div>
              <div>suggestions.length: {suggestions.length}</div>
              <div>loadingSuggestions: {loadingSuggestions.toString()}</div>
              <div>currentIndex: {currentSuggestionIndex}</div>
            </div>
          )}

          {/* Suggestion Mode View */}
          {suggestionMode && suggestions.length > 0 && (
            <div className="flex flex-col h-full max-w-5xl mx-auto px-4 py-4">
              {/* Header */}
              <div className="flex items-center justify-between w-full py-2 flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Suggestions</h2>
                <button
                  onClick={() => setShowExitConfirmation(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Suggestion Card - Scrollable */}
              <div className="flex-1 flex flex-col min-h-0 mb-1">
                <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-full max-h-[600px]">
                  {/* Card Content - Scrollable */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        {suggestions[currentSuggestionIndex].suggestion_type === 'family_info' && <Users className="w-6 h-6 text-blue-500" />}
                        {suggestions[currentSuggestionIndex].suggestion_type === 'contact_add' && <User className="w-6 h-6 text-green-500" />}
                        {suggestions[currentSuggestionIndex].suggestion_type === 'preference_update' && <Heart className="w-6 h-6 text-pink-500" />}
                        {!['family_info', 'contact_add', 'preference_update'].includes(suggestions[currentSuggestionIndex].suggestion_type) && <Brain className="w-6 h-6 text-orange-500" />}

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                          {suggestions[currentSuggestionIndex].suggestion_type.replace('_', ' ')}
                        </h3>
                      </div>

                      {/* Editable Form Fields */}
                {reviewData && (
                  <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column - Header Info */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Suggestion Details</h4>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                          {suggestions[currentSuggestionIndex].source_email_subject && (
                            <div className="flex items-start gap-2">
                              <Mail className="h-4 w-4 mt-0.5 text-gray-500" />
                              <div>
                                <span className="font-medium">Source:</span>
                                <p className="text-xs mt-1">{suggestions[currentSuggestionIndex].source_email_subject}</p>
                              </div>
                            </div>
                          )}
                          {suggestions[currentSuggestionIndex].confidence_score && (
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-3 w-3 text-blue-500" />
                              <span>AI is {Math.round(suggestions[currentSuggestionIndex].confidence_score * 100)}% confident</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column - Form Fields with horizontal labels */}
                      <div className="space-y-3">
                        {/* Dynamic form fields based on suggestion type */}
                        {suggestions[currentSuggestionIndex].suggestion_type === 'family_info' && (
                          <>
                            {reviewData.birthday && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                  <Cake className="h-4 w-4 mr-1 inline text-gray-500" />
                                  Birthday:
                                </label>
                                <input
                                  type="date"
                                  value={reviewData.birthday || ''}
                                  onChange={(e) => setReviewData({ ...reviewData, birthday: e.target.value })}
                                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </div>
                            )}
                            {reviewData.school && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                  <GraduationCap className="h-4 w-4 mr-1 inline text-gray-500" />
                                  School:
                                </label>
                                <input
                                  type="text"
                                  value={reviewData.school || ''}
                                  onChange={(e) => setReviewData({ ...reviewData, school: e.target.value })}
                                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Enter school name"
                                />
                              </div>
                            )}
                            {reviewData.age && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                  <User className="h-4 w-4 mr-1 inline text-gray-500" />
                                  Age:
                                </label>
                                <input
                                  type="number"
                                  value={reviewData.age || ''}
                                  onChange={(e) => setReviewData({ ...reviewData, age: e.target.value })}
                                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Enter age"
                                />
                              </div>
                            )}
                            {reviewData.activity && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                  <Calendar className="h-4 w-4 mr-1 inline text-gray-500" />
                                  Activity:
                                </label>
                                <input
                                  type="text"
                                  value={reviewData.activity || ''}
                                  onChange={(e) => setReviewData({ ...reviewData, activity: e.target.value })}
                                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Enter activity"
                                />
                              </div>
                            )}
                          </>
                        )}

                        {suggestions[currentSuggestionIndex].suggestion_type === 'contact_add' && (
                          <>
                            {reviewData.name && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                  <User className="h-4 w-4 mr-1 inline text-gray-500" />
                                  Name:
                                </label>
                                <input
                                  type="text"
                                  value={reviewData.name || ''}
                                  onChange={(e) => setReviewData({ ...reviewData, name: e.target.value })}
                                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Enter contact name"
                                />
                              </div>
                            )}
                            {reviewData.phone && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                  <Phone className="h-4 w-4 mr-1 inline text-gray-500" />
                                  Phone:
                                </label>
                                <input
                                  type="tel"
                                  value={reviewData.phone || ''}
                                  onChange={(e) => setReviewData({ ...reviewData, phone: e.target.value })}
                                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Enter phone number"
                                />
                              </div>
                            )}
                            {reviewData.email && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                  <Mail className="h-4 w-4 mr-1 inline text-gray-500" />
                                  Email:
                                </label>
                                <input
                                  type="email"
                                  value={reviewData.email || ''}
                                  onChange={(e) => setReviewData({ ...reviewData, email: e.target.value })}
                                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="Enter email address"
                                />
                              </div>
                            )}
                            {reviewData.role && (
                              <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                  <User className="h-4 w-4 mr-1 inline text-gray-500" />
                                  Role:
                                </label>
                                <input
                                  type="text"
                                  value={reviewData.role || ''}
                                  onChange={(e) => setReviewData({ ...reviewData, role: e.target.value })}
                                  className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., Doctor, Teacher, Emergency Contact"
                                />
                              </div>
                            )}
                          </>
                        )}

                        {suggestions[currentSuggestionIndex].suggestion_type === 'preference_update' && (
                          <>
                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                <Type className="h-4 w-4 mr-1 inline text-gray-500" />
                                Type:
                              </label>
                              <select
                                value={reviewData.preference_type || 'other'}
                                onChange={(e) => setReviewData({ ...reviewData, preference_type: e.target.value })}
                                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                <FileText className="h-4 w-4 mr-1 inline text-gray-500" />
                                Value:
                              </label>
                              <input
                                type="text"
                                value={reviewData.preference_value || ''}
                                onChange={(e) => setReviewData({ ...reviewData, preference_value: e.target.value })}
                                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., text for urgent, email for general"
                              />
                            </div>
                            <div className="flex items-start gap-3">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0 pt-1.5">
                                <FileText className="h-4 w-4 mr-1 inline text-gray-500" />
                                Details:
                              </label>
                              <textarea
                                value={reviewData.preference_text || ''}
                                onChange={(e) => setReviewData({ ...reviewData, preference_text: e.target.value })}
                                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g., We prefer text messages for urgent school notifications"
                                rows={2}
                              />
                            </div>
                          </>
                        )}

                        {/* Expiration field */}
                        <div>
                          <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                              <CalendarDays className="h-4 w-4 mr-1 inline text-gray-500" />
                              Expires:
                            </label>
                            <select
                              value={reviewData.expirationDate || getDefaultExpiration(suggestions[currentSuggestionIndex].suggestion_type, reviewData)}
                              onChange={(e) => setReviewData({ ...reviewData, expirationDate: e.target.value })}
                              className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="never">No Expiration</option>
                              <option value="1-month">1 Month ({new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                              <option value="3-months">3 Months ({new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                              <option value="6-months">6 Months ({new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                              <option value="school-year">School Year ({new Date(new Date().getFullYear() + (new Date().getMonth() >= 5 ? 1 : 0), 5, 30).toLocaleDateString()})</option>
                              <option value="1-year">1 Year ({new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()})</option>
                              <option value="custom">Custom Date</option>
                            </select>
                          </div>
                          {reviewData.expirationDate === 'custom' && (
                            <div className="flex items-center gap-3 mt-2">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20 flex-shrink-0">
                                <Calendar className="h-4 w-4 mr-1 inline text-gray-500" />
                                Date:
                              </label>
                              <input
                                type="date"
                                value={reviewData.customExpiration || ''}
                                onChange={(e) => setReviewData({ ...reviewData, customExpiration: e.target.value })}
                                className="flex-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                    </div>
                  </div>
                </div>

                  {/* Action Buttons - Fixed at bottom */}
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSuggestionResponse(suggestions[currentSuggestionIndex], 'reject')}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                    >
                      <XCircle className="w-4 h-4" />
                      Dismiss
                    </button>
                    <button
                      onClick={() => handleSuggestionResponse(suggestions[currentSuggestionIndex], 'accept')}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Accept
                    </button>
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between w-full py-2 flex-shrink-0">
                <button
                  onClick={() => navigateToSuggestion('prev')}
                  disabled={currentSuggestionIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-medium border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    {currentSuggestionIndex + 1} of {suggestions.length}
                  </span>
                  <div className="flex gap-1.5">
                    {suggestions.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                          index === currentSuggestionIndex
                            ? 'bg-blue-500 scale-110 shadow-md'
                            : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => navigateToSuggestion('next')}
                  disabled={currentSuggestionIndex === suggestions.length - 1}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 font-medium border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Exit Confirmation Modal */}
          {showExitConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Exit Suggestion Mode?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    You have {suggestions.length - currentSuggestionIndex} suggestions remaining. Are you sure you want to exit?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowExitConfirmation(false)}
                      className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Continue
                    </button>
                    <button
                      onClick={exitSuggestionMode}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Exit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!suggestionMode && messages.map((message) => {
            // If this is an assistant message being typed, show the typing version
            if (message.role === 'assistant' && message.metadata?.typing && typingMessage) {
              return (
                <div key={message.id} className="flex gap-3 justify-start animate-fade-in">
                  <div className="flex items-center justify-center w-8 h-8 bg-brand-100 dark:bg-brand-900/20 rounded-full border border-brand-200 dark:border-brand-700">
                    <img src="/favicon.ico" alt="HomeOps" className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg flex-1 max-w-none">
                    <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {typingMessage}
                      <span className="animate-pulse">|</span>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <MessageBubble
                key={message.id}
                message={message}
                userAvatarUrl={userAvatarUrl}
                onCopy={handleCopyMessage}
                onFeedback={handleMessageFeedback}
              />
            );
          })}

          {loading && (
            <div className="flex gap-3 justify-start animate-fade-in">
              <div className="flex items-center justify-center w-8 h-8 bg-brand-100 dark:bg-brand-900/20 rounded-full border border-brand-200 dark:border-brand-700">
                <img src="/favicon.ico" alt="HomeOps" className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {loadingStatus || 'AI is thinking...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 px-4 pb-2 pt-2 bg-white dark:bg-gray-900">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              loading={loading}
              suggestions={messages.length === 0 ? [] : []}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;