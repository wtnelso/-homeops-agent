import React, { useEffect } from 'react';
import Header from './ui/Header';
import Footer from './ui/Footer';

const Privacy: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

          <div className="prose prose-lg max-w-none">
            <div className="text-gray-600 mb-6">
              <p><strong>Effective Date:</strong> September 8, 2025</p>
              <p><strong>Last Updated:</strong> September 8, 2025</p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
              <p className="text-gray-600 mb-4">
                HomeOps ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered email intelligence service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Personal Information</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Account Information</strong>: Name, email address, and profile details you provide during registration</li>
                <li><strong>Gmail Account Access</strong>: OAuth tokens to access your Gmail account (with your explicit consent)</li>
                <li><strong>User Preferences</strong>: Email categorization preferences, scoring weights, and calibration feedback</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Email Data</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Email Content</strong>: Subject lines, sender information, email snippets, and metadata from your Gmail account</li>
                <li><strong>Email Interactions</strong>: Your rating feedback during calibration ("Interested" vs "Not Interested")</li>
                <li><strong>Usage Patterns</strong>: How you interact with email summaries and dashboard features</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Technical Data</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Device Information</strong>: Browser type, operating system, IP address</li>
                <li><strong>Usage Analytics</strong>: App performance metrics, feature usage statistics</li>
                <li><strong>Error Logs</strong>: Technical logs for debugging and service improvement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Core Service Delivery</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Email Intelligence</strong>: Analyze your emails to provide personalized mental load assessments</li>
                <li><strong>AI Summaries</strong>: Generate intelligent summaries using OpenAI GPT-4</li>
                <li><strong>Pattern Learning</strong>: Build personalized email prioritization models</li>
                <li><strong>Dashboard Insights</strong>: Provide actionable insights about your email patterns</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Service Improvement</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Machine Learning</strong>: Improve our AI algorithms (using anonymized data only)</li>
                <li><strong>Feature Development</strong>: Enhance existing features and develop new ones</li>
                <li><strong>Quality Assurance</strong>: Monitor service performance and reliability</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Communication</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Service Updates</strong>: Notify you about important changes or updates</li>
                <li><strong>Support</strong>: Respond to your questions and provide customer support</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. OpenAI Integration</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Purpose</strong>: Generate AI-powered email summaries and insights</li>
                <li><strong>Data Shared</strong>: Email content (subject, snippet, sender) for processing</li>
                <li><strong>Data Retention</strong>: OpenAI processes data according to their privacy policy</li>
                <li><strong>Opt-out</strong>: You can disable AI summaries in your account settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Google OAuth</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Purpose</strong>: Secure access to your Gmail account</li>
                <li><strong>Permissions</strong>: Read-only access to email content and metadata</li>
                <li><strong>Data Storage</strong>: OAuth tokens stored securely in our Supabase database</li>
                <li><strong>Revocation</strong>: You can revoke access at any time through Google Account settings</li>
              </ul>
              <p className="text-gray-600 mb-6">
                The use of information received from Workspace APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 hover:text-blue-700">Google User Data Policy</a>, including the <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" className="text-blue-600 hover:text-blue-700">Limited User requirements</a>. HomeOps does not use Google Workspace APIs to develop, improve, or train generalized AI and/or ML models.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Supabase (Database)</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Purpose</strong>: Secure storage of user profiles, preferences, and learning data</li>
                <li><strong>Security</strong>: End-to-end encryption, SOC 2 compliance</li>
                <li><strong>Location</strong>: Data stored in secure cloud infrastructure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Encryption</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>In Transit</strong>: All data transmitted using TLS 1.3 encryption</li>
                <li><strong>At Rest</strong>: Database encryption using AES-256 standards</li>
                <li><strong>OAuth Tokens</strong>: Securely encrypted and regularly rotated</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Access Controls</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Limited Access</strong>: Only authorized personnel can access user data</li>
                <li><strong>Audit Logs</strong>: All data access is logged and monitored</li>
                <li><strong>Multi-Factor Authentication</strong>: Required for all administrative access</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Data Minimization</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Necessary Data Only</strong>: We only collect data essential for service functionality</li>
                <li><strong>Regular Cleanup</strong>: Automated deletion of unnecessary logs and temporary data</li>
                <li><strong>Anonymization</strong>: Personal identifiers removed from analytics data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights and Choices</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Data Access</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Account Dashboard</strong>: View and download your personal data</li>
                <li><strong>Data Export</strong>: Request a complete export of your information</li>
                <li><strong>Transparency</strong>: Clear visibility into what data we collect and why</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Data Control</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Email Access Revocation</strong>: Revoke Gmail access permissions at any time</li>
                <li><strong>Preference Updates</strong>: Modify your calibration settings and preferences</li>
                <li><strong>Feature Opt-outs</strong>: Disable specific features like AI summaries</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Data Deletion</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Account Deletion</strong>: Delete your account and all associated data</li>
                <li><strong>Selective Deletion</strong>: Remove specific types of data while keeping your account</li>
                <li><strong>Retention Limits</strong>: Data automatically deleted after specified periods</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Active Accounts</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>User Profiles</strong>: Retained while your account is active</li>
                <li><strong>Learning Data</strong>: Kept to maintain personalized email intelligence</li>
                <li><strong>Email Summaries</strong>: Stored for 90 days, then automatically deleted</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Inactive Accounts</h3>
              <ul className="list-disc list-inside text-gray-600 mb-6 space-y-2">
                <li><strong>Account Dormancy</strong>: Accounts inactive for 2 years will be flagged for deletion</li>
                <li><strong>Data Purging</strong>: All personal data deleted 30 days after account closure</li>
                <li><strong>Legal Requirements</strong>: Some data may be retained longer if required by law</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Analytics Data</h3>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li><strong>Anonymized Metrics</strong>: Retained indefinitely for service improvement</li>
                <li><strong>Personal Identifiers</strong>: Removed from analytics data after 30 days</li>
                <li><strong>Aggregated Insights</strong>: Used to enhance AI algorithms (no personal data)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
              <p className="text-gray-600 mb-4">
                HomeOps is not intended for use by children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
              <p className="text-gray-600 mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.
              </p>
            </section>


            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
              <p className="text-gray-600 mb-4">
                We may update this Privacy Policy periodically. We will notify you of any material changes by:
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4 space-y-2">
                <li>Email notification to your registered email address</li>
                <li>Prominent notice in the HomeOps application</li>
                <li>Updated "Last Modified" date at the top of this policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="bg-gray-50 p-6 rounded-lg mb-4">
                <p className="text-gray-600 mb-4">For questions about this Privacy Policy or your personal data, contact us:</p>
                <p className="text-gray-600">
                  <strong>Email</strong>: <a href="mailto:hello@homeops.ai" className="text-blue-600 hover:text-blue-700">hello@homeops.ai</a>
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Privacy;