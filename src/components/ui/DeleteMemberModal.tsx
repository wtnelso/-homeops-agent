import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import Modal from './Modal';

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  memberName: string;
}

const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({ isOpen, onClose, onConfirm, memberName }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting member:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Family Member"
      size="sm"
    >
      <div className="space-y-6">
        {/* Warning Icon and Message */}
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Are you sure?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You're about to delete <span className="font-medium text-gray-900 dark:text-white">{memberName}</span> from your family. This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-6 py-3 border border-gray-400 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-500 dark:hover:bg-gray-700/50 rounded-lg transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-6 py-3 border border-red-500 text-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete Member'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteMemberModal;