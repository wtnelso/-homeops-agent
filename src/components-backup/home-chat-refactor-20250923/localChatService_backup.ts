import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

// Simple in-memory storage for conversations (will be lost on refresh)
interface LocalMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface LocalConversation {
  id: string;
  title: string;
  messages: LocalMessage[];
  created_at: Date;
  updated_at: Date;
}

class LocalChatService {
  private conversations: Map<string, LocalConversation> = new Map();
  private llm: ChatOpenAI;

  constructor() {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    const model = import.meta.env.VITE_OPENAI_MODEL;
    const temperature = import.meta.env.VITE_OPENAI_TEMPERATURE 
      ? parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE)
      : 0.7;

    console.log('LocalChatService initialization:', {
      hasApiKey: !!openaiApiKey,
      model: model,
      temperature: temperature,
      keyLength: openaiApiKey?.length
    });

    if (!openaiApiKey) {
      throw new Error('VITE_OPENAI_API_KEY environment variable is required');
    }
    
    if (!model) {
      throw new Error('VITE_OPENAI_MODEL environment variable is required');
    }

    // Set the global environment variable for LangChain
    if (typeof window !== 'undefined') {
      (window as any).process = { env: { OPENAI_API_KEY: openaiApiKey } };
    }

    this.llm = new ChatOpenAI({
      openAIApiKey: openaiApiKey,
      modelName: model.trim(), // Remove any whitespace
      temperature: temperature,
      configuration: {
        apiKey: openaiApiKey
      }
    });
  }

  async sendMessage(message: string, conversationId?: string): Promise<{
    success: boolean;
    conversationId?: string;
    messages?: LocalMessage[];
    error?: string;
  }> {
    try {
      // Get or create conversation
      let conversation: LocalConversation;
      
      if (conversationId && this.conversations.has(conversationId)) {
        conversation = this.conversations.get(conversationId)!;
      } else {
        // Create new conversation
        const newId = Date.now().toString();
        const title = this.generateTitle(message);
        conversation = {
          id: newId,
          title,
          messages: [],
          created_at: new Date(),
          updated_at: new Date()
        };
        this.conversations.set(newId, conversation);
        conversationId = newId;
      }

      // Add user message
      const userMessage: LocalMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      conversation.messages.push(userMessage);

      // Generate AI response
      const aiResponse = await this.generateAIResponse(conversation.messages);

      // Add AI message
      const aiMessage: LocalMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      conversation.messages.push(aiMessage);

      // Update conversation
      conversation.updated_at = new Date();
      this.conversations.set(conversationId, conversation);

      return {
        success: true,
        conversationId,
        messages: conversation.messages
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send message'
      };
    }
  }

  private async generateAIResponse(messages: LocalMessage[]): Promise<string> {
    // Build system prompt
    const systemPrompt = `You are a helpful AI assistant for HomeOps, a family logistics and home operations management platform. You help users with:

- Family scheduling and calendar management
- Email organization and insights
- Household task coordination
- Family communication
- Home management tasks

Guidelines:
- Be helpful, friendly, and family-focused
- Provide practical, actionable advice
- Ask clarifying questions when needed
- Keep responses concise but complete`;

    // Convert messages to LangChain format
    const langChainMessages = [
      new SystemMessage(systemPrompt),
      ...messages
        .filter(m => m.role !== 'system')
        .slice(-10) // Keep last 10 messages for context
        .map(msg => {
          if (msg.role === 'user') {
            return new HumanMessage(msg.content);
          } else {
            return new AIMessage(msg.content);
          }
        })
    ];

    // Generate response
    const response = await this.llm.invoke(langChainMessages);
    return response.content as string;
  }

  private generateTitle(message: string): string {
    const title = message
      .substring(0, 50)
      .replace(/\n/g, ' ')
      .trim();
    
    return title + (message.length > 50 ? '...' : '');
  }

  getConversations(): LocalConversation[] {
    return Array.from(this.conversations.values())
      .sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
  }

  getConversation(id: string): LocalConversation | null {
    return this.conversations.get(id) || null;
  }

  deleteConversation(id: string): boolean {
    return this.conversations.delete(id);
  }

  renameConversation(id: string, newTitle: string): boolean {
    const conversation = this.conversations.get(id);
    if (conversation) {
      conversation.title = newTitle;
      conversation.updated_at = new Date();
      return true;
    }
    return false;
  }
}

export { LocalChatService, type LocalMessage, type LocalConversation };