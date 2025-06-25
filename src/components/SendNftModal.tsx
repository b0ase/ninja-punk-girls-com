'use client';

import React, { useState, useEffect } from 'react';

interface SendNftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (recipient: string) => void; // Callback with recipient handle/address
  nftName?: string;
  nftNumber?: number;
  isLoading?: boolean;
  error?: string | null;
}

const SendNftModal: React.FC<SendNftModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    nftName = 'this NFT',
    nftNumber,
    isLoading,
    error: propError
}) => {
  const [recipient, setRecipient] = useState('');
  const [internalError, setInternalError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setRecipient('');
      setInternalError('');
    }
  }, [isOpen]);

  // Display propError if it exists
  useEffect(() => {
    if (propError) {
        setInternalError(propError);
    }
  }, [propError]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isLoading) return;
    if (!recipient || !recipient.trim()) {
      setInternalError('Please enter a recipient $handle or address.');
      return;
    }
    // Basic validation (starts with $ or is likely an address format)
    if (!recipient.startsWith('$') && recipient.length < 20) { // Very basic address check
       setInternalError('Invalid format. Use $handle or a full address.');
       return;
    }
    setInternalError('');
    onConfirm(recipient.trim());
  };

  const title = nftNumber ? `${nftName} (#${nftNumber})` : nftName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-gray-800 text-white rounded-lg shadow-xl max-w-md w-full p-6 border border-blue-700/50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-blue-300">Send {title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        
        <div className="mb-4">
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-300 mb-1">Recipient</label>
            <input 
                type="text" 
                id="recipient"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter $handle or BSV address"
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {internalError && <p className="text-red-500 text-xs mt-1">{internalError}</p>}
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium rounded"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded flex items-center justify-center ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                </>
            ) : (
                'Confirm Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendNftModal; 