/**
 * API Configuration
 * Centralized configuration for all API endpoints and server URLs
 */

interface ApiEndpoints {
  // Authentication & Session Management
  passwordResetSession: {
    create: string;
    validate: string;
    clear: string;
  };

  // Chat & AI
  chat: string;
  chatStream: string;
  chatHealth: string;
  conversations: string;
  agentMemory: string;

  // Search & Content
  semanticSearch: string;
  embeddings: string;

  // User Management
  profile: string;
  profileSuggestions: string;

  // Integration
  oauth: string;

  // System
  health: string;
}

interface ApiConfig {
  baseUrl: string;
  endpoints: ApiEndpoints;
  timeout: number;
  retryAttempts: number;
}

// Environment-based server URL configuration
const getServerUrl = (): string => {
  const renderUrl = import.meta.env.VITE_RENDER_SERVER_URL;
  const environment = import.meta.env.VITE_APP_ENV;

  // Production/Staging - use Render URL
  if (environment === 'PRODUCTION' || environment === 'STAGING') {
    return renderUrl || 'https://homeops-email-processor.onrender.com';
  }

  // Development - check for local server or fallback to Render
  if (renderUrl) {
    return renderUrl;
  }

  // Default local development
  return 'http://localhost:10000';
};

export const API_CONFIG: ApiConfig = {
  baseUrl: getServerUrl(),

  endpoints: {
    // Authentication & Session Management
    passwordResetSession: {
      create: '/api/password-reset-session/create',
      validate: '/api/password-reset-session/validate',
      clear: '/api/password-reset-session/clear'
    },

    // Chat & AI
    chat: '/api/chat',
    chatStream: '/api/chat/stream',
    chatHealth: '/health/tools',
    conversations: '/api/conversations',
    agentMemory: '/api/agent-memory',

    // Search & Content
    semanticSearch: '/api/semantic-search',
    embeddings: '/api/embeddings',

    // User Management
    profile: '/api/profile',
    profileSuggestions: '/api/profile-suggestions',

    // Integration
    oauth: '/api/oauth',

    // System
    health: '/health'
  },

  // Request configuration
  timeout: 30000, // 30 seconds
  retryAttempts: 3
};

// Helper function to get full URL for an endpoint
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};

// Type-safe endpoint accessors
export const ENDPOINTS = API_CONFIG.endpoints;

export default API_CONFIG;