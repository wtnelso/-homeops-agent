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
  onComplete: (response: string) => void;
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
  type: 'chunk' | 'status' | 'complete' | 'error' | 'structured_data';
  content?: string;
  message?: string;
  error?: string;
  structuredData?: StructuredData;
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
          callbacks.onComplete(data.message);
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
            callbacks.onStructuredData(structuredData);
          } catch (e) {
            console.error('Failed to parse structured data:', e);
            callbacks.onError('Failed to parse structured response');
          }
        }
        break;
      case 'tool_start':
        // Tool execution started - could show loading indicator
        if (callbacks.onToolStart) {
          callbacks.onToolStart(data);
        }
        break;
      case 'tool_complete':
        // Tool execution completed - could hide loading indicator
        if (callbacks.onToolComplete) {
          callbacks.onToolComplete(data);
        }
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