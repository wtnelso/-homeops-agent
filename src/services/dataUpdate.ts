import { supabase } from '../lib/supabase';
import { ROUTES } from '../config/routes';

export interface AccountUpdateData {
  account_name?: string;
  household_type?: string;
  timezone?: string;
  subscription_status?: string;
  is_active?: boolean;
}

export interface UserUpdateData {
  name_user_provided?: string;
  avatar_url?: string;
  avatar_user_provided?: string;
  is_active?: boolean;
}

export class DataUpdateService {
  /**
   * Handles session expiration by redirecting to login and showing toast
   */
  private static handleSessionExpired(message: string = 'Session expired. Please sign in again.') {
    // Import toast context dynamically to avoid circular dependencies
    import('../contexts/ToastContext').then(({ useToast }) => {
      // Show toast notification
      const toast = useToast();
      toast.showToast(message, 'warning');
    }).catch(() => {
      // Fallback if toast context is not available
      console.warn('Toast context not available, showing alert instead');
      alert(message);
    });

    // Redirect to login page
    window.location.href = ROUTES.LOGIN;
  }

  /**
   * Validates JWT token and checks for authentication
   */
  private static async validateAuthentication(): Promise<{ valid: boolean; session: any; error?: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        this.handleSessionExpired('Authentication error. Please sign in again.');
        return { valid: false, session: null, error: sessionError.message };
      }

      if (!session || !session.access_token) {
        this.handleSessionExpired('No active session. Please sign in.');
        return { valid: false, session: null, error: 'No active session' };
      }

      // Check if JWT token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < currentTime) {
        this.handleSessionExpired('Session expired. Please sign in again.');
        return { valid: false, session: null, error: 'Session expired' };
      }

      // Verify JWT token structure and signature (Supabase handles this internally)
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        this.handleSessionExpired('Invalid session. Please sign in again.');
        return { valid: false, session: null, error: 'Invalid JWT token' };
      }

      // Ensure the user ID from JWT matches the session
      if (user.id !== session.user.id) {
        this.handleSessionExpired('Session mismatch. Please sign in again.');
        return { valid: false, session: null, error: 'Token mismatch' };
      }

      return { valid: true, session, error: undefined };
    } catch (error) {
      this.handleSessionExpired('Authentication validation failed. Please sign in again.');
      return { valid: false, session: null, error: 'Authentication validation failed' };
    }
  }

  /**
   * Validates input data to prevent injection attacks
   */
  private static validateInputData(data: any): { valid: boolean; error?: string } {
    // Check for null/undefined
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid input data' };
    }

    // Check for malicious patterns in string values
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:text\/html/i,
      /eval\(/i,
      /expression\(/i,
      /vbscript:/i
    ];

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Check for XSS patterns
        for (const pattern of maliciousPatterns) {
          if (pattern.test(value)) {
            return { valid: false, error: `Potentially malicious content detected in ${key}` };
          }
        }

        // Check for excessive length (prevent DoS)
        if (value.length > 1000) {
          return { valid: false, error: `Input too long for field ${key}` };
        }
      }

      // Validate specific field constraints
      if (key === 'account_name' && value && typeof value !== 'string') {
        return { valid: false, error: 'Account name must be a string' };
      }

      if (key === 'household_type' && value && !['single', 'couple', 'family', 'roommates'].includes(value)) {
        return { valid: false, error: 'Invalid household type' };
      }

      if (key === 'subscription_status' && value && !['active', 'inactive', 'suspended', 'cancelled'].includes(value)) {
        return { valid: false, error: 'Invalid subscription status' };
      }

      if (key === 'timezone' && value && typeof value !== 'string') {
        return { valid: false, error: 'Invalid timezone format' };
      }
    }

    return { valid: true };
  }

  /**
   * Updates account settings for the authenticated user
   */
  static async updateAccountSettings(updates: AccountUpdateData): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate authentication and JWT token
      const authResult = await this.validateAuthentication();
      if (!authResult.valid) {
        return { success: false, error: authResult.error };
      }

      // Validate input data
      const inputValidation = this.validateInputData(updates);
      if (!inputValidation.valid) {
        return { success: false, error: inputValidation.error };
      }

      // Get current user's account ID securely
      const accountId = await this.getCurrentAccountId();
      if (!accountId) {
        return { success: false, error: 'Account not found' };
      }

      // Update account data using RLS policies with JWT authentication
      // Supabase automatically uses the JWT token for RLS policy enforcement
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);

      if (updateError) {
        // Check if error is due to authentication/authorization
        if (updateError.code === 'PGRST301' || updateError.message.includes('JWT')) {
          this.handleSessionExpired('Session expired during update. Please sign in again.');
          return { success: false, error: 'Session expired' };
        }
        
        console.error('Error updating account:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error updating account:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Updates user profile settings for the authenticated user
   */
  static async updateUserProfile(updates: UserUpdateData): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate authentication and JWT token
      const authResult = await this.validateAuthentication();
      if (!authResult.valid) {
        return { success: false, error: authResult.error };
      }

      // Validate input data
      const inputValidation = this.validateInputData(updates);
      if (!inputValidation.valid) {
        return { success: false, error: inputValidation.error };
      }

      // Update user data using RLS policies with JWT authentication
      // The JWT token automatically provides user context for RLS
      const { error: updateError } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('auth_id', authResult.session.user.id);

      if (updateError) {
        // Check if error is due to authentication/authorization
        if (updateError.code === 'PGRST301' || updateError.message.includes('JWT')) {
          this.handleSessionExpired('Session expired during update. Please sign in again.');
          return { success: false, error: 'Session expired' };
        }
        
        console.error('Error updating user profile:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error updating user profile:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Helper method to get current user's account ID with authentication check
   */
  private static async getCurrentAccountId(): Promise<string | null> {
    try {
      const authResult = await this.validateAuthentication();
      if (!authResult.valid) {
        throw new Error('Authentication required');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('account_id')
        .eq('auth_id', authResult.session.user.id)
        .single();

      if (userError) {
        // Check if error is due to authentication/authorization
        if (userError.code === 'PGRST301' || userError.message.includes('JWT')) {
          this.handleSessionExpired('Session expired while fetching account. Please sign in again.');
          return null;
        }
        
        throw new Error(`Error fetching user account: ${userError.message}`);
      }

      return userData?.account_id || null;
    } catch (error) {
      console.error('Error getting current account ID:', error);
      return null;
    }
  }

  /**
   * Updates both user and account data in a single operation with validation
   */
  static async updateUserAndAccount(
    userUpdates: UserUpdateData, 
    accountUpdates: AccountUpdateData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate authentication once for both operations
      const authResult = await this.validateAuthentication();
      if (!authResult.valid) {
        return { success: false, error: authResult.error };
      }

      // Validate both input sets
      const userValidation = this.validateInputData(userUpdates);
      if (!userValidation.valid) {
        return { success: false, error: `User data: ${userValidation.error}` };
      }

      const accountValidation = this.validateInputData(accountUpdates);
      if (!accountValidation.valid) {
        return { success: false, error: `Account data: ${accountValidation.error}` };
      }

      // Update user profile
      const userResult = await this.updateUserProfile(userUpdates);
      if (!userResult.success) {
        return userResult;
      }

      // Update account settings
      const accountResult = await this.updateAccountSettings(accountUpdates);
      if (!accountResult.success) {
        return accountResult;
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error updating user and account:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
}