/**
 * Conversational LLM Tool
 *
 * Handles general conversation, emotional support, brainstorming, and advice
 * requests that don't require specific data retrieval or action tools.
 * Uses the existing BASE_PROMPT with sophisticated HomeOps personality.
 */

import { Tool } from '@langchain/core/tools';
import { ChatOpenAI } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import AgentMemoryService from '../services/agentMemoryService.js';
import { SYSTEM_PROMPTS } from '../config/chatConfig.js';

export class ConversationalLLMTool extends Tool {
  name = 'conversational_llm';
  description = `Use this tool for conversational responses, emotional support, brainstorming, and general advice.

  This tool handles:
  - General conversation and emotional support (e.g., "family life is hard")
  - Brainstorming and creative suggestions (e.g., "what are some good ideas for activities")
  - Opinion requests and advice seeking (e.g., "what do you think", "how should I handle")
  - Open-ended questions requiring reasoning or creativity
  - General chat and casual interaction

  Input format: {"query": "user_message"}

  Example inputs:
  - {"query": "family life is hard"}
  - {"query": "what are some good ideas for the family this week"}
  - {"query": "how should I handle this situation"}
  - {"query": "what do you think about this"}`;

  schema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The user query or conversation message'
      }
    },
    required: ['query']
  };

  constructor({ userId }) {
    super();
    this.userId = userId;
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    this.agentMemory = new AgentMemoryService(this.supabase);
  }

  async _call({ query }) {
    try {
      console.log(`🗣️ ConversationalLLM: Processing query: "${query}"`);

      // Initialize LLM with higher temperature for conversational responses
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.8, // Higher temperature for more natural conversation
        configuration: {
          fetch: (await import('node-fetch')).default
        }
      });

      // Get relevant memories for context
      let memoryContext = '';
      try {
        const memories = await this.agentMemory.searchMemories(this.userId, query, {
          limit: 3,
          minSimilarity: 0.7
        });

        if (memories && memories.length > 0) {
          memoryContext = '\n\nRelevant context from previous conversations:\n' +
            memories.map(m => `- ${m.content}`).join('\n');
        }
      } catch (error) {
        console.log(`🗣️ ConversationalLLM: No relevant memories found (${error.message})`);
      }

      // Use the existing BASE_PROMPT which contains the sophisticated HomeOps personality:
      // - Personal chief of staff for modern family life
      // - Blend of Mel Robbins, Andrew Huberman, The Gottmans, Amy Schumer, Guy Raz, Cal Newport
      // - Calm, executive-level peer (not coach or therapist)
      // - Validate effort once, use dry grounded language, move conversations forward
      // - Reduce mental load with actionable clarity
      const conversationalPrompt = `${SYSTEM_PROMPTS.BASE_PROMPT}

You are responding to a conversational message that doesn't require specific data retrieval or actions.
This is general conversation, emotional support, brainstorming, or advice seeking.
${memoryContext}

User message: "${query}"

Respond in your established HomeOps voice - as a personal chief of staff providing calm, actionable clarity. Follow your communication tone blend and tone rules exactly.`;

      console.log(`🗣️ ConversationalLLM: Generating response with HomeOps personality (temp 0.8)`);

      const response = await llm.invoke([
        { role: 'user', content: conversationalPrompt }
      ]);

      const result = response.content.trim();
      console.log(`🗣️ ConversationalLLM: Generated response (${result.length} chars)`);

      return result;

    } catch (error) {
      console.error('🗣️ ConversationalLLM: Error generating response:', error);
      // Fallback response in HomeOps voice (from BASE_PROMPT inspiration)
      return `You're carrying a lot right now. That's not weakness — that's the reality of managing complexity. How can I help you move forward?`;
    }
  }
}