import React, { useState } from 'react';
import { Save, Check } from 'lucide-react';
import { DataSource } from '../../services/accountProfileService';
import SourceIndicator from './SourceIndicator';
import SourceViewModal from './SourceViewModal';
import { InlineLoader } from './Loader';

interface ProfileFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  source?: DataSource;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'time' | 'textarea' | 'select';
  options?: { value: string; label: string }[];
  className?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  showSaveButton?: boolean;
  onSave?: (value: string) => Promise<void>;
  fieldPath?: string;
}

const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  onChange,
  source,
  placeholder,
  type = 'text',
  options = [],
  className = '',
  disabled = false,
  required = false,
  description,
  showSaveButton = false,
  onSave
}) => {
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const [originalValue, setOriginalValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleViewSource = () => {
    if (source && (source.type === 'chat' || source.type === 'email')) {
      setShowSourceModal(true);
    }
  };

  const handleChange = (newValue: string) => {
    onChange(newValue);
    if (showSaveButton) {
      setIsEdited(newValue !== originalValue);
      setSaveSuccess(false);
    }
  };

  const handleSave = async () => {
    if (!onSave || !isEdited) return;

    setIsSaving(true);
    try {
      await onSave(value);
      setOriginalValue(value);
      setIsEdited(false);
      setSaveSuccess(true);

      // Hide success indicator after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving field:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = () => {
    const baseClasses = `w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' : ''}`;
    const inputContainerClasses = showSaveButton ? 'flex gap-2' : '';

    const inputElement = (() => {
      switch (type) {
        case 'textarea':
          return (
            <textarea
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              className={`${baseClasses} min-h-[80px] resize-y ${showSaveButton ? 'flex-1' : ''}`}
              disabled={disabled}
              rows={3}
            />
          );
        case 'select':
          return (
            <select
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              className={`${baseClasses} ${showSaveButton ? 'flex-1' : ''}`}
              disabled={disabled}
            >
              <option value="">{placeholder || `Select ${label.toLowerCase()}`}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );
        default:
          return (
            <input
              type={type}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              className={`${baseClasses} ${showSaveButton ? 'flex-1' : ''}`}
              disabled={disabled}
            />
          );
      }
    })();

    const saveButton = showSaveButton && (
      <button
        onClick={handleSave}
        disabled={!isEdited || isSaving || disabled}
        className={`px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-1 text-sm font-medium ${
          saveSuccess
            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
            : isEdited && !disabled
            ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-gray-600 cursor-not-allowed'
        }`}
        title={saveSuccess ? 'Saved!' : isEdited ? 'Save changes' : 'No changes to save'}
      >
        {isSaving ? (
          <InlineLoader size="xs" />
        ) : saveSuccess ? (
          <Check className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saveSuccess ? 'Saved' : 'Save'}
      </button>
    );

    return (
      <div className={inputContainerClasses}>
        {inputElement}
        {saveButton}
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <SourceIndicator source={source} onViewSource={handleViewSource} />
      </div>

      {renderInput()}

      {description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}

      {source && showSourceModal && (
        <SourceViewModal
          isOpen={showSourceModal}
          onClose={() => setShowSourceModal(false)}
          source={source}
        />
      )}
    </div>
  );
};

export default ProfileField;