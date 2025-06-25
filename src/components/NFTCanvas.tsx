'use client';

import React from 'react';
import { NFTType } from '@/types';
import Image from 'next/image'; // <<< Uncomment Image import

interface NFTCanvasProps {
  nft: NFTType | null; // Allow null for initial state
}

// Remove fixed display dimensions constants
// const DISPLAY_WIDTH = 961;
// const DISPLAY_HEIGHT = 1441;

const NFTCanvas: React.FC<NFTCanvasProps> = ({ nft }) => {
  // <<< Delete the simplified Render for Testing >>>
  /* 
  return (
    <div 
       className="bg-purple-900 rounded-lg shadow-lg w-full aspect-[961/1441]"
       title={nft ? `NFT: ${nft.name}` : 'Placeholder'} 
    >
    </div>
  );
  */

  // <<< Uncomment original code >>>
  if (!nft || !nft.image) { 
    return (
        <div className="bg-gray-900 rounded-lg shadow-lg flex items-center justify-center w-full aspect-[961/1441]">
            <div className="text-center text-gray-500">NFT Preview</div>
        </div>
    );
  }
  return (
    <div className="bg-gray-900 rounded-lg shadow-lg flex items-center justify-center relative w-full aspect-[961/1441]">
      <Image
        src={nft.image} 
        alt={nft.name || 'Generated NFT'}
        fill 
        className="object-contain pointer-events-none"
        priority 
        unoptimized={true} 
        onError={(e) => { console.error('Error loading NFT image:', nft.image); }}
      />
    </div>
  );
};

export default NFTCanvas; 