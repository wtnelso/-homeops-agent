import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

const Homepage1: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              to={ROUTES.HOME}
              className="text-[#cbd5e1] no-underline font-medium text-sm hover:text-[#6366f1] transition-colors duration-300"
            >
              Home
            </Link>
          </li>
          <li>
            <a
              href="#features"
              className="text-[#cbd5e1] no-underline font-medium text-sm hover:text-[#6366f1] transition-colors duration-300"
            >
              Features
            </a>
          </li>
          <li>
            <Link
              to={ROUTES.PRICING}
              className="text-[#cbd5e1] no-underline font-medium text-sm hover:text-[#6366f1] transition-colors duration-300"
            >
              Pricing
            </Link>
          </li>
          <li>
            <Link
              to={ROUTES.LOGIN}
              className="text-[#cbd5e1] no-underline font-medium text-sm hover:text-[#6366f1] transition-colors duration-300"
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
              to={ROUTES.HOME}
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
              to={ROUTES.PRICING}
              className="text-[#cbd5e1] no-underline font-medium text-lg hover:text-[#6366f1] transition-colors duration-300"
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
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-white to-[#cbd5e1] bg-clip-text text-transparent">
            Mental Load Operating System for High Performing Families
          </h1>

          <p className="text-lg md:text-xl text-[#94a3b8] mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your family's chaos into clarity. HomeOps.AI intelligently manages schedules,
            tasks, and communications so you can focus on what truly matters.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to={ROUTES.LOGIN}
              className="bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] border-none px-8 py-4 rounded-lg text-white no-underline font-semibold text-lg transition-all duration-300 shadow-[0_4px_14px_0_rgba(99,102,241,0.3)] hover:translate-y-[-1px] hover:shadow-[0_6px_20px_0_rgba(99,102,241,0.4)]"
            >
              Start Free Trial
            </Link>
            <button className="border border-[#374151] bg-transparent px-8 py-4 rounded-lg text-[#cbd5e1] font-semibold text-lg transition-all duration-300 hover:border-[#6366f1] hover:text-[#6366f1]">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section id="features" className="py-16 px-5 md:px-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-12">
            Everything your family needs in one place
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[rgba(30,30,60,0.5)] backdrop-blur-[10px] border border-[rgba(99,102,241,0.2)] rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Scheduling</h3>
              <p className="text-[#94a3b8]">
                AI-powered calendar coordination that prevents conflicts and optimizes your family's time.
              </p>
            </div>

            <div className="bg-[rgba(30,30,60,0.5)] backdrop-blur-[10px] border border-[rgba(99,102,241,0.2)] rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">✉️</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Email Intelligence</h3>
              <p className="text-[#94a3b8]">
                Automatically extract important dates, tasks, and information from your family's emails.
              </p>
            </div>

            <div className="bg-[rgba(30,30,60,0.5)] backdrop-blur-[10px] border border-[rgba(99,102,241,0.2)] rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-xl">🧠</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Memory Assistant</h3>
              <p className="text-[#94a3b8]">
                Never forget important family details, preferences, or commitments again.
              </p>
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

export default Homepage1;