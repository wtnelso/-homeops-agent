import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { IS_LIVE } from '../config/vars';
import HomeOpsLogo from './ui/HomeOpsLogo';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center space-x-3">
          <HomeOpsLogo width={32} height={32} variant="icon" />
          <h1 className="text-xl font-semibold text-gray-900">HomeOps</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to={ROUTES.LOGIN}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to={ROUTES.SIGNUP}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* Main Content - Claude-like Design */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo Section */}
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <HomeOpsLogo width={120} height={120} variant="icon" />
            </div>
            
            {/* Welcome Message */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How can I help you today?
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto">
              HomeOps helps you stay ahead by surfacing what matters — from school updates to appointments — and turning mental clutter into calm, organized action.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to={ROUTES.LOGIN}
              className="bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              Sign In
            </Link>
            <Link
              to={ROUTES.SIGNUP}
              className="border border-gray-300 text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 sm:p-6 text-center text-sm text-gray-500">
        <p>HomeOps AI can make mistakes. Please verify important information.</p>
      </div>
    </div>
  );
};

export default Landing;