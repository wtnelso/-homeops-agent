import React from 'react';
import { User, MessageSquare, Heart, Zap, Home, GraduationCap, CreditCard, ShoppingCart } from 'lucide-react';
import { OnboardingData } from '../Onboarding';

interface AgentPersonaStepProps {
  data: OnboardingData;
  onUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
}

const AgentPersonaStep: React.FC<AgentPersonaStepProps> = ({ data, onUpdate, onNext }) => {
  const updateStyle = (key: keyof OnboardingData['agentProfile']['style'], value: number) => {
    onUpdate({
      agentProfile: {
        ...data.agentProfile,
        style: {
          ...data.agentProfile.style,
          [key]: value
        }
      }
    });
  };

  const toggleDomain = (domain: string) => {
    const domains = data.agentProfile.domains.includes(domain)
      ? data.agentProfile.domains.filter(d => d !== domain)
      : [...data.agentProfile.domains, domain];
      
    onUpdate({
      agentProfile: {
        ...data.agentProfile,
        domains
      }
    });
  };

  const styleSliders = [
    {
      key: 'directness' as const,
      label: 'Communication Style',
      leftLabel: 'Collaborative',
      rightLabel: 'Direct',
      icon: MessageSquare,
      description: 'How should HomeOps communicate suggestions?'
    },
    {
      key: 'concision' as const,
      label: 'Response Length',
      leftLabel: 'Detailed',
      rightLabel: 'Concise', 
      icon: Zap,
      description: 'How much detail should responses include?'
    },
    {
      key: 'empathy' as const,
      label: 'Emotional Tone',
      leftLabel: 'Practical',
      rightLabel: 'Empathetic',
      icon: Heart,
      description: 'How emotionally aware should responses be?'
    }
  ];

  const domainOptions = [
    { id: 'home', label: 'Home Logistics', icon: Home, description: 'Household management and organization' },
    { id: 'school', label: 'School & Education', icon: GraduationCap, description: 'Academic schedules and school communications' },
    { id: 'commerce', label: 'Shopping & Finance', icon: ShoppingCart, description: 'Purchases, bills, and financial management' },
    { id: 'work', label: 'Work & Career', icon: CreditCard, description: 'Professional communications and scheduling' }
  ];

  const generatePreview = () => {
    const { directness, concision, empathy } = data.agentProfile.style;
    
    if (directness >= 4 && concision >= 4) {
      return "You have 3 bills due this week. Pay electric bill ($127) by Friday.";
    } else if (empathy >= 4 && concision <= 2) {
      return "I noticed you have a few bills coming up this week. The electric bill ($127) is due Friday - would you like me to help you set a reminder or explore payment options?";
    } else {
      return "You have 3 bills due this week, including your electric bill ($127) due Friday. I can help you prioritize these payments.";
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Configure Your AI Assistant
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Personalize how HomeOps communicates with you and your family.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Style Configuration */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Communication Style
            </h3>
            
            <div className="space-y-8">
              {styleSliders.map((slider) => {
                const Icon = slider.icon;
                const value = data.agentProfile.style[slider.key];
                
                return (
                  <div key={slider.key}>
                    <div className="flex items-center space-x-3 mb-3">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {slider.label}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {slider.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span>{slider.leftLabel}</span>
                        <span>{slider.rightLabel}</span>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={value}
                          onChange={(e) => updateStyle(slider.key, parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Domain Selection & Preview */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Focus Areas
            </h3>
            
            <div className="space-y-3 mb-8">
              {domainOptions.map((domain) => {
                const Icon = domain.icon;
                const isSelected = data.agentProfile.domains.includes(domain.id);
                
                return (
                  <button
                    key={domain.id}
                    onClick={() => toggleDomain(domain.id)}
                    className={`
                      w-full p-4 rounded-lg border-2 text-left transition-all duration-200
                      ${isSelected
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center
                        ${isSelected
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }
                      `}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${isSelected ? 'text-pink-900 dark:text-pink-100' : 'text-gray-900 dark:text-white'}`}>
                          {domain.label}
                        </h4>
                        <p className={`text-sm ${isSelected ? 'text-pink-700 dark:text-pink-300' : 'text-gray-600 dark:text-gray-400'}`}>
                          {domain.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Preview */}
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 rounded-xl p-6 border border-pink-200/50 dark:border-pink-800/50">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Preview Response
              </h4>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-pink-200 dark:border-pink-700">
                <p className="text-gray-900 dark:text-white text-sm">
                  {generatePreview()}
                </p>
              </div>
              <p className="text-xs text-pink-600 dark:text-pink-400 mt-2">
                This example updates as you adjust the settings above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPersonaStep;