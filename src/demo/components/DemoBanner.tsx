import React from 'react';
import { Play, RotateCcw } from 'lucide-react';

interface DemoBannerProps {
  onResetDemo?: () => void;
}

const DemoBanner: React.FC<DemoBannerProps> = ({ onResetDemo }) => {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-center">
      <div className="flex items-center justify-center gap-2 text-sm font-medium">
        <Play className="w-4 h-4" />
        <span>DEMO MODE</span>

        {onResetDemo && (
          <>
            <span className="text-purple-100 mx-2">|</span>
            <button
              onClick={onResetDemo}
              className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Demo
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DemoBanner;