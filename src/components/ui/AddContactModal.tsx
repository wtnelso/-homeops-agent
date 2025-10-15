import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, FileText, Tag } from 'lucide-react';
import Modal from './Modal';
import { useToast } from '../../contexts/ToastContext';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contactData: any) => Promise<void>;
  editingContact?: any;
  isEditing?: boolean;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, onAdd, editingContact, isEditing = false }) => {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactData, setContactData] = useState({
    contact_name: '',
    contact_type: '',
    phone: '',
    email: '',
    notes: ''
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditing && editingContact) {
      setContactData({
        contact_name: editingContact.name || '',
        contact_type: editingContact.contact_type || '',
        phone: editingContact.phone || '',
        email: editingContact.email || '',
        notes: editingContact.notes || ''
      });
    } else {
      // Reset form when not editing
      setContactData({
        contact_name: '',
        contact_type: '',
        phone: '',
        email: '',
        notes: ''
      });
    }
  }, [isEditing, editingContact, isOpen]);

  const handleChange = (field: string, value: any) => {
    setContactData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contactData.contact_name.trim()) {
      showToast('Please enter a contact name', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(contactData);
      onClose();
    } catch (error) {
      console.error('Error saving contact:', error);
      showToast('Failed to save contact. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Contact' : 'Add New Contact'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Name */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="w-4 h-4" />
              Contact Name *
            </label>
            <input
              type="text"
              value={contactData.contact_name}
              onChange={(e) => handleChange('contact_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter contact name"
              required
            />
          </div>

          {/* Contact Type */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag className="w-4 h-4" />
              Contact Type
            </label>
            <input
              type="text"
              value={contactData.contact_type}
              onChange={(e) => handleChange('contact_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., Teacher, Doctor, Coach, Neighbor"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </label>
            <input
              type="tel"
              value={contactData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter phone number"
            />
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input
              type="email"
              value={contactData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter email address"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4" />
              Notes
            </label>
            <textarea
              value={contactData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Contact' : 'Add Contact'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default AddContactModal;