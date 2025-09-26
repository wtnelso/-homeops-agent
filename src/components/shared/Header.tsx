import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  currentPage?: 'home' | 'pricing';
}

const Header: React.FC<HeaderProps> = ({ currentPage = 'home' }) => {
  const navRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Add scroll effect to navigation
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
    };

    window.addEventListener('scroll', handleScroll);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleFeaturesClick = (e: React.MouseEvent) => {
    if (currentPage === 'home') {
      // If on homepage, scroll to features section
      e.preventDefault();
      const element = document.querySelector('#features');
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth'
        });
      }
    } else {
      // If on another page, navigate to homepage then scroll
      e.preventDefault();
      navigate('/');
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
  };

  return (
    <nav className="header-nav" ref={navRef}>
      <Link to="/" className="header-logo">HOMEOPS.AI</Link>
      <ul className="header-nav-links">
        <li>
          <Link
            to="/"
            className={currentPage === 'home' ? 'active' : ''}
          >
            Home
          </Link>
        </li>
        <li>
          <button
            onClick={handleFeaturesClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: 0,
              fontSize: 'inherit',
              fontFamily: 'inherit'
            }}
          >
            Features
          </button>
        </li>
        <li>
          <Link
            to="/pricing"
            className={currentPage === 'pricing' ? 'active' : ''}
          >
            Pricing
          </Link>
        </li>
      </ul>
      <Link to="/signup" className="header-cta-button">Get Started</Link>
      <button className="header-mobile-menu-toggle" aria-label="Toggle menu">☰</button>
    </nav>
  );
};

export default Header;