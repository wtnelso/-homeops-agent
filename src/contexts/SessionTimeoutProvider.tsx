import React, { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { SessionTimeoutManager } from '../lib/sessionTimeout'

interface SessionTimeoutProviderProps {
  children: React.ReactNode
}

export const SessionTimeoutProvider: React.FC<SessionTimeoutProviderProps> = ({ children }) => {
  const { user, signOut } = useAuth()
  const [sessionTimeoutManager, setSessionTimeoutManager] = useState<SessionTimeoutManager | null>(null)

  useEffect(() => {
    if (user) {
      // User is logged in, start session timeout

      const timeoutManager = new SessionTimeoutManager({
        onTimeout: () => {
          signOut()
        },
        onWarning: () => {
          // You could show a toast notification here if needed
        },
        onActivity: () => {
          // User is active, reset warning state if needed
        },
        onExtend: () => {
          console.log('🔄 Session extended by user')
        }
      })

      setSessionTimeoutManager(timeoutManager)

      return () => {
        // Cleanup when user changes or component unmounts
        timeoutManager.destroy()
      }
    } else {
      // User is not logged in, clean up any existing timeout manager
      if (sessionTimeoutManager) {
        console.log('🛑 Stopping session timeout manager (user signed out)')
        sessionTimeoutManager.destroy()
        setSessionTimeoutManager(null)
      }
    }
  }, [user, signOut])

  return <>{children}</>
}