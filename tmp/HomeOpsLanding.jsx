import React, { useState } from 'react';
import { Menu, X, ArrowRight, Brain, Users, Zap, LayoutDashboard, Sparkles, ShoppingCart, DollarSign, MessageSquare, Repeat, Check, Star } from 'lucide-react';

// HomeOps Logo Component
const HomeOpsLogo = ({ size = 48 }) => {
  const gradientId = `homeops-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="HomeOps agent logo">
      <defs>
        <linearGradient id={gradientId} x1="220" y1="300" x2="820" y2="880" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4C6FFF"/>
          <stop offset="100%" stopColor="#9C4DFF"/>
        </linearGradient>
      </defs>
      <path d="M256 520 L512 320 L768 520 V740 Q768 776 732 776 H292 Q256 776 256 740 Z" fill="none" stroke={`url(#${gradientId})`} strokeWidth="44" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M392 620 Q512 704 632 620" fill="none" stroke={`url(#${gradientId})`} strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="420" y1="560" x2="470" y2="560" stroke={`url(#${gradientId})`} strokeWidth="28" strokeLinecap="round"/>
      <line x1="554" y1="560" x2="604" y2="560" stroke={`url(#${gradientId})`} strokeWidth="28" strokeLinecap="round"/>
      <path d="M256 600 Q216 616 200 648" fill="none" stroke={`url(#${gradientId})`} strokeWidth="32" strokeLinecap="round"/>
      <path d="M768 600 Q808 616 824 648" fill="none" stroke={`url(#${gradientId})`} strokeWidth="32" strokeLinecap="round"/>
      <path d="M188 650 q22 22 0 44 q-22 -22 0 -44 Z" fill="none" stroke={`url(#${gradientId})`} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M836 650 q22 22 0 44 q-22 -22 0 -44 Z" fill="none" stroke={`url(#${gradientId})`} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="430" y1="776" x2="430" y2="852" stroke={`url(#${gradientId})`} strokeWidth="32" strokeLinecap="round"/>
      <line x1="594" y1="776" x2="594" y2="852" stroke={`url(#${gradientId})`} strokeWidth="32" strokeLinecap="round"/>
      <line x1="388" y1="852" x2="472" y2="852" stroke={`url(#${gradientId})`} strokeWidth="20" strokeLinecap="round"/>
      <line x1="552" y1="852" x2="636" y2="852" stroke={`url(#${gradientId})`} strokeWidth="20" strokeLinecap="round"/>
    </svg>
  );
};

