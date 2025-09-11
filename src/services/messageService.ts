import { NeonDbService, Message, AgentMemory } from './neonDb';

export interface MessageServiceConfig {
  neonDb: NeonDbService;
}

export interface ProcessMessageRequest {
  conversationId: string;
  userId: string;
  accountId: string;
  message: string;
}

export interface ContextData {
  recentMessages: Message[];
  userPreferences: AgentMemory[];
  familyInfo: AgentMemory[];
  conversationContext: AgentMemory[];
}

export class MessageService {
  private neonDb: NeonDbService;

  constructor(config: MessageServiceConfig) {
    this.neonDb = config.neonDb;
  }

  static create(): MessageService {
    const neonDb = NeonDbService.create();
    return new MessageService({ neonDb });
  }

  async processUserMessage(request: ProcessMessageRequest): Promise<{
    success: boolean;
    userMessage?: Message;
    context?: ContextData;
    error?: string;
  }> {
    try {
      // Verify conversation access
      const conversation = await this.neonDb.getConversation(request.conversationId);
      if (!conversation) {
        return { success: false, error: 'Conversation not found' };
      }

      if (conversation.user_id !== request.userId) {
        return { success: false, error: 'Unauthorized access to conversation' };
      }

      // Save user message
      const userMessage = await this.neonDb.createMessage({
        conversation_id: request.conversationId,
        role: 'user',
        content: request.message,
        metadata: {
          source: 'user_input',
          processed_at: new Date().toISOString()
        }
      });

      // Gather context for AI agent
      const context = await this.gatherContext(request.userId, request.accountId, request.conversationId);

      // Update conversation context memory
      await this.updateConversationContext(request.userId, request.accountId, request.conversationId, request.message);

      return { success: true, userMessage, context };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async saveAssistantMessage(conversationId: string, content: string, metadata?: Record<string, any>): Promise<{
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
          generated_at: new Date().toISOString(),
          ...metadata
        }
      });

      return { success: true, message };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async gatherContext(userId: string, _accountId: string, conversationId: string): Promise<ContextData> {
    try {
      // Get recent messages from conversation
      const recentMessages = await this.neonDb.getMessages(conversationId, 20);

      // Get user preferences
      const userPreferences = await this.neonDb.getMemoriesByType(userId, 'user_preferences');

      // Get family/household info
      const familyInfo = await this.neonDb.getMemoriesByType(userId, 'family_info');

      // Get conversation-specific context
      const conversationContext = await this.neonDb.getMemoriesByType(userId, 'conversation_context');

      return {
        recentMessages,
        userPreferences,
        familyInfo,
        conversationContext
      };
    } catch (error) {
      console.error('Error gathering context:', error);
      return {
        recentMessages: [],
        userPreferences: [],
        familyInfo: [],
        conversationContext: []
      };
    }
  }

  async updateUserPreference(userId: string, accountId: string, key: string, value: any, expiresInDays?: number): Promise<{
    success: boolean;
    memory?: AgentMemory;
    error?: string;
  }> {
    try {
      const expiresAt = expiresInDays ? new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000)) : undefined;

      const memory = await this.neonDb.setMemory({
        user_id: userId,
        account_id: accountId,
        memory_type: 'user_preferences',
        key,
        value: { preference: value, updated_at: new Date().toISOString() },
        expires_at: expiresAt
      });

      return { success: true, memory };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateFamilyInfo(userId: string, accountId: string, key: string, value: any): Promise<{
    success: boolean;
    memory?: AgentMemory;
    error?: string;
  }> {
    try {
      const memory = await this.neonDb.setMemory({
        user_id: userId,
        account_id: accountId,
        memory_type: 'family_info',
        key,
        value: { info: value, updated_at: new Date().toISOString() }
      });

      return { success: true, memory };
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
      // Verify access
      const conversation = await this.neonDb.getConversation(conversationId);
      if (!conversation || conversation.user_id !== userId) {
        return { success: false, error: 'Unauthorized or conversation not found' };
      }

      const messages = await this.neonDb.getMessages(conversationId);
      
      if (messages.length === 0) {
        return { success: true, summary: 'No messages in conversation' };
      }

      // Simple summary generation - could be enhanced with AI
      const userMessages = messages.filter(m => m.role === 'user');
      const assistantMessages = messages.filter(m => m.role === 'assistant');

      const summary = `Conversation with ${userMessages.length} user messages and ${assistantMessages.length} assistant responses. Started: ${messages[0].created_at.toLocaleDateString()}`;

      return { success: true, summary };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async updateConversationContext(userId: string, accountId: string, conversationId: string, message: string): Promise<void> {
    try {
      // Extract potential context clues from user message
      const contextClues = this.extractContextClues(message);
      
      if (contextClues.length > 0) {
        await this.neonDb.setMemory({
          user_id: userId,
          account_id: accountId,
          memory_type: 'conversation_context',
          key: `conversation_${conversationId}_topics`,
          value: {
            topics: contextClues,
            last_updated: new Date().toISOString()
          },
          expires_at: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days
        });
      }
    } catch (error) {
      console.error('Error updating conversation context:', error);
    }
  }

  private extractContextClues(message: string): string[] {
    const clues: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Common family/home topics
    const topics = [
      'schedule', 'calendar', 'appointment', 'meeting',
      'school', 'homework', 'pickup', 'dropoff',
      'grocery', 'shopping', 'meal', 'dinner', 'lunch',
      'chores', 'cleaning', 'laundry', 'dishes',
      'birthday', 'anniversary', 'vacation', 'holiday',
      'doctor', 'dentist', 'vet', 'medical',
      'soccer', 'practice', 'game', 'activity',
      'babysitter', 'daycare', 'afterschool'
    ];

    topics.forEach(topic => {
      if (lowerMessage.includes(topic)) {
        clues.push(topic);
      }
    });

    return [...new Set(clues)]; // Remove duplicates
  }

  async searchMessages(conversationId: string, userId: string, query: string, limit: number = 20): Promise<{
    success: boolean;
    messages?: Message[];
    error?: string;
  }> {
    try {
      // Verify access
      const conversation = await this.neonDb.getConversation(conversationId);
      if (!conversation || conversation.user_id !== userId) {
        return { success: false, error: 'Unauthorized or conversation not found' };
      }

      const allMessages = await this.neonDb.getMessages(conversationId, 1000);
      const filteredMessages = allMessages
        .filter(message => message.content.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit);

      return { success: true, messages: filteredMessages };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}