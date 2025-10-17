import React from 'react';

interface HomeOpsLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

const HomeOpsLogo: React.FC<HomeOpsLogoProps> = ({
  width = 32,
  height = 32,
  className = ""
}) => (
  <img
    src="/homeops_logo.png"
    alt="HomeOps Logo"
    width={width}
    height={height}
    className={className}
    style={{ objectFit: 'contain' }}
  />
);

export default HomeOpsLogo;