/**
 * OpenAI Rate Limiter Service
 *
 * Implements sliding window rate limiting and exponential backoff retry logic
 * for OpenAI API calls to prevent hitting rate limits across multiple accounts.
 */

import { EmailConfig } from '../config/emailConfig.js';

export class OpenAIRateLimiter {
  constructor() {
    this.config = EmailConfig.openaiConfig.rateLimiting;

    // Sliding window tracking for different request types
    this.requestWindows = {
      llm: [],      // Track LLM API call timestamps
      embedding: [] // Track embedding API call timestamps
    };

    console.log('🔒 OpenAI Rate Limiter initialized:', this.config);
  }

  /**
   * Execute an OpenAI API call with rate limiting and retry logic
   */
  async executeWithRateLimit(apiCall, requestType = 'llm') {
    const maxRetries = this.config.maxRetries;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Wait for rate limit clearance
        await this.waitForRateLimit(requestType);

        // Track this request
        this.trackRequest(requestType);

        // Execute the API call
        const result = await apiCall();

        if (attempt > 0) {
          console.log(`✅ OpenAI request succeeded after ${attempt} retries`);
        }

        return result;

      } catch (error) {
        lastError = error;

        // Check if this is a rate limit error
        if (this.isRateLimitError(error)) {
          const delay = this.calculateRetryDelay(attempt);
          console.warn(`⏰ Rate limit hit (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);

          if (attempt < maxRetries) {
            await this.sleep(delay);
            continue;
          }
        } else {
          // Non-rate-limit error, don't retry
          console.error(`❌ OpenAI API error (non-rate-limit):`, error.message);
          throw error;
        }
      }
    }

    // All retries exhausted
    console.error(`❌ OpenAI request failed after ${maxRetries} retries`);
    throw new Error(`Rate limit exceeded: ${lastError.message}`);
  }

  /**
   * Wait until we're within rate limits for the request type
   */
  async waitForRateLimit(requestType) {
    const now = Date.now();
    const windowSize = this.config.windowSizeMs;
    const maxRequests = requestType === 'llm'
      ? this.config.llmRequestsPerMinute
      : this.config.embeddingRequestsPerMinute;

    // Clean old entries outside the current window
    this.requestWindows[requestType] = this.requestWindows[requestType]
      .filter(timestamp => now - timestamp < windowSize);

    // Check if we're within limits
    while (this.requestWindows[requestType].length >= maxRequests) {
      const oldestRequest = Math.min(...this.requestWindows[requestType]);
      const waitTime = (oldestRequest + windowSize) - now;

      if (waitTime > 0) {
        console.log(`⏳ Rate limit: waiting ${waitTime}ms for ${requestType} request slot...`);
        await this.sleep(Math.min(waitTime, 1000)); // Wait max 1 second at a time

        // Clean old entries again
        const currentTime = Date.now();
        this.requestWindows[requestType] = this.requestWindows[requestType]
          .filter(timestamp => currentTime - timestamp < windowSize);
      } else {
        break;
      }
    }
  }

  /**
   * Track a request in the sliding window
   */
  trackRequest(requestType) {
    this.requestWindows[requestType].push(Date.now());
  }

  /**
   * Check if an error is a rate limit error
   */
  isRateLimitError(error) {
    const message = error.message?.toLowerCase() || '';
    const status = error.status || error.code;

    // OpenAI rate limit indicators
    return (
      status === 429 ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('quota exceeded') ||
      error.type === 'rate_limit_exceeded'
    );
  }

  /**
   * Calculate exponential backoff delay
   */
  calculateRetryDelay(attempt) {
    const baseDelay = this.config.baseRetryDelayMs;
    const multiplier = this.config.backoffMultiplier;
    const jitter = Math.random() * 0.3; // Add 0-30% jitter to prevent thundering herd

    return Math.floor(baseDelay * Math.pow(multiplier, attempt) * (1 + jitter));
  }

  /**
   * Sleep utility
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus() {
    const now = Date.now();
    const windowSize = this.config.windowSizeMs;

    // Clean old entries
    this.requestWindows.llm = this.requestWindows.llm
      .filter(timestamp => now - timestamp < windowSize);
    this.requestWindows.embedding = this.requestWindows.embedding
      .filter(timestamp => now - timestamp < windowSize);

    return {
      llm: {
        current: this.requestWindows.llm.length,
        limit: this.config.llmRequestsPerMinute,
        available: Math.max(0, this.config.llmRequestsPerMinute - this.requestWindows.llm.length)
      },
      embedding: {
        current: this.requestWindows.embedding.length,
        limit: this.config.embeddingRequestsPerMinute,
        available: Math.max(0, this.config.embeddingRequestsPerMinute - this.requestWindows.embedding.length)
      },
      window_size_minutes: windowSize / 60000
    };
  }

  /**
   * Reset rate limit tracking (useful for testing)
   */
  resetRateLimits() {
    this.requestWindows.llm = [];
    this.requestWindows.embedding = [];
    console.log('🔄 Rate limit tracking reset');
  }
}

// Global instance for the entire application
export const globalRateLimiter = new OpenAIRateLimiter();

export default OpenAIRateLimiter;