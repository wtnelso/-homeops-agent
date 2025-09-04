import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Mail, 
  Users, 
  ShoppingCart, 
  AlertCircle, 
  Briefcase, 
  VolumeX, 
  Inbox,
  Microscope,
  BarChart4
} from 'lucide-react';

interface EmailStats {
  tasks: number;
  events: number;
  urgent: number;
  hidden: number;
}

interface EmailCard {
  id: string;
  subject: string;
  snippet: string;
  category: 'family' | 'commerce' | 'priority' | 'work' | 'noise';
  insight: string;
  sender: string;
  timestamp: string;
}

const EmailIntelligence: React.FC = () => {
  const [stats, setStats] = useState<EmailStats>({
    tasks: 0,
    events: 0,
    urgent: 0,
    hidden: 0
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [emails, setEmails] = useState<EmailCard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const categories = [
    { key: 'all', label: 'All', icon: Inbox },
    { key: 'family', label: 'Family', icon: Users },
    { key: 'commerce', label: 'Commerce', icon: ShoppingCart },
    { key: 'priority', label: 'Priority', icon: AlertCircle },
    { key: 'work', label: 'Work', icon: Briefcase },
    { key: 'noise', label: 'Noise', icon: VolumeX },
  ];

  const connectGmail = async () => {
    setIsProcessing(true);
    // Simulate connection process
    setTimeout(() => {
      setIsConnected(true);
      setIsProcessing(false);
    }, 2000);
  };

  const loadEmailCards = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/decoder-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (data.success && data.cards) {
        setEmails(data.cards);
        // Update stats based on loaded emails
        setStats({
          tasks: data.cards.filter((card: EmailCard) => card.insight.includes('task')).length,
          events: data.cards.filter((card: EmailCard) => card.insight.includes('event')).length,
          urgent: data.cards.filter((card: EmailCard) => card.category === 'priority').length,
          hidden: data.cards.filter((card: EmailCard) => card.category === 'noise').length
        });
      }
    } catch (error) {
      console.error('Failed to load email cards:', error);
    }
    setIsProcessing(false);
  };

  const testSampleEmail = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/analyze-sample-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'school' })
      });
      const data = await response.json();
      if (data.success) {
        // Add sample email to the list
        const sampleEmail: EmailCard = {
          id: 'sample-1',
          subject: 'School Winter Concert - Permission Slip Due',
          snippet: 'Dear Parents, The winter concert is scheduled for...',
          category: 'family',
          insight: 'Permission slip required by Friday, concert on Dec 15th',
          sender: 'Lincoln Elementary',
          timestamp: new Date().toISOString()
        };
        setEmails([sampleEmail]);
        setStats(prev => ({ ...prev, tasks: 1, events: 1 }));
      }
    } catch (error) {
      console.error('Failed to analyze sample email:', error);
    }
    setIsProcessing(false);
  };

  const filteredEmails = activeCategory === 'all' 
    ? emails 
    : emails.filter(email => email.category === activeCategory);

  return (
    <div className="email-intelligence">
      {/* Intelligence Status Dashboard */}
      <div className="status-card">
        <div className="status-header">
          <div className="status-title">
            <Brain className="status-icon" />
            <span>Intelligence Status</span>
          </div>
          <div className={`connection-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
        </div>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Tasks</div>
            <div className="stat-value">{stats.tasks}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Events</div>
            <div className="stat-value">{stats.events}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Urgent</div>
            <div className="stat-value">{stats.urgent}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Hidden</div>
            <div className="stat-value">{stats.hidden}</div>
          </div>
        </div>
      </div>

      {/* Connection & Actions */}
      <div className="actions-section">
        <button 
          className="connect-button" 
          onClick={connectGmail}
          disabled={isProcessing}
        >
          <Mail size={24} />
          <span>Connect Gmail & Start Intelligence</span>
        </button>
        
        <div className="action-buttons">
          <button 
            className="action-button primary"
            onClick={loadEmailCards}
            disabled={isProcessing}
          >
            <Brain size={18} />
            <span>Load Email Cards</span>
          </button>
          
          <button 
            className="action-button secondary"
            onClick={testSampleEmail}
            disabled={isProcessing}
          >
            <Microscope size={18} />
            <span>Demo: School Email</span>
          </button>
        </div>
      </div>

      {/* Email Categories */}
      <div className="categories-section">
        <div className="section-title">
          <BarChart4 size={20} />
          <span>Email Categories</span>
        </div>
        
        <div className="category-tabs">
          {categories.map((category) => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.key}
                className={`category-tab ${activeCategory === category.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.key)}
              >
                <IconComponent size={16} />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Email Results */}
      <div className="email-results">
        {isProcessing ? (
          <div className="processing-status">
            <div className="typing-dots">
              <div></div>
              <div></div>
              <div></div>
            </div>
            <div>Processing emails...</div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="no-emails-placeholder">
            <Mail size={48} />
            <div className="placeholder-title">No Emails Decoded Yet</div>
            <div className="placeholder-subtitle">
              Connect Gmail or try the demo to see how I decode and categorize your emails with intelligent analysis.
            </div>
          </div>
        ) : (
          <div className="email-cards">
            {filteredEmails.map((email) => (
              <div key={email.id} className="email-card">
                <div className="email-header">
                  <div className="email-subject">{email.subject}</div>
                  <div className="email-sender">{email.sender}</div>
                </div>
                <div className="email-snippet">{email.snippet}</div>
                <div className="email-insight">
                  <Brain size={14} />
                  <span>{email.insight}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailIntelligence;