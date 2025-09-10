import React from 'react'

const StagingBanner: React.FC = () => {

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
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div>
        STAGING ENVIRONMENT
      </div>
    </div>
  )
}

export default StagingBanner