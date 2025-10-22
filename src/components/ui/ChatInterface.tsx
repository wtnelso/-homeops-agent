/**
 * Clean ChatInterface Component with Streaming
 * Uses ProfileSuggestions and DefaultPrompts sub-components
 */

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import ConversationList from './ConversationList';
import StreamingMessage from './StreamingMessage';
import ChatInput from './ChatInput';
import ProfileSuggestions from './ProfileSuggestions';
import DefaultPrompts from './DefaultPrompts';
import HomeOpsLogo from './HomeOpsLogo';
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
  const [conversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [loadingConversations] = useState(false);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Profile suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsCount, setSuggestionsCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  // Prompt animation state
  const [promptsAnimating, setPromptsAnimating] = useState(false);

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
    if (streamingMessages.length > 0) {
      // Use a small delay to ensure content is rendered
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (scrollContainerRef.current) {
          // Fallback: scroll the container to bottom
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 150);
    }
  }, [streamingMessages]);

  // Auto-scroll when streaming starts (for immediate feedback)
  useEffect(() => {
    if (isStreaming) {
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        } else if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  }, [isStreaming]);

  // Immediate scroll when new message is added (for instant feedback)
  useEffect(() => {
    if (streamingMessages.length > 0) {
      // Immediate scroll without delay
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'instant' });
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'instant'
        });
      }
    }
  }, [streamingMessages.length]);

  // Scroll detection for scroll-to-bottom button
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const hasScrollableContent = scrollHeight > clientHeight;
      const shouldShow = hasScrollableContent && distanceFromBottom > 100 && streamingMessages.length > 0;

      setShowScrollButton(shouldShow);
    };

    // Add scroll listener
    scrollContainer.addEventListener('scroll', handleScroll);

    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      handleScroll();
    });
    
    resizeObserver.observe(scrollContainer);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
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
    } else if (scrollContainerRef.current) {
      // Fallback: scroll the container to bottom
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
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
    <div className={`flex flex-col h-full w-full bg-white dark:bg-gray-900 ${className} ${isMobile ? 'mobile-chat-container' : ''}`}>
      {/* Conversation Sidebar */}
      {showConversationList && (
        <div className="hidden md:block md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversation?.id}
            loading={loadingConversations}
            onConversationSelect={(conversationId) => {
              const conversation = conversations.find(c => c.id === conversationId);
              setCurrentConversation(conversation || null);
            }}
            onNewConversation={handleNewConversation}
            onDeleteConversation={() => {}}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800">
          <div className="w-full max-w-none px-2 sm:px-4 md:max-w-3xl md:mx-auto flex justify-end items-center">
            <div className="flex space-x-1 sm:space-x-2">
              {isStreaming && (
                <button
                  onClick={abortStream}
                  className="px-2 sm:px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center space-x-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              )}
              <button
                onClick={handleNewConversation}
                className="px-2 sm:px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">New Chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4">
            <div className="w-full max-w-none px-2 sm:px-4 md:max-w-3xl md:mx-auto flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300 truncate">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 flex-shrink-0 ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Messages Area - Full Screen Native App Style */}
        <div className={`flex-1 relative ${isMobile ? 'mobile-chat-messages' : ''}`}>
          <div ref={scrollContainerRef} className="h-full w-full overflow-y-auto chat-scrollbar native-scroll-container">
            <div className={`w-full px-4 sm:px-6 py-4 sm:py-6 ${isMobile ? 'pb-32' : ''}`}>
              {/* Welcome State - Full Screen */}
              {streamingMessages.length === 0 && !isStreaming && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  {/* Logo Section */}
                  <div className="mb-8 sm:mb-12">
                    <div className="flex justify-center mb-4">
                      <HomeOpsLogo 
                        width={80} 
                        height={80} 
                        variant="icon" 
                        className=""
                      />
                    </div>
                    <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                      HomeOps helps you stay ahead by surfacing what matters — from school updates to appointments — and turning mental clutter into calm, organized action.
                    </p>
                    {/* Updated UI - Backend connected successfully */}
                  </div>

                  {initialPrompts.length > 0 && !promptsAnimating && (
                    <div className="w-full max-w-3xl">
                      <DefaultPrompts
                        prompts={initialPrompts}
                        onPromptClick={handleSendMessage}
                        onSuggestionsClick={handleSuggestionsClick}
                        loading={isStreaming}
                        disabled={userData?.user && userData.user.is_active === false}
                        suggestionsCount={suggestionsCount}
                        loadingCount={loadingCount}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Animated prompts during transition - hidden during animation */}
              {promptsAnimating && (
                <div className="opacity-0 pointer-events-none">
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
                </div>
              )}

              {/* Chat Messages - Full Width */}
              {streamingMessages.length > 0 && (
                <div className="space-y-4 sm:space-y-6 w-full">
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

        {/* Input Area - Claude Style */}
        <div className={`bg-white border-t border-gray-100 ${isMobile ? 'mobile-chat-input' : ''}`}>
          <div className={`w-full max-w-none px-4 sm:px-6 md:max-w-4xl md:mx-auto ${isMobile ? 'py-4' : 'py-6'}`}>
            <ChatInput
              onSend={handleSendMessage}
              loading={isStreaming}
              suggestions={streamingMessages.length === 0 ? [] : []}
              disabled={userData?.user && userData.user.is_active === false}
              autoFocus={isMobile && streamingMessages.length === 0} // Auto-focus on mobile when no messages
              placeholder={
                userData?.user && userData.user.is_active === false
                  ? "Account is inactive. Go to Settings to activate your account."
                  : "Ask HomeOps anything..."
              }
            />

            {isStreaming && (
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mt-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="font-medium">HomeOps is thinking...</span>
              </div>
            )}
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