import { MapPin, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import Layout from './Layout';

const Contact: React.FC = () => {
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
    <Layout>
      <div className="max-w-6xl mx-auto px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold lg:tracking-tight">Contact</h1>
        <p className="text-lg mt-4 text-slate-600">We are here to help.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10 mx-auto max-w-4xl mt-16">
        <div>
          <h2 className="font-medium text-2xl text-gray-800">Contact HomeOps</h2>
          <p className="text-lg leading-relaxed text-slate-500 mt-3">
            Have something to say? We are here to help. Fill up the form or send
            email or call phone.
          </p>
          <div className="mt-5">
            <div className="flex items-center mt-2 space-x-2 text-gray-600">
              <MapPin className="text-gray-400 w-4 h-4" />
              <span>San Francisco, CA 94102</span>
            </div>
            <div className="flex items-center mt-2 space-x-2 text-gray-600">
              <Mail className="text-gray-400 w-4 h-4" />
              <a href="mailto:hello@homeops.ai" className="hover:text-blue-500">
                hello@homeops.ai
              </a>
            </div>
            <div className="flex items-center mt-2 space-x-2 text-gray-600">
              <Phone className="text-gray-400 w-4 h-4" />
              <a href="tel:+1 (555) 123-4567" className="hover:text-blue-500">
                +1 (555) 123-4567
              </a>
            </div>
          </div>
        </div>
        
        <div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 placeholder:text-gray-800 rounded-md outline-none focus:ring-4 border-gray-300 focus:border-gray-600 ring-gray-100"
              />
            </div>
            
            <div>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 placeholder:text-gray-800 rounded-md outline-none focus:ring-4 border-gray-300 focus:border-gray-600 ring-gray-100"
              />
            </div>
            
            <div>
              <textarea
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border-2 placeholder:text-gray-800 rounded-md outline-none h-36 focus:ring-4 border-gray-300 focus:border-gray-600 ring-gray-100 resize-none"
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
            
            {submitResult && (
              <div className={`mt-3 text-center ${
                submitResult.includes('Thank you') ? 'text-green-500' : 'text-red-500'
              }`}>
                {submitResult}
              </div>
            )}
          </form>
        </div>
      </div>

      <div className="mt-20 bg-gray-50 rounded-lg p-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h3>
          <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">How secure is my email data?</h4>
              <p className="text-slate-600">We use enterprise-grade encryption and never store your email content. All processing happens securely and your data remains private.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Which email providers do you support?</h4>
              <p className="text-slate-600">Currently we support Gmail with plans to expand to Outlook, Yahoo, and other major email providers.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Can I cancel anytime?</h4>
              <p className="text-slate-600">Yes, you can cancel your subscription at any time with no penalties or hidden fees.</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Do you offer family discounts?</h4>
              <p className="text-slate-600">Our Family plan is designed for households with up to 8 members. Contact us for larger family arrangements.</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default Contact;