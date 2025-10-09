/**
 * HomeOps Email Processing Server
 * 
 * Long-running server for email embedding processing with LangChain and OpenAI.
 * Handles heavy AI processing that exceeds serverless function limits.
 */

// Load environment variables FIRST - before any imports that might use them
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import embeddingRoutes from './routes/embeddings.js';
import healthRoutes from './routes/health.js';
import chatRoutes from './routes/chat.js';
import conversationRoutes from './routes/conversations.js';
import agentMemoryRoutes from './routes/agentMemory.js';
console.log('✅ Agent memory routes imported successfully');
import semanticSearchRoutes from './routes/semanticSearch.js';
import profileRoutes from './routes/profile.js';
import profileSuggestionsRoutes from './routes/profileSuggestions.js';
import oauthRoutes from './routes/oauth.js';
import passwordResetSessionRoutes from './routes/passwordResetSession.js';
import userProviderRoutes from './routes/userProvider.js';
import familySyncRoutes from './routes/familySync.js';
import cacheManagementRoutes from './routes/cacheManagement.js';
import { SERVER_CONFIG, validateServerConfig } from './config/serverConfig.js';
import { MemoryCleanupService } from './services/memoryCleanupService.js';
import { initializeServer } from './serverInit.js';

const app = express();

// Validate configuration before starting
try {
  validateServerConfig();
  console.log('✅ Server configuration validated');
} catch (error) {
  console.error('❌ Configuration validation failed:', error.message);
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: SERVER_CONFIG.CORS.ALLOWED_ORIGINS,
  credentials: SERVER_CONFIG.CORS.CREDENTIALS
}));

app.use(express.json({ limit: SERVER_CONFIG.REQUEST_LIMITS.JSON_LIMIT }));
app.use(express.urlencoded({ extended: SERVER_CONFIG.REQUEST_LIMITS.URL_ENCODED_EXTENDED }));
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/embeddings', embeddingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/agent-memory', agentMemoryRoutes);
app.use('/api/semantic-search', semanticSearchRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/profile-suggestions', profileSuggestionsRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/password-reset-session', passwordResetSessionRoutes);
app.use('/api/user', userProviderRoutes);
app.use('/api/family-sync', familySyncRoutes);
app.use('/api/cache', cacheManagementRoutes);
app.use('/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'HomeOps Email Processing Server',
    status: 'running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      embeddings: '/api/embeddings',
      chat: '/api/chat',
      conversations: '/api/conversations',
      agentMemory: '/api/agent-memory',
      semanticSearch: '/api/semantic-search',
      profile: '/api/profile',
      profileSuggestions: '/api/profile-suggestions',
      oauth: '/api/oauth',
      passwordResetSession: '/api/password-reset-session',
      familySync: '/api/family-sync'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(SERVER_CONFIG.PORT, '0.0.0.0', async () => {
  console.log(`🚀 HomeOps Email Processing Server running on port ${SERVER_CONFIG.PORT}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${SERVER_CONFIG.ENVIRONMENT}`);
  console.log(`🔗 Health check: http://localhost:${SERVER_CONFIG.PORT}/health`);
  console.log(`🌐 CORS origins:`, SERVER_CONFIG.CORS.ALLOWED_ORIGINS);

  // Initialize server services (Redis queues, etc.)
  try {
    await initializeServer();
  } catch (error) {
    console.error('❌ Failed to initialize server services:', error);
  }

  // Start memory management services
  try {
    MemoryCleanupService.startAll();
  } catch (error) {
    console.error('❌ Failed to start memory management services:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});