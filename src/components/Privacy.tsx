import React, { useEffect } from 'react';
import Header from './shared/Header';
import Footer from './Footer';

const Privacy: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

          <div className="prose prose-lg max-w-none prose-invert">
            <p className="text-slate-300 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
              <p className="text-slate-300 mb-4">
                Welcome to HomeOps ("we," "our," or "us"). This Privacy Policy explains how we collect,
                use, disclose, and safeguard your information when you use our AI-powered family operations
                platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              <p className="text-slate-300 mb-4">
                We may collect information about you in a variety of ways. The information we may collect
                includes:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Personal data you provide when creating an account</li>
                <li>Email content and metadata (with your explicit consent)</li>
                <li>Usage data and analytics</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
              <p className="text-slate-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Provide and maintain our services</li>
                <li>Process and analyze your emails for intelligence insights</li>
                <li>Improve our AI algorithms and user experience</li>
                <li>Send you updates and notifications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <p className="text-slate-300 mb-4">
                We implement appropriate security measures to protect your personal information against
                unauthorized access, alteration, disclosure, or destruction. However, no internet-based
                service is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Email Processing</h2>
              <p className="text-slate-300 mb-4">
                Our email intelligence system operates with read-only access to your Gmail account. We:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Never store or retain personal email content permanently</li>
                <li>Process emails only to extract actionable insights and priorities</li>
                <li>Use bank-level security for all data transmission</li>
                <li>Allow you to revoke access at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <p className="text-slate-300 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Access and review your personal data</li>
                <li>Request correction of inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential communications</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <p className="text-slate-300">
                If you have any questions about this Privacy Policy, please contact us at{' '}
                <a href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300">
                  {import.meta.env.VITE_SUPPORT_EMAIL}
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;