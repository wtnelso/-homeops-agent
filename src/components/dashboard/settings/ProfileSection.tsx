import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { DataUpdateService } from '../../../services/dataUpdate';
import { AvatarUploadService } from '../../../services/avatarUpload';
import AvatarUpload from '../../ui/AvatarUpload';

const ProfileSection: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name_user_provided: userData?.user.name || '',
    avatar_url: userData?.user.avatar_url || '',
    avatar_user_provided: userData?.user.avatar_user_provided || null,
  });

  const handleSave = async () => {
    if (!userData) return;
    
    setSaving(true);
    try {
      const result = await DataUpdateService.updateUserProfile({
        name_user_provided: formData.name_user_provided,
        avatar_url: formData.avatar_url,
        avatar_user_provided: formData.avatar_user_provided
      });
      
      if (result.success) {
        // Refresh user data to get updated values
        await refreshUserData();
        console.log('Profile updated successfully');
      } else {
        console.error('Failed to update profile:', result.error);
        // Error handling and redirects are handled in DataUpdateService
      }
    } catch (error) {
      console.error('Unexpected error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarUpload = async (file: File) => {
    if (!userData) return;
    
    setUploading(true);
    try {
      // Resize image before upload
      const resizedFile = await AvatarUploadService.resizeImage(file, 60, 60);
      
      // Upload to Supabase storage
      const uploadResult = await AvatarUploadService.uploadAvatar(resizedFile, userData.user.id);
      
      if (uploadResult.success && uploadResult.url) {
        setFormData(prev => ({
          ...prev,
          avatar_user_provided: uploadResult.url || null
        }));
        
        // Auto-save the new avatar
        const result = await DataUpdateService.updateUserProfile({
          avatar_user_provided: uploadResult.url || null
        });
        
        if (result.success) {
          await refreshUserData();
          showToast('Avatar updated successfully!', 'success');
        } else {
          showToast('Failed to save avatar. Please try again.', 'error');
        }
      } else {
        showToast(uploadResult.error || 'Avatar upload failed. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Unexpected avatar upload error:', error);
      showToast('An unexpected error occurred. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarDelete = async () => {
    if (!userData || !formData.avatar_user_provided) return;
    
    try {
      // Delete from storage
      await AvatarUploadService.deleteAvatar(formData.avatar_user_provided);
      
      // Update database
      setFormData(prev => ({
        ...prev,
        avatar_user_provided: null
      }));
      
      const result = await DataUpdateService.updateUserProfile({
        avatar_user_provided: null
      });
      
      if (result.success) {
        await refreshUserData();
        showToast('Avatar removed successfully!', 'success');
      } else {
        showToast('Failed to remove avatar. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Avatar delete error:', error);
      showToast('An unexpected error occurred while removing avatar.', 'error');
    }
  };

  if (!userData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 dark:text-gray-400">Loading profile data...</p>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h3>
        <div className="space-y-6">
          
          {/* Name (editable) with Avatar */}
          <div className="grid grid-cols-2 gap-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name_user_provided}
                onChange={(e) => handleFieldChange('name_user_provided', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-center">
              <AvatarUpload
                currentAvatar={formData.avatar_url}
                userProvidedAvatar={formData.avatar_user_provided}
                onUpload={handleAvatarUpload}
                onDelete={handleAvatarDelete}
                uploading={uploading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Last Login (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Last Login
              </label>
              <input
                type="text"
                value={formatDate(userData.user.last_login_at)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>

            {/* Created At (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Created
              </label>
              <input
                type="text"
                value={formatDate(userData.user.created_at)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed"
              />
            </div>
          </div>

        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;