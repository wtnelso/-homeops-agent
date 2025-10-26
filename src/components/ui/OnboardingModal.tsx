import React from 'react';
import SimplifiedOnboarding from '../onboarding/SimplifiedOnboarding';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">

          {/* Modal content */}
          <div className="max-h-[90vh] overflow-y-auto">
            <SimplifiedOnboarding
              inModal={true}
              onComplete={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;