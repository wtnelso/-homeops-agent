/**
 * Token Usage Tracker Service
 * 
 * Tracks actual token usage from OpenAI API responses for accurate cost calculation.
 * Handles both LangChain wrapper responses and direct OpenAI API responses.
 */

export class TokenUsageTracker {
  constructor() {
    this.usage = {
      gpt_input_tokens: 0,
      gpt_output_tokens: 0,
      embedding_tokens: 0
    };
  }

  /**
   * Reset all token counters
   */
  reset() {
    this.usage = {
      gpt_input_tokens: 0,
      gpt_output_tokens: 0,
      embedding_tokens: 0
    };
  }

  /**
   * Track tokens from LangChain LLM response (GPT models)
   */
  trackLLMResponse(response, fallbackPromptLength = 0) {
    try {
      // Try to extract from LangChain response metadata
      if (response?.response_metadata?.tokenUsage) {
        const usage = response.response_metadata.tokenUsage;
        const inputTokens = usage.promptTokens || usage.input_tokens || 0;
        const outputTokens = usage.completionTokens || usage.output_tokens || 0;
        
        this.usage.gpt_input_tokens += inputTokens;
        this.usage.gpt_output_tokens += outputTokens;
        
        console.log(`🎯 LLM tokens tracked: ${inputTokens} input, ${outputTokens} output (total input: ${this.usage.gpt_input_tokens}, output: ${this.usage.gpt_output_tokens})`);
        return { inputTokens, outputTokens, source: 'actual' };
      }
      
      // Try alternative metadata locations
      if (response?.usage) {
        const usage = response.usage;
        const inputTokens = usage.prompt_tokens || usage.input_tokens || 0;
        const outputTokens = usage.completion_tokens || usage.output_tokens || 0;
        
        this.usage.gpt_input_tokens += inputTokens;
        this.usage.gpt_output_tokens += outputTokens;
        
        console.log(`🎯 LLM tokens tracked: ${inputTokens} input, ${outputTokens} output (total input: ${this.usage.gpt_input_tokens}, output: ${this.usage.gpt_output_tokens})`);
        return { inputTokens, outputTokens, source: 'actual' };
      }

      // Fallback: estimate tokens based on content length
      const responseContent = response?.content || response?.text || '';
      const inputEstimate = Math.ceil(fallbackPromptLength / 4);
      const outputEstimate = Math.ceil(responseContent.length / 4);
      
      this.usage.gpt_input_tokens += inputEstimate;
      this.usage.gpt_output_tokens += outputEstimate;
      
      console.log(`🎯 LLM tokens estimated: ${inputEstimate} input, ${outputEstimate} output (total input: ${this.usage.gpt_input_tokens}, output: ${this.usage.gpt_output_tokens})`);
      return { inputTokens: inputEstimate, outputTokens: outputEstimate, source: 'estimated' };

    } catch (error) {
      console.error('❌ Error tracking LLM tokens:', error);
      return { inputTokens: 0, outputTokens: 0, source: 'error' };
    }
  }

  /**
   * Track tokens from embedding response
   */
  trackEmbeddingResponse(response, fallbackContentLength = 0) {
    try {
      // Try to extract from embedding response metadata
      if (response?.usage) {
        const tokens = response.usage.total_tokens || response.usage.prompt_tokens || 0;
        this.usage.embedding_tokens += tokens;
        
        console.log(`💎 Embedding tokens tracked: ${tokens} (total: ${this.usage.embedding_tokens})`);
        return { tokens, source: 'actual' };
      }

      // Try alternative response structures
      if (response?.data?.[0]?.usage) {
        const tokens = response.data[0].usage.total_tokens || response.data[0].usage.prompt_tokens || 0;
        this.usage.embedding_tokens += tokens;
        
        console.log(`💎 Embedding tokens tracked: ${tokens} (total: ${this.usage.embedding_tokens})`);
        return { tokens, source: 'actual' };
      }

      // Fallback: estimate tokens as content length / 4
      const estimatedTokens = Math.ceil(fallbackContentLength / 4);
      this.usage.embedding_tokens += estimatedTokens;
      
      console.log(`💎 Embedding tokens estimated: ${estimatedTokens} (total: ${this.usage.embedding_tokens})`);
      return { tokens: estimatedTokens, source: 'estimated' };

    } catch (error) {
      console.error('❌ Error tracking embedding tokens:', error);
      return { tokens: 0, source: 'error' };
    }
  }

  /**
   * Manually add tokens (for cases where automatic tracking fails)
   */
  addTokens(type, amount) {
    if (this.usage.hasOwnProperty(type)) {
      this.usage[type] += amount;
      console.log(`📝 Manually added ${amount} ${type} (total: ${this.usage[type]})`);
    } else {
      console.warn(`⚠️ Invalid token type: ${type}`);
    }
  }

  /**
   * Get current token usage totals
   */
  getUsage() {
    return { ...this.usage };
  }

  /**
   * Get total tokens across all types
   */
  getTotalTokens() {
    return this.usage.gpt_input_tokens + this.usage.gpt_output_tokens + this.usage.embedding_tokens;
  }

  /**
   * Get usage summary for logging
   */
  getSummary() {
    const total = this.getTotalTokens();
    return {
      ...this.usage,
      total_tokens: total,
      breakdown: {
        gpt_tokens: this.usage.gpt_input_tokens + this.usage.gpt_output_tokens,
        embedding_tokens: this.usage.embedding_tokens
      }
    };
  }

  /**
   * Log current usage summary
   */
  logSummary() {
    const summary = this.getSummary();
    console.log('📊 Token Usage Summary:', {
      'GPT Input': summary.gpt_input_tokens,
      'GPT Output': summary.gpt_output_tokens, 
      'Embeddings': summary.embedding_tokens,
      'Total': summary.total_tokens
    });
  }
}