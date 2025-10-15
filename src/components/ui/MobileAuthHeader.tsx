import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

const MobileAuthHeader: React.FC = () => {
  return (
    <>
      {/* Mobile Header - homepage style */}
      <div className="lg:hidden h-16 backdrop-blur-sm border-b border-indigo-500/20 flex items-center justify-between px-4" style={{ background: 'rgba(15, 15, 35, 0.98)' }}>
        {/* Return home button - left side with Get Started styling */}
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white rounded-md transition-all duration-300 hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 2px 8px 0 rgba(99, 102, 241, 0.3)',
            fontWeight: 600
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px 0 rgba(99, 102, 241, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(99, 102, 241, 0.3)';
          }}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Return home
        </Link>

        {/* Logo - center */}
        <div className="flex items-center">
          <h1 className="text-lg font-bold text-indigo-400">HOMEOPS.AI</h1>
        </div>

        {/* Empty space for balance */}
        <div className="w-24"></div>
      </div>
    </>
  );
};

export default MobileAuthHeader;