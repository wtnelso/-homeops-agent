import React, { useRef } from 'react';
import { Plus, X, User } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { FileValidationService } from '../../services/fileValidation';

interface AvatarUploadProps {
  currentAvatar: string | null;
  userProvidedAvatar: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => void;
  uploading?: boolean;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  userProvidedAvatar,
  onUpload,
  onDelete,
  uploading = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Determine which avatar to show (user-provided takes precedence)
  const displayAvatar = userProvidedAvatar || currentAvatar;

  const handleFileSelect = async (file: File) => {
    try {
      // Comprehensive file validation
      const validationResult = await FileValidationService.validateImageFile(file);
      
      if (!validationResult.valid) {
        const userFriendlyError = FileValidationService.getValidationErrorMessage(validationResult);
        showToast(userFriendlyError, 'error');
        return;
      }

      // File is valid, proceed with upload
      await onUpload(file);
    } catch (error) {
      console.error('File validation error:', error);
      showToast('Failed to validate file. Please try again.', 'error');
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      {/* Avatar Display */}
      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {displayAvatar ? (
          <img
            src={displayAvatar}
            alt="Profile picture"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.removeAttribute('style');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${displayAvatar ? 'hidden' : ''}`}>
          <User className="w-8 h-8 text-gray-400" />
        </div>
      </div>
      
      {/* Action button overlay */}
      <button
        onClick={userProvidedAvatar ? onDelete : handleUploadClick}
        disabled={uploading}
        className="absolute -top-1 -right-1 w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors shadow-sm disabled:opacity-50"
        title={userProvidedAvatar ? "Remove custom avatar" : "Upload avatar"}
      >
        {uploading ? (
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
        ) : userProvidedAvatar ? (
          <X className="w-3 h-3" />
        ) : (
          <Plus className="w-3 h-3" />
        )}
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={uploading}
      />
    </div>
  );
};

export default AvatarUpload;