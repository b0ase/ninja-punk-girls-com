'use client';

import React from 'react';
import { NFTType } from '@/types';
import { LAYER_DETAILS, EXCLUDED_LAYERS } from '@/data/layer-config';
import { useHandCashWallet } from '@/context/HandCashWalletContext';

interface AttributesTableProps {
  nft: NFTType | null;
}

export default function AttributesTable({ nft }: AttributesTableProps) {
  // --- Tooltip state and handlers temporarily commented out ---
  // const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, imageSrc: '' });

  // const handleMouseEnter = (event: React.MouseEvent, imageSrc: string) => {
  //   console.log('[AttributesTable] handleMouseEnter triggered. Setting tooltip visible. Image:', imageSrc);
  //   const rect = event.currentTarget.getBoundingClientRect();
  //   const scrollX = window.scrollX || window.pageXOffset;
  //   const scrollY = window.scrollY || window.pageYOffset;
  //   setTooltip({ visible: true, x: rect.right + scrollX + 5, y: rect.top + scrollY, imageSrc }); 
  // };

  // const handleMouseLeave = () => {
  //   console.log('[AttributesTable] handleMouseLeave triggered. Setting tooltip hidden.');
  //   setTooltip({ ...tooltip, visible: false });
  // };
  // -----------------------------------------------------------

  if (!nft) return null;

  // Filter attributes
  const filteredAttributes = nft.attributes
    .filter(attr => !EXCLUDED_LAYERS.includes(attr.layer))
    .reverse(); 

  // Log the tooltip state right before rendering (commented out)
  // console.log('[AttributesTable] Rendering with tooltip state:', tooltip);

  return (
    <div className="bg-gray-900 rounded-lg p-6 shadow-xl relative">
      {/* --- Tooltip Rendering Temporarily Commented Out --- */}
      {/* {tooltip.visible && ( ... tooltip div ... )} */}
      {/* --------------------------------------------------- */}

      <h2 className="text-2xl font-bold text-pink-500 mb-6 text-center">Summary for NFT {nft.number}: {nft.name}</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th> */}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Layer</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Asset #</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Element</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Character</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Genes</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Colour</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rarity</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Strength</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Speed</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Skill</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stamina</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stealth</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Style</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {filteredAttributes.map((attr, index) => {
              // Layer Name Derivation (Seems OK)
              const layerDetail = LAYER_DETAILS[attr.layer];
              const layerName = layerDetail ? layerDetail.folderName.split(' ').slice(1).join(' ') : attr.layer;
              // const folderName = layerDetail ? layerDetail.folderName : 'UnknownLayer'; 
              // const imageName = attr.fullFilename || `${attr.asset}.png`; 
              // const imagePath = `/assets/${folderName}/${imageName}`; 
              
              // *** Use Correct Fields from NFTAttribute ***
              const assetNumberToDisplay = attr.assetNumber || '000'; // Use the new field
              const elementNameToDisplay = attr.metadata?.elementName || 'Unknown';
              const characterNameToDisplay = attr.metadata?.characterName || '';
              const genesToDisplay = attr.metadata?.genes || '';
              const rarityToDisplay = attr.metadata?.rarity || 'Unknown';
              const hasRGBToDisplay = attr.metadata?.hasRGB || false;
              // ******************************************
              
              return (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'}>
                   {/* Layer Name */}
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{layerName}</td>
                   {/* Asset Number */}
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{assetNumberToDisplay}</td>
                   {/* Element Name */}
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{elementNameToDisplay}</td>
                   {/* Character Name */}
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{characterNameToDisplay}</td>
                   {/* Genes */}
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{genesToDisplay}</td>
                   {/* Colour (hasRGB) */}
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{hasRGBToDisplay ? 'x' : ''}</td>
                   {/* Rarity */}
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{rarityToDisplay}</td>
                   {/* Stats */}
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{attr.stats.strength}</td>
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{attr.stats.speed}</td>
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{attr.stats.skill}</td>
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{attr.stats.stamina}</td>
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{attr.stats.stealth}</td>
                   <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">{attr.stats.style}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 