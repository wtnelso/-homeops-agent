import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

const MobileAuthFooter: React.FC = () => {
  return (
    <div className="lg:hidden bg-slate-900 text-slate-400">
      <div className="px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-slate-500 mb-4 md:mb-0">
            © {new Date().getFullYear()} HomeOps. All rights reserved.
          </p>
          <div className="flex items-center space-x-4">
            <Link to={ROUTES.PRIVACY} className="text-sm text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to={ROUTES.TERMS} className="text-sm text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAuthFooter;