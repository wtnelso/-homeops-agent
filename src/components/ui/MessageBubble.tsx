import React from 'react';
import { User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { ChatMessage } from '../../services/edgeFunctionChatService';

interface MessageBubbleProps {
  message: ChatMessage;
  isLoading?: boolean;
  onCopy?: (content: string) => void;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isLoading = false,
  onCopy,
  onFeedback
}) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      navigator.clipboard.writeText(message.content);
    }
  };

  const formatTimestamp = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Don't render system messages visually
  if (isSystem) {
    return null;
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="flex items-center justify-center w-8 h-8 bg-brand-100 dark:bg-brand-900/20 rounded-full border border-brand-200 dark:border-brand-700 flex-shrink-0">
          <Bot className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        </div>
      )}

      {/* Message Content */}
      <div
        className={`max-w-[80%] p-3 rounded-lg relative ${
          isUser
            ? 'bg-brand-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
        } ${isLoading ? 'opacity-70' : ''}`}
      >
        {/* Message Text */}
        <div className="prose prose-sm max-w-none">
          <p className="text-sm whitespace-pre-wrap mb-0 leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Timestamp */}
        <p className={`text-xs mt-2 ${
          isUser ? 'text-brand-100' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {formatTimestamp(message.timestamp)}
        </p>

        {/* Action Buttons (for assistant messages) */}
        {isAssistant && !isLoading && (
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              title="Copy message"
            >
              <Copy className="w-3 h-3" />
            </button>
            
            {onFeedback && (
              <>
                <button
                  onClick={() => onFeedback(message.id, 'positive')}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  title="Good response"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>
                
                <button
                  onClick={() => onFeedback(message.id, 'negative')}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Poor response"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        )}

        {/* Simple indicator for message type */}
        <div className="mt-1 text-xs opacity-50">
          {isAssistant && '🤖'}
        </div>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 flex-shrink-0">
          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;