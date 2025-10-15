import React, { useState, useEffect } from 'react';
import { Plus, Edit } from 'lucide-react';
import Modal from './Modal';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (memberData: any) => Promise<void>;
  editingMember?: any;
  isEditing?: boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onAdd, editingMember, isEditing = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [memberData, setMemberData] = useState({
    name: '',
    type: '',
    email: '',
    age: '',
    birthday_month: '',
    birthday_day: ''
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditing && editingMember) {
      setMemberData({
        name: editingMember.name || '',
        type: editingMember.family_relationship || '',
        email: editingMember.email || '',
        age: editingMember.age ? editingMember.age.toString() : '',
        birthday_month: editingMember.birthday_month || '',
        birthday_day: editingMember.birthday_day ? editingMember.birthday_day.toString() : ''
      });
      setEmailError('');
    } else {
      // Reset form when not editing
      setMemberData({
        name: '',
        type: '',
        email: '',
        age: '',
        birthday_month: '',
        birthday_day: ''
      });
      setEmailError('');
    }
  }, [isEditing, editingMember, isOpen]);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    if (!email) return true; // Email is optional, so empty is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (field: string, value: any) => {
    setMemberData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate email field
    if (field === 'email') {
      if (value && !validateEmail(value)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError('');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!memberData.name || !memberData.type) {
      return;
    }

    // Check for email validation errors
    if (emailError) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(memberData);
      // Reset form
      setMemberData({
        name: '',
        type: '',
        email: '',
        age: '',
        birthday_month: '',
        birthday_day: ''
      });
      setEmailError('');
      onClose();
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
      setMemberData({
        name: '',
        type: '',
        email: '',
        age: '',
        birthday_month: '',
        birthday_day: ''
      });
      setEmailError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Edit Family Member" : "Add New Family Member"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={memberData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Name"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              required
            />
          </div>

          {/* Type Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Type <span className="text-red-500">*</span>
            </label>
            {isEditing && editingMember?.type === 'user' ? (
              <input
                type="text"
                value="Me"
                readOnly
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed"
              />
            ) : (
              <div className="relative">
                <select
                  value={memberData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors appearance-none"
                  required
                >
                  <option value="">Select type</option>
                  <option value="partner">Partner</option>
                  <option value="child">Child</option>
                  <option value="pet">Pet</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="grandparent">Grandparent</option>
                  <option value="other">Other</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              value={memberData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Email address"
              className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors ${
                emailError
                  ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            {emailError && (
              <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {emailError}
              </p>
            )}
          </div>

          {/* Age Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Age
            </label>
            <input
              type="number"
              value={memberData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              placeholder="Age"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              min="0"
              max="150"
            />
          </div>
        </div>

        {/* Birthday Section - Full Width */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Birthday
          </label>
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
              <select
                value={memberData.birthday_month}
                onChange={(e) => handleChange('birthday_month', e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors appearance-none"
              >
                <option value="">Month</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="relative">
              <select
                value={memberData.birthday_day}
                onChange={(e) => handleChange('birthday_day', e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors appearance-none"
              >
                <option value="">Day</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
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
            disabled={!memberData.name || !memberData.type || isSubmitting || !!emailError}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              memberData.name && memberData.type && !isSubmitting && !emailError
                ? 'border border-blue-500 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/20'
                : 'border border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isEditing ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isSubmitting
              ? (isEditing ? 'Updating...' : 'Adding...')
              : (isEditing ? 'Update Member' : 'Add Member')
            }
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal;