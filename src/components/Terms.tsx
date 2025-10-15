import React, { useEffect } from 'react';
import Header from './shared/Header';
import Footer from './Footer';

const Terms: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

          <div className="prose prose-lg max-w-none prose-invert">
            <p className="text-slate-300 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Acceptance of Terms</h2>
              <p className="text-slate-300 mb-4">
                By accessing and using HomeOps ("the Service"), you accept and agree to be bound by the
                terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Description of Service</h2>
              <p className="text-slate-300 mb-4">
                HomeOps is an AI-powered family operations platform that provides email intelligence,
                calendar management, and family logistics coordination services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">User Responsibilities</h2>
              <p className="text-slate-300 mb-4">
                As a user of HomeOps, you agree to:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Provide accurate and truthful information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use the service in compliance with all applicable laws</li>
                <li>Not attempt to disrupt or harm the service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Email Access and Processing</h2>
              <p className="text-slate-300 mb-4">
                By connecting your email account, you grant HomeOps permission to:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Read and analyze your email content (read-only access)</li>
                <li>Extract relevant information for intelligence insights</li>
                <li>Process data securely without permanent storage of personal content</li>
                <li>Provide you with actionable family logistics insights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Service Availability</h2>
              <p className="text-slate-300 mb-4">
                We strive to maintain high service availability, but cannot guarantee uninterrupted access. We may perform maintenance, updates, or improvements that temporarily affect service availability.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Intellectual Property</h2>
              <p className="text-slate-300 mb-4">
                The Service and its original content, features, and functionality are owned by HomeOps and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
              <p className="text-slate-300 mb-4">
                HomeOps shall not be liable for any indirect, incidental, special, consequential, or
                punitive damages resulting from your use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Termination</h2>
              <p className="text-slate-300 mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability,
                for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to Terms</h2>
              <p className="text-slate-300 mb-4">
                We reserve the right to modify or replace these Terms at any time. We will provide notice
                of any significant changes via email or through the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Information</h2>
              <p className="text-slate-300">
                If you have any questions about these Terms of Service, please contact us at{' '}
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

export default Terms;