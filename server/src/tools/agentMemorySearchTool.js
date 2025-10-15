/**
 * Agent Memory Search LangChain Tool
 *
 * Provides access to user's agent memory including contacts, family info, preferences,
 * schedules, and other personal information stored through the agent memory system.
 */

import { Tool } from '@langchain/core/tools';
import AgentMemoryService from '../services/agentMemoryService.js';
import { TOOLS_CONFIG } from '../config/chatConfig.js';

export class AgentMemorySearchTool extends Tool {
  name = 'agent_memory_search';
  description = `ALWAYS use this tool when the user asks about contacts, personal information, family details, or stored data.

  This tool searches the user's personal agent memory containing:
  - ALL CONTACTS (doctors, teachers, family friends, service providers)
  - Family member information and preferences
  - Schedules and activities
  - Personal preferences and stored knowledge

  MUST USE for these queries:
  - "who are my contacts" / "my contacts" / "list contacts" / "show contacts"
  - "doctor" / "pediatrician" / "teacher" / "dentist" (any contact type)
  - Family member questions ("my child's doctor", "who is the teacher")
  - Any question about stored personal information

  Input format: {"query": "search terms", "memoryType": "optional_type"}

  Example inputs:
  - {"query": "contacts", "memoryType": "contact_info"}
  - {"query": "doctor", "memoryType": "contact_info"}
  - {"query": "family preferences"}
  - {"query": "my child's schedule"}

  Memory types: contact_info, family_info, preference_info, schedule_info, activity_info, education_info`;

  schema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search terms to find relevant memories (e.g., "family", "contacts", "doctor")'
      },
      memoryType: {
        type: 'string',
        description: 'Optional memory type filter',
        enum: ['contact_info', 'family_info', 'preference_info', 'schedule_info', 'activity_info', 'education_info']
      }
    },
    required: ['query']
  };

  constructor({ userId }) {
    super();
    this.userId = userId;
  }

  /**
   * Execute agent memory search
   */
  async _call(input) {
    console.log(`🚨 AGENT MEMORY TOOL _call() EXECUTED!`);
    console.log(`🚨 Input received:`, JSON.stringify(input, null, 2));
    try {
      // Input should be the arguments object directly from LangChain
      const { query, memoryType = null } = input || {};
      console.log(`🚨 Parsed - query: "${query}", memoryType: "${memoryType}"`);

      if (!query || typeof query !== 'string') {
        return JSON.stringify({
          success: false,
          error: 'Query parameter is required and must be a string'
        });
      }

      console.log(`🧠 Agent memory search: "${query}" for user ${this.userId}${memoryType ? ` (type: ${memoryType})` : ''}`);

      // Use AgentMemoryService to get relevant memories
      console.log(`🔍 Calling AgentMemoryService.getRelevantMemories with userId: ${this.userId}, query: ${query}`);
      const memoryResult = await AgentMemoryService.getRelevantMemories(this.userId, query);
      console.log(`📊 Agent memory result:`, JSON.stringify(memoryResult, null, 2));

      if (!memoryResult.success) {
        console.error('Agent memory search error:', memoryResult.error);
        return JSON.stringify({
          success: false,
          error: 'Agent memory search failed',
          details: memoryResult.error
        });
      }

      let memories = memoryResult.memories || [];

      // Apply memory type filter if specified
      if (memoryType && memories.length > 0) {
        memories = memories.filter(memory => {
          if (memory.memory_type === memoryType) return true;

          // Also check context_type for structured data
          if (memory.value && typeof memory.value === 'object' && memory.value.context_type === memoryType) {
            return true;
          }

          return false;
        });
      }

      // Format results for LangChain consumption
      const formattedResults = this._formatResults(memories, query);

      return JSON.stringify({
        success: true,
        source: 'agent_memory',
        query,
        memory_type_filter: memoryType,
        total_results: memories.length,
        results: formattedResults,
        metadata: {
          search_method: 'agent_memory_query',
          user_id: this.userId,
          searched_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Agent memory search tool error:', error);
      return JSON.stringify({
        success: false,
        error: 'Agent memory search failed',
        details: error.message
      });
    }
  }

  /**
   * Format search results for LangChain consumption
   * @private
   */
  _formatResults(memories, query) {
    return memories.map(memory => {
      const result = {
        id: memory.id,
        memory_type: memory.memory_type,
        key: memory.key,
        confidence_score: memory.confidence_score,
        priority: memory.priority,
        created_at: memory.created_at,
        expires_at: memory.expires_at,
        source: 'agent_memory'
      };

      // Format value based on type
      if (typeof memory.value === 'object' && memory.value !== null) {
        // Structured data (contacts, family info, etc.)
        const data = memory.value;

        if (data.context_type === 'contact_info') {
          result.contact = {
            name: data.name,
            role: data.role,
            email: data.email,
            phone: data.phone,
            category: data.contact_category,
            member_name: data.member_name
          };
          result.formatted_text = `${data.name} (${data.role})${data.phone ? ` - ${data.phone}` : ''}${data.email ? ` - ${data.email}` : ''}`;
        } else if (data.context_type === 'family_info') {
          result.family = {
            name: data.name,
            relationship: data.relationship,
            age: data.age,
            grade: data.grade
          };
          result.formatted_text = `${data.name} (${data.relationship})${data.age ? `, age ${data.age}` : ''}${data.grade ? `, grade ${data.grade}` : ''}`;
        } else if (data.context_type === 'preference_info') {
          result.preference = {
            name: data.name,
            type: data.type,
            items: data.items
          };
          result.formatted_text = `${data.name}: ${data.type} - ${Array.isArray(data.items) ? data.items.join(', ') : data.items}`;
        } else {
          // Generic structured data
          result.data = data;
          result.formatted_text = JSON.stringify(data);
        }
      } else {
        // Simple text data
        result.text = memory.value;
        result.formatted_text = String(memory.value);
      }

      return result;
    });
  }
}

export default AgentMemorySearchTool;