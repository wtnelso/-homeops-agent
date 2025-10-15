/**
 * Profile Data Operations Service
 *
 * Handles CRUD operations for profile data including family members,
 * schools, activities, and other profile-related data.
 */

import { familyProfileService, ProfileData } from './familyProfileService';

interface FamilyMember {
  name: string;
  type: 'user' | 'partner' | 'child' | 'pet' | 'parent' | 'sibling' | 'grandparent' | 'other';
  user?: boolean; // true if this is the account user
  order?: number; // for display ordering
  email?: string;
  age?: number;
  birthday?: { month: string; day: string };
  pet_type?: string; // Only for pets - dog, cat, etc.
  schools?: School[];
  activities?: Activity[];
  source?: {
    type: string;
    timestamp: string;
    confidence: number;
    source_id?: string | null;
    original_text?: string | null;
    updated_at?: string;
  };
}

interface School {
  name: string;
  type?: string;
  email_domain?: string;
  grade?: string;
}

interface Activity {
  name: string;
  type?: string;
  frequency?: string;
  days?: string[];
  end_date?: string;
}

class ProfileDataService {
  /**
   * Add a new family member
   */
  async addFamilyMember(
    accountId: string,
    memberType: string,
    memberData: FamilyMember
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Adding family member:', memberType, memberData);

      // Get current profile to append to existing members
      const currentProfile = await familyProfileService.getProfile(accountId);
      if (!currentProfile.success) {
        throw new Error('Failed to get current profile');
      }

      const existingMembers = currentProfile.profile?.members || [];

      // Calculate the next order value
      const maxOrder = Math.max(...existingMembers.map(m => m.order || 0), -1);
      const nextOrder = maxOrder + 1;

      const updates: Partial<ProfileData> = {
        members: [
          ...existingMembers,
          {
            name: memberData.name,
            type: memberData.type,
            order: nextOrder, // Assign order to new member
            age: memberData.age,
            birthday: memberData.birthday,
            email: memberData.email,
            pet_type: memberData.pet_type,
            schools: memberData.schools || [],
            activities: memberData.activities || []
          }
        ]
      };

      const result = await familyProfileService.updateProfile(accountId, updates);

      if (result.success) {
        console.log('✅ Family member added successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to add family member:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ Error adding family member:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }


  /**
   * Add school to a specific family member
   */
  async addSchoolToMember(
    accountId: string,
    memberIndex: number, // Index in the members array
    schoolData: School
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Adding school to member:', memberIndex, schoolData);

      // Get current profile
      const currentProfile = await familyProfileService.getProfile(accountId);
      if (!currentProfile.success) {
        throw new Error('Failed to get current profile');
      }

      const existingMembers = currentProfile.profile?.members || [];
      if (memberIndex >= existingMembers.length) {
        throw new Error(`Member not found at index: ${memberIndex}`);
      }

      // Create updated members array
      const updatedMembers = [...existingMembers];
      const member = updatedMembers[memberIndex];
      const existingSchools = member.schools || [];

      updatedMembers[memberIndex] = {
        ...member,
        schools: [
          ...existingSchools,
          {
            name: schoolData.name,
            type: schoolData.type,
            email_domain: schoolData.email_domain,
            grade: schoolData.grade
          }
        ]
      };

      const updates: Partial<ProfileData> = {
        members: updatedMembers
      };

      // Update the profile
      const result = await familyProfileService.updateProfile(accountId, updates);

      if (result.success) {
        console.log('✅ School added to member successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to add school to member:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ Error adding school to member:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Add activity to a specific family member
   */
  async addActivityToMember(
    accountId: string,
    memberIndex: number, // Index in the members array
    activityData: Activity
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Adding activity to member:', memberIndex, activityData);

      // Get current profile
      const currentProfile = await familyProfileService.getProfile(accountId);
      if (!currentProfile.success) {
        throw new Error('Failed to get current profile');
      }

      const existingMembers = currentProfile.profile?.members || [];
      if (memberIndex >= existingMembers.length) {
        throw new Error(`Member not found at index: ${memberIndex}`);
      }

      // Create updated members array
      const updatedMembers = [...existingMembers];
      const member = updatedMembers[memberIndex];
      const existingActivities = member.activities || [];

      updatedMembers[memberIndex] = {
        ...member,
        activities: [
          ...existingActivities,
          {
            name: activityData.name,
            type: activityData.type,
            frequency: activityData.frequency,
            days: activityData.days,
            end_date: activityData.end_date
          }
        ]
      };

      const updates: Partial<ProfileData> = {
        members: updatedMembers
      };

      // Update the profile
      const result = await familyProfileService.updateProfile(accountId, updates);

      if (result.success) {
        console.log('✅ Activity added to member successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to add activity to member:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ Error adding activity to member:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a specific field in the profile
   */
  async updateProfileField(
    accountId: string,
    fieldPath: string, // e.g., "family.members.0.name"
    value: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating profile field:', fieldPath, value);

      // Get current profile
      const currentProfile = await familyProfileService.getProfile(accountId);
      if (!currentProfile.success) {
        throw new Error('Failed to get current profile');
      }

      // Handle member-specific updates
      if (fieldPath.startsWith('members.')) {
        const pathParts = fieldPath.split('.');
        const memberIndex = parseInt(pathParts[1]);
        const memberField = pathParts.slice(2).join('.');

        const existingMembers = currentProfile.profile?.members || [];
        if (memberIndex >= existingMembers.length) {
          throw new Error(`Member not found at index: ${memberIndex}`);
        }

        const updatedMembers = [...existingMembers];

        // Handle nested field updates (e.g., "schools.0.name")
        if (memberField.includes('.')) {
          const member = { ...updatedMembers[memberIndex] };
          this.setNestedValue(member, memberField, value);
          updatedMembers[memberIndex] = member;
        } else {
          // Direct field update (e.g., "name", "age")
          updatedMembers[memberIndex] = {
            ...updatedMembers[memberIndex],
            [memberField]: value
          };
        }

        const updates: Partial<ProfileData> = {
          members: updatedMembers
        };

        const result = await familyProfileService.updateProfile(accountId, updates);

        if (result.success) {
          console.log('✅ Profile field updated successfully');
          return { success: true };
        } else {
          console.error('❌ Failed to update profile field:', result.error);
          return { success: false, error: result.error };
        }
      } else {
        // Handle non-member field updates (account info, etc.)
        const updates: any = {};
        const pathParts = fieldPath.split('.');
        let current = updates;

        for (let i = 0; i < pathParts.length - 1; i++) {
          current[pathParts[i]] = {};
          current = current[pathParts[i]];
        }
        current[pathParts[pathParts.length - 1]] = value;

        const result = await familyProfileService.updateProfile(accountId, updates);

        if (result.success) {
          console.log('✅ Profile field updated successfully');
          return { success: true };
        } else {
          console.error('❌ Failed to update profile field:', result.error);
          return { success: false, error: result.error };
        }
      }

    } catch (error) {
      console.error('❌ Error updating profile field:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }


  /**
   * Set nested object value by path (e.g., 'schools.0.name')
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  /**
   * Update school for a specific family member
   */
  async updateSchoolForMember(
    accountId: string,
    memberIndex: number,
    schoolIndex: number,
    schoolData: School
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating school for member:', memberIndex, 'school:', schoolIndex, schoolData);

      // Get current profile
      const currentProfile = await familyProfileService.getProfile(accountId);
      if (!currentProfile.success) {
        throw new Error('Failed to get current profile');
      }

      const existingMembers = currentProfile.profile?.members || [];
      if (memberIndex >= existingMembers.length) {
        throw new Error(`Member not found at index: ${memberIndex}`);
      }

      // Create updated members array
      const updatedMembers = [...existingMembers];
      const member = updatedMembers[memberIndex];
      const schools = [...(member.schools || [])];

      if (schoolIndex >= schools.length) {
        throw new Error(`School not found at index: ${schoolIndex}`);
      }

      // Update the school at the specified index
      schools[schoolIndex] = {
        name: schoolData.name,
        type: schoolData.type,
        email_domain: schoolData.email_domain,
        grade: schoolData.grade
      };

      updatedMembers[memberIndex] = {
        ...member,
        schools: schools
      };

      const updates: Partial<ProfileData> = {
        members: updatedMembers
      };

      // Update the profile
      const result = await familyProfileService.updateProfile(accountId, updates);

      if (result.success) {
        console.log('✅ School updated for member successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to update school for member:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ Error updating school for member:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update activity for a specific family member
   */
  async updateActivityForMember(
    accountId: string,
    memberIndex: number,
    activityIndex: number,
    activityData: Activity
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating activity for member:', memberIndex, 'activity:', activityIndex, activityData);

      // Get current profile
      const currentProfile = await familyProfileService.getProfile(accountId);
      if (!currentProfile.success) {
        throw new Error('Failed to get current profile');
      }

      const existingMembers = currentProfile.profile?.members || [];
      if (memberIndex >= existingMembers.length) {
        throw new Error(`Member not found at index: ${memberIndex}`);
      }

      // Create updated members array
      const updatedMembers = [...existingMembers];
      const member = updatedMembers[memberIndex];
      const activities = [...(member.activities || [])];

      if (activityIndex >= activities.length) {
        throw new Error(`Activity not found at index: ${activityIndex}`);
      }

      // Update the activity at the specified index
      activities[activityIndex] = {
        name: activityData.name,
        type: activityData.type,
        frequency: activityData.frequency,
        days: activityData.days,
        end_date: activityData.end_date
      };

      updatedMembers[memberIndex] = {
        ...member,
        activities: activities
      };

      const updates: Partial<ProfileData> = {
        members: updatedMembers
      };

      // Update the profile
      const result = await familyProfileService.updateProfile(accountId, updates);

      if (result.success) {
        console.log('✅ Activity updated for member successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to update activity for member:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ Error updating activity for member:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete school from a specific family member
   */
  async deleteSchoolFromMember(
    accountId: string,
    memberIndex: number,
    schoolIndex: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Deleting school from member:', memberIndex, 'school:', schoolIndex);

      // Get current profile
      const currentProfile = await familyProfileService.getProfile(accountId);
      if (!currentProfile.success) {
        throw new Error('Failed to get current profile');
      }

      const existingMembers = currentProfile.profile?.members || [];
      if (memberIndex >= existingMembers.length) {
        throw new Error(`Member not found at index: ${memberIndex}`);
      }

      // Create updated members array
      const updatedMembers = [...existingMembers];
      const member = updatedMembers[memberIndex];
      const schools = [...(member.schools || [])];

      if (schoolIndex >= schools.length) {
        throw new Error(`School not found at index: ${schoolIndex}`);
      }

      // Remove the school at the specified index
      schools.splice(schoolIndex, 1);

      updatedMembers[memberIndex] = {
        ...member,
        schools: schools
      };

      const updates: Partial<ProfileData> = {
        members: updatedMembers
      };

      // Update the profile
      const result = await familyProfileService.updateProfile(accountId, updates);

      if (result.success) {
        console.log('✅ School deleted from member successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to delete school from member:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ Error deleting school from member:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete activity from a specific family member
   */
  async deleteActivityFromMember(
    accountId: string,
    memberIndex: number,
    activityIndex: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Deleting activity from member:', memberIndex, 'activity:', activityIndex);

      // Get current profile
      const currentProfile = await familyProfileService.getProfile(accountId);
      if (!currentProfile.success) {
        throw new Error('Failed to get current profile');
      }

      const existingMembers = currentProfile.profile?.members || [];
      if (memberIndex >= existingMembers.length) {
        throw new Error(`Member not found at index: ${memberIndex}`);
      }

      // Create updated members array
      const updatedMembers = [...existingMembers];
      const member = updatedMembers[memberIndex];
      const activities = [...(member.activities || [])];

      if (activityIndex >= activities.length) {
        throw new Error(`Activity not found at index: ${activityIndex}`);
      }

      // Remove the activity at the specified index
      activities.splice(activityIndex, 1);

      updatedMembers[memberIndex] = {
        ...member,
        activities: activities
      };

      const updates: Partial<ProfileData> = {
        members: updatedMembers
      };

      // Update the profile
      const result = await familyProfileService.updateProfile(accountId, updates);

      if (result.success) {
        console.log('✅ Activity deleted from member successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to delete activity from member:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ Error deleting activity from member:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Delete a family member
   */
  async deleteFamilyMember(
    accountId: string,
    memberIndex: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Deleting family member at index:', memberIndex);

      // Get current profile
      const currentProfile = await familyProfileService.getProfile(accountId);
      if (!currentProfile.success) {
        throw new Error('Failed to get current profile');
      }

      const existingMembers = currentProfile.profile?.members || [];
      if (memberIndex >= existingMembers.length) {
        throw new Error(`Member not found at index: ${memberIndex}`);
      }

      // Check if trying to delete the user (type 'user')
      const memberToDelete = existingMembers[memberIndex];
      if (memberToDelete.user || memberToDelete.type === 'user') {
        throw new Error('Cannot delete the main user account');
      }

      // Create updated members array by removing the member at the specified index
      const updatedMembers = [...existingMembers];
      updatedMembers.splice(memberIndex, 1);

      // Reorder the remaining members to maintain sequential order
      const reorderedMembers = updatedMembers.map((member, index) => ({
        ...member,
        order: index
      }));

      const updates: Partial<ProfileData> = {
        members: reorderedMembers
      };

      // Update the profile
      const result = await familyProfileService.updateProfile(accountId, updates);

      if (result.success) {
        console.log('✅ Family member deleted successfully');
        return { success: true };
      } else {
        console.error('❌ Failed to delete family member:', result.error);
        return { success: false, error: result.error };
      }

    } catch (error) {
      console.error('❌ Error deleting family member:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Helper function to parse member keys from the UI
   */
  parseMemberKey(memberKey: string): { path: string; type: string; index?: number } {
    // memberKey format: "member-{type}-{index}"
    const parts = memberKey.split('-');
    if (parts.length < 3) {
      throw new Error(`Invalid member key format: ${memberKey}`);
    }

    const type = parts[1];
    const index = parts[2] !== undefined ? parseInt(parts[2]) : undefined;

    let path: string;
    if (type === 'user') {
      path = 'account';
    } else {
      // All family members are now in the members array
      path = `members.${index}`;
    }

    return { path, type, index };
  }
}

// Export singleton instance
export const profileDataService = new ProfileDataService();
export default profileDataService;
export type { FamilyMember, School, Activity };