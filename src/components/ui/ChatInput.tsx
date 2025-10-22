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
  demoTypingText?: string | null;
  onDemoTypingComplete?: () => void;
  autoFocus?: boolean; // New prop for auto-focus on mobile
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onAttachment,
  disabled = false,
  loading = false,
  placeholder = "Type your message...",
  maxLength = 2000,
  suggestions = [],
  demoTypingText = null,
  onDemoTypingComplete,
  autoFocus = false
}) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isTypingDemo, setIsTypingDemo] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Auto-focus on mobile devices
  useEffect(() => {
    if (autoFocus && textareaRef.current && !disabled && !loading) {
      // Small delay to ensure the component is fully rendered
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled, loading]);

  // Mobile keyboard handling
  useEffect(() => {
    const handleResize = () => {
      // Adjust viewport height when keyboard appears/disappears on mobile
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Demo typing effect
  useEffect(() => {
    if (demoTypingText) {
      setIsTypingDemo(true);
      setInput(''); // Clear current input

      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex < demoTypingText.length) {
          const newText = demoTypingText.substring(0, currentIndex + 1);
          setInput(newText);
          currentIndex++;
          typingTimeoutRef.current = setTimeout(typeNextChar, 20); // 20ms per character
        } else {
          console.log('🎬 ChatInput: Demo typing complete');
          setIsTypingDemo(false);
          onDemoTypingComplete?.();
        }
      };

      // Start typing after a short delay
      typingTimeoutRef.current = setTimeout(typeNextChar, 200);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [demoTypingText, onDemoTypingComplete]);

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
    // Prevent user input during demo typing
    if (isTypingDemo) return;

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

      {/* Input Area - Claude Style */}
      <div className="relative">
        {/* Text Input */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={disabled || loading}
            placeholder={loading ? "AI is thinking..." : isTypingDemo ? "" : placeholder}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 pr-14 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-300 transition-all resize-none min-h-[52px] max-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            rows={1}
          />
          
          {/* Send Button - Inside Input */}
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled || loading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-gray-600 hover:text-gray-700 disabled:text-gray-400 p-2 rounded-lg transition-all duration-200 flex items-center justify-center"
            title={loading ? "Sending..." : "Send message"}
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
          
          {/* Character Counter */}
          {input.length > maxLength * 0.8 && (
            <div className={`absolute bottom-1 right-16 text-xs ${
              input.length >= maxLength ? 'text-red-500' : 'text-gray-400'
            }`}>
              {input.length}/{maxLength}
            </div>
          )}
        </div>
      </div>

      {/* Minimal Help Text - Claude Style */}
      <div className="mt-2 text-center">
        <p className="text-xs text-gray-400">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default ChatInput;