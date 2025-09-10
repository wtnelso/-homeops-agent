import { supabase } from '../lib/supabase';

export interface AdminCheckResult {
  isAdmin: boolean;
  error?: string;
}

export interface BetaUser {
  id: string;
  email: string;
  added_by: string | null;
  added_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BetaUserResult {
  success: boolean;
  error?: string;
  betaUser?: BetaUser;
}

export interface BetaUsersListResult {
  success: boolean;
  betaUsers?: BetaUser[];
  error?: string;
}

export class AdminService {
  /**
   * Checks if the current authenticated user is an admin
   */
  static async checkCurrentUserAdminStatus(): Promise<AdminCheckResult> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return { isAdmin: false, error: 'Authentication error' };
      }

      if (!session || !session.user || !session.user.email) {
        return { isAdmin: false, error: 'Not authenticated' };
      }

      return this.checkUserAdminStatusByEmail(session.user.email);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return { isAdmin: false, error: 'Failed to check admin status' };
    }
  }

  /**
   * Checks if a user email is in the admin list
   */
  static async checkUserAdminStatusByEmail(email: string): Promise<AdminCheckResult> {
    try {
      const { data: adminRecord, error } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No matching records found - user is not an admin
          return { isAdmin: false };
        }
        console.error('Database error checking admin status:', error);
        return { isAdmin: false, error: error.message };
      }

      return { isAdmin: true };
    } catch (error) {
      console.error('Error checking user admin status:', error);
      return { isAdmin: false, error: 'Failed to check admin status' };
    }
  }

  /**
   * Lists all admin emails (for display purposes)
   */
  static async listAdminEmails(): Promise<{ success: boolean; emails?: string[]; error?: string }> {
    try {
      // First verify the current user is an admin
      const currentUserAdminCheck = await this.checkCurrentUserAdminStatus();
      if (!currentUserAdminCheck.isAdmin) {
        return { success: false, error: 'Only admins can view admin list' };
      }

      const { data: adminUsers, error } = await supabase
        .from('admin_users')
        .select('email')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error listing admin emails:', error);
        return { success: false, error: error.message };
      }

      const emails = adminUsers.map(admin => admin.email);
      return { success: true, emails };
    } catch (error) {
      console.error('Error listing admin emails:', error);
      return { success: false, error: 'Failed to list admin emails' };
    }
  }

  // === BETA USER MANAGEMENT METHODS ===

  /**
   * Lists all beta users (admin only)
   */
  static async listBetaUsers(): Promise<BetaUsersListResult> {
    try {
      // First verify the current user is an admin
      const currentUserAdminCheck = await this.checkCurrentUserAdminStatus();
      if (!currentUserAdminCheck.isAdmin) {
        return { success: false, error: 'Only admins can view beta users' };
      }

      const { data: betaUsers, error } = await supabase
        .from('beta_users')
        .select('*')
        .eq('is_active', true)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error listing beta users:', error);
        return { success: false, error: error.message };
      }

      return { success: true, betaUsers };
    } catch (error) {
      console.error('Error listing beta users:', error);
      return { success: false, error: 'Failed to list beta users' };
    }
  }

  /**
   * Adds a new beta user (admin only)
   */
  static async addBetaUser(email: string): Promise<BetaUserResult> {
    try {
      // First verify the current user is an admin
      const currentUserAdminCheck = await this.checkCurrentUserAdminStatus();
      if (!currentUserAdminCheck.isAdmin) {
        return { success: false, error: 'Only admins can add beta users' };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Get current user for tracking who added the beta user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Check if email is already a beta user
      const { data: existingBetaUser } = await supabase
        .from('beta_users')
        .select('email')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (existingBetaUser) {
        return { success: false, error: 'Email is already a beta user' };
      }

      // Insert new beta user
      const { data: newBetaUser, error: insertError } = await supabase
        .from('beta_users')
        .insert({
          email: email.toLowerCase(),
          added_by: session.user.id,
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error adding beta user:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, betaUser: newBetaUser };
    } catch (error) {
      console.error('Error adding beta user:', error);
      return { success: false, error: 'Failed to add beta user' };
    }
  }

  /**
   * Removes a beta user (admin only)
   */
  static async removeBetaUser(betaUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First verify the current user is an admin
      const currentUserAdminCheck = await this.checkCurrentUserAdminStatus();
      if (!currentUserAdminCheck.isAdmin) {
        return { success: false, error: 'Only admins can remove beta users' };
      }

      // Delete the beta user record
      const { error: deleteError } = await supabase
        .from('beta_users')
        .delete()
        .eq('id', betaUserId);

      if (deleteError) {
        console.error('Error removing beta user:', deleteError);
        return { success: false, error: deleteError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing beta user:', error);
      return { success: false, error: 'Failed to remove beta user' };
    }
  }

  /**
   * Checks if a user email has beta access
   */
  static async checkBetaAccess(email: string): Promise<AdminCheckResult> {
    try {
      const { data, error } = await supabase
        .from('beta_users')
        .select('email')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No matching records found - user does not have beta access
          return { isAdmin: false };
        }
        console.error('Database error checking beta access:', error);
        return { isAdmin: false, error: error.message };
      }

      return { isAdmin: true }; // Using isAdmin field for consistency, but this represents beta access
    } catch (error) {
      console.error('Error checking beta access:', error);
      return { isAdmin: false, error: 'Failed to check beta access' };
    }
  }
}