import React, { createContext, useContext, useEffect, useState } from 'react'

interface StagingGateContextType {
  isStagingUnlocked: boolean
  unlockStaging: (password: string) => boolean
  isStaging: boolean
}

const StagingGateContext = createContext<StagingGateContextType | undefined>(undefined)

export const useStagingGate = () => {
  const context = useContext(StagingGateContext)
  if (context === undefined) {
    throw new Error('useStagingGate must be used within a StagingGateProvider')
  }
  return context
}

export const StagingGateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStagingUnlocked, setIsStagingUnlocked] = useState(false)
  
  const isStaging = import.meta.env.VITE_APP_ENV === 'STAGING'
  const stagingPassword = 'homeops-staging-2024' // Simple password for staging access
  
  useEffect(() => {
    // Check if staging was previously unlocked
    const unlocked = localStorage.getItem('staging-unlocked')
    if (unlocked === 'true') {
      setIsStagingUnlocked(true)
    }
  }, [])

  const unlockStaging = (password: string): boolean => {
    if (password === stagingPassword) {
      setIsStagingUnlocked(true)
      localStorage.setItem('staging-unlocked', 'true')
      return true
    }
    return false
  }

  const value = {
    isStagingUnlocked,
    unlockStaging,
    isStaging,
  }

  return (
    <StagingGateContext.Provider value={value}>
      {children}
    </StagingGateContext.Provider>
  )
}