import { NeonDbService, Conversation, Message } from './neonDb';

export interface ConversationServiceConfig {
  neonDb: NeonDbService;
}

export interface CreateConversationRequest {
  userId: string;
  accountId: string;
  title?: string;
  initialMessage?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  message: string;
  userId: string;
}

export class ConversationService {
  private neonDb: NeonDbService;

  constructor(config: ConversationServiceConfig) {
    this.neonDb = config.neonDb;
  }

  static create(): ConversationService {
    const neonDb = NeonDbService.create();
    return new ConversationService({ neonDb });
  }

  async createConversation(request: CreateConversationRequest): Promise<{
    success: boolean;
    conversation?: Conversation;
    error?: string;
  }> {
    try {
      // Generate title if not provided
      const title = request.title || this.generateConversationTitle(request.initialMessage);

      const conversation = await this.neonDb.createConversation({
        user_id: request.userId,
        account_id: request.accountId,
        title,
        metadata: {
          created_by: 'chat_interface',
          version: '1.0'
        }
      });

      // Add initial message if provided
      if (request.initialMessage) {
        await this.neonDb.createMessage({
          conversation_id: conversation.id,
          role: 'user',
          content: request.initialMessage,
          metadata: {
            source: 'initial_message'
          }
        });
      }

      return { success: true, conversation };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getConversation(conversationId: string): Promise<{
    success: boolean;
    conversation?: Conversation;
    messages?: Message[];
    error?: string;
  }> {
    try {
      const conversation = await this.neonDb.getConversation(conversationId);
      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }

      const messages = await this.neonDb.getMessages(conversationId);

      return { success: true, conversation, messages };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getUserConversations(userId: string, limit: number = 20): Promise<{
    success: boolean;
    conversations?: Conversation[];
    error?: string;
  }> {
    try {
      const conversations = await this.neonDb.getConversationsByUser(userId, limit);
      return { success: true, conversations };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async addUserMessage(request: SendMessageRequest): Promise<{
    success: boolean;
    message?: Message;
    error?: string;
  }> {
    try {
      // Verify conversation exists and user has access
      const conversation = await this.neonDb.getConversation(request.conversationId);
      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }

      if (conversation.user_id !== request.userId) {
        return { success: false, error: 'Unauthorized access to conversation' };
      }

      const message = await this.neonDb.createMessage({
        conversation_id: request.conversationId,
        role: 'user',
        content: request.message,
        metadata: {
          source: 'user_input',
          timestamp: new Date().toISOString()
        }
      });

      return { success: true, message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async addAssistantMessage(conversationId: string, content: string, metadata?: Record<string, any>): Promise<{
    success: boolean;
    message?: Message;
    error?: string;
  }> {
    try {
      const message = await this.neonDb.createMessage({
        conversation_id: conversationId,
        role: 'assistant',
        content,
        metadata: {
          source: 'ai_agent',
          timestamp: new Date().toISOString(),
          ...metadata
        }
      });

      return { success: true, message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateConversationTitle(conversationId: string, title: string, userId: string): Promise<{
    success: boolean;
    conversation?: Conversation;
    error?: string;
  }> {
    try {
      // Verify user has access to conversation
      const existingConversation = await this.neonDb.getConversation(conversationId);
      if (!existingConversation) {
        return { success: false, error: 'Conversation not found' };
      }

      if (existingConversation.user_id !== userId) {
        return { success: false, error: 'Unauthorized access to conversation' };
      }

      const conversation = await this.neonDb.updateConversation(conversationId, { title });
      return { success: true, conversation: conversation || undefined };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getConversationMessages(conversationId: string, userId: string, limit: number = 50): Promise<{
    success: boolean;
    messages?: Message[];
    error?: string;
  }> {
    try {
      // Verify user has access to conversation
      const conversation = await this.neonDb.getConversation(conversationId);
      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }

      if (conversation.user_id !== userId) {
        return { success: false, error: 'Unauthorized access to conversation' };
      }

      const messages = await this.neonDb.getMessages(conversationId, limit);
      return { success: true, messages };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private generateConversationTitle(initialMessage?: string): string {
    if (!initialMessage) {
      return `New Chat - ${new Date().toLocaleDateString()}`;
    }

    // Extract first 50 characters and clean up
    const title = initialMessage
      .substring(0, 50)
      .replace(/\n/g, ' ')
      .trim();

    return title + (initialMessage.length > 50 ? '...' : '');
  }

  async searchConversations(userId: string, query: string, limit: number = 10): Promise<{
    success: boolean;
    conversations?: Conversation[];
    error?: string;
  }> {
    try {
      // For now, simple title search - could be enhanced with full-text search
      const allConversations = await this.neonDb.getConversationsByUser(userId, 100);
      const filteredConversations = allConversations
        .filter(conv => 
          conv.title?.toLowerCase().includes(query.toLowerCase()) ||
          JSON.stringify(conv.metadata).toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);

      return { success: true, conversations: filteredConversations };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}