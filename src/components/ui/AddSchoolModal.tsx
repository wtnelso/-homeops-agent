import React, { useState, useEffect } from 'react';
import { Plus, Edit } from 'lucide-react';
import { SCHOOL_TYPE_OPTIONS } from '../../config/schoolTypes';
import Modal from './Modal';

interface AddSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (schoolData: any) => Promise<void>;
  editingSchool?: any;
  isEditing?: boolean;
}

const AddSchoolModal: React.FC<AddSchoolModalProps> = ({ isOpen, onClose, onAdd, editingSchool, isEditing = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schoolData, setSchoolData] = useState({
    name: '',
    type: '',
    email_domain: '',
    grade: ''
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditing && editingSchool) {
      setSchoolData({
        name: editingSchool.name || '',
        type: editingSchool.type || '',
        email_domain: editingSchool.email_domain || '',
        grade: editingSchool.grade || ''
      });
    } else {
      // Reset form when not editing
      setSchoolData({
        name: '',
        type: '',
        email_domain: '',
        grade: ''
      });
    }
  }, [isEditing, editingSchool, isOpen]);

  const handleChange = (field: string, value: any) => {
    setSchoolData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!schoolData.name) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(schoolData);
      // Reset form
      setSchoolData({
        name: '',
        type: '',
        email_domain: '',
        grade: ''
      });
      onClose();
    } catch (error) {
      console.error('Error adding school:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
      setSchoolData({
        name: '',
        type: '',
        email_domain: '',
        grade: ''
      });
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Edit School" : "Add New School"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              School Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={schoolData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="School name"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              required
            />
          </div>

          {/* Type Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={schoolData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors appearance-none"
              >
                <option value="">Select type</option>
                {SCHOOL_TYPE_OPTIONS.map(schoolType => (
                  <option key={schoolType} value={schoolType}>
                    {schoolType}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Email Domain Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Email Domain
            </label>
            <input
              type="text"
              value={schoolData.email_domain}
              onChange={(e) => handleChange('email_domain', e.target.value)}
              placeholder="example.edu"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            />
          </div>

          {/* Grade Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Grade/Year
            </label>
            <input
              type="text"
              value={schoolData.grade}
              onChange={(e) => handleChange('grade', e.target.value)}
              placeholder="e.g., 3rd Grade, Sophomore, etc."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700 mt-8">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-3 border border-gray-400 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!schoolData.name || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              schoolData.name && !isSubmitting
                ? 'border border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20'
                : 'border border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isEditing ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isSubmitting
              ? (isEditing ? 'Updating...' : 'Adding...')
              : (isEditing ? 'Update School' : 'Add School')
            }
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSchoolModal;