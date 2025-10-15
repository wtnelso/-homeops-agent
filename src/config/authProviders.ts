// Authentication provider configuration
export interface AuthProvider {
  id: string
  name: string
  displayName: string
  errorMessages: {
    signInConflict: string
    signUpConflict: string
    resetPasswordConflict: string
  }
  detectionPatterns: string[]
}

export const AUTH_PROVIDERS: Record<string, AuthProvider> = {
  google: {
    id: 'google',
    name: 'Google',
    displayName: 'Google',
    errorMessages: {
      signInConflict: 'This email is registered with Google. Please sign in with Google instead.',
      signUpConflict: 'This email is already registered with Google. Please sign in with Google instead.',
      resetPasswordConflict: 'This email is registered with Google. Please sign in with Google instead of resetting your password.'
    },
    detectionPatterns: [
      'email address is already registered',
      'signup is disabled',
      'continue with',
      'Google',
      'oauth',
      'social',
      'linked to google',
      'registered with google',
      'sign up using oauth',
      'user already registered'
    ]
  },

  azure: {
    id: 'azure',
    name: 'azure',
    displayName: 'Microsoft',
    errorMessages: {
      signInConflict: 'This email is registered with Microsoft. Please sign in with Microsoft instead.',
      signUpConflict: 'This email is already registered with Microsoft. Please sign in with Microsoft instead.',
      resetPasswordConflict: 'This email is registered with Microsoft. Please sign in with Microsoft instead of resetting your password.'
    },
    detectionPatterns: [
      'Microsoft',
      'Azure',
      'azure',
      'continue with Microsoft'
    ]
  },

  email: {
    id: 'email',
    name: 'email',
    displayName: 'Email/Password',
    errorMessages: {
      signInConflict: '',
      signUpConflict: '',
      resetPasswordConflict: ''
    },
    detectionPatterns: [
      'Invalid login credentials',
      'Email not confirmed',
      'User not found'
    ]
  }
}

// Helper function to detect provider from error message
export const detectProviderFromError = (errorMessage: string): string | null => {
  for (const [providerId, provider] of Object.entries(AUTH_PROVIDERS)) {
    const hasPattern = provider.detectionPatterns.some(pattern =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    )

    if (hasPattern && providerId !== 'email') {
      return providerId
    }
  }

  // Check for email patterns last (default case)
  const emailProvider = AUTH_PROVIDERS.email
  const hasEmailPattern = emailProvider.detectionPatterns.some(pattern =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  )

  return hasEmailPattern ? 'email' : null
}

// Helper to get provider error message
export const getProviderErrorMessage = (
  providerId: string,
  action: 'signIn' | 'signUp' | 'resetPassword'
): string => {
  const provider = AUTH_PROVIDERS[providerId]
  if (!provider) return ''

  const actionKey = `${action}Conflict` as keyof typeof provider.errorMessages
  return provider.errorMessages[actionKey]
}

// Configuration for enabled providers
export const ENABLED_PROVIDERS = {
  google: true,
  azure: false,  // Set to true when implementing Azure
  email: true
}

// Get list of enabled OAuth providers
export const getEnabledOAuthProviders = (): AuthProvider[] => {
  return Object.entries(ENABLED_PROVIDERS)
    .filter(([providerId, enabled]) => enabled && providerId !== 'email')
    .map(([providerId]) => AUTH_PROVIDERS[providerId])
}

// Check if provider is enabled
export const isProviderEnabled = (providerId: string): boolean => {
  return ENABLED_PROVIDERS[providerId as keyof typeof ENABLED_PROVIDERS] || false
}