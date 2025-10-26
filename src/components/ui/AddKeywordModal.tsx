import React, { useState, useEffect } from 'react';
import { X, Hash, Tag, School, Mail, MapPin, Sparkles } from 'lucide-react';

interface AddKeywordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (keywordData: any) => Promise<void>;
  editingKeyword?: any;
  isEditing?: boolean;
}

const AddKeywordModal: React.FC<AddKeywordModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  editingKeyword,
  isEditing = false
}) => {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<'activity' | 'school' | 'email_domain' | 'location' | 'other'>('other');
  const [isLoading, setIsLoading] = useState(false);

  // Categories with icons and colors
  const categories = [
    {
      value: 'activity' as const,
      label: 'Activities & Sports',
      icon: Sparkles,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      value: 'school' as const,
      label: 'Schools',
      icon: School,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      value: 'email_domain' as const,
      label: 'Email Domains',
      icon: Mail,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      value: 'location' as const,
      label: 'Important Places',
      icon: MapPin,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      value: 'other' as const,
      label: 'Other',
      icon: Tag,
      color: 'text-gray-600 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-700'
    }
  ];

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (isEditing && editingKeyword) {
        setKeyword(editingKeyword.keyword || '');
        setCategory(editingKeyword.category || 'other');
      } else {
        setKeyword('');
        setCategory('other');
      }
    }
  }, [isOpen, isEditing, editingKeyword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!keyword.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await onAdd({
        keyword: keyword.trim(),
        category
      });
      onClose();
    } catch (error) {
      console.error('Error saving keyword:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Hash className="w-5 h-5" />
            {isEditing ? 'Edit Keyword' : 'Add Keyword'}
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Keyword Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Keyword
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., Soccer, Lincoln Elementary, @school.edu"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={isLoading}
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Category
            </label>
            <div className="grid grid-cols-1 gap-2">
              {categories.map((cat) => (
                <label
                  key={cat.value}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    category === cat.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.value}
                    checked={category === cat.value}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="sr-only"
                    disabled={isLoading}
                  />
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${cat.bg}`}>
                    <cat.icon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {cat.label}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !keyword.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddKeywordModal;