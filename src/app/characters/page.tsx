'use client';

import React, { useState, useEffect, useMemo } from 'react';
import CharacterPreviewCanvas from '@/components/CharacterPreviewCanvas';
import { LAYER_ORDER, LAYER_DETAILS } from '@/data/layer-config';
import { useAssets } from '@/context/AssetContext';
import ErrorBoundary from '@/components/ErrorBoundary';

// Define the AssetDetail type that matches what we need for the characters page
interface CharacterAssetDetail {
  layer: string;
  name: string;
  filename: string;
  assetNumber?: string;
  rarity?: string;
  type?: string;
  character?: string;
  genes?: string;
  stats?: {
    strength?: number;
    speed?: number;
    skill?: number;
    stamina?: number;
    stealth?: number;
    style?: number;
  };
}

export default function CharactersPage() {
  return (
    <ErrorBoundary>
      <CharactersPageContent />
    </ErrorBoundary>
  );
}

function CharactersPageContent() {
  // Use the Asset context hook (same as build and elements pages)
  const { 
    availableAssets, 
    isInitialized: assetsLoaded, 
    assetLoadingProgress 
  } = useAssets(); 

  // --- MODIFIED/ADDED STATE ---
  const [uniqueCharacterNames, setUniqueCharacterNames] = useState<string[]>([]);
  const [activeCharacterTab, setActiveCharacterTab] = useState<string | null>(null);
  const [assetsForSelectedCharacter, setAssetsForSelectedCharacter] = useState<CharacterAssetDetail[]>([]);
  const [isPreview3D, setIsPreview3D] = useState<boolean>(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  // --- END STATE CHANGES ---

  // Effect 1: Extract unique character names from availableAssets
  useEffect(() => {
    if (!assetsLoaded || Object.keys(availableAssets).length === 0) {
      setUniqueCharacterNames([]);
      setActiveCharacterTab(null);
      return;
    }

    // Extract unique, valid character names from all assets
    const characterNameSet = new Set<string>();
    
    Object.values(availableAssets).forEach(layerAssets => {
      layerAssets.forEach((asset) => {
        if (asset.character && asset.character !== 'x' && asset.character !== 'logo') {
          characterNameSet.add(asset.character);
        }
      });
    });

    const sortedNames = Array.from(characterNameSet).sort((a, b) => a.localeCompare(b));
    setUniqueCharacterNames(sortedNames);

    // Set the first character as active initially
    if (sortedNames.length > 0) {
      setActiveCharacterTab(sortedNames[0]);
    }
  }, [assetsLoaded, availableAssets]);

  // Effect 2: Filter assets when active tab or all assets change
  useEffect(() => {
    setIsPreviewLoading(true);
    
    if (!activeCharacterTab || !assetsLoaded || Object.keys(availableAssets).length === 0) {
      setAssetsForSelectedCharacter([]);
      setIsPreviewLoading(false);
      return;
    }
    
    // Flatten all assets and filter by character
    const allAssets: CharacterAssetDetail[] = Object.entries(availableAssets).flatMap(([layerKey, layerAssets]) => 
      layerAssets.map(asset => ({ 
        layer: layerKey,
        name: asset.name || '',
        filename: asset.filename,
        assetNumber: asset.filename,
        rarity: asset.rarity || undefined,
        type: layerKey, // Use the layerKey from the Object.entries destructuring
        character: asset.character || undefined,
        genes: asset.genes || undefined,
        stats: asset.stats || undefined
      }))
    );
    
    const filtered = allAssets.filter(asset => asset.character === activeCharacterTab);
    
    // Sort filtered assets by layer order
    filtered.sort((a, b) => {
        const layerAIndex = LAYER_ORDER.indexOf(a.layer);
        const layerBIndex = LAYER_ORDER.indexOf(b.layer);
        const effectiveLayerAIndex = layerAIndex === -1 ? Infinity : layerAIndex;
        const effectiveLayerBIndex = layerBIndex === -1 ? Infinity : layerBIndex;
        return effectiveLayerAIndex - effectiveLayerBIndex;
    });
    
    setAssetsForSelectedCharacter(filtered);
    console.log(`Filtered ${filtered.length} assets for active tab: ${activeCharacterTab}`);

    // Use a small timeout to allow the state update and potential re-render cycle
    const timer = setTimeout(() => setIsPreviewLoading(false), 50); 
    return () => clearTimeout(timer);

  }, [activeCharacterTab, availableAssets, assetsLoaded]);

  // --- COMMON STYLING FOR TABS (similar to Studio) ---
  const tabButtonBase = "px-4 py-2 rounded-t-md text-sm font-medium transition-colors border-b-2 whitespace-nowrap";
  const activeTabStyle = "border-yellow-400 text-white bg-gray-800/50";
  const inactiveTabStyle = "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600";

  // Render loading state based on context
  if (!assetsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Loading Character Data...</h1>
          <div className="w-64 bg-gray-700 rounded-full h-2.5 mx-auto">
            <div className="bg-pink-500 h-2.5 rounded-full" style={{ width: `${assetLoadingProgress}%` }}></div>
          </div>
          <p className="text-sm text-gray-400 mt-1">{assetLoadingProgress}%</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">
          NPG Characters
        </h1>

        {/* --- Loading / Error Handling for Initial Fetch --- */} 
        {!assetsLoaded && (
          <p className="text-center text-gray-400 animate-pulse py-10">Loading character data...</p>
        )}
        {assetsLoaded && uniqueCharacterNames.length === 0 && (
           <p className="text-center text-gray-500 py-10">No characters found in asset data.</p>
        )}

        {/* --- Render Tabs and Content if data loaded --- */} 
        {assetsLoaded && uniqueCharacterNames.length > 0 && (
            <> {/* Fragment to group tabs and content */} 
                 {/* Tab Buttons */} 
                <div className="mb-6 border-b border-gray-700 flex justify-center flex-wrap"> {/* Use flex-wrap for responsiveness */} 
                    {uniqueCharacterNames.map((charName) => (
                        <button
                            key={charName}
                            onClick={() => setActiveCharacterTab(charName)}
                            className={`${tabButtonBase} ${activeCharacterTab === charName ? activeTabStyle : inactiveTabStyle}`}
                        >
                            {charName}
                        </button>
                    ))}
                </div>

                {/* Active Tab Content Area */} 
                {activeCharacterTab && (
                     <div className="grid grid-cols-1 lg:grid-cols-5 gap-8"> {/* Grid for table and preview */} 
                        
                        {/* Column 1-3: Detailed Asset Table */} 
                        <div className="lg:col-span-3 bg-gray-900 p-4 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto"> 
                             <h2 className="text-xl font-semibold text-yellow-300 mb-4">Assets for {activeCharacterTab}</h2>
                             {assetsForSelectedCharacter.length > 0 ? (
                                <div className="overflow-x-auto"> {/* Make table scrollable horizontally if needed */} 
                                    <table className="min-w-full table-auto border-collapse border border-gray-700 text-xs"> {/* Reduced text size */} 
                                    <thead>
                                        <tr className="bg-gray-800 sticky top-0"> {/* Sticky header */} 
                                            <th className="border border-gray-600 px-2 py-1 text-left">Layer</th>
                                            <th className="border border-gray-600 px-2 py-1 text-left">Asset#</th>
                                            <th className="border border-gray-600 px-2 py-1 text-left">Type</th>
                                            <th className="border border-gray-600 px-2 py-1 text-left">Name</th>
                                            <th className="border border-gray-600 px-2 py-1 text-left">Gene</th>
                                            <th className="border border-gray-600 px-2 py-1 text-left">Rarity</th>
                                            <th className="border border-gray-600 px-2 py-1 text-center">Str</th>
                                            <th className="border border-gray-600 px-2 py-1 text-center">Spd</th>
                                            <th className="border border-gray-600 px-2 py-1 text-center">Skl</th>
                                            <th className="border border-gray-600 px-2 py-1 text-center">Stm</th>
                                            <th className="border border-gray-600 px-2 py-1 text-center">Stl</th>
                                            <th className="border border-gray-600 px-2 py-1 text-center">Sty</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                                        {assetsForSelectedCharacter.map((asset, index) => (
                                        <tr key={`${asset.filename}-${index}`} className="hover:bg-gray-700/50 transition-colors">
                                            <td className="border border-gray-600 px-2 py-1">{LAYER_DETAILS[asset.layer]?.folderName ?? asset.layer}</td>
                                            <td className="border border-gray-600 px-2 py-1 text-center">{asset.assetNumber ?? '-'}</td>
                                            <td className="border border-gray-600 px-2 py-1">{asset.type ?? '-'}</td>
                                            <td className="border border-gray-600 px-2 py-1">{asset.name ?? '-'}</td>
                                            <td className="border border-gray-600 px-2 py-1 capitalize">{asset.genes ?? '-'}</td>
                                            <td className="border border-gray-600 px-2 py-1">{asset.rarity ?? '-'}</td>
                                            <td className="border border-gray-600 px-2 py-1 text-center">{asset.stats?.strength ?? 0}</td>
                                            <td className="border border-gray-600 px-2 py-1 text-center">{asset.stats?.speed ?? 0}</td>
                                            <td className="border border-gray-600 px-2 py-1 text-center">{asset.stats?.skill ?? 0}</td>
                                            <td className="border border-gray-600 px-2 py-1 text-center">{asset.stats?.stamina ?? 0}</td>
                                            <td className="border border-gray-600 px-2 py-1 text-center">{asset.stats?.stealth ?? 0}</td>
                                            <td className="border border-gray-600 px-2 py-1 text-center">{asset.stats?.style ?? 0}</td>
                                        </tr>
                                        ))}
                                    </tbody>
                                    </table>
                                </div>
                             ) : (
                                <p className="text-center text-gray-500">No specific assets found for this character.</p>
                             )}
                        </div>

                        {/* Column 4-5: Character Preview */} 
                        <div className="lg:col-span-2 sticky top-24 h-[calc(100vh-8rem)]"> 
                             <div className="flex justify-center items-center mb-6 relative">
                                <h2 className="text-2xl font-bold text-pink-400 text-center">
                                    Character Preview
                                </h2>
                                <div className="absolute right-0 top-0 flex items-center space-x-2 bg-gray-800 p-1 rounded-md">
                                    {/* 2D/3D Toggle Buttons */} 
                                    <button onClick={() => setIsPreview3D(false)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${!isPreview3D ? 'bg-pink-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}>2D</button>
                                    <button onClick={() => setIsPreview3D(true)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${isPreview3D ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}>3D</button>
                                </div>
                            </div>
                            <div className="bg-gray-900 p-6 rounded-lg shadow-lg h-full flex flex-col items-center justify-center">
                                {isPreview3D ? (
                                    <div className="text-center">
                                        <p className="text-2xl text-purple-400 mb-4">3D Preview</p>
                                        <p className="text-gray-500">Coming Soon!</p>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-md aspect-[961/1441] relative flex items-center justify-center"> {/* Added flex for centering loading text */} 
                                         {/* --- MODIFIED: Conditional Rendering for Clearing --- */} 
                                        {isPreviewLoading ? (
                                            // Display loading text directly instead of overlay
                                            <p className="text-gray-300 animate-pulse text-lg">Loading Preview...</p>
                                        ) : (
                                            // Render canvas only when not loading
                                            <CharacterPreviewCanvas
                                                key={activeCharacterTab} // Re-render on tab change
                                                assets={assetsForSelectedCharacter}
                                                layerOrder={LAYER_ORDER}
                                                layerDetails={LAYER_DETAILS}
                                                width={961} 
                                                height={1441}
                                            />
                                        )}
                                         {/* --- END MODIFICATION --- */} 
                                    </div>
                                )}
                                <p className="text-center text-xl mt-4 text-pink-300 font-semibold">{activeCharacterTab}</p>
                             </div>
                        </div>
                     </div>
                )}
            </>
        )} 

      </div>
    </div>
  );
} 