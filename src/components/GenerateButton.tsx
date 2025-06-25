'use client';

import React from 'react';
import { NFTType } from '@/types';

interface GenerateButtonProps {
  isInitialized: boolean;
  isGenerating: boolean;
  progress: number;
  onClick: () => void;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({
  isInitialized,
  isGenerating,
  progress,
  onClick
}) => {
  const progressWidth = `${progress}%`;
  
  return (
    <div className="w-full">
      {isGenerating ? (
        <div className="relative w-full bg-gray-800 h-12 rounded-md overflow-hidden text-white">
          <div
            className="absolute left-0 top-0 h-full bg-pink-600 transition-all duration-300"
            style={{ width: progressWidth }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            Generating NFT... {Math.round(progress)}%
          </div>
        </div>
      ) : (
        <button
          onClick={onClick}
          disabled={!isInitialized}
          className={`w-full h-12 rounded-md ${
            isInitialized
              ? 'bg-pink-600 hover:bg-pink-700 text-white'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed'
          } transition-colors`}
        >
          {isInitialized ? 'Generate Another NFT' : 'Loading Assets...'}
        </button>
      )}
    </div>
  );
};

export default GenerateButton; 