import Layout from './Layout';

const Terms: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-800 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-slate-600 mb-6">
              Last updated: {new Date().toLocaleDateString()}
            </p>
            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Acceptance of Terms</h2>
              <p className="text-slate-600 mb-4">
                By accessing and using HomeOps ("the Service"), you accept and agree to be bound by the 
                terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Description of Service</h2>
              <p className="text-slate-600 mb-4">
                HomeOps is an AI-powered family operations platform that provides email intelligence, 
                calendar management, and family logistics coordination services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">User Responsibilities</h2>
              <p className="text-slate-600 mb-4">
                As a user of HomeOps, you agree to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Provide accurate and truthful information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use the service in compliance with all applicable laws</li>
                <li>Not attempt to disrupt or harm the service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Email Access and Processing</h2>
              <p className="text-slate-600 mb-4">
                By connecting your email account, you grant HomeOps permission to:
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Read and analyze your email content</li>
                <li>Extract relevant information for intelligence insights</li>
                <li>Store processed data securely for service improvement</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Limitation of Liability</h2>
              <p className="text-slate-600 mb-4">
                HomeOps shall not be liable for any indirect, incidental, special, consequential, or 
                punitive damages resulting from your use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Termination</h2>
              <p className="text-slate-600 mb-4">
                We may terminate or suspend your account immediately, without prior notice or liability, 
                for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Changes to Terms</h2>
              <p className="text-slate-600 mb-4">
                We reserve the right to modify or replace these Terms at any time. We will provide notice 
                of any significant changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Contact Information</h2>
              <p className="text-slate-600">
                If you have any questions about these Terms of Service, please contact us at legal@homeops.ai
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Terms;