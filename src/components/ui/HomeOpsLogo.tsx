import React from 'react';

interface HomeOpsLogoProps {
  width?: number;
  height?: number;
  className?: string;
  variant?: 'default' | 'text' | 'icon' | 'full';
  showText?: boolean;
}

const HomeOpsLogo: React.FC<HomeOpsLogoProps> = ({
  width = 32,
  height = 32,
  className = "",
  variant = 'default',
  showText = true
}) => {
  // Your actual logo image
  const LogoImage = () => (
    <img
      src="/homeops_logo.png"
      alt="HomeOps Logo"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );

  // Text component
  const LogoText = () => (
    <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
      HomeOps
    </span>
  );

  // Render based on variant
  if (variant === 'icon') {
    return <LogoImage />;
  }
  
  if (variant === 'text') {
    return <LogoText />;
  }
  
  if (variant === 'full') {
    return (
      <div className="flex items-center space-x-3">
        <LogoImage />
        <LogoText />
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center space-x-2">
      <LogoImage />
      {showText && <LogoText />}
    </div>
  );
};

export default HomeOpsLogo;