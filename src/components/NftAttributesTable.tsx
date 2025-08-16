'use client';

import React from 'react';
import { NFTAttribute } from '@/types';

interface NftAttributesTableProps {
  attributes: NFTAttribute[];
  limitRows?: number; 
  isCollapsed: boolean;
}

// Helper to determine rarity color (can be moved to a utils file later if needed)
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
  
const NftAttributesTable: React.FC<NftAttributesTableProps> = ({ 
  attributes, 
  limitRows, 
  isCollapsed,
}) => {

  const excludedLayers = new Set(['TEAM', 'EFFECTS', 'DECALS', 'BANNER', 'BACKGROUND']);
  const filteredAttributes = attributes.filter(attr => 
      !excludedLayers.has(attr.layer)
  );
  const layersToHideStats = new Set(['BACKGROUND']);
  const layersToHideStatsUpdated = new Set<string>();

  const displayAttributes = limitRows ? filteredAttributes.slice(0, limitRows) : filteredAttributes;
  const reversedDisplayAttributes = [...displayAttributes].reverse();

  if (!filteredAttributes || filteredAttributes.length === 0) {
    return <p className="text-sm text-gray-500">No attribute data available.</p>;
  }
  
  const detailColumnCount = 6; // Layer, Asset, Element, Character, Genes, Rarity
  const statColumnCount = 6;
  const totalColumns = isCollapsed ? (1 + statColumnCount) : (detailColumnCount + statColumnCount);

  return (
    <div className="overflow-x-auto custom-scrollbar"> 
         <table className="w-full text-sm text-left table-auto border-collapse min-w-[300px]"> 
            <thead className="bg-gray-800 sticky top-0 z-10">
              <tr>
                <th className="p-2 border border-gray-700 sticky left-0 bg-gray-800">
                    {isCollapsed ? '' : 'Layer'} 
                </th>
                {!isCollapsed && (
                    <>
                        <th className="p-2 border border-gray-700">Asset</th>
                        <th className="p-2 border border-gray-700">Element</th>
                        <th className="p-2 border border-gray-700">Character</th>
                        <th className="p-2 border border-gray-700">Genes</th>
                        <th className="p-2 border border-gray-700">Rarity</th>
                    </>
                )}
                <th className="p-1 border border-gray-700 text-center text-red-400" title="Strength">Str</th>
                <th className="p-1 border border-gray-700 text-center text-blue-400" title="Speed">Spd</th>
                <th className="p-1 border border-gray-700 text-center text-green-400" title="Skill">Skl</th>
                <th className="p-1 border border-gray-700 text-center text-yellow-400" title="Stamina">Stm</th>
                <th className="p-1 border border-gray-700 text-center text-gray-400" title="Stealth">Sth</th>
                <th className="p-1 border border-gray-700 text-center text-pink-400" title="Style">Sty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {reversedDisplayAttributes.map((attr, index) => {
                const hideStats = layersToHideStatsUpdated.has(attr.layer);
                return (
                    <tr key={`${attr.layer}-${index}`} className="hover:bg-gray-700/30 align-top">
                        <td className="p-2 border border-gray-700 sticky left-0 bg-gray-900 group-hover:bg-gray-700/30 whitespace-nowrap">
                           {isCollapsed 
                              ? <span className="text-gray-500 italic text-xs">{typeof attr.layer === 'string' ? attr.layer.replace(/_/g, ' ') : 'Unknown Layer'}</span> 
                              : (typeof attr.layer === 'string' ? attr.layer.replace(/_/g, ' ') : 'Unknown Layer')
                           }
                        </td>
                        {!isCollapsed && (
                          <>
                            <td className="p-2 border border-gray-700">{attr.asset || ''}</td>
                            <td className="p-2 border border-gray-700">{(attr.metadata?.elementName && attr.metadata.elementName.toLowerCase() !== 'x') ? attr.metadata.elementName : ''}</td>
                            <td className="p-2 border border-gray-700">{(attr.metadata?.characterName && attr.metadata.characterName !== 'Unknown Character') ? attr.metadata.characterName : ''}</td>
                            <td className="p-2 border border-gray-700">{(attr.metadata?.genes && attr.metadata.genes.toLowerCase() !== 'unknown genes') ? attr.metadata.genes : ''}</td>
                            <td className={`p-2 border border-gray-700 whitespace-nowrap ${(attr.metadata?.rarity && attr.metadata.rarity.toLowerCase() !== 'unknown rarity') ? getRarityColor(attr.metadata.rarity) : 'text-gray-500'}`}>
                              {(attr.metadata?.rarity && attr.metadata.rarity.toLowerCase() !== 'unknown rarity') ? attr.metadata.rarity : ''}
                            </td>
                          </>
                        )}
                        <td className="p-1 border border-gray-700 text-center">{hideStats ? '' : (attr.stats?.strength ?? 0)}</td>
                        <td className="p-1 border border-gray-700 text-center">{hideStats ? '' : (attr.stats?.speed ?? 0)}</td>
                        <td className="p-1 border border-gray-700 text-center">{hideStats ? '' : (attr.stats?.skill ?? 0)}</td>
                        <td className="p-1 border border-gray-700 text-center">{hideStats ? '' : (attr.stats?.stamina ?? 0)}</td>
                        <td className="p-1 border border-gray-700 text-center">{hideStats ? '' : (attr.stats?.stealth ?? 0)}</td>
                        <td className="p-1 border border-gray-700 text-center">{hideStats ? '' : (attr.stats?.style ?? 0)}</td>
                    </tr>
                );
              })}
              {limitRows && filteredAttributes.length > limitRows && (
                 <tr>
                    <td colSpan={totalColumns} className="p-1 text-center text-xs text-gray-500 border border-gray-700">
                        ... ({filteredAttributes.length - limitRows} more rows not shown)
                    </td>
                 </tr> 
              )}
            </tbody>
         </table>
    </div>
  );
};

export default NftAttributesTable; 