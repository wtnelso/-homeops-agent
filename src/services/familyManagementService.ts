import { supabase } from '../lib/supabase';
import { FamilyActivity, FamilySchool, FamilyMember, FamilyContact, FamilyKeyword } from './userSession';

export class FamilyManagementService {
  /**
   * Add an activity to the family.activities table
   * @param activity - Activity data to insert
   * @returns Promise with success status and activity data
   */
  static async addActivity(activity: Omit<FamilyActivity, 'id' | 'created_at' | 'updated_at'>): Promise<{
    success: boolean;
    activity?: FamilyActivity;
    error?: string;
  }> {
    try {
      // Store familyMemberName for sync, then remove fields that don't exist in database schema
      const familyMemberName = (activity as any).familyMemberName;
      const { source, familyMemberName: _, ...activityData } = activity as any;

      // Handle empty date strings - convert to null for database
      const dbData = {
        ...activityData,
        end_date: activityData.end_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('family_activities')
        .insert([dbData])
        .select()
        .single();

      if (error) {
        console.error('Error adding activity:', error);
        return { success: false, error: error.message };
      }

      // Dual-write: Sync to agent memory
      try {
        console.log('🔄 Preparing to sync activity to agent memory:', {
          userId: data.created_by,
          familyId: data.family_id,
          activityId: data.id,
          activityName: data.activity_name
        });

        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.created_by,
            familyId: data.family_id,
            activityData: data,
            familyMemberName: familyMemberName // Pass family member name from frontend
          }),
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to sync activity to agent memory:', await response.text());
        } else {
          console.log('✅ Activity synced to agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error syncing activity to agent memory:', syncError);
        // Don't fail the main operation if sync fails
      }

      return { success: true, activity: data };
    } catch (err) {
      console.error('Unexpected error adding activity:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update an existing activity
   * @param activityId - ID of the activity to update
   * @param updates - Partial activity data to update
   * @returns Promise with success status and updated activity data
   */
  static async updateActivity(
    activityId: string,
    updates: Partial<Omit<FamilyActivity, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{
    success: boolean;
    activity?: FamilyActivity;
    error?: string;
  }> {
    try {
      // Store familyMemberName for sync, then remove fields that don't exist in database schema
      const familyMemberName = (updates as any).familyMemberName;
      const { source, familyMemberName: _, ...updateData } = updates as any;

      // Handle empty date strings - convert to null for database
      const dbData = {
        ...updateData,
        ...(updateData.end_date !== undefined && { end_date: updateData.end_date || null }),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('family_activities')
        .update(dbData)
        .eq('id', activityId)
        .select()
        .single();

      if (error) {
        console.error('Error updating activity:', error);
        return { success: false, error: error.message };
      }

      // Dual-write: Sync to agent memory
      try {
        console.log('🔄 Preparing to sync activity to agent memory:', {
          userId: data.created_by,
          familyId: data.family_id,
          activityId: data.id,
          activityName: data.activity_name
        });

        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/activity`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.created_by,
            familyId: data.family_id,
            activityData: data,
            familyMemberName: familyMemberName // Pass family member name from frontend
          }),
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to sync updated activity to agent memory:', await response.text());
        } else {
          console.log('✅ Updated activity synced to agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error syncing updated activity to agent memory:', syncError);
        // Don't fail the main operation if sync fails
      }

      return { success: true, activity: data };
    } catch (err) {
      console.error('Unexpected error updating activity:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Delete an activity
   * @param activityId - ID of the activity to delete
   * @returns Promise with success status
   */
  static async deleteActivity(activityId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('family_activities')
        .delete()
        .eq('id', activityId);

      if (error) {
        console.error('Error deleting activity:', error);
        return { success: false, error: error.message };
      }

      // Dual-write: Remove from agent memory
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/activity/${activityId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to delete activity from agent memory:', await response.text());
        } else {
          console.log('✅ Activity deleted from agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error deleting activity from agent memory:', syncError);
        // Don't fail the main operation if sync fails
      }

      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting activity:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get activities for a family or family member
   * @param familyId - Family ID
   * @param familyMemberId - Optional family member ID to filter by
   * @returns Promise with activities array
   */
  static async getActivities(familyId: string, familyMemberId?: string): Promise<{
    success: boolean;
    activities?: FamilyActivity[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('family_activities')
        .select('*')
        .eq('family_id', familyId);

      if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        return { success: false, error: error.message };
      }

      return { success: true, activities: data || [] };
    } catch (err) {
      console.error('Unexpected error fetching activities:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Add a school to the family.schools table
   * @param school - School data to insert
   * @returns Promise with success status and school data
   */
  static async addSchool(school: Omit<FamilySchool, 'id' | 'created_at' | 'updated_at'>): Promise<{
    success: boolean;
    school?: FamilySchool;
    error?: string;
  }> {
    try {
      // Store familyMemberName for sync, then remove fields that don't exist in database schema
      const familyMemberName = (school as any).familyMemberName;
      const { source, familyMemberName: _, ...schoolData } = school as any;

      const { data, error } = await supabase
        .from('family_schools')
        .insert([{
          ...schoolData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding school:', error);
        return { success: false, error: error.message };
      }

      // Dual-write: Sync to agent memory
      try {
        console.log('🔄 Preparing to sync school to agent memory:', {
          userId: data.created_by,
          familyId: data.family_id,
          schoolId: data.id,
          schoolName: data.school_name
        });

        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/school`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.created_by,
            familyId: data.family_id,
            schoolData: data,
            familyMemberName: familyMemberName // Pass family member name from frontend
          }),
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to sync school to agent memory:', await response.text());
        } else {
          console.log('✅ School synced to agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error syncing school to agent memory:', syncError);
        // Don't fail the main operation if sync fails
      }

      return { success: true, school: data };
    } catch (err) {
      console.error('Unexpected error adding school:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update an existing school
   * @param schoolId - ID of the school to update
   * @param updates - Partial school data to update
   * @returns Promise with success status and updated school data
   */
  static async updateSchool(
    schoolId: string,
    updates: Partial<Omit<FamilySchool, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<{
    success: boolean;
    school?: FamilySchool;
    error?: string;
  }> {
    try {
      // Store familyMemberName for sync, then remove fields that don't exist in database schema
      const familyMemberName = (updates as any).familyMemberName;
      const { source, familyMemberName: _, ...updateData } = updates as any;

      const { data, error } = await supabase
        .from('family_schools')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', schoolId)
        .select()
        .single();

      if (error) {
        console.error('Error updating school:', error);
        return { success: false, error: error.message };
      }

      // Dual-write: Sync to agent memory
      try {
        console.log('🔄 Preparing to sync updated school to agent memory:', {
          userId: data.created_by,
          familyId: data.family_id,
          schoolId: data.id,
          schoolName: data.school_name
        });

        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/school`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.created_by,
            familyId: data.family_id,
            schoolData: data,
            familyMemberName: familyMemberName // Pass family member name from frontend
          }),
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to sync updated school to agent memory:', await response.text());
        } else {
          console.log('✅ Updated school synced to agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error syncing updated school to agent memory:', syncError);
        // Don't fail the main operation if sync fails
      }

      return { success: true, school: data };
    } catch (err) {
      console.error('Unexpected error updating school:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Delete a school
   * @param schoolId - ID of the school to delete
   * @returns Promise with success status
   */
  static async deleteSchool(schoolId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('family_schools')
        .delete()
        .eq('id', schoolId);

      if (error) {
        console.error('Error deleting school:', error);
        return { success: false, error: error.message };
      }

      // Dual-write: Remove from agent memory
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/school/${schoolId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to delete school from agent memory:', await response.text());
        } else {
          console.log('✅ School deleted from agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error deleting school from agent memory:', syncError);
        // Don't fail the main operation if sync fails
      }

      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting school:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get schools for a family or family member
   * @param familyId - Family ID
   * @param familyMemberId - Optional family member ID to filter by
   * @returns Promise with schools array
   */
  static async getSchools(familyId: string, familyMemberId?: string): Promise<{
    success: boolean;
    schools?: FamilySchool[];
    error?: string;
  }> {
    try {
      let query = supabase
        .from('family_schools')
        .select('*')
        .eq('family_id', familyId);

      if (familyMemberId) {
        query = query.eq('family_member_id', familyMemberId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching schools:', error);
        return { success: false, error: error.message };
      }

      return { success: true, schools: data || [] };
    } catch (err) {
      console.error('Unexpected error fetching schools:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Delete a family member
   * @param familyMemberId - ID of the family member to delete (this comes as family_member_id from frontend but maps to id column in DB)
   * @returns Promise with success status
   */
  static async deleteFamilyMember(familyMemberId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Note: This will cascade delete associated activities and schools due to foreign key constraints
      // The familyMemberId parameter comes as family_member_id from the frontend, but the DB column is 'id'
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', familyMemberId);

      if (error) {
        console.error('Error deleting family member:', error);
        return { success: false, error: error.message };
      }

      // Dual-write: Remove from agent memory (this will also remove associated activities/schools)
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/member/${familyMemberId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to delete family member from agent memory:', await response.text());
        } else {
          console.log('✅ Family member deleted from agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error deleting family member from agent memory:', syncError);
        // Don't fail the main operation if sync fails
      }

      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting family member:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Add a family member
   * @param member - Family member data to insert
   * @param syncUserId - Optional user ID for agent memory sync (defaults to authenticated user)
   * @returns Promise with success status and member data
   */
  static async addFamilyMember(member: Omit<FamilyMember, 'family_member_id' | 'created_at' | 'updated_at'>, syncUserId?: string): Promise<{
    success: boolean;
    member?: FamilyMember;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .insert([{
          ...member,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding family member:', error);
        return { success: false, error: error.message };
      }

      // Dual-write: Sync to agent memory
      try {
        if (!syncUserId) {
          console.warn('⚠️ No syncUserId provided for agent memory sync, skipping...');
          return { success: true, member: data };
        }

        console.log('🔄 Preparing to sync family member to agent memory:', {
          userId: syncUserId,
          familyId: data.family_id,
          memberId: data.id,
          memberName: data.name
        });

        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: syncUserId,
            familyId: data.family_id,
            memberData: data
          }),
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to sync family member to agent memory:', await response.text());
        } else {
          console.log('✅ Family member synced to agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error syncing family member to agent memory:', syncError);
        // Don't fail the main operation if sync fails
      }

      return { success: true, member: data };
    } catch (err) {
      console.error('Unexpected error adding family member:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update a family member by user_id (for the user's own record)
   * @param userId - User ID to update (this updates the user's own family member record)
   * @param updates - Partial family member data to update
   * @param syncUserId - Optional user ID for agent memory sync
   * @returns Promise with success status and updated member data
   */
  static async updateFamilyMemberByUserId(
    userId: string,
    updates: any,
    syncUserId?: string
  ): Promise<{
    success: boolean;
    member?: FamilyMember;
    error?: string;
  }> {
    try {
      console.log('🔍 UpdateFamilyMemberByUserId - userId:', userId);
      console.log('🔍 UpdateFamilyMemberByUserId - updates:', updates);

      const { data, error } = await supabase
        .from('family_members')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId) // Use user_id instead of id
        .select()
        .single();

      if (error) {
        console.error('Error updating family member by user_id:', error);
        return { success: false, error: error.message };
      }

      // Dual-write: Sync to agent memory
      try {
        if (!syncUserId) {
          console.warn('⚠️ No syncUserId provided for agent memory sync, skipping...');
          return { success: true, member: data };
        }

        console.log('🔄 Preparing to sync updated family member to agent memory:', {
          userId: syncUserId,
          familyId: data.family_id,
          memberId: data.id,
          memberName: data.name
        });

        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: syncUserId,
            familyId: data.family_id,
            memberData: data
          }),
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to sync updated family member to agent memory:', await response.text());
        } else {
          console.log('✅ Updated family member synced to agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error syncing updated family member to agent memory:', syncError);
        // Don't fail the main operation if sync fails
      }

      return { success: true, member: data };
    } catch (err) {
      console.error('Unexpected error updating family member by user_id:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update a family member
   * @param familyMemberId - ID of the family member to update (this comes as family_member_id from frontend but maps to id column in DB)
   * @param updates - Partial family member data to update
   * @param syncUserId - Optional user ID for agent memory sync
   * @returns Promise with success status and updated member data
   */
  static async updateFamilyMember(
    familyMemberId: string,
    updates: any,
    syncUserId?: string
  ): Promise<{
    success: boolean;
    member?: FamilyMember;
    error?: string;
  }> {
    try {
      console.log('🔍 UpdateFamilyMember - familyMemberId:', familyMemberId);
      console.log('🔍 UpdateFamilyMember - updates:', updates);

      const { data, error } = await supabase
        .from('family_members')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', familyMemberId)
        .select()
        .single();

      if (error) {
        console.error('Error updating family member:', error);
        return { success: false, error: error.message };
      }

      // Dual-write: Sync to agent memory
      try {
        if (!syncUserId) {
          console.warn('⚠️ No syncUserId provided for agent memory sync, skipping...');
          return { success: true, member: data };
        }

        console.log('🔄 Preparing to sync updated family member to agent memory:', {
          userId: syncUserId,
          familyId: data.family_id,
          memberId: data.id,
          memberName: data.name
        });

        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/member`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: syncUserId,
            familyId: data.family_id,
            memberData: data
          }),
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to sync updated family member to agent memory:', await response.text());
        } else {
          console.log('✅ Updated family member synced to agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error syncing updated family member to agent memory:', syncError);
        // Don't fail the main operation if sync fails
      }

      return { success: true, member: data };
    } catch (err) {
      console.error('Unexpected error updating family member:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Get family members
   * @param familyId - Family ID
   * @returns Promise with family members array
   */
  static async getFamilyMembers(familyId: string): Promise<{
    success: boolean;
    members?: FamilyMember[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching family members:', error);
        return { success: false, error: error.message };
      }

      return { success: true, members: data || [] };
    } catch (err) {
      console.error('Unexpected error fetching family members:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Add a contact to the family_contacts table
   * @param contact - Contact data to insert
   * @returns Promise with success status and contact data
   */
  static async addContact(contact: any): Promise<{
    success: boolean;
    contact?: FamilyContact;
    error?: string;
  }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'No authenticated user' };
      }

      // Map contact data to Supabase schema
      const contactRecord = {
        family_id: contact.family_id,
        contact_name: contact.contact_name,
        contact_type: contact.contact_type || null,
        phone: contact.phone || null,
        email: contact.email || null,
        notes: contact.notes || null,
        created_by: contact.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check if contact already exists
      const { data: existingContact, error: checkError } = await supabase
        .from('family_contacts')
        .select('id')
        .eq('family_id', contact.family_id)
        .eq('contact_name', contactRecord.contact_name)
        .eq('contact_type', contactRecord.contact_type)
        .maybeSingle();

      if (checkError) {
        return { success: false, error: `Error checking existing contact: ${checkError.message}` };
      }

      let savedContact;
      if (existingContact) {
        // Update existing contact
        const { data: updatedContact, error: updateError } = await supabase
          .from('family_contacts')
          .update({
            phone: contactRecord.phone,
            email: contactRecord.email,
            notes: contactRecord.notes,
            updated_at: contactRecord.updated_at
          })
          .eq('id', existingContact.id)
          .select()
          .single();

        if (updateError) {
          return { success: false, error: `Error updating contact: ${updateError.message}` };
        }
        savedContact = updatedContact;
      } else {
        // Insert new contact
        const { data: newContact, error: insertError } = await supabase
          .from('family_contacts')
          .insert(contactRecord)
          .select()
          .single();

        if (insertError) {
          return { success: false, error: `Error creating contact: ${insertError.message}` };
        }
        savedContact = newContact;
      }

      // Sync to agent memory (like profile suggestions do)
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/contact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            familyId: contact.family_id,
            contactData: {
              id: savedContact.id,
              name: savedContact.contact_name,
              contact_type: savedContact.contact_type,
              phone: savedContact.phone,
              email: savedContact.email,
              notes: savedContact.notes
            }
          }),
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to sync contact to agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error syncing contact to agent memory:', syncError);
        // Don't fail the request if sync fails
      }

      return {
        success: true,
        contact: {
          id: savedContact.id,
          contact_name: savedContact.contact_name,
          contact_type: savedContact.contact_type,
          phone: savedContact.phone,
          email: savedContact.email,
          notes: savedContact.notes
        }
      };

    } catch (error) {
      console.error('❌ Error adding contact:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Update a contact in the family_contacts table
   * @param contactId - The ID of the contact to update
   * @param updates - Contact data to update
   * @returns Promise with success status and updated contact data
   */
  static async updateContact(contactId: string, updates: any): Promise<{
    success: boolean;
    contact?: FamilyContact;
    error?: string;
  }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'No authenticated user' };
      }

      // Update contact in database
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.contact_name !== undefined) updateData.contact_name = updates.contact_name;
      if (updates.contact_type !== undefined) updateData.contact_type = updates.contact_type;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { data: updatedContact, error: updateError } = await supabase
        .from('family_contacts')
        .update(updateData)
        .eq('id', contactId)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: `Error updating contact: ${updateError.message}` };
      }

      // Sync to agent memory (family_id should be passed from frontend)
      if (updates.family_id) {
        try {
          const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/contact`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              familyId: updates.family_id,
              contactData: {
                id: updatedContact.id,
                name: updatedContact.contact_name,
                contact_type: updatedContact.contact_type,
                phone: updatedContact.phone,
                email: updatedContact.email,
                notes: updatedContact.notes
              }
            }),
          });

          if (!response.ok) {
            console.warn('⚠️ Failed to sync updated contact to agent memory');
          }
        } catch (syncError) {
          console.warn('⚠️ Error syncing updated contact to agent memory:', syncError);
          // Don't fail the request if sync fails
        }
      }

      return {
        success: true,
        contact: {
          id: updatedContact.id,
          contact_name: updatedContact.contact_name,
          contact_type: updatedContact.contact_type,
          phone: updatedContact.phone,
          email: updatedContact.email,
          notes: updatedContact.notes
        }
      };

    } catch (error) {
      console.error('❌ Error updating contact:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Delete a contact from the family_contacts table
   * @param contactId - The ID of the contact to delete
   * @returns Promise with success status
   */
  static async deleteContact(contactId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Get current user for authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'No authenticated user' };
      }

      // Delete contact from database
      const { error: deleteError } = await supabase
        .from('family_contacts')
        .delete()
        .eq('id', contactId);

      if (deleteError) {
        return { success: false, error: `Error deleting contact: ${deleteError.message}` };
      }

      // Remove from agent memory
      try {
        const response = await fetch(`${import.meta.env.VITE_RENDER_SERVER_URL}/api/family-sync/contact/${contactId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('⚠️ Failed to remove contact from agent memory');
        }
      } catch (syncError) {
        console.warn('⚠️ Error removing contact from agent memory:', syncError);
        // Don't fail the request if sync fails
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting contact:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Add a keyword to the family_keywords table
   * @param keyword - Keyword data to insert
   * @returns Promise with success status and keyword data
   */
  static async addKeyword(keyword: Omit<FamilyKeyword, 'id'>): Promise<{
    success: boolean;
    keyword?: FamilyKeyword;
    error?: string;
  }> {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, error: 'No authenticated user' };
      }

      const keywordRecord = {
        family_id: (keyword as any).family_id,
        keyword: keyword.keyword,
        category: keyword.category,
        importance: 1,
        auto_generated: false,
        match_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('family_keywords')
        .insert([keywordRecord])
        .select()
        .single();

      if (error) {
        console.error('Error adding keyword:', error);
        return { success: false, error: error.message };
      }

      return { success: true, keyword: data };
    } catch (err) {
      console.error('Unexpected error adding keyword:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Update a keyword in the family_keywords table
   * @param keywordId - The ID of the keyword to update
   * @param updates - Keyword data to update
   * @returns Promise with success status and updated keyword data
   */
  static async updateKeyword(keywordId: string, updates: Partial<FamilyKeyword>): Promise<{
    success: boolean;
    keyword?: FamilyKeyword;
    error?: string;
  }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.keyword !== undefined) updateData.keyword = updates.keyword;
      if (updates.category !== undefined) updateData.category = updates.category;

      const { data, error } = await supabase
        .from('family_keywords')
        .update(updateData)
        .eq('id', keywordId)
        .select()
        .single();

      if (error) {
        console.error('Error updating keyword:', error);
        return { success: false, error: error.message };
      }

      return { success: true, keyword: data };
    } catch (err) {
      console.error('Unexpected error updating keyword:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }

  /**
   * Delete a keyword from the family_keywords table
   * @param keywordId - The ID of the keyword to delete
   * @returns Promise with success status
   */
  static async deleteKeyword(keywordId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from('family_keywords')
        .delete()
        .eq('id', keywordId);

      if (error) {
        console.error('Error deleting keyword:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Unexpected error deleting keyword:', err);
      return { success: false, error: 'Unexpected error occurred' };
    }
  }
}