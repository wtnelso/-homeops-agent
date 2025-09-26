import React, { useState } from 'react';
import { Users, Heart, Baby, User, ChevronDown, ChevronRight, Plus, Edit, Trash2, Calendar, GraduationCap, Dumbbell, Palette, BookOpen, Users2, TreePine, Home, Heart as HeartIcon, Zap, School, Building, Building2, University, UserCheck, Crown, Dog, UserX, Target } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import AddMemberModal from '../../ui/AddMemberModal';
import DeleteMemberModal from '../../ui/DeleteMemberModal';
import AddHobbyModal from '../../ui/AddHobbyModal';
import AddSchoolModal from '../../ui/AddSchoolModal';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import SourceIndicator from '../../ui/SourceIndicator';
import { accountProfileService } from '../../../services/accountProfileService';

// Helper function to get activity type styling and icon
const getActivityTypeStyle = (type: string) => {
  const styles = {
    sport: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-300',
      icon: Dumbbell
    },
    creative: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      icon: Palette
    },
    educational: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      icon: BookOpen
    },
    social: {
      bg: 'bg-pink-100 dark:bg-pink-900/30',
      text: 'text-pink-700 dark:text-pink-300',
      icon: Users2
    },
    outdoor: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      icon: TreePine
    },
    indoor: {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-700 dark:text-gray-300',
      icon: Home
    },
    fitness: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      icon: Zap
    },
    faith: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: HeartIcon
    },
    hobby: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-700 dark:text-indigo-300',
      icon: Heart
    },
    other: {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-400',
      icon: Calendar
    }
  };
  return styles[type as keyof typeof styles] || styles.other;
};

// Helper function to get school type styling and icon
const getSchoolTypeStyle = (type: string) => {
  const styles = {
    elementary: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: School
    },
    middle: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-700 dark:text-orange-300',
      icon: Building
    },
    high: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      icon: Building2
    },
    college: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      icon: University
    },
    university: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      text: 'text-indigo-700 dark:text-indigo-300',
      icon: GraduationCap
    },
    graduate: {
      bg: 'bg-violet-100 dark:bg-violet-900/30',
      text: 'text-violet-700 dark:text-violet-300',
      icon: GraduationCap
    },
    trade: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      icon: Dumbbell
    },
    preschool: {
      bg: 'bg-pink-100 dark:bg-pink-900/30',
      text: 'text-pink-700 dark:text-pink-300',
      icon: Baby
    },
    daycare: {
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      text: 'text-rose-700 dark:text-rose-300',
      icon: Heart
    },
    other: {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-400',
      icon: School
    }
  };
  return styles[type as keyof typeof styles] || styles.other;
};

// Helper function to get member type icon
const getMemberTypeIcon = (type: string) => {
  const icons = {
    user: UserCheck,
    partner: Heart,
    child: Baby,
    pet: Dog,
    parent: Crown,
    sibling: Users2,
    grandparent: UserX,
    other: User
  };
  return icons[type as keyof typeof icons] || icons.other;
};


