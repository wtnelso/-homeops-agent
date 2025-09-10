import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, auth } from '../lib/supabase'
import { UserSessionService, UserSessionData } from '../services/userSession'

interface AuthContextType {
  user: User | null
  session: Session | null
  userData: UserSessionData | null
  userDataLoading: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
  signInWithGoogle: () => Promise<any>
  signOut: () => Promise<any>
  refreshUserData: () => Promise<void>
  isOnboardingRequired: () => boolean
  isEmailVerified: () => boolean
  getActiveIntegrations: () => any[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userData, setUserData] = useState<UserSessionData | null>(null)
  const [userDataLoading, setUserDataLoading] = useState(false)
  const [loading, setLoading] = useState(true)


  // Function to fetch user session data
  const fetchUserData = async (): Promise<void> => {
    setUserDataLoading(true)
    try {
      const data = await UserSessionService.getUserSessionData()
      
      if ('error' in data) {
        console.error('Error fetching user data:', data.error)
        setUserData(null)
      } else {
        console.log('Fetched user data:', data) // Debug log
        setUserData(data)
      }
    } catch (error) {
      console.error('Unexpected error fetching user data:', error)
      setUserData(null)
    } finally {
      setUserDataLoading(false)
    }
  }

  // Helper function to refresh user data
  const refreshUserData = async (): Promise<void> => {
    if (user) {
      await fetchUserData()
    }
  }

  // Helper functions for common checks
  const isOnboardingRequired = (): boolean => {
    return userData ? UserSessionService.isOnboardingRequired(userData) : false
  }

  const isEmailVerified = (): boolean => {
    return userData ? UserSessionService.isEmailVerified(userData) : false
  }

  const getActiveIntegrations = () => {
    return userData ? UserSessionService.getActiveIntegrations(userData) : []
  }

  useEffect(() => {
    // Check if Supabase is configured
    if (!supabase) {
      console.warn('Supabase not configured.')
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Always set loading to false first to allow app to render
      setLoading(false)
      
      // Fetch user data if we have an existing session
      if (session?.user) {
        fetchUserData()
      }
    }).catch((error) => {
      console.error('Error getting session:', error)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Always set loading to false first
      setLoading(false)
      
      // Handle user data based on auth events
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔐 SIGNED_IN event triggered for user:', session.user.id, session.user.email)
        UserSessionService.updateLastLogin()
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing user data')
        setUserData(null)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('Token refreshed, updating user data')
        fetchUserData()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    session,
    userData,
    userDataLoading,
    loading,
    signIn: auth.signIn,
    signUp: auth.signUp,
    signInWithGoogle: auth.signInWithGoogle,
    signOut: auth.signOut,
    refreshUserData,
    isOnboardingRequired,
    isEmailVerified,
    getActiveIntegrations,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}