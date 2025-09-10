/**
 * Email Analysis Service
 * 
 * Handles email analysis operations for onboarding and dashboard
 */

import { supabase } from '../lib/supabase';

export interface EmailInsight {
  id: string;
  type: 'theme' | 'actionable_insight';
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  email_count: number;
  examples: string[];
}

export interface AnalysisStatus {
  status: 'not_started' | 'pending' | 'syncing' | 'analyzing' | 'completed' | 'failed' | 'not_found';
  batch_id?: string;
  total_emails?: number;
  processed_emails?: number;
  message?: string;
}

export interface AnalysisResults {
  success: boolean;
  status: string;
  batch_id?: string;
  summary?: {
    total_emails: number;
    themes_count: number;
    insights_count: number;
    top_senders_count: number;
    analysis_date: string;
    keywords_analyzed: string[];
  };
  themes: EmailInsight[];
  actionable_insights: EmailInsight[];
  sender_patterns: Array<{
    id: string;
    domain: string;
    email_count: number;
    category: string;
  }>;
  error?: string;
}

export class EmailAnalysisService {
  /**
   * Start email analysis for an account
   */
  static async startAnalysis(accountId: string, keywords: string[] = []): Promise<{
    success: boolean;
    batch_id?: string;
    error?: string;
  }> {
    try {
      console.log('🚀 Starting email analysis...');

      const response = await supabase.functions.invoke('start-email-analysis', {
        body: {
          account_id: accountId,
          keywords
        }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to start email analysis');
      }

      console.log('✅ Email analysis started:', response.data);

      return {
        success: true,
        batch_id: response.data.batch_id
      };

    } catch (error) {
      console.error('❌ Failed to start email analysis:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start email analysis'
      };
    }
  }

  /**
   * Get analysis status and results for an account
   */
  static async getAnalysisStatus(accountId: string, batchId?: string): Promise<AnalysisResults> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams();
      if (batchId) {
        params.append('batch_id', batchId);
      } else {
        params.append('account_id', accountId);
      }

      const response = await supabase.functions.invoke('get-email-analysis', {
        body: Object.fromEntries(params.entries()),
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        console.error('Analysis status error:', response.error);
        return {
          success: false,
          status: 'failed',
          themes: [],
          actionable_insights: [],
          sender_patterns: [],
          error: response.error.message
        };
      }

      const result = response.data;
      console.log('📊 Analysis status:', result.status);

      return {
        success: result.success,
        status: result.status,
        batch_id: result.batch_id,
        summary: result.summary,
        themes: result.themes || [],
        actionable_insights: result.actionable_insights || [],
        sender_patterns: result.sender_patterns || [],
        error: result.error
      };

    } catch (error) {
      console.error('Error fetching analysis status:', error);
      return {
        success: false,
        status: 'failed',
        themes: [],
        actionable_insights: [],
        sender_patterns: [],
        error: 'Failed to check analysis status'
      };
    }
  }

  /**
   * Poll for analysis completion with automatic retries
   */
  static async pollUntilComplete(
    accountId: string, 
    batchId?: string,
    onStatusUpdate?: (status: AnalysisResults) => void,
    maxAttempts: number = 60, // 3 minutes with 3-second intervals
    interval: number = 3000
  ): Promise<AnalysisResults> {
    let attempts = 0;

    const poll = async (): Promise<AnalysisResults> => {
      attempts++;
      const result = await this.getAnalysisStatus(accountId, batchId);
      
      // Update caller with current status
      if (onStatusUpdate) {
        onStatusUpdate(result);
      }

      // If completed or failed, return result
      if (result.status === 'completed' || result.status === 'failed') {
        return result;
      }

      // If max attempts reached, return current status
      if (attempts >= maxAttempts) {
        return {
          ...result,
          success: false,
          status: 'failed',
          error: 'Analysis polling timed out'
        };
      }

      // If still in progress, wait and poll again
      if (['pending', 'syncing', 'analyzing'].includes(result.status)) {
        await new Promise(resolve => setTimeout(resolve, interval));
        return poll();
      }

      // Unknown status, return as-is
      return result;
    };

    return poll();
  }

  /**
   * Helper to get status message for display
   */
  static getStatusMessage(status: string, totalEmails?: number, processedEmails?: number): string {
    switch (status) {
      case 'not_started':
        return 'Ready to analyze your emails';
      case 'pending':
        return 'Starting email analysis...';
      case 'syncing':
        return `Fetching emails from Gmail... ${processedEmails || 0}/${totalEmails || '?'} processed`;
      case 'analyzing':
        return 'Analyzing emails with AI to extract insights...';
      case 'completed':
        return `Analysis complete! Found insights from ${totalEmails || 0} emails.`;
      case 'failed':
        return 'Email analysis failed. Please try again.';
      case 'not_found':
        return 'No email analysis found. Please connect Gmail first.';
      default:
        return 'Processing...';
    }
  }

  /**
   * Helper to calculate progress percentage
   */
  static getProgressPercentage(status: string, totalEmails?: number, processedEmails?: number): number {
    switch (status) {
      case 'not_started':
        return 0;
      case 'pending':
        return 5;
      case 'syncing':
        if (totalEmails && processedEmails) {
          return 5 + Math.round((processedEmails / totalEmails) * 70); // 5-75%
        }
        return 20;
      case 'analyzing':
        return 80;
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 10;
    }
  }
}