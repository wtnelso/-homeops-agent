/**
 * Clean ChatInterface Component with Streaming
 * Uses ProfileSuggestions and DefaultPrompts sub-components
 */

import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, AlertCircle, ChevronDown } from 'lucide-react';
import ConversationList from './ConversationList';
import StreamingMessage from './StreamingMessage';
import ChatInput from './ChatInput';
import ProfileSuggestions from './ProfileSuggestions';
import DefaultPrompts from './DefaultPrompts';
import { useAuth } from '../../contexts/AuthContext';
import { useStreamingChat } from '../../hooks/useStreamingChat';
import { profileSuggestionsService } from '../../services/profileSuggestionsService';

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
  const { userData } = useAuth();

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Profile suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsCount, setSuggestionsCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Prompt animation state
  const [promptsAnimating, setPromptsAnimating] = useState(false);
  const [showPromptsHeader, setShowPromptsHeader] = useState(false);

  // Streaming chat integration
  const {
    messages: streamingMessages,
    isStreaming,
    sendStreamingMessage,
    abortStream,
    clearMessages: clearStreamingMessages
  } = useStreamingChat();

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [streamingMessages]);

  // Scroll detection for scroll-to-bottom button
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const hasScrollableContent = scrollHeight > clientHeight;
      const shouldShow = hasScrollableContent && (scrollTop > 0 || distanceFromBottom > 50) && streamingMessages.length > 0;

      setShowScrollButton(shouldShow);
    };

    handleScroll();
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [streamingMessages]);

  // Load suggestions count when user data is available
  useEffect(() => {
    if (userData?.user?.id) {
      loadSuggestionsCount();
    }
  }, [userData?.user?.id]);

  // Handle trigger message
  useEffect(() => {
    if (triggerMessage && userData?.user?.id) {
      handleSendMessage(triggerMessage);
    }
  }, [triggerMessage, userData?.user?.id]);

  const loadSuggestionsCount = async () => {
    if (!userData?.user?.id) return;

    setLoadingCount(true);
    try {
      const response = await profileSuggestionsService.getPendingSuggestions(userData.user.id);
      if (response.success) {
        const count = response.suggestions?.length || 0;
        setSuggestionsCount(count);
      }
    } catch (error) {
      console.error('Error loading suggestions count:', error);
    } finally {
      setLoadingCount(false);
    }
  };

  const handleSendMessage = async (messageText: string) => {
    if (!userData?.user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!messageText.trim() || isStreaming) return;

    setError(null);

    // Trigger prompt animation if this is the first message
    const isFirstMessage = streamingMessages.length === 0;
    if (isFirstMessage) {
      setPromptsAnimating(true);
      setShowPromptsHeader(true);

      // Wait for animation to complete before proceeding
      setTimeout(async () => {
        await sendMessage(messageText);
        setPromptsAnimating(false);
      }, 600);
      return;
    }

    await sendMessage(messageText);
  };

  const sendMessage = async (messageText: string) => {
    try {
      await sendStreamingMessage(
        messageText,
        currentConversation?.id || '', // Empty string for new conversation
        userData!.user!.id
      );
    } catch (error: any) {
      setError(error.message || 'Failed to send message');
    }
  };

  const handleSuggestionsClick = () => {
    if (!userData?.user?.id) return;
    setShowSuggestions(true);
  };

  const handleSuggestionsClose = () => {
    setShowSuggestions(false);
  };

  const handleSuggestionProcessed = () => {
    // Refresh suggestions count
    loadSuggestionsCount();
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const clearError = () => {
    setError(null);
  };

  const handleNewConversation = () => {
    setCurrentConversation(null);
    clearStreamingMessages();
    setError(null);
  };

  return (
    <div className={`flex h-full bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Conversation Sidebar */}
      {showConversationList && (
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversation?.id}
            loading={loadingConversations}
            onSelectConversation={setCurrentConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={() => {}}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">
              HomeOps AI
            </h1>
            <div className="flex space-x-2">
              {isStreaming && (
                <button
                  onClick={abortStream}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>Stop</span>
                </button>
              )}
              <button
                onClick={handleNewConversation}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                New Chat
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden relative">
          <div ref={scrollContainerRef} className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto py-8">
              {/* Welcome State */}
              {streamingMessages.length === 0 && !isStreaming && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <h2 className="text-3xl sm:text-4xl font-medium text-gray-900 dark:text-white mb-8">
                    HomeOps AI
                  </h2>

                  {initialPrompts.length > 0 && !promptsAnimating && (
                    <DefaultPrompts
                      prompts={initialPrompts}
                      onPromptClick={handleSendMessage}
                      onSuggestionsClick={handleSuggestionsClick}
                      loading={isStreaming}
                      disabled={userData?.user && userData.user.is_active === false}
                      suggestionsCount={suggestionsCount}
                      loadingCount={loadingCount}
                    />
                  )}
                </div>
              )}

              {/* Animated prompts during transition */}
              {promptsAnimating && (
                <DefaultPrompts
                  prompts={initialPrompts}
                  onPromptClick={handleSendMessage}
                  onSuggestionsClick={handleSuggestionsClick}
                  loading={isStreaming}
                  disabled={userData?.user && userData.user.is_active === false}
                  suggestionsCount={suggestionsCount}
                  loadingCount={loadingCount}
                  showAnimated={true}
                  animationDelay={600}
                />
              )}

              {/* Chat Messages */}
              {streamingMessages.length > 0 && (
                <div className="space-y-6 px-4">
                  {streamingMessages.map((message) => (
                    <StreamingMessage
                      key={message.id}
                      message={message}
                      onAbort={isStreaming ? abortStream : undefined}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Scroll to bottom button */}
          {showScrollButton && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-1/2 transform translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 z-10"
              title="Scroll to bottom"
            >
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
          <div className="max-w-3xl mx-auto p-4">
            <ChatInput
              onSend={handleSendMessage}
              loading={isStreaming}
              suggestions={streamingMessages.length === 0 ? [] : []}
              disabled={userData?.user && userData.user.is_active === false}
              placeholder={
                userData?.user && userData.user.is_active === false
                  ? "Account is inactive. Go to Settings to activate your account."
                  : "Message HomeOps AI..."
              }
            />

            {isStreaming && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-3">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-claude-thinking"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-claude-thinking"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-claude-thinking"></div>
                </div>
                <span>HomeOps AI is thinking...</span>
              </div>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              HomeOps AI can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Suggestions Modal */}
      {userData?.user?.id && (
        <ProfileSuggestions
          userId={userData.user.id}
          isOpen={showSuggestions}
          onClose={handleSuggestionsClose}
          onSuggestionProcessed={handleSuggestionProcessed}
        />
      )}
    </div>
  );
};

export default ChatInterface;