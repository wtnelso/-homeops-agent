import React, { useEffect } from 'react';
import { ArrowRight, Brain, Users, Zap, LayoutDashboard, Sparkles, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES, BETA_MODE } from '../../config/routes';
import HomeOpsLogo from '../ui/HomeOpsLogo';
import Header from '../ui/Header';

const HomeOpsLanding: React.FC = () => {

  useEffect(() => {
    // Handle hash scrolling when component mounts
    const hash = window.location.hash;
    if (hash) {
      // Remove the # from the hash
      const sectionId = hash.substring(1);
      // Add a small delay to ensure the page has fully loaded
      setTimeout(() => {
        const element = document.querySelector(`#${sectionId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-4 text-sm font-medium text-slate-500 uppercase tracking-wide">
            Mental Load Operating System™
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight px-4">
            The family operations platform that thinks ahead
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl text-slate-600 mb-10 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
            HomeOps organizes the mental load from school emails to weekend logistics into one intelligent system that keeps life moving forward effortlessly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16 px-4">
            {BETA_MODE ? (
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-base sm:text-lg hover:shadow-2xl transition flex items-center justify-center gap-2">
                In Closed Beta • Coming Soon
              </button>
            ) : (
              <Link
                to={ROUTES.LOGIN}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-base sm:text-lg hover:shadow-2xl transition flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
          </div>

          {/* Product Screenshot Mockup */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl p-8 border border-blue-200/50">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-8 flex items-center justify-start px-4 gap-2">
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                  <div className="w-3 h-3 bg-white/30 rounded-full"></div>
                </div>
                <div className="p-8">
                  <div className="text-left mb-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Family Dashboard</h3>
                    <p className="text-slate-600">See everything that matters in one intelligent view</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-slate-800">Smart Insights</span>
                      </div>
                      <p className="text-sm text-slate-600">AI-powered family scheduling</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-slate-800">Family Sync</span>
                      </div>
                      <p className="text-sm text-slate-600">Everyone stays connected</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-blue-50 p-4 rounded-xl border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-slate-800">Auto-Magic</span>
                      </div>
                      <p className="text-sm text-slate-600">Tasks organize themselves</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Your family's digital command center
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              HomeOps transforms the overwhelming mental load of family life into an organized, intelligent system that anticipates needs and streamlines daily operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Intelligence</h3>
              <p className="text-slate-600">Smart algorithms learn your family's patterns and proactively suggest optimizations for schedules, tasks, and logistics.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Unified Dashboard</h3>
              <p className="text-slate-600">See everything that matters in one place - calendars, tasks, communications, and family updates in a single intelligent view.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Family Coordination</h3>
              <p className="text-slate-600">Keep everyone in sync with real-time updates, shared calendars, and intelligent notifications that reach the right person at the right time.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Proactive Automation</h3>
              <p className="text-slate-600">HomeOps anticipates needs before they become urgent, automatically organizing schedules and suggesting optimal timing for family activities.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Communication</h3>
              <p className="text-slate-600">Intelligently filter and organize family communications, ensuring important information never gets lost in the noise.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Effortless Integration</h3>
              <p className="text-slate-600">Seamlessly connects with your existing tools and services, creating a unified ecosystem that works with your family's current workflow.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6">
              How HomeOps works
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto">
              Three simple steps to transform your family's mental load into an organized, intelligent system.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect Your Life</h3>
              <p className="text-slate-600">Link your calendars, emails, and family communication channels. HomeOps intelligently organizes everything in one secure dashboard.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">AI Learns Your Patterns</h3>
              <p className="text-slate-600">Our intelligent system learns your family's routines, preferences, and priorities to provide personalized insights and automation.</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Life Runs Smoothly</h3>
              <p className="text-slate-600">Enjoy proactive scheduling, smart notifications, and seamless family coordination that keeps everyone informed and on track.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to transform your family operations?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            {BETA_MODE ? (
              "Join the closed beta and be among the first families to experience the future of household management."
            ) : (
              "Start organizing your family's mental load with intelligent automation and coordination."
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

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <HomeOpsLogo width={40} height={40} />
              <span className="text-2xl font-bold">HomeOps</span>
            </div>
            <div className="flex gap-8 text-sm">
              <Link to={ROUTES.PRIVACY} className="text-slate-400 hover:text-white transition">Privacy</Link>
              <Link to={ROUTES.TERMS} className="text-slate-400 hover:text-white transition">Terms</Link>
              <Link to={ROUTES.CONTACT} className="text-slate-400 hover:text-white transition">Contact</Link>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2025 HomeOps. All rights reserved. Mental Load Operating System™
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeOpsLanding;