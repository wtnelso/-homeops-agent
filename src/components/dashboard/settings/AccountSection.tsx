import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { DataUpdateService } from '../../../services/dataUpdate';
import { HOUSEHOLD_TYPES } from '../../../config/constants';
import TimezoneSelect from '../../ui/TimezoneSelect';

const AccountSection: React.FC = () => {
  const { userData, refreshUserData } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    account_name: userData?.account.account_name || '',
    household_type: userData?.account.household_type || '',
    timezone: userData?.account.timezone || '',
    is_active: userData?.user.is_active || false,
  });

  const handleSave = async () => {
    if (!userData) return;
    
    setSaving(true);
    try {
      const result = await DataUpdateService.updateUserAndAccount(
        { is_active: formData.is_active },
        {
          account_name: formData.account_name,
          household_type: formData.household_type,
          timezone: formData.timezone
        }
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Settings</h3>
        <div className="space-y-6">
          {/* Account Active Toggle - Top row */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Account Active
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

          {/* Account Name and House Type - Same row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Name
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                House Type
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
          </div>

          {/* Timezone - Left side of next row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone
              </label>
              <TimezoneSelect
                value={formData.timezone}
                onChange={(value) => handleFieldChange('timezone', value)}
                placeholder="Select Timezone"
              />
            </div>
            <div></div> {/* Empty div to maintain grid structure */}
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

export default AccountSection;