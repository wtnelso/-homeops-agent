/**
 * Streaming Chat Hook
 * Manages streaming chat state and provides interface to streaming service
 */

import { useState, useCallback, useRef } from 'react';
import StreamingChatService, { StreamingCallbacks, StructuredData } from '../services/streamingChatService';
import { isStreamingEnabled } from '../config/streamingConfig';

export interface StreamingMessage {
  id: string;
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
  timestamp: Date;
  role: 'user' | 'assistant';
  status?: string;
  structuredData?: StructuredData;
  type?: 'text' | 'structured';
}

export interface UseStreamingChatReturn {
  messages: StreamingMessage[];
  isStreaming: boolean;
  sendStreamingMessage: (message: string, conversationId: string, userId: string) => Promise<void>;
  abortStream: () => void;
  addUserMessage: (content: string) => void;
  clearMessages: () => void;
}

export const useStreamingChat = (): UseStreamingChatReturn => {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamingServiceRef = useRef<StreamingChatService | null>(null);
  const currentStreamingMessageId = useRef<string | null>(null);
  const pendingContentRef = useRef<string>('');

  const generateId = (): string => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Throttled update function for smoother, slower typing effect
  const debouncedUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  const updateMessageContent = useCallback((messageId: string, content: string) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    const minDelay = 50; // Minimum 50ms between updates for slower typing

    // Clear any pending update
    if (debouncedUpdateRef.current) {
      clearTimeout(debouncedUpdateRef.current);
    }

    const doUpdate = () => {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, content }
          : msg
      ));
      lastUpdateTimeRef.current = Date.now();
    };

    // If enough time has passed, update immediately, otherwise throttle
    if (timeSinceLastUpdate >= minDelay) {
      doUpdate();
    } else {
      const delay = minDelay - timeSinceLastUpdate;
      debouncedUpdateRef.current = setTimeout(doUpdate, delay);
    }
  }, []);

  const addUserMessage = useCallback((content: string) => {
    const userMessage: StreamingMessage = {
      id: generateId(),
      content,
      isStreaming: false,
      isComplete: true,
      timestamp: new Date(),
      role: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
  }, []);

  const sendStreamingMessage = useCallback(async (
    message: string,
    conversationId: string,
    userId: string
  ): Promise<void> => {
    if (!isStreamingEnabled()) {
      throw new Error('Streaming is not enabled');
    }

    // Add user message first
    addUserMessage(message);

    // Create streaming assistant message placeholder
    const assistantMessageId = generateId();
    currentStreamingMessageId.current = assistantMessageId;
    pendingContentRef.current = ''; // Reset for new message

    const assistantMessage: StreamingMessage = {
      id: assistantMessageId,
      content: '',
      isStreaming: true,
      isComplete: false,
      timestamp: new Date(),
      role: 'assistant',
      status: 'Connecting...'
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsStreaming(true);

    // Initialize streaming service
    if (!streamingServiceRef.current) {
      streamingServiceRef.current = new StreamingChatService();
    }

    const callbacks: StreamingCallbacks = {
      onChunk: (chunk: string) => {
        // Accumulate content
        pendingContentRef.current += chunk;

        // Update content and status immediately
        updateMessageContent(assistantMessageId, pendingContentRef.current);

        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, status: 'Streaming...' }
            : msg
        ));
      },

      onStatus: (statusMessage: string) => {
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, status: statusMessage }
            : msg
        ));
      },

      onComplete: () => {
        // Clear any pending timeouts
        if (debouncedUpdateRef.current) {
          clearTimeout(debouncedUpdateRef.current);
          debouncedUpdateRef.current = null;
        }

        // Save the final content before resetting
        const finalContent = pendingContentRef.current;

        // Set final content and mark as complete
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: finalContent, // Use saved content
                isStreaming: false,
                isComplete: true,
                status: undefined
              }
            : msg
        ));

        setIsStreaming(false);
        currentStreamingMessageId.current = null;
        pendingContentRef.current = ''; // Reset for next message
      },

      onError: (error: string) => {
        console.error('Streaming error:', error);

        // Clear any pending timeouts
        if (debouncedUpdateRef.current) {
          clearTimeout(debouncedUpdateRef.current);
          debouncedUpdateRef.current = null;
        }

        // Save the content before resetting
        const finalContent = pendingContentRef.current || `Error: ${error}`;

        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: finalContent,
                isStreaming: false,
                isComplete: true,
                status: undefined
              }
            : msg
        ));

        setIsStreaming(false);
        currentStreamingMessageId.current = null;
        pendingContentRef.current = ''; // Reset for next message
      },

      onStructuredData: (structuredData: StructuredData) => {
        console.log('Received structured data:', structuredData);

        // Clear any pending timeouts
        if (debouncedUpdateRef.current) {
          clearTimeout(debouncedUpdateRef.current);
          debouncedUpdateRef.current = null;
        }

        // Set structured data and mark as complete
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: structuredData.title,
                structuredData,
                type: 'structured',
                isStreaming: false,
                isComplete: true,
                status: undefined
              }
            : msg
        ));

        setIsStreaming(false);
        currentStreamingMessageId.current = null;
        pendingContentRef.current = ''; // Reset for next message
      }
    };

    try {
      await streamingServiceRef.current.streamMessage(
        message,
        conversationId,
        userId,
        callbacks
      );
    } catch (error) {
      console.error('Failed to start streaming:', error);
      callbacks.onError(error instanceof Error ? error.message : 'Failed to start streaming');
    }
  }, [addUserMessage]);

  const abortStream = useCallback(() => {
    if (streamingServiceRef.current) {
      streamingServiceRef.current.abortStream();
      setIsStreaming(false);

      // Clear any pending timeouts
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current);
        debouncedUpdateRef.current = null;
      }

      // Mark current streaming message as incomplete
      if (currentStreamingMessageId.current) {
        // Save content before resetting
        const finalContent = pendingContentRef.current + ' [Stopped by user]';

        setMessages(prev => prev.map(msg =>
          msg.id === currentStreamingMessageId.current
            ? {
                ...msg,
                content: finalContent,
                isStreaming: false,
                isComplete: false,
                status: undefined
              }
            : msg
        ));
        currentStreamingMessageId.current = null;
        pendingContentRef.current = ''; // Reset for next message
      }
    }
  }, []);

  const clearMessages = useCallback(() => {
    abortStream();
    setMessages([]);
  }, [abortStream]);

  return {
    messages,
    isStreaming,
    sendStreamingMessage,
    abortStream,
    addUserMessage,
    clearMessages
  };
};

export default useStreamingChat;