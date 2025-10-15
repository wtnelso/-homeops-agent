import { supabase } from '../lib/supabase';
import { ROUTES } from '../config/routes';

export interface AccountUpdateData {
  account_name?: string;
  agent_name?: string;
  household_type?: string; // will be mapped to family.family_type
  timezone?: string;
  is_active?: boolean;
}

export interface UserUpdateData {
  name_user_provided?: string;
  avatar_url?: string;
  avatar_user_provided?: string | null;
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

      if (key === 'agent_name' && value && typeof value !== 'string') {
        return { valid: false, error: 'Agent name must be a string' };
      }

      if (key === 'household_type' && value && !['single', 'couple', 'family', 'roommates'].includes(value as string)) {
        return { valid: false, error: 'Invalid household type' };
      }

      if (key === 'subscription_status' && value && !['active', 'inactive', 'suspended', 'cancelled'].includes(value as string)) {
        return { valid: false, error: 'Invalid subscription status' };
      }

      if (key === 'timezone' && value && typeof value !== 'string') {
        return { valid: false, error: 'Invalid timezone format' };
      }
    }

    return { valid: true };
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
   * Updates both user and family data in a single operation with validation
   */
  static async updateUserAndAccount(
    userUpdates: UserUpdateData,
    accountUpdates: AccountUpdateData,
    userId: string,
    familyId: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate authentication
      const authResult = await this.validateAuthentication();
      if (!authResult.valid) {
        return { success: false, error: authResult.error };
      }

      // User ID is required
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      // Validate input data
      const userValidation = this.validateInputData(userUpdates);
      if (!userValidation.valid) {
        return { success: false, error: `User data: ${userValidation.error}` };
      }

      const accountValidation = this.validateInputData(accountUpdates);
      if (!accountValidation.valid) {
        return { success: false, error: `Account data: ${accountValidation.error}` };
      }

      // Separate updates for different tables
      const userTableUpdates = {
        ...userUpdates,
        ...(accountUpdates.account_name && { account_name: accountUpdates.account_name }),
        ...(accountUpdates.agent_name && { agent_name: accountUpdates.agent_name }),
        ...(accountUpdates.timezone && { timezone: accountUpdates.timezone }),
        ...(accountUpdates.is_active !== undefined && { is_active: accountUpdates.is_active }),
        updated_at: new Date().toISOString()
      };

      // Update user table
      const { error: userError } = await supabase
        .from('users')
        .update(userTableUpdates)
        .eq('id', userId);

      if (userError) {
        console.error('Error updating user:', userError);
        return { success: false, error: userError.message };
      }

      // Update family table if household_type is provided and we have a familyId
      if (accountUpdates.household_type && familyId) {
        const { error: familyError } = await supabase
          .from('families')
          .update({
            family_type: accountUpdates.household_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', familyId);

        if (familyError) {
          console.error('Error updating family:', familyError);
          return { success: false, error: familyError.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error updating user and account:', error);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
}