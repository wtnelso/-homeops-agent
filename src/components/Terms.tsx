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
          <h1 className="text-4xl font-bold text-white mb-8">HomeOps Terms of Service</h1>

          <div className="prose prose-lg max-w-none prose-invert">
            <div className="text-slate-300 mb-6">
              <p><strong>Effective Date:</strong> September 8, 2025</p>
              <p><strong>Last Updated:</strong> September 8, 2025</p>
            </div>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-300 mb-4">
                By accessing or using HomeOps ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these Terms, you may not access the Service.
              </p>
              <p className="text-slate-300 mb-4">
                HomeOps is an AI-powered email intelligence platform that helps users manage mental load by analyzing Gmail content and providing personalized insights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>

              <h3 className="text-xl font-semibold text-white mb-3">2.1 Core Features</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li><strong>Email Intelligence</strong>: AI-powered analysis of your Gmail content</li>
                <li><strong>Mental Load Assessment</strong>: Personalized scoring of email importance</li>
                <li><strong>Pattern Learning</strong>: Machine learning calibration system</li>
                <li><strong>Dashboard Insights</strong>: Actionable summaries and recommendations</li>
                <li><strong>Commerce Intelligence</strong>: Shopping and purchase pattern analysis</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">2.2 Service Requirements</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>Active Gmail account with OAuth permissions</li>
                <li>Compatible web browser (Chrome, Safari, Firefox, Edge)</li>
                <li>Internet connection for real-time email processing</li>
                <li>JavaScript enabled for full functionality</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">2.3 Service Availability</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Target uptime: 99.5% excluding scheduled maintenance</li>
                <li>Scheduled maintenance windows announced 48 hours in advance</li>
                <li>Emergency maintenance may occur without notice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts and Registration</h2>

              <h3 className="text-xl font-semibold text-white mb-3">3.1 Account Creation</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account security</li>
                <li>One account per user; no shared or duplicate accounts</li>
                <li>Must be 13 years or older to create an account</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">3.2 Account Responsibilities</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>Keep your login credentials secure and confidential</li>
                <li>Notify us immediately of any unauthorized account access</li>
                <li>You are responsible for all activities under your account</li>
                <li>Do not share your account with others</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">3.3 Account Termination</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>You may delete your account at any time through account settings</li>
                <li>We may suspend or terminate accounts for Terms violations</li>
                <li>Upon termination, your data will be deleted according to our Privacy Policy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">4. Gmail Integration and Permissions</h2>

              <h3 className="text-xl font-semibold text-white mb-3">4.1 OAuth Authorization</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>HomeOps uses Google OAuth 2.0 for secure Gmail access</li>
                <li>We request read-only permissions to your email content</li>
                <li>You can revoke permissions at any time through Google Account settings</li>
                <li>Revoking permissions will disable core HomeOps functionality</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">4.2 Email Data Usage</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>We analyze email content to provide intelligence insights</li>
                <li>Email data is processed using OpenAI GPT-4 for summaries</li>
                <li>We do not store full email content beyond temporary processing</li>
                <li>Email summaries are retained for 90 days maximum</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">4.3 Data Security</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>All email data is encrypted in transit and at rest</li>
                <li>OAuth tokens are securely stored and regularly rotated</li>
                <li>We implement industry-standard security measures</li>
                <li>No email content is shared with third parties except as disclosed</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">5. Acceptable Use Policy</h2>

              <h3 className="text-xl font-semibold text-white mb-3">5.1 Permitted Uses</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>Personal email management and organization</li>
                <li>Mental load reduction through AI insights</li>
                <li>Pattern learning for email prioritization</li>
                <li>Dashboard analytics for productivity improvement</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">5.2 Prohibited Uses</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>Commercial use without written permission</li>
                <li>Reverse engineering or attempting to extract algorithms</li>
                <li>Using the service to violate any laws or regulations</li>
                <li>Interfering with service security or performance</li>
                <li>Creating fake accounts or misrepresenting identity</li>
                <li>Attempting to access other users' data</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">5.3 Content Guidelines</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Do not use the service to process illegal content</li>
                <li>Respect intellectual property rights in email content</li>
                <li>Do not attempt to bypass security measures</li>
                <li>Report suspected violations to hello@homeops.ai</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">6. Artificial Intelligence and Machine Learning</h2>

              <h3 className="text-xl font-semibold text-white mb-3">6.1 AI Processing</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>HomeOps uses OpenAI GPT-4 for email analysis and summaries</li>
                <li>AI processing is performed on email content you explicitly authorize</li>
                <li>AI models continuously improve based on aggregated, anonymized data</li>
                <li>Individual user data is not used to train general AI models</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">6.2 Machine Learning Calibration</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>The calibration system learns from your email rating feedback</li>
                <li>Personalized models improve email prioritization accuracy</li>
                <li>Learning data remains associated with your account only</li>
                <li>You can reset calibration data at any time</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">6.3 AI Limitations</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>AI summaries are generated content and may contain errors</li>
                <li>HomeOps is not responsible for AI interpretation accuracy</li>
                <li>Users should verify important information independently</li>
                <li>AI insights are suggestions, not professional advice</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property Rights</h2>

              <h3 className="text-xl font-semibold text-white mb-3">7.1 HomeOps Property</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>HomeOps software, algorithms, and interface are our intellectual property</li>
                <li>Service design, logos, and branding are protected by trademark</li>
                <li>Users receive a limited license to use the service as intended</li>
                <li>No rights to copy, modify, or distribute our intellectual property</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">7.2 User Content</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>You retain ownership of your email content and personal data</li>
                <li>You grant HomeOps limited rights to process your data as described</li>
                <li>We do not claim ownership of your email content</li>
                <li>User feedback and calibration data helps improve the service</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">7.3 Third-Party Content</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>OpenAI intellectual property used under appropriate licensing</li>
                <li>Google APIs used in compliance with Google's Terms of Service</li>
                <li>Lucide icons and other third-party assets used under proper licenses</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">8. Privacy and Data Protection</h2>

              <h3 className="text-xl font-semibold text-white mb-3">8.1 Data Collection</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>We collect only data necessary for service functionality</li>
                <li>Email content is processed temporarily for analysis</li>
                <li>User preferences and calibration data are stored securely</li>
                <li>See our Privacy Policy for detailed information</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">8.2 Data Sharing</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>We do not sell or rent your personal information</li>
                <li>Email content may be processed by OpenAI for summaries</li>
                <li>Anonymized, aggregated data may be used for service improvement</li>
                <li>Legal compliance may require limited data disclosure</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">8.3 Data Rights</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>You can access, correct, or delete your personal data</li>
                <li>Email processing can be disabled while maintaining account</li>
                <li>Data export available through account dashboard</li>
                <li>Account deletion removes all associated data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">9. Service Limitations and Disclaimers</h2>

              <h3 className="text-xl font-semibold text-white mb-3">9.1 Service Availability</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>HomeOps is provided "as is" without warranties</li>
                <li>We do not guarantee uninterrupted service availability</li>
                <li>Scheduled maintenance may temporarily interrupt service</li>
                <li>Force majeure events may affect service delivery</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">9.2 AI Accuracy</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>AI-generated summaries and insights are not guaranteed accurate</li>
                <li>Mental load scores are subjective assessments</li>
                <li>Users should verify important information independently</li>
                <li>HomeOps is not responsible for decisions based on AI insights</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">9.3 Email Processing</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>We cannot control Gmail API availability or performance</li>
                <li>Email synchronization depends on Google's service reliability</li>
                <li>Processing delays may occur during high-traffic periods</li>
                <li>Some emails may not be processed due to content restrictions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">10. Limitation of Liability</h2>

              <h3 className="text-xl font-semibold text-white mb-3">10.1 Damages Limitation</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>HomeOps liability is limited to the maximum extent permitted by law</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>Total liability will not exceed the amount paid for the service</li>
                <li>Some jurisdictions do not allow liability limitations</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">10.2 Specific Disclaimers</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Not responsible for decisions made based on AI insights</li>
                <li>Not liable for data loss due to user actions or third-party services</li>
                <li>Not responsible for Gmail access issues or Google service interruptions</li>
                <li>Not liable for misinterpretation of email content or summaries</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">11. Indemnification</h2>
              <p className="text-slate-300 mb-4">
                You agree to indemnify and hold HomeOps harmless from any claims, damages, or expenses arising from:
              </p>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>Your use of the service in violation of these Terms</li>
                <li>Your email content that violates laws or third-party rights</li>
                <li>Unauthorized access to your account due to your negligence</li>
                <li>Your violation of any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to Terms</h2>

              <h3 className="text-xl font-semibold text-white mb-3">12.1 Modification Rights</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>We reserve the right to modify these Terms at any time</li>
                <li>Material changes will be communicated via email and in-app notifications</li>
                <li>Continued use after changes constitutes acceptance</li>
                <li>Users who disagree with changes may terminate their account</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">12.2 Notification Process</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>30 days advance notice for material changes</li>
                <li>Immediate notification for legal compliance changes</li>
                <li>Updated Terms posted on website with revision date</li>
                <li>Email notification to registered users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">13. Termination</h2>

              <h3 className="text-xl font-semibold text-white mb-3">13.1 User Termination</h3>
              <ul className="list-disc list-inside text-slate-300 mb-6 space-y-2">
                <li>You may terminate your account at any time</li>
                <li>Account deletion removes all personal data within 30 days</li>
                <li>Some data may be retained for legal compliance</li>
                <li>Termination does not affect already-processed payments</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">13.2 Service Termination</h3>
              <ul className="list-disc list-inside text-slate-300 mb-4 space-y-2">
                <li>We may terminate accounts for Terms violations</li>
                <li>Service discontinuation requires 90 days notice</li>
                <li>Refunds may be provided for prepaid services</li>
                <li>Data export available before termination</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Information</h2>
              <div className="bg-slate-900 p-6 rounded-lg mb-4">
                <p className="text-slate-300 mb-4">For questions about these Terms of Service:</p>
                <p className="text-slate-300">
                  <strong>Email</strong>: <a href="mailto:hello@homeops.ai" className="text-indigo-400 hover:text-indigo-300">hello@homeops.ai</a>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-white mb-4">15. Effective Date and Acceptance</h2>
              <p className="text-slate-300 mb-4">
                These Terms are effective as of the date first written above. By using HomeOps, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
              <p className="text-slate-400 italic">
                These Terms of Service are designed to provide clear expectations while protecting both HomeOps and our users. We encourage you to read them carefully and contact us with any questions.
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