import React, { useState, useEffect } from 'react';
import { Plus, Edit } from 'lucide-react';
import { FREQUENCY_OPTIONS } from '../../config/frequencies';
import Modal from './Modal';

interface AddHobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (hobbyData: any) => Promise<void>;
  editingHobby?: any;
  isEditing?: boolean;
}

const AddHobbyModal: React.FC<AddHobbyModalProps> = ({ isOpen, onClose, onAdd, editingHobby, isEditing = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hobbyData, setHobbyData] = useState({
    name: '',
    type: '',
    frequency: '',
    days: [] as string[],
    end_date: ''
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditing && editingHobby) {
      setHobbyData({
        name: editingHobby.name || '',
        type: editingHobby.type || '',
        frequency: editingHobby.frequency || '',
        days: editingHobby.days || [],
        end_date: editingHobby.end_date || ''
      });
    } else {
      // Reset form when not editing
      setHobbyData({
        name: '',
        type: '',
        frequency: '',
        days: [],
        end_date: ''
      });
    }
  }, [isEditing, editingHobby, isOpen]);

  const handleChange = (field: string, value: any) => {
    setHobbyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDaysChange = (day: string, checked: boolean) => {
    setHobbyData(prev => ({
      ...prev,
      days: checked
        ? [...prev.days, day]
        : prev.days.filter(d => d !== day)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hobbyData.name) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(hobbyData);
      // Reset form
      setHobbyData({
        name: '',
        type: '',
        frequency: '',
        days: [],
        end_date: ''
      });
      onClose();
    } catch (error) {
      console.error('Error adding hobby:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset form when closing
      setHobbyData({
        name: '',
        type: '',
        frequency: '',
        days: [],
        end_date: ''
      });
      onClose();
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? "Edit Activity/Hobby" : "Add New Activity/Hobby"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Activity/Hobby Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={hobbyData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Activity or hobby name"
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
                value={hobbyData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors appearance-none"
              >
                <option value="">Select type</option>
                <option value="sport">Sport</option>
                <option value="creative">Creative</option>
                <option value="educational">Educational</option>
                <option value="social">Social</option>
                <option value="outdoor">Outdoor</option>
                <option value="indoor">Indoor</option>
                <option value="fitness">Fitness</option>
                <option value="faith">Faith</option>
                <option value="hobby">Hobby</option>
                <option value="other">Other</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Frequency Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Frequency
            </label>
            <div className="relative">
              <select
                value={hobbyData.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors appearance-none"
              >
                <option value="">Select frequency</option>
                {FREQUENCY_OPTIONS.map(frequency => (
                  <option key={frequency} value={frequency}>
                    {frequency}
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

          {/* Days of Week */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Days of Week
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {daysOfWeek.map((day) => (
                <label key={day} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hobbyData.days.includes(day)}
                    onChange={(e) => handleDaysChange(day, e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{day.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              End Date (Optional)
            </label>
            <input
              type="date"
              value={hobbyData.end_date}
              onChange={(e) => handleChange('end_date', e.target.value)}
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
            disabled={!hobbyData.name || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              hobbyData.name && !isSubmitting
                ? 'border border-green-500 text-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20'
                : 'border border-gray-300 text-gray-400 dark:border-gray-600 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {isEditing ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isSubmitting
              ? (isEditing ? 'Updating...' : 'Adding...')
              : (isEditing ? 'Update Activity' : 'Add Activity')
            }
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddHobbyModal;