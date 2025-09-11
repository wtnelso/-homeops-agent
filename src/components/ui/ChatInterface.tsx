import React, { useState, useEffect, useRef } from 'react';
import { Loader, RefreshCw, AlertCircle } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ConversationList from './ConversationList';
import { EdgeFunctionChatService } from '../../services/edgeFunctionChatService';

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
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Services - Authentication handled by EdgeFunctionChatService
  const [chatService] = useState(() => {
    try {
      return new EdgeFunctionChatService();
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

    try {
      const result = await chatService.sendMessage(
        messageText, 
        currentConversation?.id
      );

      if (result.success && result.conversationId && result.messages) {
        // Update messages
        setMessages(result.messages);

        // If new conversation was created, refresh conversations list
        if (!currentConversation || currentConversation.id !== result.conversationId) {
          await loadConversations();
          const conversation = conversations.find(c => c.id === result.conversationId);
          if (conversation) {
            setCurrentConversation(conversation);
          }
        } else {
          // Refresh the conversation list to update timestamps
          await loadConversations();
        }
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (error: any) {
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
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
    <div className={`h-full flex bg-gray-50 dark:bg-gray-900 ${className}`}>
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

        {/* Chat Header */}
        {currentConversation && (
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <h2 className="font-medium text-gray-900 dark:text-white truncate">
              {currentConversation.title || 'Untitled Conversation'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Started {new Date(currentConversation.created_at).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/20 rounded-full flex items-center justify-center mb-4">
                <img src="/favicon.ico" alt="HomeOps" className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Welcome to HomeOps AI
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                I'm here to help you manage your home operations, family logistics, and daily tasks. How can I assist you today?
              </p>
              
              {initialPrompts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                  {initialPrompts.slice(0, 4).map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(prompt)}
                      disabled={loading}
                      className="p-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand-300 dark:hover:border-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300">{prompt}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onCopy={handleCopyMessage}
              onFeedback={handleMessageFeedback}
            />
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex items-center justify-center w-8 h-8 bg-brand-100 dark:bg-brand-900/20 rounded-full border border-brand-200 dark:border-brand-700">
                <img src="/favicon.ico" alt="HomeOps" className="w-4 h-4" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <ChatInput
            onSend={handleSendMessage}
            loading={loading}
            suggestions={messages.length === 0 ? initialPrompts.slice(0, 3) : []}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;