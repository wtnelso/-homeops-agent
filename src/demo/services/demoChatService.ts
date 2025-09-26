import { findDemoResponse, getDemoFallback } from '../config/demoConfig';

export interface DemoMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export class DemoChatService {
  private static instance: DemoChatService;
  private messageHistory: DemoMessage[] = [];
  private resetTimestamp: number = Date.now();

  static getInstance(): DemoChatService {
    if (!DemoChatService.instance) {
      DemoChatService.instance = new DemoChatService();
    }
    return DemoChatService.instance;
  }

  // Simulate sending a message and getting a scripted response
  async sendMessage(userMessage: string): Promise<{
    success: boolean;
    messages: DemoMessage[];
    nextQuestion?: string;
    calendarInvite?: any;
  }> {
    // Add user message
    const userMsg: DemoMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    this.messageHistory.push(userMsg);

    // Find scripted response or use fallback
    const demoResult = findDemoResponse(userMessage);
    const assistantContent = demoResult?.response || getDemoFallback();

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Add assistant response
    const assistantMsg: DemoMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date()
    };

    this.messageHistory.push(assistantMsg);

    return {
      success: true,
      messages: [...this.messageHistory],
      nextQuestion: demoResult?.nextQuestion,
      calendarInvite: demoResult?.calendarInvite
    };
  }

  // Get current conversation history
  getMessages(): DemoMessage[] {
    return [...this.messageHistory];
  }

  // Reset demo for fresh presentation
  resetDemo(): void {
    this.messageHistory = [];
    this.resetTimestamp = Date.now();
    // Clear demo onboarding completion flag
    localStorage.removeItem('demo-onboarding-completed');
    console.log('🎬 Demo reset - ready for fresh presentation with default prompts');
  }

  // Get reset timestamp for triggering re-renders
  getResetTimestamp(): number {
    return this.resetTimestamp;
  }

  // Check if demo onboarding should be launched
  shouldLaunchOnboarding(): boolean {
    return !localStorage.getItem('demo-onboarding-completed');
  }

  // Mark demo onboarding as completed
  markOnboardingCompleted(): void {
    localStorage.setItem('demo-onboarding-completed', 'true');
  }

  // Initialize demo with empty message history (show prompts)
  initializeDemo(): void {
    // Start with empty message history to show the regular prompt UI
    this.messageHistory = [];
    console.log('🎬 Demo initialized - showing default prompt interface');
  }
}

export const demoChatService = DemoChatService.getInstance();