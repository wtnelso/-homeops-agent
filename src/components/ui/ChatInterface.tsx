import React, { useState, useEffect, useRef } from 'react';
import { Loader, RefreshCw, AlertCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ConversationList from './ConversationList';
import { RenderChatService } from '../../services/edgeFunctionChatService';
import { useAuth } from '../../contexts/AuthContext';

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
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0 chat-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db #f9fafb'
          }}
        >
          {messages.length === 0 && !loading && (
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
            </div>
          )}

          {messages.map((message) => {
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
        <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-900">
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