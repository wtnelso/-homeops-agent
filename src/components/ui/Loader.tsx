import React from 'react';

// Simple utility to combine class names
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

interface LoaderProps {
  /** Size variant of the loader */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Custom size in pixels (overrides size variant) */
  customSize?: number;
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'white' | 'current';
  /** Loading text to display */
  text?: string;
  /** Whether to show as fullscreen overlay */
  fullscreen?: boolean;
  /** Custom className for the container */
  className?: string;
  /** Custom className for the spinner */
  spinnerClassName?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const variantClasses = {
  primary: 'border-blue-600 dark:border-blue-400',
  secondary: 'border-gray-600 dark:border-gray-400',
  white: 'border-white',
  current: 'border-current'
};

const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  customSize,
  variant = 'primary',
  text,
  fullscreen = false,
  className,
  spinnerClassName
}) => {
  const sizeClass = customSize ? '' : sizeClasses[size];
  const customSizeStyle = customSize ? { width: customSize, height: customSize } : {};

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-t-transparent',
        sizeClass,
        variantClasses[variant],
        spinnerClassName
      )}
      style={customSizeStyle}
    />
  );

  const content = (
    <div className={cn(
      'flex items-center justify-center',
      text && 'flex-col gap-2',
      className
    )}>
      {spinner}
      {text && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Specialized loader variants for common use cases
export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="min-h-screen bg-transparent flex items-center justify-center">
    <Loader size="xl" text={text} />
  </div>
);

export const InlineLoader: React.FC<{ text?: string; size?: LoaderProps['size'] }> = ({
  text,
  size = 'sm'
}) => (
  <Loader size={size} text={text} variant="current" />
);

export const OverlayLoader: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <Loader size="lg" text={text} fullscreen />
);

export const SubtleOverlay: React.FC<{ text?: string }> = ({ text = 'Saving...' }) => (
  <div className="fixed inset-0 bg-black/10 dark:bg-black/20 backdrop-blur-[1px] flex items-center justify-center z-40">
    <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-600">
      <Loader size="sm" text={text} />
    </div>
  </div>
);

export const ButtonLoader: React.FC = () => (
  <Loader size="xs" variant="white" spinnerClassName="border-white" />
);

export default Loader;