import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onAttachment?: (file: File) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  maxLength?: number;
  suggestions?: string[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onAttachment,
  disabled = false,
  loading = false,
  placeholder = "Type your message...",
  maxLength = 2000,
  suggestions = []
}) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleSend = () => {
    if (!input.trim() || disabled || loading) return;
    
    onSend(input.trim());
    setInput('');
    setShowSuggestions(false);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttachment) {
      onAttachment(file);
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setInput(value);
      setShowSuggestions(suggestions.length > 0 && value.length === 0);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && input.length === 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div className="relative">
      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
          <div className="p-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Suggested prompts:</p>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full p-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="flex gap-3 items-end">
        {/* Attachment Button */}
        {onAttachment && (
          <div className="flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || loading}
              className="p-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={disabled || loading}
            placeholder={loading ? "AI is thinking..." : placeholder}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none min-h-[48px] max-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
          />
          
          {/* Character Counter */}
          {input.length > maxLength * 0.8 && (
            <div className={`absolute bottom-1 right-12 text-xs ${
              input.length >= maxLength ? 'text-red-500' : 'text-gray-400'
            }`}>
              {input.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Send Button */}
        <div className="flex-shrink-0">
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled || loading}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-all duration-200 flex items-center justify-center min-w-[48px]"
            title={loading ? "Sending..." : "Send message"}
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Input Help Text */}
      <div className="flex justify-between items-center mt-2 px-1">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </p>
        {loading && (
          <p className="text-xs text-brand-600 dark:text-brand-400">
            AI is processing your request...
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatInput;