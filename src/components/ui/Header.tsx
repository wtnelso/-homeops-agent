import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ROUTES, BETA_MODE } from '../../config/routes';
import HomeOpsLogo from './HomeOpsLogo';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleSectionClick = (sectionId: string) => {
    // Check if we're on the home page
    if (window.location.pathname === '/') {
      // We're on home page, just scroll to section
      const element = document.querySelector(`#${sectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // We're on another page, navigate to home first then scroll
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <>
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={ROUTES.HOME} className="flex items-center gap-1">
              <HomeOpsLogo width={56} height={56} />
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
                HomeOps
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => handleSectionClick('features')}
                className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                Features
              </button>
              <button
                onClick={() => handleSectionClick('how-it-works')}
                className="text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                How It Works
              </button>
              <Link to={ROUTES.PRICING} className="text-slate-600 hover:text-slate-900 transition">Pricing</Link>
              {BETA_MODE ? (
                <Link
                  to={ROUTES.LOGIN}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition"
                >
                  Login
                </Link>
              ) : (
                <>
                  <Link
                    to={ROUTES.LOGIN}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition"
                  >
                    Login
                  </Link>
                  <Link
                    to={ROUTES.SIGNUP}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-white z-40 pt-24 px-6 md:hidden">
          <div className="flex flex-col gap-6">
            <button
              onClick={() => {
                handleSectionClick('features');
                setMobileMenuOpen(false);
              }}
              className="text-xl text-slate-600 text-left"
            >
              Features
            </button>
            <button
              onClick={() => {
                handleSectionClick('how-it-works');
                setMobileMenuOpen(false);
              }}
              className="text-xl text-slate-600 text-left"
            >
              How It Works
            </button>
            <Link
              to={ROUTES.PRICING}
              className="text-xl text-slate-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            {BETA_MODE ? (
              <Link
                to={ROUTES.LOGIN}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Login
              </Link>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to={ROUTES.SIGNUP}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Header;