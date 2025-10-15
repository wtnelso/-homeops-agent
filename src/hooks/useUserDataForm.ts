import { useState, useEffect } from 'react';
import { UserSessionData } from '../services/userSession';

// Generic hook for forms that depend on userData
export function useUserDataForm<T>(
  userData: UserSessionData | null,
  getInitialData: (userData: UserSessionData) => T,
  defaultValues: T
) {
  const [formData, setFormData] = useState<T>(defaultValues);

  useEffect(() => {
    if (userData) {
      setFormData(getInitialData(userData));
    }
  }, [userData, getInitialData]);

  return [formData, setFormData] as const;
}

// Specific form data extractors
export const getAccountFormData = (userData: UserSessionData) => ({
  account_name: userData.user.account_name || '',
  agent_name: userData.user.agent_name || '',
  household_type: userData.family?.family_type || '',
  timezone: userData.user.timezone || '',
  is_active: userData.user.is_active || false,
});

export const getProfileFormData = (userData: UserSessionData) => ({
  name_user_provided: userData.user.name || '',
  avatar_url: userData.user.avatar_url || '',
  avatar_user_provided: userData.user.avatar_user_provided || null,
});

// Default values
export const defaultAccountFormData = {
  account_name: '',
  agent_name: '',
  household_type: '',
  timezone: '',
  is_active: false,
};

export const defaultProfileFormData = {
  name_user_provided: '',
  avatar_url: '',
  avatar_user_provided: null,
};