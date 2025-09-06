import React from 'react'
import { ROUTES } from '../config/routes'

interface StagingBannerProps {
  onLogout?: () => void
}

const StagingBanner: React.FC<StagingBannerProps> = ({ onLogout }) => {
  const handleLogout = () => {
    // Clear staging unlock status
    localStorage.removeItem('staging-unlocked')
    
    // Call external logout handler if provided
    if (onLogout) {
      onLogout()
    } else {
      // Default: redirect to login page
      window.location.href = ROUTES.LOGIN
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#ff9999',
        color: 'white',
        zIndex: 9999,
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ flex: 1, textAlign: 'center' }}>
        STAGING ENVIRONMENT
      </div>
      <button
        onClick={handleLogout}
        style={{
          backgroundColor: 'rgba(255,255,255,0.2)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          cursor: 'pointer',
          fontWeight: 'normal',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'
        }}
      >
        Logout
      </button>
    </div>
  )
}

export default StagingBanner