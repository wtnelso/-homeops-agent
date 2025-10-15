import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { apiService } from '../services/authenticatedApiService';
import { ENDPOINTS } from '../config/apiConfig';

interface PasswordResetSession {
  isPasswordResetSession: boolean;
  sessionType: 'normal' | 'password_reset' | 'loading';
  timeRemaining?: number;
}

export const usePasswordResetSession = (): PasswordResetSession => {
  const [sessionState, setSessionState] = useState<PasswordResetSession>({
    isPasswordResetSession: false,
    sessionType: 'loading'
  });
  const location = useLocation();

  useEffect(() => {
    const checkSessionType = async () => {
      try {
        // First, check if this is a new password reset flow from URL
        const urlParams = new URLSearchParams(location.search);
        const isPasswordResetFlow = urlParams.get('type') === 'recovery';
        const accessToken = urlParams.get('access_token');

        if (isPasswordResetFlow && accessToken) {
          // Create new password reset session on server
          const createResponse = await apiService.post(ENDPOINTS.passwordResetSession.create, {
            access_token: accessToken,
            type: 'recovery'
          });

          if (createResponse.error) {
            console.error('Failed to create password reset session:', createResponse.error);
          }
        }

        // Always validate current session with server
        const validateResponse = await apiService.get(ENDPOINTS.passwordResetSession.validate);

        if (validateResponse.data) {
          setSessionState({
            isPasswordResetSession: validateResponse.data.isPasswordResetSession,
            sessionType: validateResponse.data.sessionType,
            timeRemaining: validateResponse.data.timeRemaining
          });
        } else {
          setSessionState({
            isPasswordResetSession: false,
            sessionType: 'normal'
          });
        }

      } catch (error) {
        console.error('Error checking password reset session:', error);
        setSessionState({
          isPasswordResetSession: false,
          sessionType: 'normal'
        });
      }
    };

    checkSessionType();
  }, [location]);

  return sessionState;
};

// Helper function to clear password reset session after successful reset
export const clearPasswordResetSession = async (): Promise<void> => {
  try {
    const response = await apiService.post(ENDPOINTS.passwordResetSession.clear);
    if (response.error) {
      console.error('Error clearing password reset session:', response.error);
    }
  } catch (error) {
    console.error('Error clearing password reset session:', error);
  }
};

export default usePasswordResetSession;