const FamilyProfileSection: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const { showToast } = useToast();
  const profileData = userData?.profileData;

  // Helper functions to format display text
  const formatSchoolType = (type: string): string => {
    const schoolTypeMap: { [key: string]: string } = {
      'elementary': 'Elementary',
      'middle': 'Middle School',
      'high': 'High School',
      'college': 'College',
      'university': 'University',
      'graduate': 'Graduate School',
      'trade': 'Trade School',
      'preschool': 'Preschool',
      'daycare': 'Daycare',
      'other': 'Other'
    };
    return schoolTypeMap[type] || type;
  };

  const formatActivityType = (type: string): string => {
    const activityTypeMap: { [key: string]: string } = {
      'sport': 'Sport',
      'creative': 'Creative',
      'educational': 'Educational',
      'social': 'Social',
      'outdoor': 'Outdoor',
      'indoor': 'Indoor',
      'fitness': 'Fitness',
      'faith': 'Faith',
      'hobby': 'Hobby',
      'other': 'Other'
    };
    return activityTypeMap[type] || type;
  };

  const formatMemberType = (type: string): string => {
    const memberTypeMap: { [key: string]: string } = {
      'user': 'You',
      'partner': 'Spouse/Partner',
      'child': 'Child',
      'pet': 'Pet',
      'parent': 'Parent',
      'sibling': 'Sibling',
      'grandparent': 'Grandparent'
    };
    return memberTypeMap[type] || type;
  };

  const [activeTab, setActiveTab] = useState<'members' | 'activities'>('members');
  const [expandedMembers, setExpandedMembers] = useState<{[memberKey: string]: boolean}>({});
  const [expandedActivities, setExpandedActivities] = useState<{[memberKey: string]: boolean}>({});
  const [expandedSchools, setExpandedSchools] = useState<{[memberKey: string]: boolean}>({});
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editingMemberIndex, setEditingMemberIndex] = useState<number>(-1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{member: any, index: number} | null>(null);

  // Hobby modal state
  const [showHobbyModal, setShowHobbyModal] = useState(false);
  const [editingHobby, setEditingHobby] = useState<any>(null);
  const [editingHobbyMemberIndex, setEditingHobbyMemberIndex] = useState<number>(-1);
  const [editingHobbyIndex, setEditingHobbyIndex] = useState<number>(-1);

  // School modal state
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [editingSchoolMemberIndex, setEditingSchoolMemberIndex] = useState<number>(-1);
  const [editingSchoolIndex, setEditingSchoolIndex] = useState<number>(-1);

  // Family activity modal state
  const [showFamilyHobbyModal, setShowFamilyHobbyModal] = useState(false);
  const [editingFamilyHobby, setEditingFamilyHobby] = useState<any>(null);
  const [editingFamilyHobbyIndex, setEditingFamilyHobbyIndex] = useState<number>(-1);

  // Delete confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    type: 'activity' | 'school';
    name: string;
    memberIndex: number;
    itemIndex: number;
  } | null>(null);



  // Toggle member expansion (only one open at a time)
  const toggleMember = (memberKey: string) => {
    setExpandedMembers(prev => {
      const isCurrentlyExpanded = prev[memberKey];

      // If clicking the same member that's open, close it
      if (isCurrentlyExpanded) {
        // Also close all sub-accordions when closing member
        setExpandedActivities({});
        setExpandedSchools({});
        return {};
      }

      // Otherwise, close all others and open this one
      // Also close all sub-accordions when switching members
      setExpandedActivities({});
      setExpandedSchools({});
      return { [memberKey]: true };
    });
  };

  // Toggle activities expansion
  const toggleActivities = (memberKey: string) => {
    setExpandedActivities(prev => ({
      ...prev,
      [memberKey]: !prev[memberKey]
    }));
  };

  // Toggle schools expansion
  const toggleSchools = (memberKey: string) => {
    setExpandedSchools(prev => ({
      ...prev,
      [memberKey]: !prev[memberKey]
    }));
  };



  // Add new member (called by modal)
  const handleAddMember = async (memberData: any) => {
    // Create new member object (server will generate ID)
    const newMember = {
      name: memberData.name,
      type: memberData.type,
      email: memberData.email,
      age: memberData.age ? parseInt(memberData.age) : undefined,
      birthday: {
        month: memberData.birthday_month || '',
        day: memberData.birthday_day || ''
      },
      source: {
        type: 'manual' as const,
        timestamp: new Date().toISOString(),
        confidence: 1.0,
        source_id: undefined,
        original_text: undefined
      }
    };

    // Add to existing members array
    const updatedMembers = [...(profileData?.members || []), newMember];

    const updateData = {
      members: updatedMembers
    };

    console.log('📦 Adding new member:', newMember);

    const result = await accountProfileService.updateProfile(userData?.user?.account_id || '', updateData);

    if (result.success) {
      showToast('New member added successfully!', 'success');
      // Refresh data
      await refreshUserData();
    } else {
      showToast('Failed to add member. Please try again.', 'error');
      throw new Error(result.error);
    }
  };

  // Edit existing member (called by modal)
  const handleEditMember = async (memberData: any) => {
    const existingMember = profileData?.members?.[editingMemberIndex];
    const updatedMember = {
      ...existingMember,
      name: memberData.name,
      type: memberData.type,
      email: memberData.email,
      age: memberData.age ? parseInt(memberData.age) : undefined,
      birthday: {
        month: memberData.birthday_month || '',
        day: memberData.birthday_day || ''
      }
    };

    // Preserve existing source or add manual source for edits
    if (!updatedMember.source) {
      updatedMember.source = {
        type: 'manual' as const,
        timestamp: new Date().toISOString(),
        confidence: 1.0,
        source_id: undefined,
        original_text: undefined
      };
    } else {
      // Update timestamp for edits
      updatedMember.source.updated_at = new Date().toISOString();
    }

    // Update the specific member in the array
    const updatedMembers = [...(profileData?.members || [])];
    updatedMembers[editingMemberIndex] = updatedMember;

    const updateData = {
      members: updatedMembers
    };

    console.log('📝 Updating member:', updatedMember);

    const result = await accountProfileService.updateProfile(userData?.user?.account_id || '', updateData);

    if (result.success) {
      showToast('Member updated successfully!', 'success');
      // Refresh data
      await refreshUserData();
      // Reset editing state
      setEditingMember(null);
      setEditingMemberIndex(-1);
    } else {
      showToast('Failed to update member. Please try again.', 'error');
      throw new Error(result.error);
    }
  };

  // Start editing a member
  const startEditMember = (member: any, index: number) => {
    setEditingMember(member);
    setEditingMemberIndex(index);
    setShowAddMemberModal(true);
  };

  // Start deleting a member
  const startDeleteMember = (member: any, index: number) => {
    setMemberToDelete({ member, index });
    setShowDeleteModal(true);
  };

  // Confirm delete member
  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    const { member, index } = memberToDelete;

    try {
      // Remove the member from the array
      const updatedMembers = (profileData?.members || []).filter((_, i) => i !== index);

      const updateData = {
        members: updatedMembers
      };

      console.log('🗑️ Deleting member:', member.name);

      const result = await accountProfileService.updateProfile(userData?.user?.account_id || '', updateData);

      if (result.success) {
        showToast(`${member.name || 'Member'} deleted successfully!`, 'success');
        // Refresh data
        await refreshUserData();
      } else {
        showToast('Failed to delete member. Please try again.', 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error deleting member:', error);
      showToast('Failed to delete member. Please try again.', 'error');
      throw error;
    }
  };

  // Start adding/editing hobby
  const startAddHobby = (memberIndex: number) => {
    setEditingHobbyMemberIndex(memberIndex);
    setEditingHobby(null);
    setEditingHobbyIndex(-1);
    setShowHobbyModal(true);
  };

  const startEditHobby = (memberIndex: number, hobby: any, hobbyIndex: number) => {
    setEditingHobbyMemberIndex(memberIndex);
    setEditingHobby(hobby);
    setEditingHobbyIndex(hobbyIndex);
    setShowHobbyModal(true);
  };

  // Handle hobby add/edit
  const handleHobbySubmit = async (hobbyData: any) => {
    try {
      const updatedMembers = [...(profileData?.members || [])];
      const member = updatedMembers[editingHobbyMemberIndex];

      if (!member.activities) {
        member.activities = [];
      }

      // Add source information for manual entries
      const activityWithSource = {
        ...hobbyData,
        source: {
          type: 'manual' as const,
          timestamp: new Date().toISOString(),
          confidence: 1.0,
          source_id: undefined,
          original_text: undefined
        }
      };

      if (editingHobby) {
        // Edit existing hobby - preserve existing source or add new manual source
        const existingSource = member.activities[editingHobbyIndex]?.source;
        activityWithSource.source = existingSource || activityWithSource.source;
        // Update timestamp for edits
        activityWithSource.source.updated_at = new Date().toISOString();
        member.activities[editingHobbyIndex] = activityWithSource;
      } else {
        // Add new hobby
        member.activities.push(activityWithSource);
      }

      const updateData = { members: updatedMembers };
      const result = await accountProfileService.updateProfile(userData?.user?.account_id || '', updateData);

      if (result.success) {
        showToast(`Activity ${editingHobby ? 'updated' : 'added'} successfully!`, 'success');
        await refreshUserData();
        // Reset state
        setEditingHobby(null);
        setEditingHobbyMemberIndex(-1);
        setEditingHobbyIndex(-1);
      } else {
        showToast('Failed to save activity. Please try again.', 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error saving hobby:', error);
      showToast('Failed to save activity. Please try again.', 'error');
      throw error;
    }
  };

  // Start adding/editing school
  const startAddSchool = (memberIndex: number) => {
    setEditingSchoolMemberIndex(memberIndex);
    setEditingSchool(null);
    setEditingSchoolIndex(-1);
    setShowSchoolModal(true);
  };

  const startEditSchool = (memberIndex: number, school: any, schoolIndex: number) => {
    setEditingSchoolMemberIndex(memberIndex);
    setEditingSchool(school);
    setEditingSchoolIndex(schoolIndex);
    setShowSchoolModal(true);
  };

  // Handle school add/edit
  const handleSchoolSubmit = async (schoolData: any) => {
    try {
      const updatedMembers = [...(profileData?.members || [])];
      const member = updatedMembers[editingSchoolMemberIndex];

      if (!member.schools) {
        member.schools = [];
      }

      // Add source information for manual entries
      const schoolWithSource = {
        ...schoolData,
        source: {
          type: 'manual' as const,
          timestamp: new Date().toISOString(),
          confidence: 1.0,
          source_id: undefined,
          original_text: undefined
        }
      };

      if (editingSchool) {
        // Edit existing school - preserve existing source or add new manual source
        const existingSource = member.schools[editingSchoolIndex]?.source;
        schoolWithSource.source = existingSource || schoolWithSource.source;
        // Update timestamp for edits
        schoolWithSource.source.updated_at = new Date().toISOString();
        member.schools[editingSchoolIndex] = schoolWithSource;
      } else {
        // Add new school
        member.schools.push(schoolWithSource);
      }

      const updateData = { members: updatedMembers };
      const result = await accountProfileService.updateProfile(userData?.user?.account_id || '', updateData);

      if (result.success) {
        showToast(`School ${editingSchool ? 'updated' : 'added'} successfully!`, 'success');
        await refreshUserData();
        // Reset state
        setEditingSchool(null);
        setEditingSchoolMemberIndex(-1);
        setEditingSchoolIndex(-1);
      } else {
        showToast('Failed to save school. Please try again.', 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error saving school:', error);
      showToast('Failed to save school. Please try again.', 'error');
      throw error;
    }
  };

  // Family activity handlers
  const startAddFamilyHobby = () => {
    setEditingFamilyHobby(null);
    setEditingFamilyHobbyIndex(-1);
    setShowFamilyHobbyModal(true);
  };

  const startEditFamilyHobby = (hobby: any, hobbyIndex: number) => {
    setEditingFamilyHobby(hobby);
    setEditingFamilyHobbyIndex(hobbyIndex);
    setShowFamilyHobbyModal(true);
  };

  // Handle family activity add/edit
  const handleFamilyHobbySubmit = async (hobbyData: any) => {
    try {
      const currentActivities = Array.isArray((profileData as any).activities) ? (profileData as any).activities : [];
      let updatedActivities;

      // Add source information for manual entries
      const activityWithSource = {
        ...hobbyData,
        source: {
          type: 'manual' as const,
          timestamp: new Date().toISOString(),
          confidence: 1.0,
          source_id: undefined,
          original_text: undefined
        }
      };

      if (editingFamilyHobby) {
        // Edit existing family activity - preserve existing source or add new manual source
        const existingSource = currentActivities[editingFamilyHobbyIndex]?.source;
        activityWithSource.source = existingSource || activityWithSource.source;
        // Update timestamp for edits
        activityWithSource.source.updated_at = new Date().toISOString();
        updatedActivities = [...currentActivities];
        updatedActivities[editingFamilyHobbyIndex] = activityWithSource;
      } else {
        // Add new family activity
        updatedActivities = [...currentActivities, activityWithSource];
      }

      const updateData = { activities: updatedActivities };
      const result = await accountProfileService.updateProfile(userData?.user?.account_id || '', updateData as any);

      if (result.success) {
        showToast(`Family activity ${editingFamilyHobby ? 'updated' : 'added'} successfully!`, 'success');
        await refreshUserData();
        // Reset state
        setEditingFamilyHobby(null);
        setEditingFamilyHobbyIndex(-1);
      } else {
        showToast('Failed to save family activity. Please try again.', 'error');
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error saving family activity:', error);
      showToast('Failed to save family activity. Please try again.', 'error');
      throw error;
    }
  };

  // Show delete confirmation for hobby
  const handleDeleteHobby = (memberIndex: number, hobbyIndex: number) => {
    if (!profileData) return;

    const member = profileData.members[memberIndex];
    const activity = member.activities?.[hobbyIndex];

    if (activity) {
      setDeleteItem({
        type: 'activity',
        name: activity.name || 'Unnamed Activity',
        memberIndex,
        itemIndex: hobbyIndex
      });
      setShowDeleteConfirmation(true);
    }
  };

  // Actual delete hobby function
  const confirmDeleteHobby = async () => {
    if (!profileData || !deleteItem) return;

    try {
      const updatedMembers = [...(profileData?.members || [])];
      const member = { ...updatedMembers[deleteItem.memberIndex] };

      if (member.activities && member.activities.length > deleteItem.itemIndex) {
        member.activities.splice(deleteItem.itemIndex, 1);
      }

      updatedMembers[deleteItem.memberIndex] = member;

      const updateData = { members: updatedMembers };
      const result = await accountProfileService.updateProfile(userData?.user?.account_id || '', updateData);

      if (result.success) {
        showToast('Activity deleted successfully!', 'success');
        await refreshUserData();
      } else {
        throw new Error(result.error || 'Failed to delete activity');
      }
    } catch (error) {
      console.error('Error deleting hobby:', error);
      showToast('Failed to delete activity. Please try again.', 'error');
    }
  };

  // Show delete confirmation for school
  const handleDeleteSchool = (memberIndex: number, schoolIndex: number) => {
    if (!profileData) return;

    const member = profileData.members[memberIndex];
    const school = member.schools?.[schoolIndex];

    if (school) {
      setDeleteItem({
        type: 'school',
        name: school.name || 'Unnamed School',
        memberIndex,
        itemIndex: schoolIndex
      });
      setShowDeleteConfirmation(true);
    }
  };

  // Show delete confirmation for family activity
  const handleDeleteFamilyHobby = (hobbyIndex: number) => {
    if (!profileData) return;

    const activity = (profileData as any).activities?.[hobbyIndex];

    if (activity) {
      setDeleteItem({
        type: 'activity',
        name: activity.name || 'Unnamed Family Activity',
        memberIndex: -1, // Not applicable for family activities
        itemIndex: hobbyIndex
      });
      setShowDeleteConfirmation(true);
    }
  };

  // Actual delete school function
  const confirmDeleteSchool = async () => {
    if (!profileData || !deleteItem) return;

    try {
      const updatedMembers = [...(profileData?.members || [])];
      const member = { ...updatedMembers[deleteItem.memberIndex] };

      if (member.schools && member.schools.length > deleteItem.itemIndex) {
        member.schools.splice(deleteItem.itemIndex, 1);
      }

      updatedMembers[deleteItem.memberIndex] = member;

      const updateData = { members: updatedMembers };
      const result = await accountProfileService.updateProfile(userData?.user?.account_id || '', updateData);

      if (result.success) {
        showToast('School deleted successfully!', 'success');
        await refreshUserData();
      } else {
        throw new Error(result.error || 'Failed to delete school');
      }
    } catch (error) {
      console.error('Error deleting school:', error);
      showToast('Failed to delete school. Please try again.', 'error');
    }
  };

  // Actual delete family activity function
  const confirmDeleteFamilyHobby = async () => {
    if (!profileData || !deleteItem) return;

    try {
      const currentActivities = Array.isArray((profileData as any).activities) ? (profileData as any).activities : [];
      const updatedActivities = [...currentActivities];

      if (updatedActivities.length > deleteItem.itemIndex) {
        updatedActivities.splice(deleteItem.itemIndex, 1);
      }

      const updateData = { activities: updatedActivities };
      const result = await accountProfileService.updateProfile(userData?.user?.account_id || '', updateData as any);

      if (result.success) {
        showToast('Family activity deleted successfully!', 'success');
        await refreshUserData();
      } else {
        throw new Error(result.error || 'Failed to delete family activity');
      }
    } catch (error) {
      console.error('Error deleting family activity:', error);
      showToast('Failed to delete family activity. Please try again.', 'error');
    }
  };

  // Unified confirm delete function
  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    if (deleteItem.type === 'activity') {
      if (deleteItem.memberIndex === -1) {
        // Family activity
        await confirmDeleteFamilyHobby();
      } else {
        // Member activity
        await confirmDeleteHobby();
      }
    } else {
      await confirmDeleteSchool();
    }

    // Reset state
    setDeleteItem(null);
    setShowDeleteConfirmation(false);
  };

  if (!profileData?.members) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-container">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 flex-1 overflow-y-auto flex flex-col">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-5 h-5" />
              Family Members
            </button>
            <button
              onClick={() => setActiveTab('activities')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'activities'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Target className="w-5 h-5" />
              Family Activities
            </button>
          </div>

          {/* Action Button */}
          {activeTab === 'members' ? (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              Add Family Member
            </button>
          ) : (
            <button
              onClick={startAddFamilyHobby}
              className="btn-success"
            >
              <Plus className="w-4 h-4" />
              Add Family Activity
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'members' ? (
            /* Family Members Content */
            <div className="space-y-2">
              {profileData.members.map((member, index) => {
                const memberKey = `member-${index}`;
                const isExpanded = expandedMembers[memberKey];
                const Icon = getMemberTypeIcon(member.type || 'other');

                return (
                  <div key={memberKey} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-25 dark:bg-gray-800/30">
                    {/* Member Header - Clickable */}
                    <button
                      onClick={() => toggleMember(memberKey)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar-style profile icon */}
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Profile Information */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                              {member.name || 'Unnamed Member'}
                            </h3>
                            {member.age && (
                              <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                                {member.age}y
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center space-x-2">
                              {React.createElement(getMemberTypeIcon(member.type), { className: "w-4 h-4" })}
                              <span>{formatMemberType(member.type)}</span>
                            </span>
                          </div>

                          {/* Enhanced badges for schools and activities */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* School badges - more prominent */}
                            {member.schools && member.schools.length > 0 && member.schools.map((school, schoolIdx) => (
                              <span key={schoolIdx} className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full flex items-center gap-1 font-medium shadow-sm">
                                <GraduationCap className="w-3 h-3" /> {school.name}
                                {school.grade && <span className="text-emerald-600 dark:text-emerald-400">• {school.grade}</span>}
                              </span>
                            ))}

                            {/* Activity count badge */}
                            {member.activities && member.activities.length > 0 && (
                              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full flex items-center gap-1 font-medium shadow-sm">
                                <Zap className="w-3 h-3" /> {member.activities.length} {member.activities.length === 1 ? 'activity' : 'activities'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditMember(member, index);
                          }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && startEditMember(member, index)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit member"
                        >
                          <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    <div
                      className={`overflow-hidden transition-all duration-700 ease-in-out ${
                        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-b-lg">
                        {/* Member Information Display */}
                        <div className={`mb-4 ${member.type === 'user' ? 'pt-2' : 'pt-4'}`}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Name */}
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                Name
                              </label>
                              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[3rem] flex items-center">
                                <span className="text-gray-900 dark:text-white font-medium">
                                  {member.name || 'Not provided'}
                                </span>
                              </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                Email
                              </label>
                              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[3rem] flex items-center">
                                <span className="text-gray-900 dark:text-white">
                                  {member.email || '\u00A0'}
                                </span>
                              </div>
                            </div>

                            {/* Age */}
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                Age
                              </label>
                              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[3rem] flex items-center">
                                <span className="text-gray-900 dark:text-white">
                                  {member.age ? `${member.age} years old` : 'Not provided'}
                                </span>
                              </div>
                            </div>

                            {/* Birthday and Delete Button Column */}
                            <div className="space-y-1">
                              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                Birthday
                              </label>
                              <div className="flex items-center gap-2">
                                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[3rem] flex items-center flex-1">
                                  <span className="text-gray-900 dark:text-white">
                                    {member.birthday && typeof member.birthday === 'object' && 'month' in member.birthday && 'day' in member.birthday && member.birthday.month && member.birthday.day
                                      ? `${['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][parseInt(member.birthday.month as string)]} ${member.birthday.day}`
                                      : 'Not provided'
                                    }
                                  </span>
                                </div>
                                {/* Gentle Remove Button */}
                                {member.type !== 'user' && (
                                  <button
                                    onClick={() => startDeleteMember(member, index)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                                    title="Remove family member"
                                  >
                                    <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Member Source Information */}
                          {member.source && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                              <SourceIndicator
                                source={{
                                  type: (member.source.type || 'manual') as 'email' | 'manual' | 'chat',
                                  confidence: member.source.confidence,
                                  timestamp: member.source.timestamp,
                                  email_subject: member.source.email_subject,
                                  source_id: member.source.source_id
                                }}
                                originalText={member.source.original_text}
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>

                        {/* Activities Section */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                          <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <div
                              onClick={() => {
                                const hasActivities = member.activities && Array.isArray(member.activities) && member.activities.length > 0;
                                if (hasActivities) {
                                  toggleActivities(memberKey);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg transition-colors ${
                                member.activities && Array.isArray(member.activities) && member.activities.length > 0
                                  ? 'hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
                                  : 'cursor-default'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Activities {member.activities?.length ? `(${member.activities.length})` : ''}
                                </h6>
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startAddHobby(index);
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === 'Enter' && startAddHobby(index)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs border border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20 rounded-md transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add
                                </div>
                                {member.activities && Array.isArray(member.activities) && member.activities.length > 0 && (
                                  <div className="p-1">
                                    {expandedActivities[memberKey] ? (
                                      <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-400 transition-transform duration-200" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div
                              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                expandedActivities[memberKey] && member.activities && Array.isArray(member.activities) && member.activities.length > 0
                                  ? 'max-h-[2000px] opacity-100'
                                  : 'max-h-0 opacity-0'
                              }`}
                            >
                              <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
                                {member.activities && Array.isArray(member.activities) && member.activities.length > 0 ? (
                                  <div className="space-y-3 mt-3">
                                    {member.activities.map((activity, activityIndex) => (
                                      <div key={activityIndex} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 relative shadow-md">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1 min-w-0">
                                            {/* Header row with name and type */}
                                            <div className="flex items-center gap-2 mb-2">
                                              <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                                                {activity.name || 'Unnamed Activity'}
                                              </h6>
                                              {activity.type && (() => {
                                                const style = getActivityTypeStyle(activity.type);
                                                const IconComponent = style.icon;
                                                return (
                                                  <span className={`text-xs ${style.bg} ${style.text} px-2 py-1 rounded-full flex items-center gap-1`}>
                                                    <IconComponent className="w-3 h-3" />
                                                    {formatActivityType(activity.type)}
                                                  </span>
                                                );
                                              })()}
                                            </div>

                                            {/* Compact details in a single row */}
                                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                                              {activity.frequency && (
                                                <span>
                                                  <span className="font-medium">Frequency:</span> {activity.frequency.charAt(0).toUpperCase() + activity.frequency.slice(1)}
                                                </span>
                                              )}
                                              {activity.days && activity.days.length > 0 && (
                                                <span>
                                                  <span className="font-medium">Days:</span> {activity.days.map(day =>
                                                    day.charAt(0).toUpperCase() + day.slice(1)
                                                  ).join(', ')}
                                                </span>
                                              )}
                                              {activity.end_date && (
                                                <span>
                                                  <span className="font-medium">End Date:</span> {new Date(activity.end_date).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                  })}
                                                </span>
                                              )}
                                            </div>

                                            {/* Source Information - more compact */}
                                            {activity.source && (
                                              <SourceIndicator
                                                source={{
                                                  type: (activity.source.type || 'manual') as 'email' | 'manual' | 'chat',
                                                  confidence: activity.source.confidence,
                                                  timestamp: activity.source.timestamp,
                                                  email_subject: activity.source.email_subject,
                                                  source_id: activity.source.source_id
                                                }}
                                                originalText={activity.source.original_text}
                                                className="text-xs"
                                              />
                                            )}
                                          </div>

                                          {/* Action buttons - moved to top right */}
                                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                            <button
                                              onClick={() => startEditHobby(index, activity, activityIndex)}
                                              className="btn-icon-bordered"
                                              title="Edit activity"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteHobby(index, activityIndex)}
                                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors group"
                                              title="Remove activity"
                                            >
                                              <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                    No activities added yet
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Schools Section */}
                        <div className="mt-4">
                          <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                            <div
                              onClick={() => {
                                const hasSchools = member.schools && Array.isArray(member.schools) && member.schools.length > 0;
                                if (hasSchools) {
                                  toggleSchools(memberKey);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-t-lg transition-colors ${
                                member.schools && Array.isArray(member.schools) && member.schools.length > 0
                                  ? 'hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
                                  : 'cursor-default'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Schools {member.schools?.length ? `(${member.schools.length})` : ''}
                                </h6>
                              </div>
                              <div className="flex items-center gap-2">
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startAddSchool(index);
                                  }}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === 'Enter' && startAddSchool(index)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs border border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add
                                </div>
                                {member.schools && Array.isArray(member.schools) && member.schools.length > 0 && (
                                  <div className="p-1">
                                    {expandedSchools[memberKey] ? (
                                      <ChevronDown className="w-4 h-4 text-gray-400 transition-transform duration-200" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-400 transition-transform duration-200" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div
                              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                                expandedSchools[memberKey] && member.schools && Array.isArray(member.schools) && member.schools.length > 0
                                  ? 'max-h-[2000px] opacity-100'
                                  : 'max-h-0 opacity-0'
                              }`}
                            >
                              <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-b-lg">
                                {member.schools && Array.isArray(member.schools) && member.schools.length > 0 ? (
                                  <div className="space-y-3 mt-3">
                                    {member.schools.map((school, schoolIndex) => (
                                      <div key={schoolIndex} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 relative shadow-md">
                                        {/* Header with title and action buttons */}
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2 flex-1">
                                            <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                                              {school.name || 'Unnamed School'}
                                            </h6>
                                            {school.type && (() => {
                                              const style = getSchoolTypeStyle(school.type);
                                              const IconComponent = style.icon;
                                              return (
                                                <span className={`text-xs ${style.bg} ${style.text} px-2 py-1 rounded-full flex items-center gap-1`}>
                                                  <IconComponent className="w-3 h-3" />
                                                  {formatSchoolType(school.type)}
                                                </span>
                                              );
                                            })()}
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => startEditSchool(index, school, schoolIndex)}
                                              className="btn-icon-bordered"
                                              title="Edit school"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteSchool(index, schoolIndex)}
                                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors group"
                                              title="Remove school"
                                            >
                                              <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Details in horizontal layout */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-2">
                                          {school.grade && (
                                            <span>
                                              <span className="font-medium">Grade:</span> {school.grade}
                                            </span>
                                          )}
                                          {school.email_domain && (
                                            <span>
                                              <span className="font-medium">Email Domain:</span> {school.email_domain}
                                            </span>
                                          )}
                                        </div>

                                        {/* Source Information */}
                                        {school.source && (
                                          <div className="mt-2">
                                            <SourceIndicator
                                              source={{
                                                type: (school.source.type || 'manual') as 'email' | 'manual' | 'chat',
                                                confidence: school.source.confidence,
                                                timestamp: school.source.timestamp,
                                                email_subject: school.source.email_subject,
                                                source_id: school.source.source_id
                                              }}
                                              originalText={school.source.original_text}
                                              className="text-xs"
                                            />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                    No schools added yet
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Family Activities Content */
            <div className="space-y-2">
              {(profileData as any).activities && Array.isArray((profileData as any).activities) && (profileData as any).activities.length > 0 ? (
                (profileData as any).activities.map((activity: any, activityIndex: number) => (
                  <div key={activityIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-25 dark:bg-gray-800/30">
                    <div className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {activity.name || 'Unnamed Activity'}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Family Activity
                            </span>

                            {/* Activity type badge */}
                            {activity.type && (() => {
                              const style = getActivityTypeStyle(activity.type);
                              const IconComponent = style.icon;
                              return (
                                <span className={`text-xs ${style.bg} ${style.text} px-2 py-1 rounded-full flex items-center gap-1`}>
                                  <IconComponent className="w-3 h-3" />
                                  {formatActivityType(activity.type)}
                                </span>
                              );
                            })()}

                            {/* Additional activity details */}
                            {activity.frequency && (
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                                {activity.frequency.charAt(0).toUpperCase() + activity.frequency.slice(1)}
                              </span>
                            )}

                            {activity.end_date && (
                              <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full">
                                Ends {new Date(activity.end_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            )}

                            {/* Source Information */}
                            {activity.source && (
                              <SourceIndicator
                                source={{
                                  type: (activity.source.type || 'manual') as 'email' | 'manual' | 'chat',
                                  confidence: activity.source.confidence,
                                  timestamp: activity.source.timestamp,
                                  email_subject: activity.source.email_subject,
                                  source_id: activity.source.source_id
                                }}
                                originalText={activity.source.original_text}
                                className="text-xs"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          onClick={() => startEditFamilyHobby(activity, activityIndex)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && startEditFamilyHobby(activity, activityIndex)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer"
                          title="Edit activity"
                        >
                          <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </div>
                        <button
                          onClick={() => handleDeleteFamilyHobby(activityIndex)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                          title="Remove family activity"
                        >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Target className="w-12 h-12 opacity-50 mx-auto mb-2" />
                  <p>No family activities added yet</p>
                  <p className="text-sm">Click "Add Family Activity" to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Member Modal */}
      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          // Clear editing data immediately to prevent flash of wrong data
          setEditingMember(null);
          setEditingMemberIndex(-1);
        }}
        onAdd={editingMember ? handleEditMember : handleAddMember}
        editingMember={editingMember}
        isEditing={!!editingMember}
      />

      {/* Delete Member Modal */}
      <DeleteMemberModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setMemberToDelete(null);
        }}
        onConfirm={handleDeleteMember}
        memberName={memberToDelete?.member?.name || 'this member'}
      />

      {/* Add/Edit Hobby Modal */}
      <AddHobbyModal
        isOpen={showHobbyModal}
        onClose={() => {
          setShowHobbyModal(false);
          // Clear editing data immediately to prevent flash of wrong data
          setEditingHobby(null);
          setEditingHobbyIndex(-1);
          setEditingHobbyMemberIndex(-1);
        }}
        onAdd={editingHobby ? handleHobbySubmit : handleHobbySubmit}
        editingHobby={editingHobby}
        isEditing={!!editingHobby}
      />

      {/* Add/Edit School Modal */}
      <AddSchoolModal
        isOpen={showSchoolModal}
        onClose={() => {
          setShowSchoolModal(false);
          // Clear editing data immediately to prevent flash of wrong data
          setEditingSchool(null);
          setEditingSchoolIndex(-1);
          setEditingSchoolMemberIndex(-1);
        }}
        onAdd={editingSchool ? handleSchoolSubmit : handleSchoolSubmit}
        editingSchool={editingSchool}
        isEditing={!!editingSchool}
      />

      {/* Family Activity Modal */}
      <AddHobbyModal
        isOpen={showFamilyHobbyModal}
        onClose={() => {
          setShowFamilyHobbyModal(false);
          // Clear editing data immediately to prevent flash of wrong data
          setEditingFamilyHobby(null);
          setEditingFamilyHobbyIndex(-1);
        }}
        onAdd={editingFamilyHobby ? handleFamilyHobbySubmit : handleFamilyHobbySubmit}
        editingHobby={editingFamilyHobby}
        isEditing={!!editingFamilyHobby}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => {
          setShowDeleteConfirmation(false);
          setDeleteItem(null);
        }}
        onConfirm={handleConfirmDelete}
        itemName={deleteItem?.name || ''}
        itemType={deleteItem?.type || 'activity'}
      />
    </div>
  );
};

export default FamilyProfileSection;