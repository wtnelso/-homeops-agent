import React, { useState, useEffect } from 'react';

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

interface PasswordStrengthCheckerProps {
  password: string;
  confirmPassword?: string;
  className?: string;
}

const requirements: PasswordRequirement[] = [
  {
    id: 'length',
    label: 'At least 8 characters long',
    test: (password: string) => password.length >= 8
  },
  {
    id: 'uppercase',
    label: 'Contains uppercase letter (A-Z)',
    test: (password: string) => /[A-Z]/.test(password)
  },
  {
    id: 'lowercase',
    label: 'Contains lowercase letter (a-z)',
    test: (password: string) => /[a-z]/.test(password)
  },
  {
    id: 'number',
    label: 'Contains a number (0-9)',
    test: (password: string) => /\d/.test(password)
  },
  {
    id: 'special',
    label: 'Contains special character (!@#$%^&*)',
    test: (password: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  }
];

const PasswordStrengthChecker: React.FC<PasswordStrengthCheckerProps> = ({
  password,
  confirmPassword = '',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (password && password.length > 0) {
      // Show with animation
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible) {
      // Hide with closing animation
      setIsClosing(true);
      setTimeout(() => {
        setIsVisible(false);
        setIsClosing(false);
      }, 300); // Match animation duration
    }
  }, [password, isVisible]);

  const getRequirementStatus = (requirement: PasswordRequirement) => {
    if (!password) return 'empty';
    return requirement.test(password) ? 'met' : 'unmet';
  };

  // Don't show if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`mt-4 ${className} ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      {/* Header - always visible when component shows */}
      <div className="text-sm text-gray-500 mb-3">
        Password must meet the following requirements:
      </div>

      {/* Requirements list */}
      <div className="space-y-2">
        {requirements.map((requirement) => {
          const status = getRequirementStatus(requirement);

          return (
            <div key={requirement.id} className="flex items-center space-x-2">
              {status === 'met' ? (
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 transition-all duration-200">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0 transition-all duration-200" />
              )}
              <span className="text-sm text-gray-600">
                {requirement.label}
              </span>
            </div>
          );
        })}

        {/* Password confirmation check - show by default if confirmPassword prop is provided */}
        {confirmPassword !== undefined && (
          <div className="flex items-center space-x-2">
            {password === confirmPassword && password.length > 0 && confirmPassword.length > 0 ? (
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 transition-all duration-200">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0 transition-all duration-200" />
            )}
            <span className="text-sm text-gray-600">
              Passwords match
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordStrengthChecker;