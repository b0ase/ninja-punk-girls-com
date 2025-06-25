'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { NFTType } from '@/types';
import NftAttributesTable from './NftAttributesTable';

interface NftSummaryModalProps {
  nftData: NFTType | null;
  isOpen: boolean;
  onClose: () => void;
  onSendClick?: () => void;
  onListClick?: () => void;
  onBurnClick?: () => void;
  onMeltClick?: () => void;
}

const NftSummaryModal: React.FC<NftSummaryModalProps> = ({ nftData, isOpen, onClose, onSendClick, onListClick, onBurnClick, onMeltClick }) => {
  if (!isOpen || !nftData) return null;

  // Define state for the modal's table collapsed status
  const [isModalTableCollapsed, setIsModalTableCollapsed] = useState(false); // Default to expanded

  // Handler to toggle the modal's table collapsed state
  const toggleModalTableCollapse = () => {
    setIsModalTableCollapsed(!isModalTableCollapsed);
  };

  // Filter attributes to exclude 'GLOW' before passing to the table
  const filteredAttributes = nftData.attributes.filter(attr => attr.layer !== 'GLOW');

  // Helper to format stat names (e.g., strength -> Strength)
  const formatStatName = (stat: string) => stat.charAt(0).toUpperCase() + stat.slice(1);

  // Helper to determine rarity color (example)
  const getRarityColor = (rarity?: string): string => {
    switch (rarity?.toLowerCase()) {
      case 'mythical': return 'text-purple-400';
      case 'legendary': return 'text-orange-400';
      case 'epic': return 'text-red-400';
      case 'rare': return 'text-blue-400';
      case 'uncommon': return 'text-green-400';
      case 'common': return 'text-gray-400';
      default: return 'text-gray-500';
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 transition-opacity duration-300"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="bg-gray-900 text-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-purple-700/50"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800 rounded-t-lg">
          <h2 className="text-xl font-semibold text-purple-300">
            NFT Summary: {nftData.name} (#{nftData.number}) - {nftData.team}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl font-bold"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Content Area - Main scrollable container */}
        <div className="p-5 overflow-y-auto flex-grow flex flex-col md:flex-row gap-6">
        
          {/* Left Column: Image & Basic Info */}
          <div className="w-full md:w-1/3 flex flex-col items-center gap-4 flex-shrink-0">
            {nftData.image && (
              <div className="w-full aspect-square relative rounded overflow-hidden border border-gray-700">
                 <Image 
                   src={nftData.image} 
                   alt={`NFT ${nftData.name}`} 
                   layout="fill" 
                   objectFit="contain" 
                   priority // Load image eagerly as it's the main content
                   unoptimized // If images are external or paths complex
                 />
              </div>
            )}
             <div className="text-center w-full space-y-1">
                <p><span className="font-semibold text-gray-400">Team:</span> {nftData.team}</p>
                <p><span className="font-semibold text-gray-400">Series:</span> {nftData.series}</p>
                <p><span className="font-semibold text-gray-400">Total Supply:</span> {nftData.totalSupply.toLocaleString()}</p>
                {/* QR Data might be too long, consider showing only if needed or a snippet */}
                {/* <p><span className="font-semibold text-gray-400">QR Data:</span> <span className="text-xs break-all">{nftData.qrData}</span></p> */}
            </div>
            {/* Stats */}
            <div className="w-full bg-gray-800/50 p-3 rounded border border-gray-700">
                <h3 className="text-lg font-semibold mb-2 text-center text-purple-300">Total Stats</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  {Object.entries(nftData.stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-gray-400">{formatStatName(key)}:</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
             </div>

             {/* Action Buttons - Use Callbacks */} 
             <div className="mt-5 pt-4 border-t border-gray-700 flex flex-wrap justify-center gap-3">
                {/* KEEP Button (Remains Disabled) */}
                <button 
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded shadow-md transition-colors opacity-50 cursor-not-allowed"
                    title="KEEP functionality is not implemented separately."
                    disabled 
                >
                    KEEP
                </button>
                {/* BURN Button */}
                <button 
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded shadow-md transition-colors"
                    onClick={onBurnClick}
                >
                    BURN
                </button>
                {/* MELT Button */}
                <button 
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded shadow-md transition-colors"
                    onClick={onMeltClick}
                >
                    MELT
                </button>
                {/* Send Button */}
                <button 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded shadow-md transition-colors"
                    onClick={onSendClick}
                >
                    SEND
                </button>
                {/* List Button */}
                <button 
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded shadow-md transition-colors"
                    onClick={onListClick}
                >
                    LIST
                </button>
            </div>
          </div>

          {/* Right Column: Attributes Table */}
          <div className="w-full md:w-2/3 flex flex-col">
             <h3 className="text-lg font-semibold mb-3 text-purple-300 flex-shrink-0">Attributes</h3>
             <div className="flex-grow overflow-y-auto overflow-x-auto custom-scrollbar p-4">
                {/* Pass filtered attributes and state/handler to the table */}
                <NftAttributesTable 
                    attributes={filteredAttributes} 
                    isCollapsed={isModalTableCollapsed}
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NftSummaryModal; 