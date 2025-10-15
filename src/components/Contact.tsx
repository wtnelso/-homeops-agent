import React, { useState, useEffect } from 'react';
import { MapPin, Mail, MessageCircle } from 'lucide-react';
import Header from './shared/Header';
import Footer from './Footer';

const Contact: React.FC = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult('Sending...');

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitResult('Thank you! Your message has been sent.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      setSubmitResult('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitResult(''), 5000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <div className="pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold lg:tracking-tight text-white">Contact Us</h1>
            <p className="text-lg mt-4 text-slate-300">We're here to help you streamline your family operations.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div>
              <h2 className="font-semibold text-2xl text-white mb-6">Get in Touch</h2>
              <p className="text-lg leading-relaxed text-slate-300 mb-8">
                Have questions about HomeOps? Need help getting started? Our team is here to support you in transforming your family's mental load into mental clarity.
              </p>

              <div className="space-y-6">
                <div className="flex items-center space-x-4 text-slate-300">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Email</p>
                    <a href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL}`} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                      {import.meta.env.VITE_SUPPORT_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-slate-300">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Location</p>
                    <p>San Francisco, CA</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-slate-300">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Response Time</p>
                    <p>Within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400 text-white"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    placeholder="Tell us how we can help..."
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400 text-white resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>

                {submitResult && (
                  <div className={`text-center ${
                    submitResult.includes('Thank you') ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {submitResult}
                  </div>
                )}
              </form>
            </div>
          </div>

          <div className="mt-20 bg-slate-800 rounded-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h3>
              <p className="text-slate-300">Get quick answers to common questions about HomeOps.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 text-left max-w-4xl mx-auto">
              <div>
                <h4 className="font-semibold text-white mb-3">How secure is my email data?</h4>
                <p className="text-slate-300">We use enterprise-grade encryption and never store your email content permanently. All processing happens securely with read-only access, and your data remains completely private.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3">Which email providers do you support?</h4>
                <p className="text-slate-300">Currently we support Gmail with plans to expand to Outlook, Yahoo, and other major email providers in the coming months.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3">Can I cancel anytime?</h4>
                <p className="text-slate-300">Yes, you can cancel your subscription at any time with no penalties or hidden fees. Your data will be securely deleted upon request.</p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3">Do you offer family discounts?</h4>
                <p className="text-slate-300">Our Family plan is designed for households with up to 6 members. Contact us for custom arrangements for larger families or special circumstances.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;