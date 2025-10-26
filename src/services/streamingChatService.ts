/**
 * Streaming Chat Service
 * Handles Server-Sent Events for real-time chat responses
 */

import { API_CONFIG, ENDPOINTS } from '../config/apiConfig';
import { supabase } from '../lib/supabase';
import { STREAMING_CONFIG } from '../config/streamingConfig';

export interface StreamingCallbacks {
  onChunk: (chunk: string) => void;
  onStatus: (message: string) => void;
  onComplete: (response: string, conversationId?: string) => void;
  onError: (error: string) => void;
  onStructuredData: (data: StructuredData) => void;
}

export interface StructuredData {
  type: 'structured_data';
  template_name: string;
  title: string;
  data: {
    [toolName: string]: any;
  };
  metadata?: {
    query: string;
    timestamp: string;
    tools_used: string[];
    [key: string]: any;
  };
}

export interface StreamMessage {
  type: 'chunk' | 'status' | 'complete' | 'error' | 'structured_data' | 'tool_start' | 'tool_complete';
  content?: string;
  message?: string;
  error?: string;
  structuredData?: StructuredData;
  conversationId?: string;
  index?: number;
  total?: number;
}

export class StreamingChatService {
  private baseUrl: string;
  private controller: AbortController | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  async streamMessage(
    message: string,
    conversationId: string,
    userId: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    if (!STREAMING_CONFIG.enabled) {
      throw new Error('Streaming is not enabled');
    }

    // Create abort controller for this request
    this.controller = new AbortController();

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session?.access_token) {
        throw new Error('No valid session found for streaming request');
      }

      const token = session.access_token;

      const response = await fetch(`${this.baseUrl}${ENDPOINTS.chatStream}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message,
          conversationId,
          userId
        }),
        signal: this.controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      await this.processStream(response.body, callbacks);

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Stream aborted by user');
        } else {
          callbacks.onError(error.message);
        }
      } else {
        callbacks.onError('Unknown streaming error');
      }
    } finally {
      this.controller = null;
    }
  }

  private async processStream(
    body: ReadableStream<Uint8Array>,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('🌊 Stream completed');
          break;
        }

        // Decode chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamMessage = JSON.parse(line.slice(6));
              if (data.type === 'complete') {
                console.log('🔗 Raw complete message received:', data);
              }
              if (data.type === 'structured_data') {
                console.log('🔗 Raw structured_data message received:', data);
              }
              this.handleStreamData(data, callbacks);
            } catch (e) {
              console.error('Failed to parse stream data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private handleStreamData(data: StreamMessage, callbacks: StreamingCallbacks): void {
    switch (data.type) {
      case 'chunk':
        if (data.content !== undefined) {
          callbacks.onChunk(data.content);
        }
        break;
      case 'status':
        if (data.message) {
          callbacks.onStatus(data.message);
        }
        break;
      case 'complete':
        if (data.message) {
          console.log('🔗 StreamingChatService: Complete message received with conversationId:', data.conversationId);
          callbacks.onComplete(data.message, data.conversationId);
        }
        break;
      case 'error':
        if (data.error) {
          callbacks.onError(data.error);
        }
        break;
      case 'structured_data':
        if (data.content) {
          try {
            const structuredData: StructuredData = JSON.parse(data.content);
            console.log('🔗 StreamingChatService: Structured data received with conversationId:', data.conversationId);
            callbacks.onStructuredData(structuredData);
            // Also trigger onComplete with conversation ID for structured responses
            if (data.conversationId) {
              console.log('🔗 StreamingChatService: Triggering onComplete from structured data with conversationId:', data.conversationId);
              callbacks.onComplete('Structured response received', data.conversationId);
            }
          } catch (e) {
            console.error('Failed to parse structured data:', e);
            callbacks.onError('Failed to parse structured response');
          }
        }
        break;
      case 'tool_start':
        // Tool started - just log for now
        console.log('🔧 Tool started:', data.message || 'Unknown tool');
        break;
      case 'tool_complete':
        // Tool completed - just log for now
        console.log('🔧 Tool completed:', data.message || 'Unknown tool');
        break;
      default:
        console.warn('Unknown stream message type:', data.type);
    }
  }

  abortStream(): void {
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
  }

  isStreaming(): boolean {
    return this.controller !== null;
  }
}

export default StreamingChatService;