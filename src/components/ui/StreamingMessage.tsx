/**
 * Streaming Message Component
 * Displays messages with streaming indicators and status
 */

import React from 'react';
import { X } from 'lucide-react';
import { StreamingMessage as StreamingMessageType } from '../../hooks/useStreamingChat';
import CalendarEventTemplate from './CalendarEventTemplate';
import EmailListTemplate from './EmailListTemplate';

/**
 * Simple markdown parser for chat messages
 * Handles **bold** text and bullet lists with smart structure detection
 */
function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle headers (### text)
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base sm:text-lg font-semibold mt-4 mb-2 first:mt-0 break-words">
          {line.substring(4)}
        </h3>
      );
    }
    // Handle section headers (lines ending with :)
    else if (line.trim().endsWith(':') && !line.includes('•') && !line.match(/^\s*[-*]\s+/)) {
      const parsedContent = parseBoldText(line);
      elements.push(
        <div key={i} className="font-semibold mt-3 mb-2 first:mt-0 break-words">
          {parsedContent}
        </div>
      );
    }
    // Handle tags/badges (specific patterns that should be badges) - NO ICONS
    else if (line.match(/^\s*(📅\s*)?[-*]\s+(All Day Event|Private|Public|Recurring|Cancelled|Confirmed|Tentative)$/)) {
      const content = line.replace(/^\s*(📅\s*)?[-*]\s+/, '');
      elements.push(
        <div key={i} className="ml-4 mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {content}
          </span>
        </div>
      );
    }
    // Handle bullet points (- text or * text) but only if they contain detail patterns
    else if (line.match(/^\s*[-*]\s+/) && (line.includes(':') || line.match(/^\s*[-*]\s+(Type|Date|Location|Dates)/))) {
      const content = line.replace(/^\s*[-*]\s+/, '');
      const parsedContent = parseBoldText(content);
      elements.push(
        <div key={i} className="flex items-start ml-4 mb-1">
          <span className="text-gray-600 dark:text-gray-400 mr-2 mt-0.5">•</span>
          <span>{parsedContent}</span>
        </div>
      );
    }
    // Skip Source lines completely
    else if (line.match(/^\s*[-*•]?\s*Source:/i)) {
      continue;
    }
    // Handle event titles (numbered lists like "1. Event Name") - add source icons
    else if (line.match(/^\s*\d+\.\s+/)) {
      const content = line.replace(/^\s*\d+\.\s+/, '');

      // Find source in next few lines
      let sourceIcon = '';
      const nextLines = lines.slice(i + 1, i + 5);
      for (const nextLine of nextLines) {
        const sourceMatch = nextLine.match(/Source:\s*(.+)/i);
        if (sourceMatch) {
          const source = sourceMatch[1].trim().toLowerCase();
          if (source.includes('google calendar')) sourceIcon = '📅 ';
          else if (source.includes('family activities')) sourceIcon = '🏃‍♀️ ';
          else if (source.includes('gmail')) sourceIcon = '📧 ';
          else if (source.includes('agent memory')) sourceIcon = '🧠 ';
          else if (source.includes('semantic search')) sourceIcon = '🔍 ';
          break;
        }
      }

      const parsedContent = parseBoldText(content);
      elements.push(
        <div key={i} className="font-medium mt-3 mb-2">
          {sourceIcon}{parsedContent}
        </div>
      );
    }
    // Handle bullet points (event details)
    else if (line.match(/^\s*[-*•]\s+/)) {
      const content = line.replace(/^\s*[-*•]\s+/, '');
      const parsedContent = parseBoldText(content);
      elements.push(
        <div key={i} className="ml-4 mb-1 flex items-start">
          <span className="text-gray-600 dark:text-gray-400 mr-2 mt-0.5">•</span>
          <span>{parsedContent}</span>
        </div>
      );
    }
    // Handle empty lines
    else if (line.trim() === '') {
      elements.push(<br key={i} />);
    }
    // Handle regular text
    else {
      const parsedContent = parseBoldText(line);
      elements.push(
        <div key={i} className="mb-1">
          {parsedContent}
        </div>
      );
    }
  }

  return elements;
}

/**
 * Parse **bold** text in a line
 */
function parseBoldText(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

interface StreamingMessageProps {
  message: StreamingMessageType;
  onAbort?: () => void;
}

const StreamingMessage: React.FC<StreamingMessageProps> = ({ message, onAbort }) => {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  return (
    <div className={`w-full ${isUser ? 'flex justify-end' : ''}`}>
      <div className={`max-w-full sm:max-w-2xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        {/* Message Text */}
        <div className={`inline-block px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
          isUser
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
            : 'bg-transparent text-gray-900 dark:text-gray-100'
        }`}>
          <div className="break-words leading-relaxed text-sm sm:text-base">
            {isAssistant && message.type === 'structured' && message.structuredData ? (
              message.structuredData.template_name === 'email_list' ? (
                <EmailListTemplate data={message.structuredData} />
              ) : (
                <CalendarEventTemplate data={message.structuredData} />
              )
            ) : isAssistant ? (
              parseMarkdown(message.content)
            ) : (
              message.content
            )}
          </div>
        </div>

        {/* Streaming Status */}
        {message.status && (
          <div className={`flex items-center space-x-2 mt-2 text-xs text-gray-500 dark:text-gray-400 ${isUser ? 'justify-end' : ''}`}>
            {message.isStreaming ? (
              <div className="flex items-center space-x-1">
                {/* Claude-style thinking animation */}
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-claude-thinking"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-claude-thinking"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-claude-thinking"></div>
                </div>
              </div>
            ) : null}
            <span>{message.status}</span>

            {/* Abort Button */}
            {message.isStreaming && onAbort && (
              <button
                onClick={onAbort}
                className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs"
                title="Stop streaming"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingMessage;