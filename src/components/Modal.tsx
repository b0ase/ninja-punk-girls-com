'use client';

import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl'
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
        className={`bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg shadow-2xl p-6 w-full ${maxWidth} border border-pink-500/50 transform transition-all duration-300 ease-in-out scale-100 max-h-[90vh] overflow-y-auto`} 
        onClick={handleModalContentClick} 
      >
        {/* Header with title and close button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl lg:text-2xl font-bold text-pink-400">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 