import { useState } from 'react'
import { Mail, Calendar, MessageCircle, ShoppingBag } from 'lucide-react'
import EmailIntelligence from './components/EmailIntelligence'
import FamilyHub from './components/FamilyHub'
import './App.css'

function App() {
  const [activeView, setActiveView] = useState<'chat' | 'email' | 'family' | 'commerce'>('email')

  const navigationItems = [
    { key: 'chat' as const, label: 'Chat', icon: MessageCircle },
    { key: 'email' as const, label: 'Email', icon: Mail },
    { key: 'family' as const, label: 'Family', icon: Calendar },
    { key: 'commerce' as const, label: 'Commerce', icon: ShoppingBag },
  ]

  const renderContent = () => {
    switch (activeView) {
      case 'email':
        return <EmailIntelligence />
      case 'family':
        return <FamilyHub />
      case 'chat':
        return (
          <div className="chat-placeholder">
            <MessageCircle size={48} style={{ color: '#a78bfa', marginBottom: '16px' }} />
            <div style={{ fontWeight: '600', marginBottom: '8px', color: 'white' }}>AI Chat Coming Soon</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
              HomeOps AI chat for family operations assistance will be available in the next update.
            </div>
          </div>
        )
      case 'commerce':
        return (
          <div className="commerce-placeholder">
            <ShoppingBag size={48} style={{ color: '#10b981', marginBottom: '16px' }} />
            <div style={{ fontWeight: '600', marginBottom: '8px', color: 'white' }}>Commerce Intelligence</div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
              Deal analysis and shopping insights functionality will be migrated in upcoming releases.
            </div>
          </div>
        )
      default:
        return <EmailIntelligence />
    }
  }

  return (
    <div className="mobile-app">
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="logo">HomeOps</div>
        <div className="header-status">
          <div className="status-dot"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mobile-content">
        <div className="view-container">
          {renderContent()}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        {navigationItems.map((item) => {
          const IconComponent = item.icon
          return (
            <button
              key={item.key}
              className={`nav-item ${activeView === item.key ? 'active' : ''}`}
              onClick={() => setActiveView(item.key)}
            >
              <IconComponent size={20} />
              <span className="nav-label">{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default App