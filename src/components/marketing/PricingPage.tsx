import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, X, Rocket, User, Users, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES, BETA_MODE } from '../../config/routes';
import Header from '../ui/Header';
import Footer from '../ui/Footer';


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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
        { text: 'Everything in Free', included: true },
        { text: 'Unlimited AI agent chats', included: true },
        { text: 'Advanced analytics dashboard', included: true },
        { text: 'Priority email processing', included: true },
        { text: '1-year history retention', included: true },
        { text: 'Premium support', included: true },
      ],
      featured: true,
      ctaText: 'Start High Performer'
    },
    {
      id: 'family',
      name: 'Family',
      description: 'Perfect for busy families',
      icon: <Users className="w-5 h-5" />,
      monthlyPrice: 25,
      annualPrice: 250,
      features: [
        { text: 'Everything in High Performer', included: true },
        { text: 'Up to 6 family members', included: true },
        { text: 'Shared family dashboard', included: true },
        { text: 'Family calendar coordination', included: true },
        { text: 'Unlimited history retention', included: true },
        { text: 'Family admin controls', included: true },
      ],
      ctaText: 'Start Family Plan'
    }
  ];

  const handlePlanSelect = (planId: string) => {
    // Navigate to signup with plan parameter
    window.location.href = `/signup?plan=${planId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-4 text-sm font-medium text-slate-500 uppercase tracking-wide">
            Mental Load Operating System™
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Simple, transparent pricing
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
            Choose the plan that fits your family's mental load management needs.
            Start free, upgrade when you're ready to unlock the full power of HomeOps.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12 sm:mb-16">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isAnnual ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={isAnnual}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                  isAnnual ? 'translate-x-7' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
              Annual <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-1">Save 17%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => {
              const currentPrice = isAnnual ? tier.annualPrice : tier.monthlyPrice;
              const period = isAnnual ? 'year' : 'month';

              return (
                <div
                  key={tier.id}
                  className={`relative bg-white rounded-2xl border-2 p-8 ${
                    tier.featured
                      ? 'border-blue-500 shadow-2xl scale-105'
                      : 'border-slate-200 shadow-lg hover:shadow-xl'
                  } transition-all duration-300`}
                >
                  {tier.featured && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                      tier.featured
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tier.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{tier.name}</h3>
                    <p className="text-slate-600 mb-6">{tier.description}</p>

                    <div className="mb-6">
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-slate-900">${currentPrice}</span>
                        <span className="text-slate-600 ml-1">/{period}</span>
                      </div>
                      {isAnnual && tier.monthlyPrice > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          Save ${(tier.monthlyPrice * 12) - tier.annualPrice} per year
                        </p>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-slate-700' : 'text-slate-500'}`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => !BETA_MODE && handlePlanSelect(tier.id)}
                    className={`w-full py-3 px-6 rounded-full font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      tier.featured
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                        : 'border-2 border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600'
                    } ${BETA_MODE ? 'cursor-not-allowed opacity-75' : ''}`}
                  >
                    {BETA_MODE ? 'Coming Soon' : tier.ctaText}
                    {!BETA_MODE && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to know about HomeOps pricing and plans.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Can I change plans anytime?</h3>
              <p className="text-slate-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Is my family data secure?</h3>
              <p className="text-slate-600">Absolutely. We use enterprise-grade encryption and never sell your data. Your family's privacy is our top priority.</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">What happens if I exceed my plan limits?</h3>
              <p className="text-slate-600">We'll notify you before you reach your limits. For AI chats, older conversations remain accessible but new chats will be paused until your next billing cycle or upgrade.</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Do you offer a money-back guarantee?</h3>
              <p className="text-slate-600">Yes! We offer a 30-day money-back guarantee on all paid plans. If you're not completely satisfied, we'll refund your payment in full.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to transform your family operations?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {BETA_MODE ? (
              "Join the closed beta and be among the first families to experience the future of household management."
            ) : (
              "Start with our free plan and upgrade when you're ready to unlock the full power of HomeOps."
            )}
          </p>
          {BETA_MODE ? (
            <a
              href="mailto:hello@homeops.ai?subject=Beta Access Request"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:shadow-2xl transition"
            >
              Request Beta Access
            </a>
          ) : (
            <Link
              to={ROUTES.LOGIN}
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-lg hover:shadow-2xl transition gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;