import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';
import { ROUTES } from '../../config/routes';

const Pricing1: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleBilling = () => {
    setIsAnnual(!isAnnual);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-[#0f0f23] text-[#e2e8f0] overflow-x-hidden font-inter">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[1000] px-5 py-4 md:px-10 md:py-5 flex justify-between items-center bg-[rgba(15,15,35,0.98)] backdrop-blur-[12px] border-b border-[rgba(99,102,241,0.2)]">
        <div className="text-xl font-bold text-[#6366f1] tracking-[-0.5px]">
          HOMEOPS.AI
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex gap-5 list-none items-center">
          <li>
            <Link
              to={ROUTES.HOME1}
              className="text-[#cbd5e1] no-underline font-medium text-sm hover:text-[#6366f1] transition-colors duration-300 px-3 py-2 rounded-md hover:bg-[rgba(99,102,241,0.1)]"
            >
              Home
            </Link>
          </li>
          <li>
            <a
              href="#features"
              className="text-[#cbd5e1] no-underline font-medium text-sm hover:text-[#6366f1] transition-colors duration-300 px-3 py-2 rounded-md hover:bg-[rgba(99,102,241,0.1)]"
            >
              Features
            </a>
          </li>
          <li>
            <Link
              to={ROUTES.PRICING1}
              className="text-[#6366f1] bg-[rgba(99,102,241,0.1)] no-underline font-medium text-sm px-3 py-2 rounded-md"
            >
              Pricing
            </Link>
          </li>
          <li>
            <Link
              to={ROUTES.LOGIN}
              className="text-[#cbd5e1] no-underline font-medium text-sm hover:text-[#6366f1] transition-colors duration-300 px-3 py-2 rounded-md hover:bg-[rgba(99,102,241,0.1)]"
            >
              Get Started
            </Link>
          </li>
        </ul>

        {/* CTA Button */}
        <Link
          to={ROUTES.LOGIN}
          className="hidden md:inline-block bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] border-none px-5 py-2.5 rounded-lg text-white no-underline font-semibold text-sm transition-all duration-300 shadow-[0_4px_14px_0_rgba(99,102,241,0.3)] hover:translate-y-[-1px] hover:shadow-[0_6px_20px_0_rgba(99,102,241,0.4)]"
        >
          Get Started
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden bg-none border-none text-white text-2xl cursor-pointer"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[999] bg-[rgba(15,15,35,0.95)] backdrop-blur-[12px] md:hidden">
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <Link
              to={ROUTES.HOME1}
              className="text-[#cbd5e1] no-underline font-medium text-lg hover:text-[#6366f1] transition-colors duration-300"
              onClick={toggleMobileMenu}
            >
              Home
            </Link>
            <a
              href="#features"
              className="text-[#cbd5e1] no-underline font-medium text-lg hover:text-[#6366f1] transition-colors duration-300"
              onClick={toggleMobileMenu}
            >
              Features
            </a>
            <Link
              to={ROUTES.PRICING1}
              className="text-[#6366f1] no-underline font-medium text-lg"
              onClick={toggleMobileMenu}
            >
              Pricing
            </Link>
            <Link
              to={ROUTES.LOGIN}
              className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] border-none px-8 py-4 rounded-lg text-white no-underline font-semibold text-lg transition-all duration-300"
              onClick={toggleMobileMenu}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-24 md:pt-32 pb-16 px-5 md:px-10 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Simple, transparent pricing
          </h1>

          <p className="text-lg md:text-xl text-[#94a3b8] mb-8 max-w-2xl mx-auto">
            Choose the plan that fits your family's mental load management needs.
            Start free, upgrade when you're ready to unlock the full power of HomeOps.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-[#6366f1]' : 'text-[#94a3b8]'}`}>
              Monthly
            </span>
            <button
              onClick={toggleBilling}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${
                isAnnual ? 'bg-[#6366f1]' : 'bg-[#374151]'
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
            <span className={`text-sm font-medium ${isAnnual ? 'text-[#6366f1]' : 'text-[#94a3b8]'}`}>
              Annual <span className="bg-[#10b981] text-white text-xs px-2 py-1 rounded-full ml-1">Save 17%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 px-5 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">

            {/* Free Plan */}
            <div className="bg-[rgba(30,30,60,0.5)] backdrop-blur-[10px] border border-[rgba(99,102,241,0.2)] rounded-2xl p-8 text-center">
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 bg-[rgba(99,102,241,0.1)] text-[#6366f1] px-3 py-1.5 rounded-full text-sm font-medium mb-4 mx-auto w-fit">
                  <span>🚀</span>
                  <span>Free</span>
                </div>
                <p className="text-[#94a3b8] text-sm">Full features, limited agent usage</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl text-[#94a3b8]">$</span>
                  <span className="text-5xl font-bold">0</span>
                  <span className="text-[#94a3b8]">/forever</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Full email intelligence (unlimited)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Full calendar sync + summaries</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">5 AI agent chats / month</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">1 user profile</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">30-day history retention</span>
                </li>
                <li className="flex items-center gap-3">
                  <X className="w-5 h-5 text-[#ef4444] flex-shrink-0" />
                  <span className="text-sm text-[#64748b]">No shared views</span>
                </li>
              </ul>

              <Link
                to={ROUTES.LOGIN}
                className="w-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] border-none px-6 py-3 rounded-lg text-white no-underline font-semibold text-sm transition-all duration-300 shadow-[0_4px_14px_0_rgba(99,102,241,0.3)] hover:translate-y-[-1px] hover:shadow-[0_6px_20px_0_rgba(99,102,241,0.4)] flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-[rgba(30,30,60,0.5)] backdrop-blur-[10px] border-2 border-[#6366f1] rounded-2xl p-8 text-center relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white px-4 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 bg-[rgba(99,102,241,0.1)] text-[#6366f1] px-3 py-1.5 rounded-full text-sm font-medium mb-4 mx-auto w-fit">
                  <span>⭐</span>
                  <span>Pro</span>
                </div>
                <p className="text-[#94a3b8] text-sm">Perfect for busy families</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl text-[#94a3b8]">$</span>
                  <span className="text-5xl font-bold">{isAnnual ? '12' : '15'}</span>
                  <span className="text-[#94a3b8]">/{isAnnual ? 'month' : 'month'}</span>
                </div>
                {isAnnual && (
                  <p className="text-xs text-[#10b981] mt-1">Billed annually ($144/year)</p>
                )}
              </div>

              <ul className="space-y-4 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Everything in Free</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Unlimited AI agent chats</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Up to 4 family members</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Shared family dashboard</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">1-year history retention</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>

              <Link
                to={ROUTES.LOGIN}
                className="w-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] border-none px-6 py-3 rounded-lg text-white no-underline font-semibold text-sm transition-all duration-300 shadow-[0_4px_14px_0_rgba(99,102,241,0.3)] hover:translate-y-[-1px] hover:shadow-[0_6px_20px_0_rgba(99,102,241,0.4)] flex items-center justify-center gap-2"
              >
                Start Pro Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-[rgba(30,30,60,0.5)] backdrop-blur-[10px] border border-[rgba(99,102,241,0.2)] rounded-2xl p-8 text-center">
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 bg-[rgba(99,102,241,0.1)] text-[#6366f1] px-3 py-1.5 rounded-full text-sm font-medium mb-4 mx-auto w-fit">
                  <span>🏢</span>
                  <span>Enterprise</span>
                </div>
                <p className="text-[#94a3b8] text-sm">For large families & organizations</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl text-[#94a3b8]">$</span>
                  <span className="text-5xl font-bold">{isAnnual ? '25' : '30'}</span>
                  <span className="text-[#94a3b8]">/{isAnnual ? 'month' : 'month'}</span>
                </div>
                {isAnnual && (
                  <p className="text-xs text-[#10b981] mt-1">Billed annually ($300/year)</p>
                )}
              </div>

              <ul className="space-y-4 mb-8 text-left">
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Unlimited family members</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Custom integrations</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Unlimited history retention</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[#10b981] flex-shrink-0" />
                  <span className="text-sm">Dedicated support manager</span>
                </li>
              </ul>

              <Link
                to={ROUTES.CONTACT}
                className="w-full border border-[#6366f1] bg-transparent px-6 py-3 rounded-lg text-[#6366f1] no-underline font-semibold text-sm transition-all duration-300 hover:bg-[rgba(99,102,241,0.1)] flex items-center justify-center gap-2"
              >
                Contact Sales
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-5 md:px-10 border-t border-[rgba(99,102,241,0.2)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-12">Frequently Asked Questions</h2>

          <div className="text-left space-y-6">
            <div className="bg-[rgba(30,30,60,0.3)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-[#94a3b8]">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.</p>
            </div>

            <div className="bg-[rgba(30,30,60,0.3)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">Is my family data secure?</h3>
              <p className="text-[#94a3b8]">Absolutely. We use enterprise-grade encryption and never sell your data. Your family's privacy is our top priority.</p>
            </div>

            <div className="bg-[rgba(30,30,60,0.3)] rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-2">What happens if I exceed my plan limits?</h3>
              <p className="text-[#94a3b8]">We'll notify you before you reach your limits. For AI chats, older conversations remain accessible but new chats will be paused until your next billing cycle or upgrade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[rgba(99,102,241,0.2)] py-8 px-5 md:px-10 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="text-[#6366f1] font-bold text-xl mb-4">HOMEOPS.AI</div>
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <Link to={ROUTES.PRIVACY} className="text-[#94a3b8] hover:text-[#6366f1] transition-colors duration-300">
              Privacy
            </Link>
            <Link to={ROUTES.TERMS} className="text-[#94a3b8] hover:text-[#6366f1] transition-colors duration-300">
              Terms
            </Link>
            <Link to={ROUTES.CONTACT} className="text-[#94a3b8] hover:text-[#6366f1] transition-colors duration-300">
              Contact
            </Link>
          </div>
          <p className="text-[#64748b] text-sm">
            © 2024 HomeOps.AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Pricing1;