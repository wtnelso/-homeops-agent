import { Link } from 'react-router-dom';
import { ROUTES, IS_LIVE } from '../config/routes';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="my-20">
      {IS_LIVE && (
        <div className="flex justify-center space-x-4 mb-4">
          <Link 
            to={ROUTES.PRIVACY} 
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Privacy Policy
          </Link>
          <span className="text-slate-300">•</span>
          <Link 
            to={ROUTES.TERMS} 
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      )}
      <p className="text-center text-sm text-slate-500">
        Copyright © {currentYear} HomeOps. All rights reserved.
      </p>
      <p className="text-center text-xs text-slate-500 mt-1">
        Made with ❤️ for modern families
      </p>
    </footer>
  );
};

export default Footer;