// Removed unused supabase import since we're using Vercel API routes
import { UserSessionService } from './userSession';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

export class EdgeFunctionChatService {
  private async getUserData() {
    // Use your existing user session service instead of making additional DB calls
    const sessionData = await UserSessionService.getUserSessionData();
    
    if (!sessionData?.user?.id || !sessionData?.account?.id) {
      throw new Error('User session not found');
    }

    return {
      userId: sessionData.user.id,
      accountId: sessionData.account.id
    };
  }

  async sendMessage(message: string, conversationId?: string): Promise<{
    success: boolean;
    conversationId?: string;
    messages?: ChatMessage[];
    error?: string;
  }> {
    try {
      const { userId, accountId } = await this.getUserData();

      // Use Vercel API route instead of Supabase Edge Functions
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversationId,
          userId,
          accountId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success,
        conversationId: data.conversationId,
        messages: data.messages?.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send message'
      };
    }
  }

  async getConversations(limit: number = 20): Promise<{
    success: boolean;
    conversations?: Conversation[];
    error?: string;
  }> {
    try {
      const { userId, accountId } = await this.getUserData();

      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'list',
          userId,
          accountId,
          limit
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        success: data.success,
        conversations: data.conversations
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch conversations'
      };
    }
  }

  async deleteConversation(conversationId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { userId } = await this.getUserData();

      const response = await fetch('/api/conversations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return { success: data.success };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete conversation'
      };
    }
  }

  async renameConversation(conversationId: string, title: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { userId } = await this.getUserData();

      const response = await fetch('/api/conversations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
          userId,
          title
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return { success: data.success };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to rename conversation'
      };
    }
  }
}

export { type ChatMessage, type Conversation };