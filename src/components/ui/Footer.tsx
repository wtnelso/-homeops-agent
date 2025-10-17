import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';
import HomeOpsLogo from './HomeOpsLogo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <HomeOpsLogo width={40} height={40} />
            <span className="text-2xl font-bold">HomeOps</span>
          </div>
          <div className="flex gap-8 text-sm">
            <Link to={ROUTES.PRIVACY} className="text-slate-400 hover:text-white transition">Privacy</Link>
            <Link to={ROUTES.TERMS} className="text-slate-400 hover:text-white transition">Terms</Link>
            <a href="mailto:hello@homeops.ai?subject=Support" className="text-slate-400 hover:text-white transition">Contact</a>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-slate-400 text-sm">
            © 2025 HomeOps. All rights reserved. Mental Load Operating System™
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;