import { ReactNode } from 'react';
import Navigation from './Navigation';
import Footer from './Footer';

interface LayoutProps {
  children: ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen bg-white ${className}`}>
      <div className="bg-gray-50">
        <Navigation />
      </div>
      <main className="min-h-screen">
        {children}
      </main>
      <div className="bg-gray-50">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;