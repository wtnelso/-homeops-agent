import React, { useState } from 'react';
import { MessageSquare, Mail, User, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { DataSource } from '../../services/accountProfileService';

interface SourceIndicatorProps {
  source?: DataSource;
  onViewSource?: () => void;
  originalText?: string;
  showOriginalToggle?: boolean;
  className?: string;
}

const SourceIndicator: React.FC<SourceIndicatorProps> = ({
  source,
  onViewSource,
  originalText,
  showOriginalToggle = true,
  className = ""
}) => {
  const [showOriginal, setShowOriginal] = useState(false);
  if (!source) {
    return null;
  }

  const getIcon = () => {
    switch (source.type) {
      case 'chat':
        return <MessageSquare className="w-3 h-3" />;
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'manual':
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getColor = () => {
    switch (source.type) {
      case 'chat':
        return 'text-blue-500 hover:text-blue-700';
      case 'email':
        return 'text-green-500 hover:text-green-700';
      case 'manual':
      default:
        return 'text-gray-500 hover:text-gray-700';
    }
  };

  const getTooltip = () => {
    switch (source.type) {
      case 'chat':
        return `From chat conversation${source.timestamp ? ` (${new Date(source.timestamp).toLocaleDateString()})` : ''}`;
      case 'email':
        return `From email${source.email_subject ? `: ${source.email_subject}` : ''}${source.timestamp ? ` (${new Date(source.timestamp).toLocaleDateString()})` : ''}`;
      case 'manual':
      default:
        return 'Manually entered';
    }
  };

  const canViewSource = source.type === 'chat' || source.type === 'email';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Horizontal layout like the agent memory section */}
      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
        {/* Confidence Score */}
        {source.confidence && (
          <div className="flex items-center space-x-1">
            <span className="font-medium">Confidence:</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              source.confidence >= 0.8 ? 'bg-green-100 text-green-800' :
              source.confidence >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {Math.round(source.confidence * 100)}%
            </span>
          </div>
        )}

        {/* Source Type */}
        <div className="flex items-center space-x-1">
          <span className="font-medium">Source:</span>
          <div className="inline-flex items-center space-x-1">
            <span className="inline-flex items-center space-x-1 text-gray-500" title={getTooltip()}>
              {getIcon()}
              <span>{source.type === 'chat' ? 'Chat' : source.type === 'email' ? 'Email' : 'Manual Entry'}</span>
            </span>
            {canViewSource && (
              <button
                onClick={onViewSource}
                className="inline-flex items-center text-blue-600"
                title="View source"
              >
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Created Date */}
        {source.timestamp && (
          <div className="flex items-center space-x-1">
            <span className="font-medium">Created:</span>
            <span>{new Date(source.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</span>
          </div>
        )}

        {/* Show Original Button */}
        {originalText && showOriginalToggle && (
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showOriginal ? (
              <>
                <EyeOff className="w-3 h-3" />
                <span>Hide original</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3" />
                <span>Show original</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Original text expansion */}
      {showOriginal && originalText && (
        <div className="p-2 bg-gray-50 rounded-md">
          <div className="text-xs font-medium text-gray-700 mb-1">
            Original text:
          </div>
          <div className="text-sm text-gray-600 italic">
            "{originalText}"
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceIndicator;