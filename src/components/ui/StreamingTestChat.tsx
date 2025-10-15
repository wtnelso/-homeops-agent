/**
 * Streaming Test Chat Component
 * Simple test interface for streaming functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, ChevronDown } from 'lucide-react';
import StreamingMessage from './StreamingMessage';
import { useStreamingChat } from '../../hooks/useStreamingChat';
import { isStreamingEnabled } from '../../config/streamingConfig';
import { useAuth } from '../../contexts/AuthContext';

const StreamingTestChat: React.FC = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { userData } = useAuth();
  const {
    messages,
    isStreaming,
    sendStreamingMessage,
    abortStream,
    clearMessages
  } = useStreamingChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Scroll detection to show/hide scroll-to-bottom button
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const hasScrollableContent = scrollHeight > clientHeight;
      const shouldShow = hasScrollableContent && (scrollTop > 0 || distanceFromBottom > 50) && messages.length > 0;

      setShowScrollButton(shouldShow);
    };

    // Initial check
    handleScroll();

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    try {
      const userId = userData?.user?.id;
      if (!userId) {
        alert('Please log in to test streaming');
        return;
      }

      await sendStreamingMessage(
        inputMessage,
        '', // Empty string for new conversation (will be handled as null on backend)
        userId
      );
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send streaming message:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isStreamingEnabled()) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200">
          Streaming is not enabled. Set <code>VITE_ENABLE_STREAMING=true</code> to test streaming functionality.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 p-4">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">
            ChatGPT
          </h1>
          <div className="flex space-x-2">
            {isStreaming && (
              <button
                onClick={abortStream}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center space-x-1"
              >
                <Square className="w-3 h-3" />
                <span>Stop</span>
              </button>
            )}
            <button
              onClick={clearMessages}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative">
        <div ref={scrollContainerRef} className="h-full overflow-y-auto">
          <div className="max-w-3xl mx-auto py-8">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-16">
                <h2 className="text-2xl font-medium mb-4">How can I help you today?</h2>
                <p className="text-sm">Send a message to test streaming functionality</p>
              </div>
            ) : (
              <div className="space-y-6 px-4">
                {messages.map((message) => (
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
      <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto p-4">
          <div className="relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Message ChatGPT"
              className="w-full p-4 pr-16 border border-gray-300 dark:border-gray-600 rounded-3xl resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 placeholder-gray-500 dark:placeholder-gray-400"
              rows={1}
              disabled={isStreaming}
              style={{ minHeight: '60px', maxHeight: '200px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isStreaming}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {isStreaming && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mt-3">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-claude-thinking"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-claude-thinking"></div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-claude-thinking"></div>
              </div>
              <span>ChatGPT is thinking...</span>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            ChatGPT can make mistakes. Check important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StreamingTestChat;