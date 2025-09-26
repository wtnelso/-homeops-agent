// Render server-based chat service for LangChain-powered AI conversations
import { UserSessionService } from './userSession';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any> & {
    type?: 'calendar_invite' | 'text' | string;
    calendarData?: {
      title: string;
      date: string; // ISO date string
      time: string; // e.g., "2:00 PM - 3:00 PM"
      location?: string;
      description?: string;
      attendees?: string[];
      meetingLink?: string;
      duration?: string;
    };
  };
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
}

export class RenderChatService {
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

      // Use Express server for LangChain-powered chat with tools
      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      console.log('🚀 Sending chat request to:', `${serverUrl}/api/chat`);
      console.log('📤 Request payload:', { message: message.substring(0, 50) + '...', conversationId, accountId });

      const response = await fetch(`${serverUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          conversationId,
          accountId // Only accountId needed, not userId
        })
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Chat response received:', { success: data.success, messageCount: data.messages?.length });

      return {
        success: data.success,
        conversationId: data.conversationId,
        messages: data.messages?.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      };
    } catch (error: any) {
      console.error('❌ Chat request failed:', error);
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

      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      const response = await fetch(`${serverUrl}/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'list',
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

      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      const response = await fetch(`${serverUrl}/api/conversations`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId
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

      const serverUrl = import.meta.env.VITE_RENDER_SERVER_URL || 'http://localhost:10000';
      const response = await fetch(`${serverUrl}/api/conversations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId,
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