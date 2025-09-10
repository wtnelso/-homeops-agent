import React, { useState } from 'react';
import { Check, CreditCard, Shield, Star } from 'lucide-react';

const PlanSection: React.FC = () => {
  const [currentPlan] = useState('free');
  const [isAnnual, setIsAnnual] = useState(false);
  
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      monthlyPrice: 0,
      description: 'Perfect for getting started',
      features: [
        'Basic email intelligence',
        'Up to 100 emails per month',
        'Basic calendar integration',
        'Email support'
      ],
      limitations: [
        'Limited AI processing',
        'Basic notifications only'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: isAnnual ? 99 : 12,
      monthlyPrice: 12,
      description: 'For power users and families',
      features: [
        'Advanced email intelligence',
        'Unlimited email processing',
        'Full calendar integration',
        'Priority notifications',
        'Advanced family coordination',
        'Travel planning assistant',
        'Priority support'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: isAnnual ? 299 : 29,
      monthlyPrice: 29,
      description: 'For large families and organizations',
      features: [
        'Everything in Pro',
        'Multi-family management',
        'Advanced analytics',
        'Custom integrations',
        'Dedicated support',
        'API access'
      ]
    }
  ];

  const handleUpgrade = async (planId: string) => {
    // In a real implementation, this would integrate with Stripe
    console.log(`Upgrading to ${planId} plan`);
    
    // Simulate Stripe integration
    try {
      // This would normally call your backend to create a Stripe checkout session
      // const response = await fetch('/api/create-checkout-session', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     planId, 
      //     isAnnual,
      //     returnUrl: window.location.origin + '/settings?tab=plan'
      //   })
      // });
      // 
      // const { checkoutUrl } = await response.json();
      // window.location.href = checkoutUrl;
      
      alert(`Stripe integration would redirect to checkout for ${planId} plan`);
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Current Plan</h3>
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{currentPlan}</span>
          {currentPlan !== 'free' && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-full">
              Active
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {currentPlan === 'free' ? 'Upgrade to unlock more features' : 'Thank you for being a subscriber!'}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose Your Plan</h3>
          <div className="flex items-center space-x-3">
            <span className={`text-sm ${!isAnnual ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                ${isAnnual ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                  ${isAnnual ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
              Annual
            </span>
            {isAnnual && (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full">
                Save 20%
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`
                relative p-6 rounded-lg border-2 transition-all duration-200
                ${plan.popular 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }
                ${currentPlan === plan.id ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h4>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 ml-1">
                    {plan.price === 0 ? '' : `/${isAnnual ? 'year' : 'month'}`}
                  </span>
                </div>
                {isAnnual && plan.price > 0 && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    ${plan.monthlyPrice}/month billed annually
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{plan.description}</p>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
                {plan.limitations && plan.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-start space-x-3 opacity-60">
                    <div className="w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{limitation}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={currentPlan === plan.id}
                className={`
                  w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center
                  ${currentPlan === plan.id
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : plan.id === 'free'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }
                `}
              >
                {currentPlan === plan.id ? (
                  'Current Plan'
                ) : plan.id === 'free' ? (
                  'Downgrade'
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    {currentPlan === 'free' ? 'Upgrade' : 'Switch Plan'}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Secure Payments</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              All payments are processed securely through Stripe. We never store your payment information.
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
              <span>• Cancel anytime</span>
              <span>• 30-day money-back guarantee</span>
              <span>• Prorated billing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSection;