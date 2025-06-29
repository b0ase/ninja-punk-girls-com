'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CharacterPreviewCanvas from '@/components/CharacterPreviewCanvas';
import CharacterPreview3D from '@/components/CharacterPreview3D';
import { LAYER_ORDER, LAYER_DETAILS } from '@/data/layer-config';
import Image from 'next/image';

// Reuse the AssetDetail interface from the API route or define similarly
interface AssetDetail {
  layer: string;
  name: string;
  filename: string;
  assetNumber?: string;
  rarity?: string;
  type?: string;
  character?: string;
  genes?: string; // Correct field name for gene/origin
  // --- ADDED: stats to local interface for table display ---
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
  // --- MODIFIED/ADDED STATE ---
  const [allAssets, setAllAssets] = useState<AssetDetail[]>([]);
  const [erobotCharacterNames, setErobotCharacterNames] = useState<string[]>([]);
  const [npgCharacterNames, setNpgCharacterNames] = useState<string[]>([]);
  const [activeCharacterTab, setActiveCharacterTab] = useState<string | null>(null);
  const [assetsForSelectedCharacter, setAssetsForSelectedCharacter] = useState<AssetDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPreview3D, setIsPreview3D] = useState<boolean>(false);
  // --- ADDED: Preview-specific loading state ---
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  // --- UPDATED: Tooltip State (remove x, y) ---
  const [tooltipContent, setTooltipContent] = useState<{
    assetImageSrc: string;
    cardImageSrc: string;
    name: string;
  } | null>(null);
  // --- END UPDATED ---
  // --- REMOVED STATES (no longer needed for list table) ---
  // const [characters, setCharacters] = useState<CharacterInfo[]>([]);
  // const [selectedCharacterName, setSelectedCharacterName] = useState<string | null>(null);
  // const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  // --- END STATE CHANGES ---

  // Effect 1: Fetch all data and derive unique character names, splitting them *by gene*
  useEffect(() => {
    const fetchAssetData = async () => {
      setIsLoading(true);
      setError(null);
      setAllAssets([]);
      setErobotCharacterNames([]);
      setNpgCharacterNames([]);
      setActiveCharacterTab(null);
      try {
        const response = await fetch('/api/asset-data');
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const result = await response.json();
        if (!result.success || !Array.isArray(result.data)) {
          throw new Error('Invalid data format from asset API.');
        }

        const allFetchedAssets = result.data as AssetDetail[];
        setAllAssets(allFetchedAssets); // Store all assets

        // --- REVISED: Categorize based on asset genes ---
        const erobotNameSet = new Set<string>();
        const npgNameSet = new Set<string>();

        allFetchedAssets.forEach((asset: AssetDetail) => {
          // Ensure the asset has a valid character name assigned
          if (asset.character && asset.character !== 'x' && asset.character !== 'logo') {
            // Check the genes field to determine the type
            if (asset.genes?.toLowerCase() === 'erobot') {
              erobotNameSet.add(asset.character);
            } else {
              // Assume anything not explicitly Erobot (or missing genes) is NPG for grouping
              npgNameSet.add(asset.character);
            }
          }
        });
        
        // Ensure characters aren't in both lists if data is inconsistent (Erobots take precedence)
        erobotNameSet.forEach(name => {
            if (npgNameSet.has(name)) {
                npgNameSet.delete(name);
                console.warn(`Character ${name} found with both Erobot and NPG genes. Categorized as Erobot.`);
            }
        });

        const sortedErobots = Array.from(erobotNameSet).sort((a, b) => a.localeCompare(b));
        const sortedNpgs = Array.from(npgNameSet).sort((a, b) => a.localeCompare(b));

        setErobotCharacterNames(sortedErobots);
        setNpgCharacterNames(sortedNpgs);
        // --- END REVISED ---

        // Set the first NPG (if any) as active initially, otherwise the first Erobot
        if (sortedNpgs.length > 0) {
          setActiveCharacterTab(sortedNpgs[0]);
        } else if (sortedErobots.length > 0) {
          setActiveCharacterTab(sortedErobots[0]);
        }

      } catch (err: any) {
        console.error("Failed to fetch asset data:", err);
        setError(err.message || 'Could not load character data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssetData();
  }, []);

  // Effect 2: Filter assets when active tab or all assets change
  useEffect(() => {
    // --- ADDED: Set preview loading true when tab changes ---
    setIsPreviewLoading(true);
    // --- END ADDED ---
    
    if (!activeCharacterTab || allAssets.length === 0) {
      setAssetsForSelectedCharacter([]);
       // --- ADDED: Set loading false even if no assets ---
      setIsPreviewLoading(false);
      return;
    }
    
    const filtered = allAssets.filter(asset => asset.character === activeCharacterTab);
    // Optional: Sort filtered assets by layer order if needed for the table
    filtered.sort((a, b) => {
        const layerAIndex = LAYER_ORDER.indexOf(a.layer);
        const layerBIndex = LAYER_ORDER.indexOf(b.layer);
        const effectiveLayerAIndex = layerAIndex === -1 ? Infinity : layerAIndex;
        const effectiveLayerBIndex = layerBIndex === -1 ? Infinity : layerBIndex;
        return effectiveLayerAIndex - effectiveLayerBIndex;
    });
    
    setAssetsForSelectedCharacter(filtered);
    console.log(`Filtered ${filtered.length} assets for active tab: ${activeCharacterTab}`);

    // --- ADDED: Set preview loading false after filtering ---
    // Use a small timeout to allow the state update and potential re-render cycle
    // This ensures the loading state is visible briefly
    const timer = setTimeout(() => setIsPreviewLoading(false), 50); 
    return () => clearTimeout(timer); // Cleanup timer on unmount or before next run
    // --- END ADDED ---

  }, [activeCharacterTab, allAssets]); // Re-run when these change

  // Add preloading for 3D models when component first mounts
  useEffect(() => {
    // Preload models to ensure they're available when toggling to 3D
    const preloadModels = async () => {
      try {
        // Import dynamically to avoid SSR issues
        const { useGLTF } = await import('@react-three/drei');
        useGLTF.preload('/models/chibi_cyberpunk_final.glb');
        console.log("[CharactersPage] Preloaded character models");
      } catch (err) {
        console.error("[CharactersPage] Error preloading models:", err);
      }
    };
    
    preloadModels();
  }, []);

  // Handle 3D toggle with loading state
  const handle3DToggle = () => {
    // If already in 3D mode, just return
    if (isPreview3D) return;
    
    // Set loading state first
    setIsPreviewLoading(true);
    // Then switch to 3D mode
    setIsPreview3D(true);
    // Reset loading state after a short delay
    setTimeout(() => setIsPreviewLoading(false), 300);
  };

  // Handle 2D toggle 
  const handle2DToggle = () => {
    // If already in 2D mode, just return
    if (!isPreview3D) return;
    
    // Set loading state first 
    setIsPreviewLoading(true);
    // Then switch to 2D mode
    setIsPreview3D(false);
    // Reset loading state after a shorter delay (2D loads faster)
    setTimeout(() => setIsPreviewLoading(false), 100);
  };

  // --- UPDATED: Tooltip Handlers (fix card path logic AGAIN) ---
  const handleRowMouseEnter = (asset: AssetDetail) => { 
    const layerDetail = LAYER_DETAILS[asset.layer];
    if (!layerDetail?.folderName) return; 

    const assetImageSrc = `/assets/${layerDetail.folderName}/${asset.filename}`;
    
    // --- FIXED Card Path Construction (replace space AND hyphen) --- 
    const cardFileNameBase = layerDetail.folderName.toLowerCase().replace(/ |-/g, '_');
    const cardImageSrc = `/element_cards/${cardFileNameBase}.jpg`;
    // --- END FIXED --- 

    setTooltipContent({
      assetImageSrc: assetImageSrc,
      cardImageSrc: cardImageSrc, 
      name: asset.name ?? 'Asset Preview',
    });
  };

  const handleRowMouseLeave = () => {
    setTooltipContent(null);
  };
  // --- END UPDATED ---

  // --- DEFINE NEW STYLING FOR TABS ---
  const tabButtonBase = "px-4 py-2 rounded-t-md text-sm font-medium transition-colors border-b-2 whitespace-nowrap mx-1"; // Added mx-1 for spacing
  
  // Erobot Styles (Red)
  const erobotActiveTabStyle = "border-red-500 text-white bg-red-800/60";
  const erobotInactiveTabStyle = "border-transparent text-red-300 hover:text-red-100 hover:border-red-600";

  // NPG Styles (Blue)
  const npgActiveTabStyle = "border-blue-400 text-white bg-blue-800/60";
  const npgInactiveTabStyle = "border-transparent text-blue-300 hover:text-blue-100 hover:border-blue-600";
  // --- END NEW STYLING ---

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* --- UPDATED: Conditionally render the entire panel --- */} 
      {tooltipContent && (
          <div className="fixed left-6 top-64 w-40 z-30 bg-gray-800 border border-blue-500 rounded-lg shadow-xl p-3"> 
            <h3 className="text-sm font-semibold text-blue-300 mb-2 text-center border-b border-blue-400/50 pb-1">Asset Preview</h3>
            <div>
                {/* Container for layering */}
                <div className="relative w-full mb-2"> 
                    {/* Background Card Image */}
                    <Image 
                    src={tooltipContent.cardImageSrc} 
                    alt={`${tooltipContent.name} card background`} 
                    layout="fill" 
                    objectFit="cover" 
                    className="rounded-md" 
                    unoptimized 
                    onError={(e) => { console.warn(`Failed to load card image: ${tooltipContent.cardImageSrc}`); e.currentTarget.style.display = 'none'; }}
                    />
                    {/* Foreground Asset Image */}
                    <Image 
                    src={tooltipContent.assetImageSrc} 
                    alt={tooltipContent.name} 
                    layout="fill" 
                    objectFit="contain" 
                    className="absolute top-0 left-0" 
                    unoptimized 
                    onError={(e) => { console.warn(`Failed to load asset image: ${tooltipContent.assetImageSrc}`); e.currentTarget.style.display = 'none'; }}
                    />
                </div>
                <p className="text-xs text-center text-gray-200 truncate" title={tooltipContent.name}>{tooltipContent.name}</p>
            </div>
          </div>
      )}
      {/* --- END UPDATED --- */}
      
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">
          NPG Characters
        </h1>

        {/* --- ADDED: Story/Explanation Text --- */}
        <div className="mb-8 text-center text-gray-300 max-w-3xl mx-auto text-sm">
          <p className="leading-relaxed">
            Welcome! Collect all 15 unique Ninja Punk Girls characters. Each character possesses special assets. The evil Erobots have captured their boyfriends! Rescue one boyfriend for every three complete NPG characters you assemble. Good luck!
          </p>
        </div>
        {/* --- END ADDED --- */}

        {/* --- Loading / Error Handling for Initial Fetch --- */} 
        {isLoading && (
          <p className="text-center text-gray-400 animate-pulse py-10">Loading character data...</p>
        )}
        {error && (
          <p className="text-center text-red-500 py-10">Error loading data: {error}</p>
        )}
        {!isLoading && !error && (erobotCharacterNames.length === 0 && npgCharacterNames.length === 0) && (
           <p className="text-center text-gray-500 py-10">No characters found in asset data.</p>
        )}

        {/* --- Render Tabs and Content if data loaded --- */} 
        {!isLoading && !error && (erobotCharacterNames.length > 0 || npgCharacterNames.length > 0) && (
            <> 
                 {/* Tab Buttons Container */} 
                <div className="mb-6 border-b border-gray-700 flex justify-center flex-wrap">
                   {/* === SWAPPED ORDER: NPG Tabs Section FIRST === */} 
                   {npgCharacterNames.length > 0 && (
                     // Moved border/padding to NPG section
                     <div className="flex flex-wrap justify-center border-r-2 border-gray-600 pr-2 mr-2"> 
                        {npgCharacterNames.map((charName) => (
                          <button
                              key={charName}
                              onMouseEnter={() => setActiveCharacterTab(charName)}
                              className={`${tabButtonBase} ${activeCharacterTab === charName ? npgActiveTabStyle : npgInactiveTabStyle}`}
                          >
                              {charName}
                          </button>
                        ))}
                      </div>
                   )}
                   
                   {/* === SWAPPED ORDER: Erobot Tabs Section SECOND === */} 
                   {erobotCharacterNames.length > 0 && (
                     // Removed border/padding from Erobot section
                     <div className="flex flex-wrap justify-center"> 
                        {erobotCharacterNames.map((charName) => (
                          <button
                              key={charName}
                              onMouseEnter={() => setActiveCharacterTab(charName)}
                              className={`${tabButtonBase} ${activeCharacterTab === charName ? erobotActiveTabStyle : erobotInactiveTabStyle}`}
                          >
                              {charName}
                          </button>
                        ))}
                     </div>
                   )}
                </div>

                {/* Active Tab Content Area */} 
                {activeCharacterTab && (
                     <div className="grid grid-cols-1 lg:grid-cols-5 gap-8"> {/* Grid for table and preview */} 
                        
                        {/* Column 1-3: Detailed Asset Table */} 
                        <div className="lg:col-span-3 bg-gray-900 p-4 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto"> 
                             <h2 className="text-xl font-semibold text-yellow-300 mb-4">Assets for {activeCharacterTab}</h2>
                             {assetsForSelectedCharacter.length > 0 ? (
                                <div className="overflow-x-auto"> 
                                    <table className="min-w-full table-auto border-collapse border border-gray-700 text-xs align-middle"> {/* Added align-middle */} 
                                    <thead>
                                        <tr className="bg-gray-800 sticky top-0"> 
                                            {/* Added Image Header (empty) */}
                                            <th className="border border-gray-600 px-3 py-2"></th> 
                                            <th className="border border-gray-600 px-3 py-2 text-left">Layer</th>
                                            <th className="border border-gray-600 px-3 py-2 text-left">Asset#</th>
                                            <th className="border border-gray-600 px-3 py-2 text-left">Name</th>
                                            <th className="border border-gray-600 px-3 py-2 text-left">Gene</th>
                                            <th className="border border-gray-600 px-3 py-2 text-left">Rarity</th>
                                            <th className="border border-gray-600 px-3 py-2 text-center">Str</th>
                                            <th className="border border-gray-600 px-3 py-2 text-center">Spd</th>
                                            <th className="border border-gray-600 px-3 py-2 text-center">Skl</th>
                                            <th className="border border-gray-600 px-3 py-2 text-center">Stm</th>
                                            <th className="border border-gray-600 px-3 py-2 text-center">Stl</th>
                                            <th className="border border-gray-600 px-3 py-2 text-center">Sty</th>
                                        </tr>
                                    </thead>
                                    {/* Added odd/even background classes */} 
                                    <tbody className="divide-y divide-gray-700">
                                        {assetsForSelectedCharacter.map((asset, index) => {
                                          const folderName = LAYER_DETAILS[asset.layer]?.folderName;
                                          const imageSrc = folderName ? `/assets/${folderName}/${asset.filename}` : '/placeholder.png'; // Fallback needed
                                          
                                          return (
                                            <tr 
                                              key={`${asset.filename}-${index}`} 
                                              className="hover:bg-gray-700/70 odd:bg-gray-800/30 even:bg-gray-800/50 transition-colors" 
                                              // UPDATED: Mouse handlers (no event needed for enter)
                                              onMouseEnter={() => handleRowMouseEnter(asset)}
                                              onMouseLeave={handleRowMouseLeave}
                                            >
                                              {/* Added Image Cell */}
                                              <td className="border border-gray-600 px-3 py-2 w-12"> {/* Fixed width for image cell */}
                                                {folderName ? (
                                                  <Image 
                                                    src={imageSrc}
                                                    alt={asset.name ?? 'Asset preview'}
                                                    width={32} 
                                                    height={32} 
                                                    className="object-contain mx-auto" // Center image
                                                    unoptimized // Potentially needed for many small static assets if optimizing causes issues
                                                  />
                                                ) : (
                                                  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xs mx-auto">?</div> // Placeholder for missing folder
                                                )}
                                              </td>
                                              <td className="border border-gray-600 px-3 py-2">{LAYER_DETAILS[asset.layer]?.folderName ?? asset.layer}</td>
                                              <td className="border border-gray-600 px-3 py-2 text-center">{asset.assetNumber ?? '-'}</td>
                                              <td className="border border-gray-600 px-3 py-2">{asset.name ?? '-'}</td>
                                              <td className="border border-gray-600 px-3 py-2 capitalize">{asset.genes ?? '-'}</td>
                                              <td className="border border-gray-600 px-3 py-2">{asset.rarity ?? '-'}</td>
                                              <td className="border border-gray-600 px-3 py-2 text-center">{asset.stats?.strength ?? 0}</td>
                                              <td className="border border-gray-600 px-3 py-2 text-center">{asset.stats?.speed ?? 0}</td>
                                              <td className="border border-gray-600 px-3 py-2 text-center">{asset.stats?.skill ?? 0}</td>
                                              <td className="border border-gray-600 px-3 py-2 text-center">{asset.stats?.stamina ?? 0}</td>
                                              <td className="border border-gray-600 px-3 py-2 text-center">{asset.stats?.stealth ?? 0}</td>
                                              <td className="border border-gray-600 px-3 py-2 text-center">{asset.stats?.style ?? 0}</td>
                                          </tr>
                                          )
                                        })}
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
                                    <button onClick={handle2DToggle} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${!isPreview3D ? 'bg-pink-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}>2D</button>
                                    <button onClick={handle3DToggle} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${isPreview3D ? 'bg-purple-600 text-white' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}>3D</button>
                                </div>
                            </div>
                            {/* UPDATED: Removed h-full, added w-full aspect-[2/3] */}
                            <div className="relative bg-gray-900 p-6 rounded-lg shadow-lg w-full aspect-[2/3]"> 
                                {/* ADDED: Conditional rendering for Background Golden Card Image */}
                                {!isPreview3D && (
                                    <Image 
                                        src="/assets/00_Character_Card.png"
                                        alt="Character Card Background"
                                        layout="fill"
                                        objectFit="cover" // Or "contain" if you prefer not to crop
                                        className="absolute inset-0 z-0 opacity-75 rounded-lg" // Position behind, slight opacity, match rounding
                                        unoptimized
                                    />
                                )}
                                
                                {/* Existing Content Wrapper - REMOVED h-full */}
                                <div className="relative z-10 w-full flex flex-col items-center justify-center">
                                    {isPreview3D ? (
                                        <div className="text-center flex flex-col items-center justify-center w-full h-full"> {/* Added h-full back to 3D wrapper */} 
                                            <p className="text-2xl text-purple-400 mb-4">{activeCharacterTab} 3D Preview</p>
                                            {isPreviewLoading ? (
                                                <p className="text-gray-500 animate-pulse">Loading 3D model...</p>
                                            ) : (
                                                // Added w-full h-full to 3D container
                                                <div className="w-full h-full relative bg-black/50 rounded-md overflow-hidden"> 
                                                    {activeCharacterTab === 'Ayumi' ? (
                                                        <CharacterPreview3D 
                                                            characterName={activeCharacterTab}
                                                            modelUrl="/models/chibi_cyberpunk_final.glb"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                            3D model for {activeCharacterTab} coming soon!
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full max-w-md relative flex items-center justify-center"> 
                                            {isPreviewLoading ? (
                                                <p className="text-gray-300 animate-pulse text-lg">Loading Preview...</p>
                                            ) : (
                                                <CharacterPreviewCanvas
                                                    key={activeCharacterTab}
                                                    assets={assetsForSelectedCharacter}
                                                    layerOrder={LAYER_ORDER}
                                                    layerDetails={LAYER_DETAILS}
                                                    // Restored width/height props
                                                    width={961}
                                                    height={1441}
                                                    // Added className for scaling
                                                    className="w-full h-auto object-contain"
                                                />
                                            )}
                                        </div>
                                    )}
                                    <p className="text-center text-xl mt-4 text-pink-300 font-semibold drop-shadow-lg">{activeCharacterTab}</p> {/* Added drop shadow */} 
                                </div>
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