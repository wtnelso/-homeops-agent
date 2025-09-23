/**
 * Cost Calculator Service
 * 
 * Calculates estimated and actual costs for email processing jobs
 * based on OpenAI API pricing for GPT-4o-mini and text-embedding-3-small
 */

export class CostCalculator {
  // OpenAI API pricing (as of 2024) - in USD per token
  static PRICING = {
    // GPT-4o-mini pricing
    GPT_4O_MINI_INPUT: 0.00000015,  // $0.15 per 1M input tokens
    GPT_4O_MINI_OUTPUT: 0.0000006,  // $0.60 per 1M output tokens
    
    // text-embedding-3-small pricing
    TEXT_EMBEDDING_3_SMALL: 0.00000002  // $0.02 per 1M tokens
  };

  // Estimated token usage per email
  static ESTIMATED_TOKENS = {
    EMAIL_ANALYSIS_INPUT: 2000,     // Average email content + analysis prompt
    EMAIL_ANALYSIS_OUTPUT: 500,     // Analysis response with themes, priorities, etc.
    EMAIL_EMBEDDING_INPUT: 1000,    // Email content for embedding
    THEME_ANALYSIS_INPUT: 1500,     // Theme analysis prompt + email data
    THEME_ANALYSIS_OUTPUT: 300      // Theme analysis response
  };

  /**
   * Calculate estimated cost for a batch of emails
   */
  static calculateEstimatedCost(emailCount, batchType = 'full') {
    try {
      // Each email typically requires:
      // 1. Email analysis call (GPT-4o-mini)
      // 2. Email embedding call (text-embedding-3-small)
      // 3. Theme analysis call (GPT-4o-mini) - shared across emails in batch

      const emailAnalysisCalls = emailCount;
      const embeddingCalls = emailCount;
      const themeAnalysisCalls = Math.ceil(emailCount / 10); // One theme analysis per 10 emails

      // Calculate costs
      const emailAnalysisCost = emailAnalysisCalls * (
        (this.ESTIMATED_TOKENS.EMAIL_ANALYSIS_INPUT * this.PRICING.GPT_4O_MINI_INPUT) +
        (this.ESTIMATED_TOKENS.EMAIL_ANALYSIS_OUTPUT * this.PRICING.GPT_4O_MINI_OUTPUT)
      );

      const embeddingCost = embeddingCalls * 
        (this.ESTIMATED_TOKENS.EMAIL_EMBEDDING_INPUT * this.PRICING.TEXT_EMBEDDING_3_SMALL);

      const themeAnalysisCost = themeAnalysisCalls * (
        (this.ESTIMATED_TOKENS.THEME_ANALYSIS_INPUT * this.PRICING.GPT_4O_MINI_INPUT) +
        (this.ESTIMATED_TOKENS.THEME_ANALYSIS_OUTPUT * this.PRICING.GPT_4O_MINI_OUTPUT)
      );

      const totalCostUSD = emailAnalysisCost + embeddingCost + themeAnalysisCost;
      const totalCostCents = totalCostUSD * 100; // Precise decimal value

      return {
        estimated_cost_cents: totalCostCents,
        breakdown: {
          email_analysis_calls: emailAnalysisCalls,
          embedding_calls: embeddingCalls,
          theme_analysis_calls: themeAnalysisCalls,
          email_analysis_cost_cents: emailAnalysisCost * 100,
          embedding_cost_cents: embeddingCost * 100,
          theme_analysis_cost_cents: themeAnalysisCost * 100
        }
      };

    } catch (error) {
      console.error('❌ Failed to calculate estimated cost:', error);
      return {
        estimated_cost_cents: 0,
        breakdown: null
      };
    }
  }

  /**
   * Calculate actual cost based on real API usage
   */
  static calculateActualCost(apiCalls, tokenUsage = {}) {
    try {
      const {
        embedding_api_calls = 0,
        theme_analysis_calls = 0,
        email_analysis_calls = 0,
        
        // Token usage (if available from API responses)
        gpt_input_tokens = 0,
        gpt_output_tokens = 0,
        embedding_tokens = 0
      } = apiCalls;

      let actualCostUSD = 0;

      // If we have actual token usage, use that
      if (gpt_input_tokens > 0 || gpt_output_tokens > 0 || embedding_tokens > 0) {
        actualCostUSD = 
          (gpt_input_tokens * this.PRICING.GPT_4O_MINI_INPUT) +
          (gpt_output_tokens * this.PRICING.GPT_4O_MINI_OUTPUT) +
          (embedding_tokens * this.PRICING.TEXT_EMBEDDING_3_SMALL);
      } else {
        // Fallback to estimated token usage
        const totalGptCalls = email_analysis_calls + theme_analysis_calls;
        
        const gptCost = totalGptCalls * (
          (this.ESTIMATED_TOKENS.EMAIL_ANALYSIS_INPUT * this.PRICING.GPT_4O_MINI_INPUT) +
          (this.ESTIMATED_TOKENS.EMAIL_ANALYSIS_OUTPUT * this.PRICING.GPT_4O_MINI_OUTPUT)
        );

        const embeddingCost = embedding_api_calls * 
          (this.ESTIMATED_TOKENS.EMAIL_EMBEDDING_INPUT * this.PRICING.TEXT_EMBEDDING_3_SMALL);

        actualCostUSD = gptCost + embeddingCost;
      }

      // Return precise cost values without rounding
      const actualCostCents = actualCostUSD * 100;

      return {
        actual_cost_cents: actualCostCents, // Precise decimal value
        breakdown: {
          total_api_calls: embedding_api_calls + theme_analysis_calls + email_analysis_calls,
          cost_per_email_cents: actualCostCents / Math.max(email_analysis_calls, 1)
        }
      };

    } catch (error) {
      console.error('❌ Failed to calculate actual cost:', error);
      return {
        actual_cost_cents: 0,
        breakdown: null
      };
    }
  }

  /**
   * Get cost estimate for display purposes
   */
  static getCostEstimateForDisplay(emailCount) {
    const estimate = this.calculateEstimatedCost(emailCount);
    const costDollars = estimate.estimated_cost_cents / 100;
    
    return {
      cost_cents: estimate.estimated_cost_cents,
      cost_dollars: costDollars.toFixed(4),
      cost_per_email_cents: Math.round(estimate.estimated_cost_cents / emailCount),
      description: `~$${costDollars.toFixed(4)} for ${emailCount} emails (~${Math.round(estimate.estimated_cost_cents / emailCount / 10) / 10}¢ per email)`
    };
  }
}