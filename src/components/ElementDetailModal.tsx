'use client';

import React from 'react';
import Image from 'next/image';
import { NFTAttribute, StatsType } from '@/types';
import { getCardBackgroundPath, getElementAssetUrl } from '@/lib/utils';

interface ElementDetailModalProps {
  elementData: NFTAttribute | null;
  isOpen: boolean;
  onClose: () => void;
  elementCardBackgrounds: Record<string, string>;
}

// Helper to format stat names (e.g., strength -> Strength)
const formatStatName = (stat: string) => stat.charAt(0).toUpperCase() + stat.slice(1);

// Helper function to get Tailwind CSS color class based on rarity string
const getRarityColorClass = (rarity: string): string => {
  const rarityLower = rarity?.toLowerCase() || '';
  switch (rarityLower) {
    case 'common':
      return 'text-green-400 font-medium';
    case 'uncommon':
      return 'text-blue-400 font-medium';
    case 'rare':
      return 'text-purple-400 font-medium';
    case 'legendary':
      return 'text-orange-400 font-medium'; // Often orange/yellow
    case 'mythical':
      return 'text-red-500 font-bold'; // Often red and bold
    default:
      return 'text-gray-300'; // Default color
  }
};

const ElementDetailModal: React.FC<ElementDetailModalProps> = ({ elementData, isOpen, onClose, elementCardBackgrounds }) => {
  if (!isOpen || !elementData) return null;

  const backgroundUrl = getCardBackgroundPath(elementData.layer, elementCardBackgrounds);
  const elementUrl = getElementAssetUrl(elementData);
  
  const stats: StatsType = elementData.stats || { strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0 };
  const metadata = elementData.metadata;
  const assetName = elementData.metadata?.elementName || elementData.name || 'Unknown';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[60] p-4 transition-opacity duration-300" // Higher z-index than NFTDetailModal
      onClick={onClose} // Close on backdrop click
    >
      <div 
        className="bg-gray-800 text-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-teal-500/50" 
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-700 rounded-t-lg">
          <h2 className="text-lg font-semibold text-teal-300">
            Element Details: {assetName} ({elementData.layer})
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white text-2xl font-bold"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-grow flex flex-col md:flex-row gap-5">
          
          {/* Left Column: Composited Element Card Image */}
          <div className="w-full md:w-1/3 flex-shrink-0 flex flex-col items-center">
            <div className="w-full aspect-[2/3] relative rounded overflow-hidden border border-gray-600 bg-gray-900 group">
              <Image 
                src={backgroundUrl} 
                alt={`${elementData.layer} background`}
                layout="fill" 
                objectFit="cover" 
                priority 
                unoptimized
                className="block group-hover:opacity-70 transition-opacity duration-150 z-0"
                onError={(e) => {
                  console.error(`[ElementDetailModal] Background Image Load Error for src: ${backgroundUrl}`);
                  e.currentTarget.src = '/placeholder-element-card.png';
                }}
              />
              <Image 
                src={elementUrl} 
                alt={assetName}
                layout="fill" 
                objectFit="contain" 
                priority 
                unoptimized
                className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-150 z-10"
                onError={(e) => {
                  console.error(`[ElementDetailModal] Element Asset Image Load Error for src: ${elementUrl}`);
                  e.currentTarget.src = '/placeholder-element.png'; 
                  (e.target as HTMLImageElement).style.opacity = '0.5';
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">Element Card Preview</p>
          </div>

          {/* Right Column: Details */}
          <div className="w-full md:w-2/3 space-y-4 text-sm">
            <div>
              <h4 className="text-md font-semibold text-teal-300 mb-1">Identification</h4>
              <div className="space-y-1 text-xs pl-2">
                <p><span className="text-gray-400 w-20 inline-block">Layer:</span> {elementData.layer || 'N/A'}</p>
                <p><span className="text-gray-400 w-20 inline-block">Asset:</span> {assetName}</p>
              </div>
            </div>

            {metadata && (
              <div>
                <h4 className="text-md font-semibold text-teal-300 mb-1">Metadata</h4>
                <div className="space-y-1 text-xs pl-2">
                  {metadata.rarity && (
                    <p>
                      <span className="text-gray-400 w-20 inline-block">Rarity:</span> 
                      <span className={getRarityColorClass(metadata.rarity)}>{metadata.rarity}</span>
                    </p>
                  )}
                  {metadata.characterName && <p><span className="text-gray-400 w-20 inline-block">Character:</span> {metadata.characterName}</p>}
                  {metadata.genes && <p><span className="text-gray-400 w-20 inline-block">Genes:</span> {metadata.genes}</p>}
                  {/* Commented out: elementType does not exist on NFTAttribute */}
                  {/* {elementData.elementType && <p><span className="text-gray-400 w-20 inline-block">Type:</span> {elementData.elementType}</p>} */}
                  <p><span className="text-gray-400 w-20 inline-block">RGB:</span> {metadata.hasRGB ? 'Yes' : 'No'}</p>
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-md font-semibold text-teal-300 mb-1">Stats Contribution</h4>
              {stats ? (
                <div className="space-y-1 text-xs pl-2">
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex justify-between flex-1 min-w-0">
                      <span className="text-gray-400">Strength:</span>
                      <span className="font-medium">{stats.strength}</span>
                    </div>
                    <div className="flex justify-between flex-1 min-w-0">
                      <span className="text-gray-400">Speed:</span>
                      <span className="font-medium">{stats.speed}</span>
                    </div>
                    <div className="flex justify-between flex-1 min-w-0">
                      <span className="text-gray-400">Skill:</span>
                      <span className="font-medium">{stats.skill}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex justify-between flex-1 min-w-0">
                      <span className="text-gray-400">Stamina:</span>
                      <span className="font-medium">{stats.stamina}</span>
                    </div>
                    <div className="flex justify-between flex-1 min-w-0">
                      <span className="text-gray-400">Stealth:</span>
                      <span className="font-medium">{stats.stealth}</span>
                    </div>
                    <div className="flex justify-between flex-1 min-w-0">
                      <span className="text-gray-400">Style:</span>
                      <span className="font-medium">{stats.style}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 pl-2 italic">No stats associated with this element.</p>
              )}
            </div>

          </div>
        </div>

        {/* Footer (Optional) */}
        {/* <div className="p-3 border-t border-gray-700 bg-gray-700 rounded-b-lg text-right"> */}
        {/*   <button onClick={onClose} className="px-4 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">Close</button> */}
        {/* </div> */}
      </div>
    </div>
  );
};

export default ElementDetailModal; 