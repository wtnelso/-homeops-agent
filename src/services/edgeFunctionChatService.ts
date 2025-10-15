// Render server-based chat service for LangChain-powered AI conversations
import { UserSessionService } from './userSession';
import { apiService } from './authenticatedApiService';
import { ENDPOINTS } from '../config/apiConfig';

export interface ChatMessage {
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
  calendarInvite?: {
    title: string;
    date: string;
    time: string;
    location?: string;
    description?: string;
    attendees?: string[];
    duration?: string;
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

    if (!sessionData?.user?.id || !sessionData?.family?.id) {
      throw new Error('User session not found');
    }

    return {
      familyId: sessionData.family.id, // Use family.id from UserSessionData structure
      userId: sessionData.user.id // Use real authenticated user ID
    };
  }

  async sendMessage(message: string, conversationId?: string): Promise<{
    success: boolean;
    conversationId?: string;
    messages?: ChatMessage[];
    error?: string;
  }> {
    try {
      const { familyId, userId } = await this.getUserData();

      // Use authenticated API service for LangChain-powered chat with tools
      console.log('🚀 Sending chat request to:', ENDPOINTS.chat);
      console.log('📤 Request payload:', { message: message.substring(0, 50) + '...', conversationId, familyId, userId });

      const response = await apiService.post(ENDPOINTS.chat, {
        message,
        conversationId,
        familyId, // Send family context for family-aware processing
        userId    // Send user context for user-specific features
      });

      console.log('📥 Response status:', response.status);

      if (response.error) {
        throw new Error(response.error || `HTTP ${response.status}`);
      }

      const data = response.data;
      console.log('✅ Chat response received:', { success: data?.success, messageCount: data?.messages?.length });

      return {
        success: data?.success || false,
        conversationId: data?.conversationId,
        messages: data?.messages?.map((msg: any) => ({
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
      const { familyId } = await this.getUserData();

      const response = await apiService.post(ENDPOINTS.conversations, {
        action: 'list',
        familyId, // Updated to use family context
        limit
      });

      if (response.error) {
        throw new Error(response.error || `HTTP ${response.status}`);
      }

      const data = response.data;

      return {
        success: data?.success || false,
        conversations: data?.conversations
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

      const response = await apiService.request(ENDPOINTS.conversations, {
        method: 'DELETE',
        body: { conversationId }
      });

      if (response.error) {
        throw new Error(response.error || `HTTP ${response.status}`);
      }

      const data = response.data;

      return { success: data?.success || false };
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

      const response = await apiService.put(ENDPOINTS.conversations, {
        conversationId,
        title
      });

      if (response.error) {
        throw new Error(response.error || `HTTP ${response.status}`);
      }

      const data = response.data;

      return { success: data?.success || false };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to rename conversation'
      };
    }
  }
}

export { type Conversation };