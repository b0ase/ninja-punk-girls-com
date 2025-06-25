'use client';

import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode; // Allow string or JSX
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  confirmButtonStyle?: string; // Optional Tailwind classes for confirm button
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  confirmButtonStyle = 'bg-red-600 hover:bg-red-700' // Default to red for destructive actions
}) => {
  if (!isOpen) {
    return null;
  }

  // Prevent closing when clicking inside the modal content
  const handleModalContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out" 
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg shadow-2xl p-6 w-full max-w-md border border-pink-500/50 transform transition-all duration-300 ease-in-out scale-100" 
        onClick={handleModalContentClick} 
      >
        {/* Title */}
        <h2 className="text-xl lg:text-2xl font-bold text-pink-400 mb-4 text-center">{title}</h2>
        
        {/* Message */}
        <div className="text-gray-300 text-sm mb-6 text-center">
          {message}
        </div>

        {/* Action Buttons */}
        <div className={`flex ${cancelText ? 'justify-between' : 'justify-center'} space-x-4`}>
          {cancelText && (
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-wait ${confirmButtonStyle} ${!cancelText ? 'w-full' : ''}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                 <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 