import React, { useEffect } from 'react';
import Header from './shared/Header';
import Footer from './Footer';

const About: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const teamMembers = [
    {
      name: "Sarah Johnson",
      title: "Founder & CEO",
      avatar: "/api/placeholder/400/400",
      bio: "Former Google PM with 8+ years building family-focused products"
    },
    {
      name: "Michael Chen",
      title: "CTO",
      avatar: "/api/placeholder/400/400",
      bio: "AI/ML expert with experience at OpenAI and Microsoft"
    },
    {
      name: "Emily Rodriguez",
      title: "Head of Design",
      avatar: "/api/placeholder/400/400",
      bio: "Design leader focused on human-centered family experiences"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold lg:tracking-tight text-white">About HomeOps</h1>
            <p className="text-lg mt-4 text-slate-300">We are a passionate team building the future of family operations.</p>
          </div>

          <div className="flex flex-col gap-6 mx-auto max-w-4xl mt-16">
            <h2 className="font-bold text-3xl text-white">
              Empowering families with AI-powered operations.
            </h2>
            <p className="text-lg leading-relaxed text-slate-300">
              We're a dedicated team focused on solving the unique challenges modern families face with email overload and task coordination.
              Our diverse backgrounds in AI, product design, and family systems bring different perspectives and experiences that make our team special.
            </p>
            <p className="text-lg leading-relaxed text-slate-300">
              HomeOps was born from our own struggles managing family logistics through endless email threads.
              We believe AI can transform the chaos of family coordination into organized, actionable intelligence that reduces mental load for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 mx-auto max-w-5xl mt-20">
            {teamMembers.map((member, index) => (
              <div key={index} className="group text-center">
                <div className="w-full aspect-square max-w-sm mx-auto">
                  <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                    <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-white">{member.name}</h2>
                  <h3 className="text-sm text-indigo-400 font-medium mt-1">{member.title}</h3>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 bg-slate-800 rounded-lg p-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-white mb-6">Our Mission</h3>
              <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
                To reduce the mental load on modern families by transforming email chaos into organized,
                actionable intelligence through privacy-first AI technology.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-indigo-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🎯</span>
                </div>
                <h4 className="font-semibold text-white mb-3 text-lg">Focus</h4>
                <p className="text-slate-300">Laser-focused on family operations and reducing mental load for high-performing families</p>
              </div>

              <div className="text-center">
                <div className="bg-indigo-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🔒</span>
                </div>
                <h4 className="font-semibold text-white mb-3 text-lg">Privacy</h4>
                <p className="text-slate-300">Your family data stays secure with enterprise-grade protection and read-only access</p>
              </div>

              <div className="text-center">
                <div className="bg-indigo-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🚀</span>
                </div>
                <h4 className="font-semibold text-white mb-3 text-lg">Innovation</h4>
                <p className="text-slate-300">Cutting-edge AI technology designed for real families with real challenges</p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-white mb-6">Ready to transform your family operations?</h3>
            <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
              Join families who've already reduced their mental load and gained clarity in their daily operations.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default About;