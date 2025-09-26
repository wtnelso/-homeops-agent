/**
 * Server Configuration
 *
 * Centralized configuration for the HomeOps Email Processing Server
 */

export const SERVER_CONFIG = {
  // Port configuration
  PORT: process.env.PORT || 10000,

  // CORS configuration
  CORS: {
    ALLOWED_ORIGINS: [
      'http://localhost:3000',  // Local development (Vite default)
      'http://localhost:3001',  // Local development (alternative port)
      'https://dev.homeops.ai', // Development deployment
      'https://homeops.ai',     // Production deployment
      process.env.FRONTEND_URL  // Environment-specific override
    ].filter(Boolean), // Remove any undefined/null values

    CREDENTIALS: true
  },

  // Request limits
  REQUEST_LIMITS: {
    JSON_LIMIT: '10mb',
    URL_ENCODED_EXTENDED: true
  },

  // Database configuration
  DATABASE: {
    NEON_URL: process.env.NEON_DATABASE_URL
  },

  // OpenAI configuration
  OPENAI: {
    API_KEY: process.env.OPENAI_API_KEY,
    MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3')
  },

  // Supabase configuration
  SUPABASE: {
    URL: process.env.SUPABASE_URL,
    SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  // Environment
  ENVIRONMENT: process.env.NODE_ENV || 'development',

  // Logging
  LOGGING: {
    ENABLE_REQUEST_LOGGING: true,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info'
  }
};

// Validation function to ensure required config is present
export function validateServerConfig() {
  const required = [
    { key: 'DATABASE.NEON_URL', value: SERVER_CONFIG.DATABASE.NEON_URL },
    { key: 'OPENAI.API_KEY', value: SERVER_CONFIG.OPENAI.API_KEY }
  ];

  const missing = required.filter(({ value }) => !value);

  if (missing.length > 0) {
    const missingKeys = missing.map(({ key }) => key).join(', ');
    throw new Error(`Missing required configuration: ${missingKeys}`);
  }

  return true;
}

export default SERVER_CONFIG;