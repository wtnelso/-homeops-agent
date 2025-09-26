import React from 'react'
import { Play, RotateCcw } from 'lucide-react'

interface StagingBannerProps {
  isDemoMode?: boolean;
  onResetDemo?: () => void;
}

const StagingBanner: React.FC<StagingBannerProps> = ({ isDemoMode = false, onResetDemo }) => {

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
        padding: '6px 12px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
    >
      <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>STAGING ENVIRONMENT</span>

        {isDemoMode && (
          <>
            <span style={{ margin: '0 8px', opacity: 0.7 }}>•</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Play style={{ width: '12px', height: '12px' }} />
              <span>DEMO MODE</span>

              {onResetDemo && (
                <>
                  <span style={{ margin: '0 6px', opacity: 0.7 }}>|</span>
                  <button
                    onClick={onResetDemo}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      fontSize: '10px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  >
                    <RotateCcw style={{ width: '10px', height: '10px' }} />
                    Reset Demo
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default StagingBanner