import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import UserDropdown from '../ui/UserDropdown';
import { ROUTES } from '../../config/routes';
import './Header.css';

interface HeaderProps {
  currentPage?: 'home' | 'pricing';
}

interface NavItemProps {
  href?: string;
  onClick?: () => void;
  isActive: boolean;
  children: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ href, onClick, isActive, children }) => {
  const baseClasses = "nav-item";
  const activeClasses = isActive ? "nav-item-active" : "";

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick();
    }
  };

  if (href) {
    return (
      <Link to={href} className={`${baseClasses} ${activeClasses}`} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses} nav-button`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  const navRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const [featuresActive, setFeaturesActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine active page based on current route
  const getActivePage = () => {
    if (currentPage) return currentPage; // Use prop if provided for backward compatibility

    switch (location.pathname) {
      case ROUTES.HOME:
        return 'home';
      case ROUTES.PRICING:
        return 'pricing';
      default:
        return null;
    }
  };

  const activePage = getActivePage();

  useEffect(() => {
    // Add scroll effect to navigation and features section detection
    const handleScroll = () => {
      if (navRef.current) {
        if (window.scrollY > 50) {
          navRef.current.style.background = 'rgba(15, 15, 35, 0.99)';
          navRef.current.style.borderBottomColor = 'rgba(99, 102, 241, 0.3)';
        } else {
          navRef.current.style.background = 'rgba(15, 15, 35, 0.98)';
          navRef.current.style.borderBottomColor = 'rgba(99, 102, 241, 0.2)';
        }
      }

      // Check if features section is in view or if we've scrolled past it (only on homepage)
      if (activePage === 'home') {
        const featuresElement = document.querySelector('#features');
        if (featuresElement) {
          const rect = featuresElement.getBoundingClientRect();
          // Features is active if it's in view OR if we've scrolled past it (bottom of features is above viewport)
          const isInViewOrPast = rect.top <= window.innerHeight * 0.5;

          // Only update if state needs to change to avoid unnecessary re-renders
          if (isInViewOrPast && !featuresActive) {
            setFeaturesActive(true);
          } else if (!isInViewOrPast && featuresActive) {
            setFeaturesActive(false);
          }
        }
      }
    };

    // Close mobile menu on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && navRef.current && !navRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activePage, featuresActive, mobileMenuOpen]);

  const handleHomeClick = () => {
    if (activePage === 'home') {
      // If already on homepage, scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // If on another page, navigate and then scroll to top
      navigate(ROUTES.HOME);
      // Small delay to ensure navigation completes before scrolling
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 50);
    }
  };

  const handleFeaturesClick = () => {
    if (activePage === 'home') {
      // If on homepage, scroll to features section
      const element = document.querySelector('#features');
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth'
        });
      }
    } else {
      // If on another page, navigate to homepage then scroll
      navigate(ROUTES.HOME);
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.querySelector('#features');
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    // Close mobile menu after navigation
    setMobileMenuOpen(false);
  };

  const handleMobileNavClick = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const renderAuthSection = () => {
    if (loading) {
      return <div className="auth-loading" />; // Empty placeholder while loading
    }

    if (user) {
      return <UserDropdown />;
    }

    return (
      <div className="auth-buttons">
        <Link to={ROUTES.LOGIN} className="signin-button">
          Sign In
        </Link>
        <Link to={ROUTES.SIGNUP} className="cta-button">
          Get Started
        </Link>
      </div>
    );
  };

  return (
    <nav className="header-nav" ref={navRef}>
      <div className="nav-brand">
        <Link to={ROUTES.HOME} className="brand-logo">
          HOMEOPS.AI
        </Link>
      </div>

      <div className="nav-links">
        <NavItem
          href={ROUTES.HOME}
          onClick={handleHomeClick}
          isActive={activePage === 'home' && !featuresActive}
        >
          Home
        </NavItem>

        <NavItem
          onClick={handleFeaturesClick}
          isActive={featuresActive}
        >
          Features
        </NavItem>

        <NavItem
          href={ROUTES.PRICING}
          isActive={activePage === 'pricing'}
        >
          Pricing
        </NavItem>
      </div>

      <div className="nav-actions">
        {renderAuthSection()}
      </div>

      <button
        className="mobile-menu-toggle"
        aria-label="Toggle menu"
        onClick={toggleMobileMenu}
      >
        ☰
      </button>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-content">
            <NavItem
              href={ROUTES.HOME}
              onClick={() => handleMobileNavClick(handleHomeClick)}
              isActive={activePage === 'home' && !featuresActive}
            >
              Home
            </NavItem>

            <NavItem
              onClick={() => handleMobileNavClick(handleFeaturesClick)}
              isActive={featuresActive}
            >
              Features
            </NavItem>

            <NavItem
              href={ROUTES.PRICING}
              onClick={() => handleMobileNavClick(() => navigate(ROUTES.PRICING))}
              isActive={activePage === 'pricing'}
            >
              Pricing
            </NavItem>

          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;