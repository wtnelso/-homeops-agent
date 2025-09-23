import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
};

const Loader: React.FC<LoaderProps> = ({ size = 'md', text }) => {
  return (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 ${sizeClasses[size]}`}
      />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
};

// Page loader for full screen loading
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen bg-transparent flex items-center justify-center">
    <Loader size="lg" text={text} />
  </div>
);

// Inline loader for small loading states
export const InlineLoader: React.FC<{ text?: string; size?: LoaderProps['size'] }> = ({
  text,
  size = 'sm'
}) => (
  <Loader size={size} text={text} />
);

export default Loader;