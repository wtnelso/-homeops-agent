import React, { useState } from 'react';
import { Heart, Baby, User, ChevronDown, ChevronRight, Plus, Edit, Trash2, Calendar, GraduationCap, Dumbbell, Palette, BookOpen, Users2, TreePine, Home, Heart as HeartIcon, Zap, School, Building, Building2, University, UserCheck, Crown, Dog, UserX, Target, UserPlus, Hash, Tag, Mail, MapPin, Sparkles, Search, Filter } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import AddMemberModal from '../../ui/AddMemberModal';
import DeleteMemberModal from '../../ui/DeleteMemberModal';
import AddHobbyModal from '../../ui/AddHobbyModal';
import AddSchoolModal from '../../ui/AddSchoolModal';
import AddContactModal from '../../ui/AddContactModal';
import AddKeywordModal from '../../ui/AddKeywordModal';
import DeleteConfirmationModal from '../../ui/DeleteConfirmationModal';
import SourceIndicator from '../../ui/SourceIndicator';
// import { familyProfileService } from '../../../services/familyProfileService';
import { FamilyMember } from '../../../services/userSession';
import { FamilyManagementService } from '../../../services/familyManagementService';

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

// Helper function to get fun avatar styles for family members
const getMemberAvatarStyle = (type: string, isSelected: boolean) => {
  const avatarStyles = {
    user: {
      bg: 'bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900/40 dark:to-indigo-900/40',
      border: 'border-blue-200 dark:border-blue-700',
      selectedBg: 'bg-gradient-to-br from-blue-200 to-indigo-300 dark:from-blue-800/60 dark:to-indigo-800/60',
      selectedBorder: 'border-blue-300 dark:border-blue-600',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    partner: {
      bg: 'bg-gradient-to-br from-pink-100 to-rose-200 dark:from-pink-900/40 dark:to-rose-900/40',
      border: 'border-pink-200 dark:border-pink-700',
      selectedBg: 'bg-gradient-to-br from-pink-200 to-rose-300 dark:from-pink-800/60 dark:to-rose-800/60',
      selectedBorder: 'border-pink-300 dark:border-pink-600',
      icon: 'text-pink-600 dark:text-pink-400'
    },
    child: {
      bg: 'bg-gradient-to-br from-yellow-100 to-orange-200 dark:from-yellow-900/40 dark:to-orange-900/40',
      border: 'border-yellow-200 dark:border-yellow-700',
      selectedBg: 'bg-gradient-to-br from-yellow-200 to-orange-300 dark:from-yellow-800/60 dark:to-orange-800/60',
      selectedBorder: 'border-yellow-300 dark:border-yellow-600',
      icon: 'text-yellow-600 dark:text-yellow-400'
    },
    pet: {
      bg: 'bg-gradient-to-br from-green-100 to-emerald-200 dark:from-green-900/40 dark:to-emerald-900/40',
      border: 'border-green-200 dark:border-green-700',
      selectedBg: 'bg-gradient-to-br from-green-200 to-emerald-300 dark:from-green-800/60 dark:to-emerald-800/60',
      selectedBorder: 'border-green-300 dark:border-green-600',
      icon: 'text-green-600 dark:text-green-400'
    },
    parent: {
      bg: 'bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/40 dark:to-violet-900/40',
      border: 'border-purple-200 dark:border-purple-700',
      selectedBg: 'bg-gradient-to-br from-purple-200 to-violet-300 dark:from-purple-800/60 dark:to-violet-800/60',
      selectedBorder: 'border-purple-300 dark:border-purple-600',
      icon: 'text-purple-600 dark:text-purple-400'
    },
    sibling: {
      bg: 'bg-gradient-to-br from-cyan-100 to-teal-200 dark:from-cyan-900/40 dark:to-teal-900/40',
      border: 'border-cyan-200 dark:border-cyan-700',
      selectedBg: 'bg-gradient-to-br from-cyan-200 to-teal-300 dark:from-cyan-800/60 dark:to-teal-800/60',
      selectedBorder: 'border-cyan-300 dark:border-cyan-600',
      icon: 'text-cyan-600 dark:text-cyan-400'
    },
    grandparent: {
      bg: 'bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900/40 dark:to-yellow-900/40',
      border: 'border-amber-200 dark:border-amber-700',
      selectedBg: 'bg-gradient-to-br from-amber-200 to-yellow-300 dark:from-amber-800/60 dark:to-yellow-800/60',
      selectedBorder: 'border-amber-300 dark:border-amber-600',
      icon: 'text-amber-600 dark:text-amber-400'
    },
    other: {
      bg: 'bg-gradient-to-br from-slate-100 to-gray-200 dark:from-slate-900/40 dark:to-gray-900/40',
      border: 'border-slate-200 dark:border-slate-700',
      selectedBg: 'bg-gradient-to-br from-slate-200 to-gray-300 dark:from-slate-800/60 dark:to-gray-800/60',
      selectedBorder: 'border-slate-300 dark:border-slate-600',
      icon: 'text-slate-600 dark:text-slate-400'
    }
  };

  const style = avatarStyles[type as keyof typeof avatarStyles] || avatarStyles.other;

  return {
    containerClass: `${isSelected ? style.selectedBg : style.bg} ${isSelected ? style.selectedBorder : style.border}`,
    iconClass: style.icon
  };
};


interface FamilyProfileSectionProps {
  defaultTab?: 'members' | 'activities' | 'contacts' | 'keywords';
}

const FamilyProfileSection: React.FC<FamilyProfileSectionProps> = ({ defaultTab = 'members' }) => {
  const { userData, refreshUserData } = useAuth();
  const { showToast } = useToast();
  // const profileData = userData?.family;

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

  const [selectedMemberIndex, setSelectedMemberIndex] = useState<number | null>(null);
  const [expandedActivities, setExpandedActivities] = useState<{[memberKey: string]: boolean}>({});
  const [expandedSchools, setExpandedSchools] = useState<{[memberKey: string]: boolean}>({});
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [_editingMemberIndex, setEditingMemberIndex] = useState<number>(-1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{member: any, index: number} | null>(null);

  // Hobby modal state
  const [showHobbyModal, setShowHobbyModal] = useState(false);
  const [editingHobby, setEditingHobby] = useState<any>(null);
  const [editingHobbyMemberIndex, setEditingHobbyMemberIndex] = useState<number>(-1);
  const [, setEditingHobbyIndex] = useState<number>(-1);

  // School modal state
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<any>(null);
  const [editingSchoolMemberIndex, setEditingSchoolMemberIndex] = useState<number>(-1);
  const [, setEditingSchoolIndex] = useState<number>(-1);

  // Family activity modal state
  const [showFamilyHobbyModal, setShowFamilyHobbyModal] = useState(false);
  const [editingFamilyHobby, setEditingFamilyHobby] = useState<any>(null);
  const [, setEditingFamilyHobbyIndex] = useState<number>(-1);

  // Contact modal state
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [, setEditingContactIndex] = useState<number>(-1);

  // Keyword modal state
  const [showKeywordModal, setShowKeywordModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<any>(null);
  const [, setEditingKeywordIndex] = useState<number>(-1);

  // Keyword search and filter state
  const [keywordSearchTerm, setKeywordSearchTerm] = useState('');
  const [keywordSortBy, setKeywordSortBy] = useState<'name' | 'category' | 'recent'>('name');

  // Delete confirmation modal state
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{
    type: 'activity' | 'school' | 'contact' | 'keyword';
    name: string;
    memberIndex?: number;
    itemIndex?: number;
    activityId?: string;
    schoolId?: string;
    contactId?: string;
    keywordId?: string;
  } | null>(null);



  // Handle member card selection
  const handleMemberSelect = (memberIndex: number) => {
    if (selectedMemberIndex === memberIndex) {
      setSelectedMemberIndex(null); // Deselect if already selected
    } else {
      setSelectedMemberIndex(memberIndex);
      // Close all sub-accordions when switching members
      setExpandedActivities({});
      setExpandedSchools({});
    }
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
    const familyId = userData?.user?.family_id || '';

    // Create new member object
    const newMember = {
      family_id: familyId,
      user_id: null, // Family members are not system users
      name: memberData.name,
      family_relationship: memberData.type,
      email: memberData.email,
      age: memberData.age ? parseInt(memberData.age) : null,
      birthday_month: memberData.birthday_month || null,
      birthday_day: memberData.birthday_day ? parseInt(memberData.birthday_day) : null,
      created_by: userData?.user?.id
    };

    console.log('📦 Adding new member:', newMember);

    const result = await FamilyManagementService.addFamilyMember(newMember, userData?.user?.id);

    if (result.success) {
      showToast('New member added successfully!', 'success');
      await refreshUserData();
    } else {
      showToast('Failed to add member. Please try again.', 'error');
      throw new Error(result.error);
    }
  };

  // Edit existing member (called by modal)
  const handleEditMember = async (memberData: any) => {
    // Use the editingMember object that was stored when editing started
    if (!editingMember?.family_member_id) {
      throw new Error('Member ID not found');
    }

    const updatedMemberData = {
      name: memberData.name,
      family_relationship: memberData.type,
      email: memberData.email,
      age: memberData.age ? parseInt(memberData.age) : null,
      birthday_month: memberData.birthday_month || null,
      birthday_day: memberData.birthday_day ? parseInt(memberData.birthday_day) : null
    };

    console.log('📝 Updating member - editingMember:', editingMember);
    console.log('📝 Updating member - family_member_id:', editingMember.family_member_id);
    console.log('📝 Updating member - updatedMemberData:', updatedMemberData);

    // Check if this is the user's own record (Me)
    const isUserRecord = editingMember.family_member_id === userData?.user?.id;

    let result;
    if (isUserRecord) {
      // For user's own record, update using user_id column instead of id column
      result = await FamilyManagementService.updateFamilyMemberByUserId(editingMember.family_member_id, updatedMemberData, userData?.user?.id);
    } else {
      // For other family members, update using id column
      result = await FamilyManagementService.updateFamilyMember(editingMember.family_member_id, updatedMemberData, userData?.user?.id);
    }

    if (result.success) {
      showToast('Member updated successfully!', 'success');
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

    const { member } = memberToDelete;

    try {
      console.log('🗑️ Deleting member:', member.name);

      if (member.family_member_id) {
        const result = await FamilyManagementService.deleteFamilyMember(member.family_member_id);
        if (result.success) {
          showToast(`${member.name || 'Member'} deleted successfully!`, 'success');
          await refreshUserData();
        } else {
          showToast('Failed to delete member. Please try again.', 'error');
          throw new Error(result.error);
        }
      } else {
        throw new Error('Member ID not found');
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
      const familyId = userData?.user?.family_id || '';

      // Determine if this is for a family member or family-wide activity
      if (editingHobbyMemberIndex === 0 && members[0]?.isCurrentUser) {
        // Family-wide activity (associated with the family, not a specific member)
        const activityData = {
          family_id: familyId,
          family_member_id: null, // Family-wide activity
          activity_name: hobbyData.name,
          activity_type: hobbyData.type,
          frequency: hobbyData.frequency,
          days: hobbyData.days,
          end_date: hobbyData.end_date,
          created_by: userData?.user?.id,
          source: {
            type: 'manual' as const,
            timestamp: new Date().toISOString(),
            confidence: 1.0,
            original_text: `Manually added activity: ${hobbyData.name} (${hobbyData.type})`
          }
        };

        if (editingHobby) {
          // Update existing activity
          const activityId = editingHobby.id;
          if (activityId) {
            // Preserve existing source but update timestamp
            if (editingHobby.source) {
              activityData.source = {
                ...editingHobby.source,
                updated_at: new Date().toISOString()
              };
            }
            const result = await FamilyManagementService.updateActivity(activityId, activityData);
            if (result.success) {
              showToast('Activity updated successfully!', 'success');
              await refreshUserData();
            } else {
              throw new Error(result.error);
            }
          }
        } else {
          // Add new activity
          const result = await FamilyManagementService.addActivity(activityData);
          if (result.success) {
            showToast('Activity added successfully!', 'success');
            await refreshUserData();
          } else {
            throw new Error(result.error);
          }
        }
      } else {
        // Member-specific activity
        const member = members[editingHobbyMemberIndex];
        const activityData = {
          family_id: familyId,
          family_member_id: member.family_member_id,
          activity_name: hobbyData.name,
          activity_type: hobbyData.type,
          frequency: hobbyData.frequency,
          days: hobbyData.days,
          end_date: hobbyData.end_date,
          created_by: userData?.user?.id,
          familyMemberName: member.name, // Include family member name for agent memory
          source: {
            type: 'manual' as const,
            timestamp: new Date().toISOString(),
            confidence: 1.0,
            original_text: `Manually added activity for ${member.name}: ${hobbyData.name} (${hobbyData.type})`
          }
        };

        if (editingHobby) {
          // Update existing activity
          const activityId = editingHobby.id;
          if (activityId) {
            // Preserve existing source but update timestamp
            if (editingHobby.source) {
              activityData.source = {
                ...editingHobby.source,
                updated_at: new Date().toISOString()
              };
            }
            const result = await FamilyManagementService.updateActivity(activityId, activityData);
            if (result.success) {
              showToast('Activity updated successfully!', 'success');
              await refreshUserData();
            } else {
              throw new Error(result.error);
            }
          }
        } else {
          // Add new activity
          const result = await FamilyManagementService.addActivity(activityData);
          if (result.success) {
            showToast('Activity added successfully!', 'success');
            await refreshUserData();
          } else {
            throw new Error(result.error);
          }
        }
      }

      // Reset state
      setEditingHobby(null);
      setEditingHobbyMemberIndex(-1);
      setEditingHobbyIndex(-1);
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
      const familyId = userData?.user?.family_id || '';

      // Determine if this is for a family member or family-wide school
      if (editingSchoolMemberIndex === 0 && members[0]?.isCurrentUser) {
        // Family-wide school (associated with the family, not a specific member)
        const schoolDataForDb = {
          family_id: familyId,
          family_member_id: null, // Family-wide school
          school_name: schoolData.name,
          school_type: schoolData.type,
          grade: schoolData.grade,
          email_domain: schoolData.email_domain,
          created_by: userData?.user?.id,
          source: {
            type: 'manual' as const,
            timestamp: new Date().toISOString(),
            confidence: 1.0,
            original_text: `Manually added school: ${schoolData.name} (${schoolData.type})`
          }
        };

        if (editingSchool) {
          // Update existing school
          const schoolId = editingSchool.id;
          if (schoolId) {
            // Preserve existing source but update timestamp
            if (editingSchool.source) {
              schoolDataForDb.source = {
                ...editingSchool.source,
                updated_at: new Date().toISOString()
              };
            }
            const result = await FamilyManagementService.updateSchool(schoolId, schoolDataForDb);
            if (result.success) {
              showToast('School updated successfully!', 'success');
              await refreshUserData();
            } else {
              throw new Error(result.error);
            }
          }
        } else {
          // Add new school
          const result = await FamilyManagementService.addSchool(schoolDataForDb);
          if (result.success) {
            showToast('School added successfully!', 'success');
            await refreshUserData();
          } else {
            throw new Error(result.error);
          }
        }
      } else {
        // Member-specific school
        const member = members[editingSchoolMemberIndex];
        const schoolDataForDb = {
          family_id: familyId,
          family_member_id: member.family_member_id,
          school_name: schoolData.name,
          school_type: schoolData.type,
          grade: schoolData.grade,
          email_domain: schoolData.email_domain,
          created_by: userData?.user?.id,
          familyMemberName: member.name, // Include family member name for agent memory
          source: {
            type: 'manual' as const,
            timestamp: new Date().toISOString(),
            confidence: 1.0,
            original_text: `Manually added school for ${member.name}: ${schoolData.name} (${schoolData.type})`
          }
        };

        if (editingSchool) {
          // Update existing school
          const schoolId = editingSchool.id;
          if (schoolId) {
            // Preserve existing source but update timestamp
            if (editingSchool.source) {
              schoolDataForDb.source = {
                ...editingSchool.source,
                updated_at: new Date().toISOString()
              };
            }
            const result = await FamilyManagementService.updateSchool(schoolId, schoolDataForDb);
            if (result.success) {
              showToast('School updated successfully!', 'success');
              await refreshUserData();
            } else {
              throw new Error(result.error);
            }
          }
        } else {
          // Add new school
          const result = await FamilyManagementService.addSchool(schoolDataForDb);
          if (result.success) {
            showToast('School added successfully!', 'success');
            await refreshUserData();
          } else {
            throw new Error(result.error);
          }
        }
      }

      // Reset state
      setEditingSchool(null);
      setEditingSchoolMemberIndex(-1);
      setEditingSchoolIndex(-1);
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
      const familyId = userData?.user?.family_id || '';

      // Family-wide activity (associated with the family, not a specific member)
      const activityData = {
        family_id: familyId,
        family_member_id: null, // Family-wide activity
        activity_name: hobbyData.name,
        activity_type: hobbyData.type,
        frequency: hobbyData.frequency,
        days: hobbyData.days,
        end_date: hobbyData.end_date,
        created_by: userData?.user?.id,
        source: {
          type: 'manual' as const,
          timestamp: new Date().toISOString(),
          confidence: 1.0,
          original_text: `Manually added family activity: ${hobbyData.name} (${hobbyData.type})`
        }
      };

      if (editingFamilyHobby) {
        // Update existing family activity
        const activityId = editingFamilyHobby.id;
        if (activityId) {
          // Preserve existing source but update timestamp
          if (editingFamilyHobby.source) {
            activityData.source = {
              ...editingFamilyHobby.source,
              updated_at: new Date().toISOString()
            };
          }
          const result = await FamilyManagementService.updateActivity(activityId, activityData);
          if (result.success) {
            showToast('Family activity updated successfully!', 'success');
            await refreshUserData();
          } else {
            throw new Error(result.error);
          }
        }
      } else {
        // Add new family activity
        const result = await FamilyManagementService.addActivity(activityData);
        if (result.success) {
          showToast('Family activity added successfully!', 'success');
          await refreshUserData();
        } else {
          throw new Error(result.error);
        }
      }

      // Reset state
      setEditingFamilyHobby(null);
      setEditingFamilyHobbyIndex(-1);
    } catch (error) {
      console.error('❌ Error saving family activity:', error);
      showToast('Failed to save family activity. Please try again.', 'error');
      throw error;
    }
  };

  // Show delete confirmation for hobby
  const handleDeleteHobby = (activityId: string) => {
    setDeleteItem({
      type: 'activity',
      name: 'this activity', // Generic name since we have the ID
      activityId: activityId
    });
    setShowDeleteConfirmation(true);
  };

  // Actual delete hobby function
  const confirmDeleteHobby = async () => {
    if (!deleteItem || !deleteItem.activityId) return;

    try {
      const result = await FamilyManagementService.deleteActivity(deleteItem.activityId);
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
  const handleDeleteSchool = (schoolId: string) => {
    setDeleteItem({
      type: 'school',
      name: 'this school',
      schoolId: schoolId
    });
    setShowDeleteConfirmation(true);
  };

  // Show delete confirmation for family activity
  const handleDeleteFamilyHobby = (activityId: string) => {
    setDeleteItem({
      type: 'activity',
      name: 'this family activity',
      activityId: activityId
    });
    setShowDeleteConfirmation(true);
  };

  // Actual delete school function
  const confirmDeleteSchool = async () => {
    if (!deleteItem || !deleteItem.schoolId) return;

    try {
      const result = await FamilyManagementService.deleteSchool(deleteItem.schoolId);
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
    if (!deleteItem || !deleteItem.activityId) return;

    try {
      const result = await FamilyManagementService.deleteActivity(deleteItem.activityId);
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

  // Contact handlers
  const startAddContact = () => {
    setEditingContact(null);
    setEditingContactIndex(-1);
    setShowContactModal(true);
  };

  const startEditContact = (contact: any, contactIndex: number) => {
    setEditingContact(contact);
    setEditingContactIndex(contactIndex);
    setShowContactModal(true);
  };

  // Handle contact add/edit
  const handleContactSubmit = async (contactData: any) => {
    try {
      const familyId = userData?.user?.family_id || '';

      const contactDataForDb = {
        family_id: familyId,
        contact_name: contactData.contact_name,
        contact_type: contactData.contact_type || null,
        phone: contactData.phone || null,
        email: contactData.email || null,
        notes: contactData.notes || null,
        created_by: userData?.user?.id,
        source: {
          type: 'manual' as const,
          timestamp: new Date().toISOString(),
          confidence: 1.0,
          original_text: `Manually added contact: ${contactData.contact_name} (${contactData.contact_type || 'No type specified'})`
        }
      };

      if (editingContact) {
        // Update existing contact
        const contactId = editingContact.id;
        if (contactId) {
          // Preserve existing source but update timestamp
          if (editingContact.source) {
            contactDataForDb.source = {
              ...editingContact.source,
              updated_at: new Date().toISOString()
            };
          }
          const result = await FamilyManagementService.updateContact(contactId, contactDataForDb);
          if (result.success) {
            showToast('Contact updated successfully!', 'success');
            await refreshUserData();
          } else {
            throw new Error(result.error);
          }
        }
      } else {
        // Add new contact
        const result = await FamilyManagementService.addContact(contactDataForDb);
        if (result.success) {
          showToast('Contact added successfully!', 'success');
          await refreshUserData();
        } else {
          throw new Error(result.error);
        }
      }

      // Reset state
      setEditingContact(null);
      setEditingContactIndex(-1);
    } catch (error) {
      console.error('❌ Error saving contact:', error);
      showToast('Failed to save contact. Please try again.', 'error');
      throw error;
    }
  };

  // Show delete confirmation for contact
  const handleDeleteContact = (contactId: string) => {
    setDeleteItem({
      type: 'contact',
      name: 'this contact',
      contactId: contactId
    });
    setShowDeleteConfirmation(true);
  };

  // Actual delete contact function
  const confirmDeleteContact = async () => {
    if (!deleteItem || !deleteItem.contactId) return;

    try {
      const result = await FamilyManagementService.deleteContact(deleteItem.contactId);
      if (result.success) {
        showToast('Contact deleted successfully!', 'success');
        await refreshUserData();
      } else {
        throw new Error(result.error || 'Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      showToast('Failed to delete contact. Please try again.', 'error');
    }
  };

  // Keyword handlers
  const startAddKeyword = () => {
    setEditingKeyword(null);
    setEditingKeywordIndex(-1);
    setShowKeywordModal(true);
  };

  const startEditKeyword = (keyword: any, keywordIndex: number) => {
    setEditingKeyword(keyword);
    setEditingKeywordIndex(keywordIndex);
    setShowKeywordModal(true);
  };

  // Handle keyword add/edit
  const handleKeywordSubmit = async (keywordData: any) => {
    try {
      const familyId = userData?.user?.family_id || '';

      const keywordForDb = {
        family_id: familyId,
        keyword: keywordData.keyword,
        category: keywordData.category
      };

      if (editingKeyword) {
        // Update existing keyword
        const keywordId = editingKeyword.id;
        if (keywordId) {
          const result = await FamilyManagementService.updateKeyword(keywordId, keywordForDb);
          if (result.success) {
            showToast('Keyword updated successfully!', 'success');
            await refreshUserData();
          } else {
            throw new Error(result.error);
          }
        }
      } else {
        // Add new keyword
        const result = await FamilyManagementService.addKeyword(keywordForDb);
        if (result.success) {
          showToast('Keyword added successfully!', 'success');
          await refreshUserData();
        } else {
          throw new Error(result.error);
        }
      }

      // Reset state
      setEditingKeyword(null);
      setEditingKeywordIndex(-1);
    } catch (error) {
      console.error('❌ Error saving keyword:', error);
      showToast('Failed to save keyword. Please try again.', 'error');
      throw error;
    }
  };

  // Show delete confirmation for keyword
  const handleDeleteKeyword = (keywordId: string) => {
    setDeleteItem({
      type: 'keyword',
      name: 'this keyword',
      keywordId: keywordId
    });
    setShowDeleteConfirmation(true);
  };

  // Actual delete keyword function
  const confirmDeleteKeyword = async () => {
    if (!deleteItem || !deleteItem.keywordId) return;

    try {
      const result = await FamilyManagementService.deleteKeyword(deleteItem.keywordId);
      if (result.success) {
        showToast('Keyword deleted successfully!', 'success');
        await refreshUserData();
      } else {
        throw new Error(result.error || 'Failed to delete keyword');
      }
    } catch (error) {
      console.error('Error deleting keyword:', error);
      showToast('Failed to delete keyword. Please try again.', 'error');
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
    } else if (deleteItem.type === 'school') {
      await confirmDeleteSchool();
    } else if (deleteItem.type === 'contact') {
      await confirmDeleteContact();
    } else if (deleteItem.type === 'keyword') {
      await confirmDeleteKeyword();
    }

    // Reset state
    setDeleteItem(null);
    setShowDeleteConfirmation(false);
  };

  // Check if we have userData loaded
  if (!userData) {
    return <div>Loading...</div>;
  }

  // Get family data, with fallback to empty object
  const familyData = userData.family || { members: [] };
  const otherFamilyMembers = familyData.members || [];

  // Create the user as the first family member
  const userAsMember: FamilyMember = {
    family_member_id: userData.user.id,
    name: userData.user.name || 'You',
    type: 'user',
    family_relationship: 'user',
    activities: userData.family?.activities || [],
    schools: userData.user.schools || [],
    age: null,
    email: userData.user.email,
    role: userData.user.role,
    is_active: userData.user.is_active,
    created_at: userData.user.created_at,
    birthday_month: null,
    birthday_day: null,
    user_id: userData.user.id,
    isCurrentUser: true
  };

  // Combine user with other family members
  const allMembers = [userAsMember, ...otherFamilyMembers];
  const members = allMembers;

  return (
    <div className="settings-container">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 flex-1 overflow-hidden flex flex-col max-w-full">

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {defaultTab === 'members' ? (
            /* Family Members Content */
            <div className="space-y-4 md:space-y-6 w-full min-w-0 max-w-full overflow-x-hidden">
              {/* Mobile List View */}
              <div className="block md:hidden space-y-3 w-full max-w-full min-w-0">
                {members.map((member, index) => {
                  const Icon = getMemberTypeIcon(member.type || 'other');
                  const isSelected = selectedMemberIndex === index;
                  const avatarStyle = getMemberAvatarStyle(member.type || 'other', isSelected);

                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={() => handleMemberSelect(index)}
                        className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center gap-4 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${avatarStyle.containerClass}`}>
                          <Icon className={`w-6 h-6 ${avatarStyle.iconClass}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-left">
                          <h3 className={`font-semibold text-sm ${
                            isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                          }`}>
                            {member.name || 'Unnamed'}{member.type === 'user' ? ' (You)' : ''}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            {member.age && (
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {member.age}y
                              </span>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              {member.schools && member.schools.length > 0 && (
                                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <GraduationCap className="w-3 h-3" />
                                  <span>{member.schools.length}</span>
                                </div>
                              )}
                              {member.activities && member.activities.length > 0 && (
                                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                  <Zap className="w-3 h-3" />
                                  <span>{member.activities.length}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Edit button - positioned absolutely outside the main button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditMember(member, index);
                        }}
                        className="absolute top-2 right-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors z-10"
                        title="Edit member"
                      >
                        <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  );
                })}

                {/* Add Member Button for Mobile */}
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="w-full p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 flex items-center justify-center gap-3 group"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors">
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <span className="font-semibold text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Add Member
                  </span>
                </button>
              </div>

              {/* Desktop Card Grid */}
              <div className={`hidden md:grid gap-4 overflow-visible w-full min-w-0 ${
                members.length <= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                members.length <= 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
                'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}>
                {members.map((member, index) => {
                  const Icon = getMemberTypeIcon(member.type || 'other');
                  const isSelected = selectedMemberIndex === index;
                  const avatarStyle = getMemberAvatarStyle(member.type || 'other', isSelected);

                  return (
                    <div key={index} className="relative group">
                      <button
                        onClick={() => handleMemberSelect(index)}
                        className={`w-full min-h-44 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg ring-2 ring-blue-200 dark:ring-blue-800'
                            : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 transition-colors ${avatarStyle.containerClass}`}>
                          <Icon className={`w-8 h-8 ${avatarStyle.iconClass}`} />
                        </div>

                        {/* Name */}
                        <h3 className={`font-semibold text-sm mb-1 truncate ${
                          isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                        }`}>
                          {member.name || 'Unnamed'}{member.type === 'user' ? ' (You)' : ''}
                        </h3>

                        {/* Age Badge */}
                        {member.age && (
                          <div className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full mb-2 inline-block">
                            {member.age}y
                          </div>
                        )}

                        {/* Stats */}
                        <div className="space-y-1 text-xs min-h-10 flex flex-col justify-center">
                          {/* Schools count */}
                          {member.schools && member.schools.length > 0 && (
                            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <GraduationCap className="w-3 h-3" />
                              <span>{member.schools.length}</span>
                            </div>
                          )}

                          {/* Activities count */}
                          {member.activities && member.activities.length > 0 && (
                            <div className="flex items-center justify-center gap-1 text-orange-600 dark:text-orange-400">
                              <Zap className="w-3 h-3" />
                              <span>{member.activities.length}</span>
                            </div>
                          )}
                        </div>
                      </button>

                      {/* Edit button - now outside the main button */}
                      <button
                        onClick={() => startEditMember(member, index)}
                        className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors opacity-0 group-hover:opacity-100 z-10"
                        title="Edit member"
                      >
                        <Edit className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  );
                })}

                {/* Add Member Card */}
                {defaultTab === 'members' && (
                  <button
                    onClick={() => setShowAddMemberModal(true)}
                    className="relative min-h-44 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 text-center group flex flex-col items-center justify-center"
                  >
                    {/* Add Icon */}
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30">
                      <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>

                    {/* Text */}
                    <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Add Member
                    </h3>
                    {/* Stats placeholder for consistent spacing */}
                    <div className="space-y-1 text-xs min-h-10 flex flex-col justify-center">
                      <div className="text-transparent">•</div>
                    </div>
                  </button>
                )}
              </div>

              {/* Selected Member Details */}
              {selectedMemberIndex !== null && members[selectedMemberIndex] && (
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-3 md:p-6 w-full max-w-full min-w-0 overflow-hidden box-border">
                  {(() => {
                    const member = members[selectedMemberIndex];
                    const memberKey = `member-${selectedMemberIndex}`;

                    return (
                      <>
                        {/* Member Header */}
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                          <div className="flex items-center gap-3 md:gap-4">
                            {(() => {
                              const headerAvatarStyle = getMemberAvatarStyle(member.family_relationship || member.type || 'other', true);
                              const HeaderIcon = getMemberTypeIcon(member.family_relationship || member.type || 'other');
                              return (
                                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-lg border-2 ${headerAvatarStyle.containerClass}`}>
                                  <HeaderIcon className={`w-6 h-6 md:w-8 md:h-8 ${headerAvatarStyle.iconClass}`} />
                                </div>
                              );
                            })()}
                            <div>
                              <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                                {member.name || 'Unnamed Member'}
                              </h2>
                              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                                {formatMemberType(member.family_relationship)}
                              </p>
                            </div>
                          </div>

                          {/* Delete button for non-user members */}
                          {member.type !== 'user' && (
                            <button
                              onClick={() => startDeleteMember(member, selectedMemberIndex)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group"
                              title="Remove family member"
                            >
                              <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>

                        {/* Member Information Display */}
                        <div className="grid grid-cols-1 gap-3 md:gap-4 mb-4 md:mb-6 w-full max-w-full">
                          {/* Name */}
                          <div className="space-y-1 w-full min-w-0">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                              Name
                            </label>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[3rem] flex items-center w-full min-w-0 overflow-hidden">
                              <span className="text-gray-900 dark:text-white font-medium truncate w-full min-w-0">
                                {member.name || ''}
                              </span>
                            </div>
                          </div>

                          {/* Email */}
                          <div className="space-y-1 w-full min-w-0">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                              Email
                            </label>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[3rem] flex items-center w-full min-w-0 overflow-hidden">
                              <span className="text-gray-900 dark:text-white truncate w-full min-w-0">
                                {member.email || ''}
                              </span>
                            </div>
                          </div>

                          {/* Age */}
                          <div className="space-y-1 w-full min-w-0">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                              Age
                            </label>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[3rem] flex items-center w-full min-w-0 overflow-hidden">
                              <span className="text-gray-900 dark:text-white truncate w-full min-w-0">
                                {member.age ? `${member.age} years old` : ''}
                              </span>
                            </div>
                          </div>

                          {/* Birthday */}
                          <div className="space-y-1 w-full min-w-0">
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                              Birthday
                            </label>
                            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 min-h-[3rem] flex items-center w-full min-w-0 overflow-hidden">
                              <span className="text-gray-900 dark:text-white truncate w-full min-w-0">
                                {member.birthday_month && member.birthday_day
                                  ? `${['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][parseInt(member.birthday_month)]} ${member.birthday_day}`
                                  : ''
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Family members don't have source information since they're manually entered */}

                        {/* Activities Section */}
                        <div className="mb-6">
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
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startAddHobby(selectedMemberIndex);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 text-xs border border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20 rounded-md transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add
                                </button>
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
                                      <div key={activityIndex} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 relative shadow-md w-full max-w-full min-w-0 overflow-hidden">
                                        <div className="flex items-start justify-between w-full min-w-0">
                                          <div className="flex-1 min-w-0">
                                            {/* Header row with name and type */}
                                            <div className="flex items-center gap-2 mb-2">
                                              <h6 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                {activity.activity_name || 'Unnamed Activity'}
                                              </h6>
                                              {activity.activity_type && (() => {
                                                const style = getActivityTypeStyle(activity.activity_type);
                                                const IconComponent = style.icon;
                                                return (
                                                  <span className={`text-xs ${style.bg} ${style.text} px-2 py-1 rounded-full flex items-center gap-1`}>
                                                    <IconComponent className="w-3 h-3" />
                                                    {formatActivityType(activity.activity_type)}
                                                  </span>
                                                );
                                              })()}
                                            </div>

                                            {/* Compact details in a single row */}
                                            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-2 w-full min-w-0">
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
                                              onClick={() => startEditHobby(selectedMemberIndex, activity, activityIndex)}
                                              className="p-1.5 border border-gray-400 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700/50 rounded transition-colors"
                                              title="Edit activity"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => activity.id && handleDeleteHobby(activity.id)}
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
                        <div>
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
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startAddSchool(selectedMemberIndex);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 text-xs border border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  Add
                                </button>
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
                                      <div key={schoolIndex} className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 relative shadow-md w-full max-w-full min-w-0 overflow-hidden">
                                        {/* Header with title and action buttons */}
                                        <div className="flex items-center justify-between mb-2 w-full min-w-0">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <h6 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                              {school.school_name}
                                            </h6>
                                            {school.school_type && (() => {
                                              const style = getSchoolTypeStyle(school.school_type);
                                              const IconComponent = style.icon;
                                              return (
                                                <span className={`text-xs ${style.bg} ${style.text} px-2 py-1 rounded-full flex items-center gap-1`}>
                                                  <IconComponent className="w-3 h-3" />
                                                  {formatSchoolType(school.school_type)}
                                                </span>
                                              );
                                            })()}
                                          </div>
                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                              onClick={() => startEditSchool(selectedMemberIndex, school, schoolIndex)}
                                              className="p-1.5 border border-gray-400 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700/50 rounded transition-colors"
                                              title="Edit school"
                                            >
                                              <Edit className="w-3 h-3" />
                                            </button>
                                            <button
                                              onClick={() => school.id && handleDeleteSchool(school.id)}
                                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors group"
                                              title="Remove school"
                                            >
                                              <Trash2 className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                            </button>
                                          </div>
                                        </div>

                                        {/* Details in horizontal layout */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400 mb-2 w-full min-w-0">
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
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : defaultTab === 'activities' ? (
            /* Family Activities Content */
            <div className="space-y-6">
              {/* Activity Cards Grid */}
              <div className={`grid gap-4 overflow-visible w-full min-w-0 ${
                userData.family?.activities && Array.isArray(userData.family.activities) && userData.family.activities.length <= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                userData.family?.activities && Array.isArray(userData.family.activities) && userData.family.activities.length <= 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
                'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}>
                {userData.family?.activities && Array.isArray(userData.family.activities) && userData.family.activities.length > 0 ? (
                  userData.family.activities.map((activity: any, activityIndex: number) => {
                    const style = getActivityTypeStyle(activity.activity_type || 'other');
                    const IconComponent = style.icon;

                    return (
                      <div
                        key={activityIndex}
                        className="relative p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-center group"
                      >
                        {/* Activity Icon */}
                        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                          <IconComponent className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                        </div>

                        {/* Activity Name */}
                        <h3 className="font-semibold text-sm mb-1 truncate text-gray-900 dark:text-white">
                          {activity.activity_name || 'Unnamed Activity'}
                        </h3>

                        {/* Activity Type Badge and Frequency - Same Line */}
                        <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                          {activity.activity_type && (
                            <div className={`text-xs ${style.bg} ${style.text} px-2 py-1 rounded-full`}>
                              {formatActivityType(activity.activity_type)}
                            </div>
                          )}
                          {activity.frequency && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              {activity.frequency.charAt(0).toUpperCase() + activity.frequency.slice(1)}
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="space-y-1 text-xs">
                          {/* Days of Week */}
                          {activity.days && Array.isArray(activity.days) && activity.days.length > 0 && (
                            <div className="text-purple-600 dark:text-purple-400">
                              {activity.days.map((day: string) => day.slice(0, 3)).join(', ')}
                            </div>
                          )}

                          {/* End Date */}
                          {activity.end_date && (
                            <div className="text-red-600 dark:text-red-400">
                              Ends {new Date(activity.end_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                        </div>

                        {/* Edit button */}
                        <button
                          onClick={() => startEditFamilyHobby(activity, activityIndex)}
                          className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit activity"
                        >
                          <Edit className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => activity.id && handleDeleteFamilyHobby(activity.id)}
                          className="absolute top-2 right-8 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove activity"
                        >
                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    );
                  })
                ) : null}

                {/* Add Activity Card */}
                {defaultTab === 'activities' && (
                  <button
                    onClick={startAddFamilyHobby}
                    className="relative p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 text-center group"
                  >
                    {/* Add Icon */}
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-green-400 dark:group-hover:border-green-500 transition-colors">
                      <Plus className="w-8 h-8 text-gray-400 group-hover:text-green-500 transition-colors" />
                    </div>

                    {/* Text */}
                    <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      Add Activity
                    </h3>
                  </button>
                )}
              </div>

              {/* No Activities State */}
              {!userData.family?.activities || !Array.isArray(userData.family.activities) || userData.family.activities.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Target className="w-12 h-12 opacity-50 mx-auto mb-2" />
                  <p>No family activities added yet</p>
                  <p className="text-sm">Click "Add Activity" to get started</p>
                </div>
              ) : null}

            </div>
          ) : defaultTab === 'contacts' ? (
            /* Family Contacts Content */
            <div className="space-y-6">
              {/* Contact Cards Grid */}
              <div className={`grid gap-4 overflow-visible w-full min-w-0 ${
                userData.family?.contacts && Array.isArray(userData.family.contacts) && userData.family.contacts.length <= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                userData.family?.contacts && Array.isArray(userData.family.contacts) && userData.family.contacts.length <= 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
                'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
              }`}>
                {userData.family?.contacts && Array.isArray(userData.family.contacts) && userData.family.contacts.length > 0 ? (
                  userData.family.contacts.map((contact: any, contactIndex: number) => {
                    return (
                      <div
                        key={contactIndex}
                        className="relative p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-center group"
                      >
                        {/* Contact Icon */}
                        <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                          <UserPlus className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                        </div>

                        {/* Contact Name */}
                        <h3 className="font-semibold text-sm mb-1 truncate text-gray-900 dark:text-white">
                          {contact.name}
                        </h3>

                        {/* Contact Type and Details */}
                        <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                          {contact.contact_type && (
                            <div className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                              {contact.contact_type}
                            </div>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1 text-xs">
                          {/* Phone */}
                          {contact.phone && (
                            <div className="text-green-600 dark:text-green-400 truncate">
                              {contact.phone}
                            </div>
                          )}

                          {/* Email */}
                          {contact.email && (
                            <div className="text-purple-600 dark:text-purple-400 truncate">
                              {contact.email}
                            </div>
                          )}

                          {/* Notes */}
                          {contact.notes && (
                            <div className="text-gray-600 dark:text-gray-400 text-xs italic truncate mt-2">
                              {contact.notes}
                            </div>
                          )}
                        </div>

                        {/* Edit button */}
                        <button
                          onClick={() => startEditContact(contact, contactIndex)}
                          className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit contact"
                        >
                          <Edit className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => contact.id && handleDeleteContact(contact.id)}
                          className="absolute top-2 right-8 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove contact"
                        >
                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    );
                  })
                ) : null}

                {/* Add Contact Card */}
                {defaultTab === 'contacts' && (
                  <button
                    onClick={startAddContact}
                    className="relative p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 text-center group"
                  >
                    {/* Add Icon */}
                    <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors">
                      <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>

                    {/* Text */}
                    <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Add Contact
                    </h3>
                  </button>
                )}
              </div>

              {/* No Contacts State */}
              {!userData.family?.contacts || !Array.isArray(userData.family.contacts) || userData.family.contacts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <UserPlus className="w-12 h-12 opacity-50 mx-auto mb-2" />
                  <p>No family contacts added yet</p>
                  <p className="text-sm">Click "Add Contact" to get started</p>
                </div>
              ) : null}

            </div>
          ) : defaultTab === 'keywords' ? (
            /* Family Keywords Content */
            <div className="space-y-6">
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search keywords..."
                    value={keywordSearchTerm}
                    onChange={(e) => setKeywordSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={keywordSortBy}
                    onChange={(e) => setKeywordSortBy(e.target.value as 'name' | 'category' | 'recent')}
                    className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="category">Sort by Category</option>
                    <option value="recent">Sort by Recent</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Keywords Grid */}
              {(() => {
                // Filter and sort keywords
                let filteredAndSortedKeywords = userData.family?.keywords && Array.isArray(userData.family.keywords) ? [...userData.family.keywords] : [];

                // Filter by search term
                if (keywordSearchTerm) {
                  filteredAndSortedKeywords = filteredAndSortedKeywords.filter((keyword: any) =>
                    keyword.keyword?.toLowerCase().includes(keywordSearchTerm.toLowerCase()) ||
                    keyword.category?.toLowerCase().includes(keywordSearchTerm.toLowerCase())
                  );
                }

                // Sort keywords
                filteredAndSortedKeywords.sort((a: any, b: any) => {
                  switch (keywordSortBy) {
                    case 'name':
                      return (a.keyword || '').localeCompare(b.keyword || '');
                    case 'category':
                      return (a.category || '').localeCompare(b.category || '');
                    case 'recent':
                      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                    default:
                      return 0;
                  }
                });

                return (
                  <div className={`grid gap-4 overflow-visible w-full min-w-0 ${
                    (filteredAndSortedKeywords.length + 1) <= 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                    (filteredAndSortedKeywords.length + 1) <= 5 ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' :
                    'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  }`}>
                    {/* Add Keyword Tile - Always Present */}
                    <div
                      onClick={startAddKeyword}
                      className="relative p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 text-center cursor-pointer group"
                    >
                      {/* Add Icon */}
                      <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 border-dashed border-gray-300 dark:border-gray-600 group-hover:border-blue-400 bg-white dark:bg-gray-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-all duration-200">
                        <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500" />
                      </div>

                      {/* Add Text */}
                      <h3 className="font-semibold text-sm mb-2 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        Add Keyword
                      </h3>

                      {/* Helper Text */}
                      <div className="text-xs text-gray-500 dark:text-gray-500 group-hover:text-blue-500">
                        Track important topics
                      </div>
                    </div>

                    {filteredAndSortedKeywords.length > 0 ? (
                      filteredAndSortedKeywords.map((keyword: any, keywordIndex: number) => {
                    // Helper function to get category styling and icon
                    const getCategoryStyle = (category: string) => {
                      const styles = {
                        activity: {
                          bg: 'bg-green-100 dark:bg-green-900/30',
                          text: 'text-green-700 dark:text-green-300',
                          icon: Sparkles
                        },
                        school: {
                          bg: 'bg-blue-100 dark:bg-blue-900/30',
                          text: 'text-blue-700 dark:text-blue-300',
                          icon: School
                        },
                        email_domain: {
                          bg: 'bg-orange-100 dark:bg-orange-900/30',
                          text: 'text-orange-700 dark:text-orange-300',
                          icon: Mail
                        },
                        location: {
                          bg: 'bg-purple-100 dark:bg-purple-900/30',
                          text: 'text-purple-700 dark:text-purple-300',
                          icon: MapPin
                        },
                        other: {
                          bg: 'bg-gray-100 dark:bg-gray-700',
                          text: 'text-gray-600 dark:text-gray-400',
                          icon: Tag
                        }
                      };
                      return styles[category as keyof typeof styles] || styles.other;
                    };

                    const style = getCategoryStyle(keyword.category || 'other');
                    const IconComponent = style.icon;

                    return (
                      <div
                        key={keywordIndex}
                        className="relative p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 hover:shadow-md transition-all duration-200 text-center group"
                      >
                        {/* Keyword Icon */}
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 border-2 ${style.bg} border-gray-200 dark:border-gray-600`}>
                          <IconComponent className={`w-8 h-8 ${style.text}`} />
                        </div>

                        {/* Keyword */}
                        <h3 className="font-semibold text-sm mb-2 truncate text-gray-900 dark:text-white">
                          {keyword.keyword}
                        </h3>

                        {/* Category Badge */}
                        <div className="flex items-center justify-center mb-2">
                          <div className={`text-xs ${style.bg} ${style.text} px-3 py-1 rounded-full capitalize`}>
                            {keyword.category === 'email_domain' ? 'Email Domain' : keyword.category?.replace('_', ' ')}
                          </div>
                        </div>

                        {/* Edit button */}
                        <button
                          onClick={() => startEditKeyword(keyword, keywordIndex)}
                          className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="Edit keyword"
                        >
                          <Edit className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => keyword.id && handleDeleteKeyword(keyword.id)}
                          className="absolute top-2 right-8 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove keyword"
                        >
                          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    );
                  })
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400 col-span-full">
                        <Hash className="w-12 h-12 opacity-50 mx-auto mb-2" />
                        {(!userData.family?.keywords || !Array.isArray(userData.family.keywords) || userData.family.keywords.length === 0) ? (
                          <>
                            <p>No keywords added yet</p>
                            <p className="text-sm">Click "Add Keyword" to get started</p>
                          </>
                        ) : (
                          <>
                            <p>No keywords match your search</p>
                            <p className="text-sm">Try adjusting your search terms or filters</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          ) : null}
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

      {/* Contact Modal */}
      <AddContactModal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false);
          // Clear editing data immediately to prevent flash of wrong data
          setEditingContact(null);
          setEditingContactIndex(-1);
        }}
        onAdd={handleContactSubmit}
        editingContact={editingContact}
        isEditing={!!editingContact}
      />

      {/* Keyword Modal */}
      <AddKeywordModal
        isOpen={showKeywordModal}
        onClose={() => {
          setShowKeywordModal(false);
          // Clear editing data immediately to prevent flash of wrong data
          setEditingKeyword(null);
          setEditingKeywordIndex(-1);
        }}
        onAdd={handleKeywordSubmit}
        editingKeyword={editingKeyword}
        isEditing={!!editingKeyword}
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