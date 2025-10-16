import React, { useState } from 'react';
import { ArrowRight, Check, X, Rocket, User, Users, Crown } from 'lucide-react';
import Header from '../shared/Header';
import Footer from '../Footer';
import { BETA_MODE } from '../../config/routes';
import './PricingPage.css';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  monthlyPrice: number;
  annualPrice: number;
  features: Array<{
    text: string;
    included: boolean;
  }>;
  featured?: boolean;
  ctaText: string;
}

const PricingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Full features, limited agent usage',
      icon: <Rocket className="w-5 h-5" />,
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { text: 'Full email intelligence (unlimited)', included: true },
        { text: 'Full calendar sync + summaries', included: true },
        { text: '5 AI agent chats / month', included: true },
        { text: '1 user profile', included: true },
        { text: '30-day history retention', included: true },
        { text: 'No shared views', included: false },
      ],
      ctaText: 'Get Started Free'
    },
    {
      id: 'individual',
      name: 'High Performer',
      description: 'For individuals to run their life better',
      icon: <User className="w-5 h-5" />,
      monthlyPrice: 15,
      annualPrice: 150,
      features: [
        { text: 'Unlimited email summaries', included: true },
        { text: 'Unlimited calendar sync + summaries', included: true },
        { text: 'Full AI chat agent (unlimited)', included: true },
        { text: '1 user personal dashboard', included: true },
        { text: '1-year history retention', included: true },
        { text: 'Standard support', included: true },
      ],
      featured: true,
      ctaText: 'Start Free Trial'
    },
    {
      id: 'couple',
      name: 'High Performing Couple',
      description: 'For spouses/partners with joint command center',
      icon: <Users className="w-5 h-5" />,
      monthlyPrice: 25,
      annualPrice: 250,
      features: [
        { text: 'Everything in High Performer', included: true },
        { text: 'Joint command center (2 users)', included: true },
        { text: 'Shared household dashboard', included: true },
        { text: '2-year history retention', included: true },
        { text: 'Priority support', included: true },
      ],
      ctaText: 'Start Free Trial'
    },
    {
      id: 'family',
      name: 'High Performing Family',
      description: 'For families with 3+ members and complex schedules',
      icon: <Crown className="w-5 h-5" />,
      monthlyPrice: 40,
      annualPrice: 400,
      features: [
        { text: 'Everything in High Performing Couple', included: true },
        { text: 'Up to 6 family member profiles', included: true },
        { text: 'Advanced family scheduling AI', included: true },
        { text: 'Household operations dashboard', included: true },
        { text: 'Unlimited history retention', included: true },
        { text: 'Premium support + family success manager', included: true },
      ],
      ctaText: 'Start Free Trial'
    }
  ];

  const handlePlanSelect = (planId: string) => {
    // Navigate to signup with plan parameter
    window.location.href = `/signup?plan=${planId}`;
  };

  const calculateSavings = (monthly: number, annual: number) => {
    if (monthly === 0) return 0;
    return (monthly * 12) - annual;
  };

  return (
    <div className="pricing-page">
      <Header currentPage="pricing" />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Simple, transparent pricing</h1>
          <p className="hero-subtitle">
            Choose the plan that fits your family's mental load management needs.
            Start free, upgrade when you're ready to unlock the full power of HomeOps.
          </p>

          {/* Billing Toggle */}
          <div className="billing-toggle">
            <span className={`toggle-label ${!isAnnual ? 'active' : ''}`}>Monthly</span>
            <button
              className="toggle-switch"
              onClick={() => setIsAnnual(!isAnnual)}
              role="switch"
              aria-checked={isAnnual}
            >
              <div className={`toggle-slider ${isAnnual ? 'annual' : ''}`}></div>
            </button>
            <span className={`toggle-label ${isAnnual ? 'active' : ''}`}>
              Annual <span className="savings-badge">Save 17%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pricing-section">
        <div className="pricing-grid">
          {pricingTiers.map((tier) => (
            <div key={tier.id} className={`pricing-card ${tier.featured ? 'featured' : ''}`}>
              {tier.featured && <div className="featured-badge">Most Popular</div>}

              <div className="card-header">
                <div className="plan-badge">
                  {tier.icon}
                  <span>{tier.name}</span>
                </div>
                <div className="plan-description">{tier.description}</div>
              </div>

              <div className="pricing-display">
                <div className="price-container">
                  <span className="price-currency">$</span>
                  <span className="price-amount">
                    {isAnnual ? tier.annualPrice : tier.monthlyPrice}
                  </span>
                  <span className="price-period">
                    {tier.monthlyPrice === 0 ? '/forever' : isAnnual ? '/year' : '/month'}
                  </span>
                </div>
                {isAnnual && tier.monthlyPrice > 0 && (
                  <div className="annual-savings">
                    Save ${calculateSavings(tier.monthlyPrice, tier.annualPrice)}/year vs monthly
                  </div>
                )}
              </div>

              <ul className="features-list">
                {tier.features.map((feature, index) => (
                  <li key={index} className={`feature-item ${!feature.included ? 'disabled' : ''}`}>
                    {feature.included ? (
                      <Check className="w-4 h-4 feature-check" />
                    ) : (
                      <X className="w-4 h-4 feature-x" />
                    )}
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>

              {BETA_MODE ? (
                <div className={`plan-cta-beta ${tier.featured ? 'primary' : ''}`}>
                  Coming Soon
                </div>
              ) : (
                <button
                  className={`plan-cta ${tier.featured ? 'primary' : ''}`}
                  onClick={() => handlePlanSelect(tier.id)}
                >
                  {tier.ctaText}
                  <ArrowRight className="w-4 h-4 cta-arrow" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ or additional content sections could go here */}

      <Footer />
    </div>
  );
};

export default PricingPage;