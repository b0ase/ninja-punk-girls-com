'use client';

import React, { useState, useMemo } from 'react';
import { NFTType, StatsType, NFTAttribute } from '@/types';
import { EXCLUDED_LAYERS } from '@/data/layer-config';
import { useHandCashWallet } from '@/context/HandCashWalletContext';

interface NFTSummaryProps {
  nft: { 
    attributes?: NFTAttribute[]; 
    name?: string; 
    number?: number; 
    team?: string; 
    series?: string; 
  } | null;
}

// Helper to create empty stats
const createEmptyStats = (): StatsType => ({
  strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0
});

export default function NFTSummary({ nft }: NFTSummaryProps) {
  const { wallet } = useHandCashWallet();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, (err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  if (!nft || !nft.attributes) {
    return (
      <div className="bg-gray-900 rounded-lg p-5 shadow-lg">
        <h3 className="text-xl font-bold text-pink-500 mb-4">NFT Details</h3>
        <div className="text-gray-400 text-center py-10">
          Generate an NFT to see its details
        </div>
      </div>
    );
  }

  // <<< Calculate Total Stats using useMemo >>>
  const totalStats = useMemo(() => {
    if (!nft || !nft.attributes) return createEmptyStats();
    
    const calculatedStats: StatsType = createEmptyStats();

    nft.attributes.forEach((attr: NFTAttribute) => {
       // Only include stats from non-excluded layers
      if (!EXCLUDED_LAYERS.includes(attr.layer) && attr.stats) {
          Object.keys(calculatedStats).forEach(key => {
              const statKey = key as keyof StatsType;
              // Ensure attr.stats[statKey] exists and is a number before adding
              const valueToAdd = attr.stats[statKey];
              if (typeof valueToAdd === 'number') {
                 calculatedStats[statKey] += valueToAdd;
              }
          });
      }
    });
    return calculatedStats;
  }, [nft]); // Recalculate only if nft object changes
  // <<< End Stat Calculation >>>

  // Filter visible attributes (use nft.attributes directly)
  const visibleAttributes = nft.attributes.filter(attr => 
    !EXCLUDED_LAYERS.includes(attr.layer)
  );

  // Group attributes into categories
  const categories = {
    bodyParts: ['BODY', 'FACE', 'HAIR-HORNS', 'HAIR-REAR', 'HORNS-REAR'],
    clothing: ['TOP', 'BRA', 'SHORTS', 'UNDERWEAR', 'BOOTS', 'COLLAR', 'GLOVES-SLEEVES', 'MASK'],
    weapons: ['RIGHT-HAND WEAPON', 'LEFT-HAND WEAPON'],
    accessories: ['BIRTHMARKS', 'BACK', 'BEHIND-HAIR', 'DIRT-PAINT'],
  };

  const getCategoryAttributes = (categoryLayers: string[]) => {
    return visibleAttributes.filter(attr => categoryLayers.includes(attr.layer));
  };

  return (
    <div className="bg-gray-900 rounded-lg p-5 shadow-lg">
      <h3 className="text-xl font-bold text-pink-500 mb-4">NFT Details</h3>

      <div className="mb-6">
        <h4 className="text-md font-semibold text-pink-400 mb-2">Metadata</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-400">Name:</span> {nft.name}
          </div>
          <div>
            <span className="text-gray-400">Number:</span> {nft.number}
          </div>
          <div>
            <span className="text-gray-400">Team:</span> {nft.team}
          </div>
          <div>
            <span className="text-gray-400">Series:</span> {nft.series}
          </div>
          {wallet?.id && (
            <div className="sm:col-span-2">
              <span className="text-gray-400">Owner Wallet ID:</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="font-mono text-xs break-all">{wallet.id}</span>
                <button 
                  onClick={() => copyToClipboard(wallet.id || '')} 
                  className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                  title="Copy Wallet ID"
                >
                  {copied ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                     </svg>
                  ) : (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                     </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-md font-semibold text-pink-400 mb-2">Body</h4>
        <div className="text-xs text-gray-300 border border-gray-600 rounded">
          <div className="grid grid-cols-2 gap-px bg-gray-600 overflow-hidden rounded">
            {getCategoryAttributes(categories.bodyParts).map((attr, index) => (
              <div key={index} className="relative group bg-gray-800 p-2 flex justify-between items-center">
                <span className="text-gray-400 uppercase text-[10px] tracking-wider">{attr.layer}:</span>
                <span className="font-mono text-white truncate" title={attr.name}>{attr.name || 'N/A'}</span>
                
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-max max-w-xs bg-black text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 ease-in-out z-20 whitespace-normal text-center">
                  <p className="font-bold">{attr.layer}: {attr.name}</p>
                  {attr.stats && (
                    <p className="mt-1">(STR: {attr.stats.strength}, SPD: {attr.stats.speed}, SKL: {attr.stats.skill}, STM: {attr.stats.stamina}, STL: {attr.stats.stealth}, STY: {attr.stats.style})</p>
                  )}
                  {attr.metadata?.rarity && <p>Rarity: {attr.metadata.rarity}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-md font-semibold text-pink-400 mb-2">Clothing</h4>
        <div className="text-xs text-gray-300 border border-gray-600 rounded">
          <div className="grid grid-cols-2 gap-px bg-gray-600 overflow-hidden rounded">
            {getCategoryAttributes(categories.clothing).map((attr, index) => (
              <div key={index} className="relative group bg-gray-800 p-2 flex justify-between items-center">
                <span className="text-gray-400 uppercase text-[10px] tracking-wider">{attr.layer}:</span>
                <span className="font-mono text-white truncate" title={attr.name}>{attr.name || 'N/A'}</span>
                
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-max max-w-xs bg-black text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 ease-in-out z-20 whitespace-normal text-center">
                  <p className="font-bold">{attr.layer}: {attr.name}</p>
                  {attr.stats && (
                    <p className="mt-1">(STR: {attr.stats.strength}, SPD: {attr.stats.speed}, SKL: {attr.stats.skill}, STM: {attr.stats.stamina}, STL: {attr.stats.stealth}, STY: {attr.stats.style})</p>
                  )}
                  {attr.metadata?.rarity && <p>Rarity: {attr.metadata.rarity}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-md font-semibold text-pink-400 mb-2">Weapons</h4>
        <div className="text-xs text-gray-300 border border-gray-600 rounded">
          <div className="grid grid-cols-2 gap-px bg-gray-600 overflow-hidden rounded">
            {getCategoryAttributes(categories.weapons).map((attr, index) => (
              <div key={index} className="relative group bg-gray-800 p-2 flex justify-between items-center">
                <span className="text-gray-400 uppercase text-[10px] tracking-wider">{attr.layer}:</span>
                <span className="font-mono text-white truncate" title={attr.name}>{attr.name || 'N/A'}</span>
                
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-max max-w-xs bg-black text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 ease-in-out z-20 whitespace-normal text-center">
                  <p className="font-bold">{attr.layer}: {attr.name}</p>
                  {attr.stats && (
                    <p className="mt-1">(STR: {attr.stats.strength}, SPD: {attr.stats.speed}, SKL: {attr.stats.skill}, STM: {attr.stats.stamina}, STL: {attr.stats.stealth}, STY: {attr.stats.style})</p>
                  )}
                  {attr.metadata?.rarity && <p>Rarity: {attr.metadata.rarity}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-md font-semibold text-pink-400 mb-2">Accessories</h4>
        <div className="text-xs text-gray-300 border border-gray-600 rounded">
          <div className="grid grid-cols-2 gap-px bg-gray-600 overflow-hidden rounded">
            {getCategoryAttributes(categories.accessories).map((attr, index) => (
              <div key={index} className="relative group bg-gray-800 p-2 flex justify-between items-center">
                <span className="text-gray-400 uppercase text-[10px] tracking-wider">{attr.layer}:</span>
                <span className="font-mono text-white truncate" title={attr.name}>{attr.name || 'N/A'}</span>
                
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 w-max max-w-xs bg-black text-white text-xs rounded py-1 px-2 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-200 ease-in-out z-20 whitespace-normal text-center">
                  <p className="font-bold">{attr.layer}: {attr.name}</p>
                  {attr.stats && (
                    <p className="mt-1">(STR: {attr.stats.strength}, SPD: {attr.stats.speed}, SKL: {attr.stats.skill}, STM: {attr.stats.stamina}, STL: {attr.stats.stealth}, STY: {attr.stats.style})</p>
                  )}
                  {attr.metadata?.rarity && <p>Rarity: {attr.metadata.rarity}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold text-pink-400 mb-2">Total Stats</h4>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <span className="text-gray-400">Strength:</span> {totalStats.strength}
          </div>
          <div>
            <span className="text-gray-400">Speed:</span> {totalStats.speed}
          </div>
          <div>
            <span className="text-gray-400">Skill:</span> {totalStats.skill}
          </div>
          <div>
            <span className="text-gray-400">Stamina:</span> {totalStats.stamina}
          </div>
          <div>
            <span className="text-gray-400">Stealth:</span> {totalStats.stealth}
          </div>
          <div>
            <span className="text-gray-400">Style:</span> {totalStats.style}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions to format names
function formatLayerName(layer: string): string {
  return layer
    .replace('-', ' ')
    .replace('HAIR-HORNS', 'Hair')
    .replace('HAIR-REAR', 'Hair (Back)')
    .replace('HORNS-REAR', 'Horns (Back)')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatAssetName(asset: string): string {
  return asset
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
} 