const HomeOpsLanding = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <HomeOpsLogo size={56} stroke="#2563eb" />
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
                HomeOps
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-600 hover:text-slate-900 transition">Features</a>
              <a href="#how-it-works" className="text-slate-600 hover:text-slate-900 transition">How It Works</a>
              <button className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition">
                Get Started
              </button>
            </div>

            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6">
            <a href="#features" className="text-xl text-slate-600" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="text-xl text-slate-600" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium">
              Get Started
            </button>
          </div>
        </div>
      )}

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
            <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-base sm:text-lg hover:shadow-2xl transition flex items-center justify-center gap-2">
              In Closed Beta • Coming Soon
            </button>
          </div>

          {/* Product Screenshot Placeholder */}
          <div className="relative max-w-5xl mx-auto px-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl"></div>
            <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-slate-50 border-b border-slate-200">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <div className="ml-auto text-xs sm:text-sm text-slate-500 font-medium">HomeOps Dashboard</div>
              </div>
              
              {/* Iframe for screenshots */}
              <div className="w-full bg-gradient-to-br from-slate-100 to-slate-50" style={{ height: '400px', minHeight: '300px' }}>
                <div className="flex items-center justify-center h-full p-4">
                  <div className="text-center">
                    <HomeOpsLogo size={100} stroke="#94a3b8" />
                    <p className="text-slate-400 mt-6 text-base sm:text-lg">Product screenshots coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Built for High Performing Families */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 px-4">
              Built for High Performing Families
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto px-4">
              Every feature designed to reduce mental load and increase family efficiency through intelligent automation.
            </p>
            
            {/* Family illustration */}
            <div className="flex justify-center mt-8 mb-8">
              <svg viewBox="0 0 400 280" className="w-80 h-56 max-w-full">
                <defs>
                  <linearGradient id="familyGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6"/>
                    <stop offset="100%" stopColor="#6366f1"/>
                  </linearGradient>
                  <linearGradient id="familyGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#8b5cf6"/>
                    <stop offset="100%" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
                
                {/* HomeOps organizing circle */}
                <circle cx="200" cy="140" r="120" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="8,4" opacity="0.5"/>
                
                {/* Parents */}
                <g>
                  {/* Mom */}
                  <g transform="translate(140, 80)">
                    {/* Head */}
                    <circle cx="0" cy="0" r="18" fill="#fef3c7" stroke="#3b82f6" strokeWidth="2"/>
                    {/* Hair */}
                    <path d="M -16 -8 Q -18 -22 0 -18 Q 18 -22 16 -8" fill="url(#familyGradient2)"/>
                    {/* Eyes */}
                    <circle cx="-5" cy="-3" r="1.5" fill="#1f2937"/>
                    <circle cx="5" cy="-3" r="1.5" fill="#1f2937"/>
                    {/* Smile */}
                    <path d="M -7 4 Q 0 10 7 4" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    {/* Body */}
                    <rect x="-10" y="18" width="20" height="35" rx="10" fill="url(#familyGradient1)"/>
                    {/* Arms */}
                    <circle cx="-16" cy="30" r="6" fill="#fef3c7" stroke="#3b82f6" strokeWidth="1.5"/>
                    <circle cx="16" cy="30" r="6" fill="#fef3c7" stroke="#3b82f6" strokeWidth="1.5"/>
                    {/* Legs */}
                    <rect x="-6" y="53" width="5" height="22" rx="2.5" fill="#3b82f6"/>
                    <rect x="1" y="53" width="5" height="22" rx="2.5" fill="#3b82f6"/>
                  </g>
                  
                  {/* Dad */}
                  <g transform="translate(260, 80)">
                    {/* Head */}
                    <circle cx="0" cy="0" r="20" fill="#fef3c7" stroke="#8b5cf6" strokeWidth="2"/>
                    {/* Hair */}
                    <path d="M -18 -12 Q 0 -22 18 -12" fill="#374151"/>
                    {/* Eyes */}
                    <circle cx="-6" cy="-3" r="1.5" fill="#1f2937"/>
                    <circle cx="6" cy="-3" r="1.5" fill="#1f2937"/>
                    {/* Smile */}
                    <path d="M -8 5 Q 0 12 8 5" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    {/* Body */}
                    <rect x="-12" y="20" width="24" height="40" rx="12" fill="url(#familyGradient2)"/>
                    {/* Arms */}
                    <circle cx="-18" cy="35" r="7" fill="#fef3c7" stroke="#8b5cf6" strokeWidth="1.5"/>
                    <circle cx="18" cy="35" r="7" fill="#fef3c7" stroke="#8b5cf6" strokeWidth="1.5"/>
                    {/* Legs */}
                    <rect x="-7" y="60" width="6" height="25" rx="3" fill="#8b5cf6"/>
                    <rect x="1" y="60" width="6" height="25" rx="3" fill="#8b5cf6"/>
                  </g>
                </g>
                
                {/* Kids */}
                <g>
                  {/* Kid 1 */}
                  <g transform="translate(170, 180)">
                    {/* Head */}
                    <circle cx="0" cy="0" r="14" fill="#fef3c7" stroke="#10b981" strokeWidth="2"/>
                    {/* Hair */}
                    <path d="M -12 -6 Q 0 -16 12 -6" fill="#f59e0b"/>
                    {/* Eyes */}
                    <circle cx="-4" cy="-2" r="1" fill="#1f2937"/>
                    <circle cx="4" cy="-2" r="1" fill="#1f2937"/>
                    {/* Smile */}
                    <path d="M -5 3 Q 0 7 5 3" stroke="#1f2937" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    {/* Body */}
                    <rect x="-7" y="14" width="14" height="22" rx="7" fill="#10b981"/>
                    {/* Arms */}
                    <circle cx="-10" cy="22" r="4" fill="#fef3c7" stroke="#10b981" strokeWidth="1"/>
                    <circle cx="10" cy="22" r="4" fill="#fef3c7" stroke="#10b981" strokeWidth="1"/>
                    {/* Legs */}
                    <rect x="-4" y="36" width="3" height="16" rx="1.5" fill="#10b981"/>
                    <rect x="1" y="36" width="3" height="16" rx="1.5" fill="#10b981"/>
                  </g>
                  
                  {/* Kid 2 */}
                  <g transform="translate(230, 180)">
                    {/* Head */}
                    <circle cx="0" cy="0" r="14" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2"/>
                    {/* Hair */}
                    <path d="M -11 -8 Q -13 -18 0 -16 Q 13 -18 11 -8" fill="#ec4899"/>
                    {/* Eyes */}
                    <circle cx="-4" cy="-2" r="1" fill="#1f2937"/>
                    <circle cx="4" cy="-2" r="1" fill="#1f2937"/>
                    {/* Smile */}
                    <path d="M -5 3 Q 0 7 5 3" stroke="#1f2937" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                    {/* Body */}
                    <rect x="-7" y="14" width="14" height="22" rx="7" fill="#f59e0b"/>
                    {/* Arms */}
                    <circle cx="-10" cy="22" r="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1"/>
                    <circle cx="10" cy="22" r="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1"/>
                    {/* Legs */}
                    <rect x="-4" y="36" width="3" height="16" rx="1.5" fill="#f59e0b"/>
                    <rect x="1" y="36" width="3" height="16" rx="1.5" fill="#f59e0b"/>
                  </g>
                </g>
                
                {/* Connection lines showing family unity */}
                <g stroke="#cbd5e1" strokeWidth="2" opacity="0.6" fill="none">
                  <path d="M 160 110 Q 200 90 240 110" strokeDasharray="4,4"/>
                  <path d="M 150 160 Q 180 140 200 160" strokeDasharray="4,4"/>
                  <path d="M 200 160 Q 220 140 250 160" strokeDasharray="4,4"/>
                </g>
                
                {/* HomeOps label */}
                <text x="200" y="260" textAnchor="middle" fill="#6366f1" fontSize="14" fontWeight="600" fontFamily="system-ui">
                  HomeOps
                </text>
              </svg>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 px-4">
            {[
              {
                icon: Brain,
                title: "Email Intelligence Engine",
                description: "Advanced AI instantly decodes your family's email stream, identifying what needs action versus what can wait—no more inbox overwhelm.",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Zap,
                title: "Instant Priority Scoring",
                description: "Every email gets an intelligent priority score based on urgency, importance, and your family's unique patterns and preferences.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: Users,
                title: "Smart Task Extraction",
                description: "Automatically surfaces deadlines, appointments, and action items from school communications, activities, and household logistics.",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: LayoutDashboard,
                title: "Unified Family Command Center",
                description: "One dashboard showing your family's real priorities: upcoming deadlines, important communications, and what actually needs your time.",
                gradient: "from-orange-500 to-red-500"
              },
              {
                icon: MessageSquare,
                title: "Parent Built Security",
                description: "Built by parents, for parents. We use military-grade encryption, read-only Gmail access with zero data storage of personal content, and complete transparency about what we access and why. Your family's privacy is sacred.",
                gradient: "from-indigo-500 to-blue-500"
              },
              {
                icon: Repeat,
                title: "Gets Smarter Over Time",
                description: "Our AI learns your family's unique patterns, what's relevant to schedule, and what's unsolicited, and helps optimize high-emotion messages.",
                gradient: "from-violet-500 to-purple-500"
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 hover:shadow-xl transition group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition flex items-center justify-center`}>
                  <feature.icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stop Drowning Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Stop drowning in family logistics
          </h2>
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Transform your family's email chaos into clear priorities and actionable insights. Join families who've reclaimed their time and mental energy with HomeOps AI.
          </p>
          <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold text-lg hover:shadow-lg transition">
            In Closed Beta • Coming Soon
          </button>
        </div>
      </section>



      

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-white">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Ready to lighten your load?
            </h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-blue-100">
              Join thousands of families who've transformed chaos into clarity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-blue-600 rounded-full font-semibold text-base sm:text-lg hover:shadow-2xl transition">
                Join Waitlist
              </button>
              <button className="px-8 py-4 bg-transparent text-white rounded-full font-semibold text-base sm:text-lg border-2 border-white hover:bg-white/10 transition">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <HomeOpsLogo size={32} stroke="#ffffff" />
                <span className="text-xl font-bold">HomeOps</span>
              </div>
              <p className="text-slate-400 text-sm">The operating system for high-performing families.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Updates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400 text-sm">
            © 2025 HomeOps. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeOpsLanding;
