import React, { useState } from 'react';
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
  BarChart4,
  Calendar,
  MessageCircle
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

interface EmailIntelligenceProps {
  onNavigate?: (view: string) => void;
}

const EmailIntelligence: React.FC<EmailIntelligenceProps> = ({ onNavigate }) => {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 text-white">
      {/* Header */}
      <div className="bg-purple-600 bg-opacity-50 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">HomeOps</h1>
          <div className="text-sm bg-green-500 bg-opacity-20 px-3 py-1 rounded-full border border-green-400">
            Works!
          </div>
        </div>
      </div>

      {/* Intelligence Status Dashboard */}
      <div className="p-6">
        <div className="bg-purple-600 bg-opacity-40 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Brain className="text-yellow-400" size={24} />
              <span className="text-lg font-semibold">Intelligence Status</span>
            </div>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xs uppercase text-purple-200 mb-1">TASKS</div>
              <div className="text-2xl font-bold">{stats.tasks}</div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase text-purple-200 mb-1">EVENTS</div>
              <div className="text-2xl font-bold">{stats.events}</div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase text-purple-200 mb-1">URGENT</div>
              <div className="text-2xl font-bold">{stats.urgent}</div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase text-purple-200 mb-1">HIDDEN</div>
              <div className="text-2xl font-bold">{stats.hidden}</div>
            </div>
          </div>
        </div>

        {/* Connection & Actions */}
        <div className="mb-6">
          <button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg flex items-center justify-center gap-3 mb-4 transition-colors"
            onClick={connectGmail}
            disabled={isProcessing}
          >
            <Mail size={20} />
            <span>Connect Gmail & Start Intelligence</span>
          </button>
          
          <div className="flex gap-4">
            <button 
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              onClick={loadEmailCards}
              disabled={isProcessing}
            >
              <Brain size={18} />
              <span>Load Email Cards</span>
            </button>
            
            <button 
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              onClick={testSampleEmail}
              disabled={isProcessing}
            >
              <Microscope size={18} />
              <span>Demo: School Email</span>
            </button>
          </div>
        </div>

        {/* Email Categories */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart4 size={20} className="text-purple-200" />
            <span className="font-semibold">Email Categories</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.key}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    activeCategory === category.key 
                      ? 'bg-white text-purple-700 border-white' 
                      : 'bg-purple-600 bg-opacity-40 text-white border-purple-400 hover:bg-purple-500 hover:bg-opacity-60'
                  }`}
                  onClick={() => setActiveCategory(category.key)}
                >
                  <IconComponent size={16} />
                  <span className="text-sm font-medium">{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Email Results */}
        <div>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex space-x-1 mb-4">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
              <div className="text-purple-200">Processing emails...</div>
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Mail size={64} className="text-purple-300 mb-6" />
              <div className="text-xl font-semibold mb-2">No Emails Decoded Yet</div>
              <div className="text-purple-200 max-w-md">
                Connect Gmail or try the demo to see how I decode and categorize your emails with intelligent analysis.
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEmails.map((email) => (
                <div key={email.id} className="bg-purple-600 bg-opacity-40 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold">{email.subject}</div>
                    <div className="text-sm text-purple-200">{email.sender}</div>
                  </div>
                  <div className="text-purple-100 text-sm mb-3">{email.snippet}</div>
                  <div className="flex items-center gap-2 text-sm text-purple-200">
                    <Brain size={14} />
                    <span>{email.insight}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-purple-800 bg-opacity-90 p-4">
        <div className="flex justify-center">
          <div className="flex gap-8">
            <button 
              className="flex flex-col items-center gap-1"
              onClick={() => onNavigate?.('chat')}
            >
              <MessageCircle size={24} />
              <span className="text-xs">Chat</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-yellow-400">
              <Mail size={24} />
              <span className="text-xs">Email</span>
            </button>
            <button 
              className="flex flex-col items-center gap-1"
              onClick={() => onNavigate?.('family')}
            >
              <Calendar size={24} />
              <span className="text-xs">Calendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailIntelligence;