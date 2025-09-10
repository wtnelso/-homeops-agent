import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Loader, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const HomePage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your HomeOps AI assistant. How can I help you manage your home operations today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const predefinedPrompts = [
    {
      id: '1',
      text: 'Summarize my upcoming week',
      category: 'Family Operations'
    },
    {
      id: '2', 
      text: 'Help me plan dinner for the family this week',
      category: 'Meal Planning'
    },
    {
      id: '3',
      text: 'What are the upcoming school events I need to know about?',
      category: 'School & Kids'
    },
    {
      id: '4',
      text: 'Create a grocery list for this week\'s meals',
      category: 'Shopping'
    },
    {
      id: '5',
      text: 'Help me organize my family calendar',
      category: 'Calendar Management'
    },
    {
      id: '6',
      text: 'Draft a message to coordinate with other parents',
      category: 'Communication'
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 1) {
      scrollToBottom();
    }
  }, [messages]);

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

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response - replace with your actual API call
    setTimeout(() => {
      const responses = [
        'I understand your request. This is a placeholder response from your HomeOps AI assistant.',
        'That\'s an interesting question! Let me help you with that. Once integrated with the OpenAI API, I\'ll provide detailed assistance.',
        'I\'m here to help with your home operations and general tasks. This response will be powered by AI once the backend is connected.',
        'Great question! I\'m processing your request and will provide a comprehensive answer once the AI integration is complete.'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };


  const handlePromptClick = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Predefined Prompts Sidebar */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Quick Prompts</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Click on any prompt to get started
              </p>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-3">
                {predefinedPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => handlePromptClick(prompt.text)}
                    disabled={isLoading}
                    className="w-full p-3 text-left bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-brand-600 dark:text-brand-400 uppercase tracking-wide">
                        {prompt.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {prompt.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex items-center justify-center w-8 h-8 bg-brand-100 dark:bg-brand-900/20 rounded-full border border-brand-200 dark:border-brand-700 flex-shrink-0">
                      <img src="/favicon.ico" alt="HomeOps" className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-brand-100' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {message.sender === 'user' && (
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 flex-shrink-0">
                      <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex items-center justify-center w-8 h-8 bg-brand-100 dark:bg-brand-900/20 rounded-full border border-brand-200 dark:border-brand-700">
                    <img src="/favicon.ico" alt="HomeOps" className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type your message..."
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none min-h-[48px] max-h-[120px]"
                    rows={1}
                  />
                </div>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-all duration-200 flex items-center justify-center min-w-[48px]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;