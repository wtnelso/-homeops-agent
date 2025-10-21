import React, { useState } from 'react';
import { Home, CheckCircle, Tag, Building, Globe, Bot } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { DataUpdateService } from '../../../services/dataUpdate';
import { HOUSEHOLD_TYPES } from '../../../config/constants';
import TimezoneSelect from '../../ui/TimezoneSelect';
import { useUserDataForm, getAccountFormData, defaultAccountFormData } from '../../../hooks/useUserDataForm';
import EmailProcessingStatusCard from './EmailProcessingStatusCard';

const AccountSection: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useUserDataForm(
    userData,
    getAccountFormData,
    defaultAccountFormData
  );

  const handleSave = async () => {
    if (!userData) return;

    setSaving(true);
    try {
      const result = await DataUpdateService.updateUserAndAccount(
        { is_active: formData.is_active },
        {
          account_name: formData.account_name,
          agent_name: formData.agent_name,
          household_type: formData.household_type,
          timezone: formData.timezone
        },
        userData.user.id,
        userData.user.family_id
      );

      if (result.success) {
        // Refresh user data to get updated values
        await refreshUserData();
        console.log('Account updated successfully');
      } else {
        console.error('Failed to update account:', result.error);
        // Error handling and redirects are handled in DataUpdateService
      }
    } catch (error) {
      console.error('Unexpected error updating account:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!userData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500 dark:text-gray-400">Loading account data...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
          <Home className="w-5 h-5" />
          <span>Account Settings</span>
        </h3>

        <div className="space-y-6">
          {/* Account Active Toggle - Top row */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Account Active</span>
            </label>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleFieldChange('is_active', !formData.is_active)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  ${formData.is_active ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                    transition duration-200 ease-in-out
                    ${formData.is_active ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {formData.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Controls whether this account has access to HomeOps features
            </p>
          </div>

          {/* Account Name and Agent Name - Same row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Account Name</span>
              </label>
              <input
                type="text"
                value={formData.account_name}
                onChange={(e) => handleFieldChange('account_name', e.target.value)}
                placeholder="Enter a name for your account"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Display name for your HomeOps account
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                <Bot className="w-4 h-4" />
                <span>Agent Name</span>
              </label>
              <input
                type="text"
                value={formData.agent_name}
                onChange={(e) => handleFieldChange('agent_name', e.target.value)}
                placeholder="Enter a name for your AI agent"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                What you'd like to call your AI assistant
              </p>
            </div>
          </div>

          {/* House Type and Timezone - Next row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>House Type</span>
              </label>
              <select
                value={formData.household_type}
                onChange={(e) => handleFieldChange('household_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select house type</option>
                {HOUSEHOLD_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Timezone</span>
              </label>
              <TimezoneSelect
                value={formData.timezone}
                onChange={(value) => handleFieldChange('timezone', value)}
                placeholder="Select Timezone"
              />
            </div>
          </div>

          {/* Email Processing Status */}
          <EmailProcessingStatusCard />

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                saving
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSection;