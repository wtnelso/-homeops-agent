import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { MessageService, ContextData } from './messageService';
import { ConversationService } from './conversationService';
import { Message } from './neonDb';

export interface AIAgentConfig {
  openaiApiKey: string;
  messageService: MessageService;
  conversationService: ConversationService;
  model?: string;
  temperature?: number;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  userId: string;
  accountId: string;
}

export interface ChatResponse {
  success: boolean;
  response?: string;
  conversationId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export class AIAgentService {
  private llm: ChatOpenAI;
  private messageService: MessageService;
  private conversationService: ConversationService;

  constructor(config: AIAgentConfig) {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.openaiApiKey,
      modelName: config.model || 'gpt-4',
      temperature: config.temperature || 0.7
    });
    this.messageService = config.messageService;
    this.conversationService = config.conversationService;
  }

  static create(): AIAgentService {
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('VITE_OPENAI_API_KEY environment variable is required');
    }

    const model = import.meta.env.VITE_OPENAI_MODEL;
    if (!model) {
      throw new Error('VITE_OPENAI_MODEL environment variable is required');
    }

    const temperature = import.meta.env.VITE_OPENAI_TEMPERATURE 
      ? parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE)
      : 0.7;

    const messageService = MessageService.create();
    const conversationService = ConversationService.create();

    return new AIAgentService({
      openaiApiKey,
      messageService,
      conversationService,
      model,
      temperature
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      let conversationId = request.conversationId;

      // Create new conversation if none provided
      if (!conversationId) {
        const createResult = await this.conversationService.createConversation({
          userId: request.userId,
          accountId: request.accountId,
          title: this.generateTitle(request.message),
          initialMessage: request.message
        });

        if (!createResult.success || !createResult.conversation) {
          return { success: false, error: createResult.error || 'Failed to create conversation' };
        }

        conversationId = createResult.conversation.id;
      }

      // Process user message and gather context
      const messageResult = await this.messageService.processUserMessage({
        conversationId,
        userId: request.userId,
        accountId: request.accountId,
        message: request.message
      });

      if (!messageResult.success || !messageResult.context) {
        return { success: false, error: messageResult.error || 'Failed to process message' };
      }

      // Generate AI response
      const aiResponse = await this.generateResponse(request.message, messageResult.context);

      // Save AI response
      const saveResult = await this.messageService.saveAssistantMessage(
        conversationId,
        aiResponse,
        {
          model: import.meta.env.VITE_OPENAI_MODEL || 'unknown',
          temperature: this.llm.temperature,
          generated_at: new Date().toISOString()
        }
      );

      if (!saveResult.success) {
        return { success: false, error: saveResult.error || 'Failed to save AI response' };
      }

      return {
        success: true,
        response: aiResponse,
        conversationId,
        metadata: {
          messageCount: messageResult.context.recentMessages.length,
          hasContext: messageResult.context.userPreferences.length > 0 || messageResult.context.familyInfo.length > 0
        }
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async generateResponse(userMessage: string, context: ContextData): Promise<string> {
    // Build system prompt with context
    const systemPrompt = this.buildSystemPrompt(context);

    // Build conversation history
    const messages = [
      new SystemMessage(systemPrompt),
      ...this.buildMessageHistory(context.recentMessages),
      new HumanMessage(userMessage)
    ];

    // Generate response
    const response = await this.llm.invoke(messages);
    return response.content as string;
  }

  private buildSystemPrompt(context: ContextData): string {
    let prompt = `You are a helpful AI assistant for HomeOps, a family logistics and home operations management platform. You help users with:

- Family scheduling and calendar management
- Email organization and insights
- Household task coordination
- Family communication
- Home management tasks

Guidelines:
- Be helpful, friendly, and family-focused
- Provide practical, actionable advice
- Ask clarifying questions when needed
- Remember context from previous messages
- Keep responses concise but complete`;

    // Add user preferences context
    if (context.userPreferences.length > 0) {
      prompt += `\n\nUser Preferences:\n`;
      context.userPreferences.forEach(pref => {
        prompt += `- ${pref.key}: ${JSON.stringify(pref.value.preference)}\n`;
      });
    }

    // Add family info context
    if (context.familyInfo.length > 0) {
      prompt += `\n\nFamily Information:\n`;
      context.familyInfo.forEach(info => {
        prompt += `- ${info.key}: ${JSON.stringify(info.value.info)}\n`;
      });
    }

    // Add conversation context
    if (context.conversationContext.length > 0) {
      prompt += `\n\nConversation Context:\n`;
      context.conversationContext.forEach(ctx => {
        if (ctx.value.topics) {
          prompt += `- Recent topics discussed: ${ctx.value.topics.join(', ')}\n`;
        }
      });
    }

    return prompt;
  }

  private buildMessageHistory(messages: Message[]): (HumanMessage | AIMessage)[] {
    // Only include recent messages to avoid token limits
    const recentMessages = messages.slice(-10);

    return recentMessages.map(msg => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else if (msg.role === 'assistant') {
        return new AIMessage(msg.content);
      }
      // Skip system messages in history
      return null;
    }).filter(Boolean) as (HumanMessage | AIMessage)[];
  }

  private generateTitle(message: string): string {
    // Extract first 50 characters for title
    const title = message
      .substring(0, 50)
      .replace(/\n/g, ' ')
      .trim();

    return title + (message.length > 50 ? '...' : '');
  }

  async updateUserPreference(userId: string, accountId: string, preference: string, value: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await this.messageService.updateUserPreference(userId, accountId, preference, value);
      return { success: result.success, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateFamilyInfo(userId: string, accountId: string, key: string, info: any): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await this.messageService.updateFamilyInfo(userId, accountId, key, info);
      return { success: result.success, error: result.error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getConversationSummary(conversationId: string, userId: string): Promise<{
    success: boolean;
    summary?: string;
    error?: string;
  }> {
    try {
      // Get conversation and messages
      const conversationResult = await this.conversationService.getConversation(conversationId);
      if (!conversationResult.success || !conversationResult.messages) {
        return { success: false, error: conversationResult.error || 'Failed to get conversation' };
      }

      // Verify user access
      if (conversationResult.conversation?.user_id !== userId) {
        return { success: false, error: 'Unauthorized access' };
      }

      if (conversationResult.messages.length === 0) {
        return { success: true, summary: 'No messages in conversation' };
      }

      // Use AI to generate summary
      const messages = conversationResult.messages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const summaryPrompt = `Please provide a brief summary of this conversation:

${messages}

Summary:`;

      const summary = await this.llm.invoke([new HumanMessage(summaryPrompt)]);
      
      return { success: true, summary: summary.content as string };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async suggestFollowUpQuestions(conversationId: string, userId: string): Promise<{
    success: boolean;
    suggestions?: string[];
    error?: string;
  }> {
    try {
      const conversationResult = await this.conversationService.getConversationMessages(conversationId, userId, 10);
      if (!conversationResult.success || !conversationResult.messages) {
        return { success: false, error: conversationResult.error || 'Failed to get messages' };
      }

      const recentMessages = conversationResult.messages.slice(-5);
      const context = recentMessages
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      const prompt = `Based on this conversation context, suggest 3 helpful follow-up questions the user might want to ask:

${context}

Respond with just the questions, one per line, starting with "1.", "2.", "3.":`;

      const response = await this.llm.invoke([new HumanMessage(prompt)]);
      const suggestions = (response.content as string)
        .split('\n')
        .filter(line => line.trim().match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim());

      return { success: true, suggestions };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}