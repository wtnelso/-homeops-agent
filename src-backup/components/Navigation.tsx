import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { NAV_ITEMS, ROUTES } from '../config/routes';
import { IS_LIVE, IS_MOCK_LOGGED_IN } from '../config/vars';

const Navigation: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isLoggedIn = IS_MOCK_LOGGED_IN; // TODO: Replace with real auth state

const mainNavItems = IS_LIVE 
  ? NAV_ITEMS.filter((item) => item.path !== ROUTES.HOME && item.path !== ROUTES.DASHBOARD)
  : [];

  return (
    <div className="max-w-6xl mx-auto px-4">
      <header className="flex flex-col lg:flex-row justify-between items-center my-5">
        <div className="flex w-full lg:w-auto items-center justify-between">
          <Link to={ROUTES.HOME} className="text-lg">
            <span className="font-bold text-slate-800">Home</span>
            <span className="text-slate-500">Ops</span>
          </Link>
          <div className="block lg:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-4 h-4 text-gray-800"
            >
              {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>
        
        <div className={`${isMenuOpen ? 'block' : 'hidden'} w-full lg:w-auto mt-2 lg:flex lg:mt-0`}>
          <ul className="flex flex-col lg:flex-row lg:gap-3">
            {mainNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex lg:px-3 py-2 items-center transition-colors ${
                    location.pathname === item.path
                      ? 'text-gray-900 font-medium'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          {IS_LIVE && !isLoggedIn && (
            <div className="lg:hidden flex items-center mt-3 gap-4">
              <Link to={ROUTES.LOGIN} className="text-sm text-gray-600 hover:text-gray-900">
                Log in
              </Link>
              <Link 
                to={ROUTES.SIGNUP} 
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
          {IS_LIVE && isLoggedIn && (
            <div className="lg:hidden flex items-center mt-3">
              <Link 
                to={ROUTES.DASHBOARD} 
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          )}
          {!IS_LIVE && (
            <div className="lg:hidden flex items-center mt-3">
              <span className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg">
                Coming Soon
              </span>
            </div>
          )}
        </div>
        
        {IS_LIVE && !isLoggedIn && (
          <div className="hidden lg:flex items-center gap-4">
            <Link to={ROUTES.LOGIN} className="text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link 
              to={ROUTES.SIGNUP} 
              className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
        {IS_LIVE && isLoggedIn && (
          <div className="hidden lg:flex items-center">
            <Link 
              to={ROUTES.DASHBOARD} 
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        )}
        {!IS_LIVE && (
          <div className="hidden lg:flex items-center">
            <span className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg">
              Coming Soon
            </span>
          </div>
        )}
      </header>
    </div>
  );
};

export default Navigation;