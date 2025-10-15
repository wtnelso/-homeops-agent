/**
 * Streaming Configuration
 * Controls when and how streaming responses are enabled
 */

export interface StreamingConfig {
  enabled: boolean;
  fallbackTimeout: number;
  retryAttempts: number;
  chunkBufferSize: number;
  maxConnectionTime: number;
}

export const STREAMING_CONFIG: StreamingConfig = {
  enabled: import.meta.env.VITE_ENABLE_STREAMING === 'TRUE' || import.meta.env.VITE_ENABLE_STREAMING === 'true',
  fallbackTimeout: 10000, // 10 seconds before falling back to non-streaming
  retryAttempts: 3,
  chunkBufferSize: 1024,
  maxConnectionTime: 60000 // 60 seconds max connection
};

export const isStreamingEnabled = (): boolean => {
  return STREAMING_CONFIG.enabled;
};

export default STREAMING_CONFIG;