'use client';

import React, { useState, useMemo } from 'react';
import { useAssets } from '@/context/AssetContext'; 
import { AssetDetail } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import ErrorBoundary from '@/components/ErrorBoundary';
import PeriodicTable from '@/components/PeriodicTable';
// Import the shared layer configuration
import { LAYER_ORDER, LAYER_DETAILS } from '@/data/layer-config'; 
// import AssetGrid from '@/components/AssetGrid'; // Removed potentially incorrect import

// --- Helper Function for Title Case --- 
const toTitleCase = (str: string): string => {
  if (!str) return '';
  // Specific replacements first
  if (str.toUpperCase() === 'BODY_SKIN') return 'Body'; 

  return str
    .toLowerCase()
    .replace(/_/g, ' ') // Replace underscores with spaces
    .split('-') // Split by hyphen (keep this if needed)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) 
    .join('-'); // Join back with hyphen (keep this if needed)
};
// --------------------------------------

// Layers to exclude from the main library view (non-character elements)
const EXCLUDED_LIBRARY_LAYERS = new Set([
  'BACKGROUND',
  'GLOW',
  'BANNER',
  'DECALS',
  'LOGO',
  'COPYRIGHT',
  'SCORES',
  'TEAM',
  'INTERFACE',
  'EFFECTS'
]);

// Helper to get card cover image URL using shared config
const getCoverImageUrl = (layerKey: string): string => {
  const layerDetail = LAYER_DETAILS[layerKey];
  if (!layerDetail) {
    console.error(`[getCoverImageUrl] No configuration found for layer key: ${layerKey}`);
    return '/placeholder.png';
  }
  
  // <<< START FIX for Body/Body_Skin Mismatch >>>
  let baseName = layerKey.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
  // If the key is BODY_SKIN, explicitly use 'body' for the filename base
  if (layerKey === 'BODY_SKIN') {
      baseName = 'body';
  }
  // <<< END FIX >>>

  const filename = `${layerDetail.number}_${baseName}.jpg`;
  console.log(`[getCoverImageUrl] Generated filename: ${filename} for layer key: ${layerKey}, full path: /element_cards/${filename}`);
  return `/element_cards/${filename}`;
};

// Helper to get the folder name using shared config
const getLayerFolder = (layerKey: string): string => {
  return LAYER_DETAILS[layerKey]?.folderName || layerKey; // Use folderName from LAYER_DETAILS
};

// --- Catalogue Table Component --- 
interface ElementsCatalogueTableProps {
  assets: Record<string, AssetDetail[]>;
}

const ElementsCatalogueTable: React.FC<ElementsCatalogueTableProps> = ({ assets }) => {
  // --- Filter State ---
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [rarityFilter, setRarityFilter] = useState<string>('');
  const [characterFilter, setCharacterFilter] = useState<string>('');
  const [genesFilter, setGenesFilter] = useState<string>('');
  const [selectedSeries, setSelectedSeries] = useState<string>('');

  // --- Collapse State (Default to collapsed) ---
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(() => {
    // Initialize with all categories collapsed
    const initialCollapsed: Record<string, boolean> = {};
    Object.keys(assets).forEach(key => {
      initialCollapsed[key] = true; // Set true for collapsed
    });
    return initialCollapsed;
  });

  // 1. Flatten and Filter the assets
  const filteredAssets = useMemo(() => {
    const flattened = Object.entries(assets).flatMap(([layerKey, layerAssets]) => 
      layerAssets.map(asset => ({ ...asset, layerKey }))
    );

    return flattened.filter(asset => {
      // Category Filter
      if (categoryFilter && asset.layerKey !== categoryFilter) return false;
      // Rarity Filter
      if (rarityFilter && (asset.rarity || 'N/A') !== rarityFilter) return false;
      // Character Filter (Case-insensitive partial match)
      if (characterFilter && !(asset.character || '').toLowerCase().includes(characterFilter.toLowerCase())) return false;
      // Genes Filter (Case-insensitive partial match)
      if (genesFilter && !(asset.genes || '').toLowerCase().includes(genesFilter.toLowerCase())) return false;
      // Series Filter (Exact match or all)
      if (selectedSeries && (asset.series || 'Series 1') !== selectedSeries) {
           return false;
      }
      
      return true; // Include if all filters pass
    });
    // Optionally sort filtered assets
    // .sort((a, b) => a.layerKey.localeCompare(b.layerKey) || a.name.localeCompare(b.name));
  }, [assets, categoryFilter, rarityFilter, characterFilter, genesFilter, selectedSeries]);

  // <<< Group Filtered Assets by Category >>>
  const groupedFilteredAssets = useMemo(() => {
    // Explicitly type the accumulator for the reduce function
    return filteredAssets.reduce((acc, asset) => {
      const key = asset.layerKey;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(asset);
      return acc;
    }, {} as Record<string, AssetDetail[]>); // <-- Explicit type here
  }, [filteredAssets]);

  // Function to toggle collapse state
  const toggleCategoryCollapse = (categoryKey: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey] // Toggle the boolean value
    }));
  };

  // --- Get unique values for dropdowns ---
  const uniqueCategories = useMemo(() => [
      '', 
      ...Array.from(new Set(Object.keys(assets)))
          .sort()
  ], [assets]);
  const uniqueRarities = useMemo(() => [
      '', 
      ...Array.from(new Set(Object.values(assets).flat().map(a => a.rarity || 'N/A')))
          .sort()
  ], [assets]);
  const uniqueGenes = useMemo(() => [...new Set(filteredAssets.map(a => a.genes).filter(Boolean))].sort(), [filteredAssets]);
  const uniqueCharacters = useMemo(() => [...new Set(filteredAssets.map(a => a.character).filter(Boolean))].sort(), [filteredAssets]);
  // Note: Unique characters/genes might be numerous; consider text input or typeahead later
  // --------------------------------------

  // TODO: Implement pagination or virtualization if needed for performance

  // 2. Render the table
  return (
    <div>
      {/* --- Filter UI --- */} 
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4 p-4 bg-gray-800/50 rounded-md">
        {/* Category Dropdown */} 
        <div>
          <label htmlFor="category-filter" className="block text-xs font-medium text-gray-400 mb-1">Category</label>
          <select 
            id="category-filter" 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)} 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="">All Categories</option>
            {uniqueCategories.slice(1).map(cat => <option key={cat} value={cat}>{toTitleCase(cat)}</option>)}
          </select>
        </div>
        {/* Rarity Dropdown */} 
        <div>
          <label htmlFor="rarity-filter" className="block text-xs font-medium text-gray-400 mb-1">Rarity</label>
          <select 
            id="rarity-filter" 
            value={rarityFilter} 
            onChange={(e) => setRarityFilter(e.target.value)} 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="">All Rarities</option>
             {uniqueRarities.slice(1).map(rarity => <option key={rarity} value={rarity}>{rarity}</option>)} 
          </select>
        </div>
         {/* Character Input */}
        <div>
          <label htmlFor="character-filter" className="block text-xs font-medium text-gray-400 mb-1">Character</label>
          <input 
            type="text" 
            id="character-filter" 
            value={characterFilter || ''}
            onChange={(e) => setCharacterFilter(e.target.value)} 
            placeholder="Filter by character..." 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>
         {/* Genes Input */}
        <div>
          <label htmlFor="genes-filter" className="block text-xs font-medium text-gray-400 mb-1">Genes</label>
          <select 
            id="genes-filter" 
            value={genesFilter || ''}
            onChange={(e) => setGenesFilter(e.target.value)} 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="">All Genes</option>
            {/* Filter out null/undefined using a type guard before mapping */}
            {uniqueGenes.filter((gene): gene is string => typeof gene === 'string').map(gene => (
              <option key={gene} value={gene}>{gene}</option>
            ))} 
          </select>
        </div>
        {/* Series Dropdown */}
        <div>
          <label htmlFor="series-filter" className="block text-xs font-medium text-gray-400 mb-1">Series</label>
          <select 
            id="series-filter" 
            value={selectedSeries} 
            onChange={(e) => setSelectedSeries(e.target.value)} 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-1 focus:ring-pink-500"
          >
            <option value="">All Series</option>
            <option value="Series 1">Series 1</option>
            <option value="Series 2" disabled className="text-gray-500">Series 2 (Coming Soon)</option>
            <option value="Series 3" disabled className="text-gray-500">Series 3 (Coming Soon)</option>
          </select>
        </div>
      </div>
      {/* --- End Filter UI --- */}

      <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-700"><thead className="bg-gray-700">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Number</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Image</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rarity</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Character</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Genes</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">RGB</th>
              <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Str</th>
              <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Spd</th>
              <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Skl</th>
              <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Stm</th>
              <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Stl</th>
              <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Sty</th>
            </tr>
          </thead>
          {/* <<< Updated Table Body for Grouping/Collapsing >>> */}
          <tbody className="bg-gray-800 divide-y divide-gray-600">
            {Object.entries(groupedFilteredAssets).length === 0 ? (
              // Handle case where no assets remain after filtering
              <tr>
                <td colSpan={14} className="text-center text-gray-500 py-6 text-sm">
                  No elements match the current filters.
                </td>
              </tr>
            ) : (
              // Map over grouped assets
              Object.entries(groupedFilteredAssets).map(([categoryKey, assetsInCategory]) => {
                const isCollapsed = collapsedCategories[categoryKey];
                const categoryItemCount = assetsInCategory.length;
                const folderName = getLayerFolder(categoryKey);

                return (
                  <React.Fragment key={categoryKey}>
                    {/* Category Header Row */} 
                    <tr className="bg-gray-700/50 hover:bg-gray-700/80">
                      <td colSpan={14} className="px-4 py-2"><button 
                          onClick={() => toggleCategoryCollapse(categoryKey)}
                          className="flex items-center justify-start w-full text-left text-sm font-semibold text-teal-300 hover:text-teal-200"
                        >
                          <span className="mr-2 w-4 text-center">{isCollapsed ? '►' : '▼'}</span>
                          <span>{toTitleCase(categoryKey)} ({categoryItemCount} items)</span>
                        </button>
                      </td>
                    </tr>

                    {/* Always map, but return null for collapsed rows */} 
                    {assetsInCategory.map((asset: AssetDetail, index: number) => {
                      if (isCollapsed) return null;

                      const imageUrl = asset.filename ? `/assets/${folderName}/${asset.filename}` : '/placeholder.png'; // Safety check for image URL
                      const stats = { ...asset.stats, strength: asset.stats?.strength || 0, speed: asset.stats?.speed || 0, skill: asset.stats?.skill || 0, stamina: asset.stats?.stamina || 0, stealth: asset.stats?.stealth || 0, style: asset.stats?.style || 0 };
                      // Add safety check for asset.filename before calling .includes()
                      const isRgb = !!asset.filename?.includes('_RGB_');
                      
                      return (
                        <tr key={`${asset.filename || `missing-filename-${index}`}-${index}`} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{toTitleCase(categoryKey)}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{asset.assetNumber || 'N/A'}</td>
                          <td className="px-4 py-1">
                             {/* Use the safety-checked imageUrl */}
                             <Image src={imageUrl} alt={asset.name || 'Unknown Asset'} width={40} height={60} objectFit="contain" unoptimized className="rounded" onError={(e) => e.currentTarget.src = '/placeholder.png'} />
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-200">
                            <span data-tooltip-img-url={imageUrl}>{asset.name || 'Unnamed'}</span> {/* Add fallback for name */} 
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{asset.rarity || 'N/A'}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{(asset.character && asset.character !== 'N/A') ? asset.character : ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{(asset.genes && asset.genes !== 'N/A') ? asset.genes : ''}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-green-400">{isRgb ? '✅' : ''}</td>
                          {/* Stats Cells */}
                          <td className="px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">{stats.strength}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">{stats.speed}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">{stats.skill}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">{stats.stamina}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">{stats.stealth}</td>
                          <td className="px-2 py-2 text-center whitespace-nowrap text-sm text-gray-300">{stats.style}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
// ---------------------------------

// Main index page component
function ElementsIndexPageContent() {
  console.log("[Elements Index] Component rendering started."); 

  const { 
    isInitialized, 
    availableAssets, 
    assetLoadingProgress 
  } = useAssets(); 
  
  console.log("[Elements Index] Initialized (from context):", isInitialized);
  console.log("[Elements Index] Available Assets Keys (from context):", Object.keys(availableAssets));

  const [currentView, setCurrentView] = useState<'grid' | 'catalogue' | 'table'>('grid'); // Keep state for view

  // Filter layers (Needed for Grid view)
  const filteredLayers = LAYER_ORDER.filter(key => 
    LAYER_DETAILS[key] && !EXCLUDED_LIBRARY_LAYERS.has(key)
  );
  
  // <<< Sort filtered layers alphabetically >>>
  const displayLayers = [...filteredLayers].sort((a, b) => a.localeCompare(b)); 

  console.log("[Elements Index] Layers to display (sorted alphabetically):", displayLayers);

  // --- Restore Loading State --- 
  if (!isInitialized) { 
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6 flex items-center justify-center">
        <div className="text-center max-w-xl">
          <h1 className="text-3xl font-bold text-center text-pink-500 mb-6">Loading Elements Library...</h1>
          <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
            <div className="bg-pink-500 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${assetLoadingProgress}%` }}></div>
          </div>
          <p className="text-sm text-gray-400 mt-2">{assetLoadingProgress}% Complete</p>
        </div>
      </div>
    );
  }
  // --- Restore Error State (No Assets) --- 
  const hasAssets = Object.keys(availableAssets).length > 0;
  if (!hasAssets) {
     return (
        <div className="min-h-screen bg-gray-950 text-white p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-pink-500 mb-8 text-center">Character Elements Library</h1>
            <p className="text-center text-yellow-500">Initialization complete, but no assets were loaded for display. Please check the API connection or console logs for errors.</p>
          </div>
            <footer className="mt-16 text-center text-gray-500 text-sm">
              <p>&copy; 2024 Ninja Punk Girls. All rights reserved.</p>
            </footer>
        </div>
      );
  }
  // --- Success State --- 
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-pink-500 mb-4 text-center">Character Elements Library</h1>

        {/* Tab Buttons UI */}
        <div className="flex justify-center mb-6 border-b border-gray-700">
          <button
            onClick={() => setCurrentView('grid')}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors 
              ${currentView === 'grid' 
                ? 'border-pink-500 text-pink-400' 
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}
            `}
          >
            Grid View
          </button>
          <button
            onClick={() => setCurrentView('catalogue')}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors
              ${currentView === 'catalogue'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}
            `}
          >
            List View
          </button>
          <button
            onClick={() => setCurrentView('table')}
            className={`px-4 py-2 -mb-px text-sm font-medium border-b-2 transition-colors
              ${currentView === 'table'
                ? 'border-pink-500 text-pink-400'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}
            `}
          >
            Table View
          </button>
        </div>
        
        {/* Conditional Rendering Logic ... (keep as is) */}
        {currentView === 'grid' && (
            <>
              {/* Existing Grid View Logic using displayLayers and availableAssets */} 
              {displayLayers.length === 0 ? (
                <p className="text-center text-red-500">Error: No displayable layers found after filtering.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Map over the REVERSED displayLayers array */}
                  {displayLayers.map((layerKey) => { 
                    const folderName = getLayerFolder(layerKey);
                    // Remove the cast here, availableAssets should provide AssetDetail[]
                    const assetsInCategory = availableAssets[layerKey] || [];
                    const assetCount = assetsInCategory.length;
                    
                    // Get the filename of the first asset (should now work with correct type)
                    const firstAssetFilename = assetsInCategory[0]?.filename;
                    // Construct the image URL
                    let firstAssetImageUrl = '/placeholder.png'; // Default fallback
                    if (firstAssetFilename) {
                        // Construct the path relative to the public directory
                        // Assuming assets are stored in /public/assets/<layerFolderName>/<filename>
                        firstAssetImageUrl = `/assets/${folderName}/${firstAssetFilename}`;
                    }
                    
                    // Get URL for the card background JPG
                    const cardBackgroundUrl = getCoverImageUrl(layerKey);
                    
                    console.log(`[Elements Index] Rendering Card - LayerKey: ${layerKey}, Count: ${assetCount}, Image: ${firstAssetImageUrl}, Background: ${cardBackgroundUrl}`);

                    return (
                      <Link 
                        key={layerKey}
                        href={`/elements/${encodeURIComponent(folderName)}`}
                        className="block bg-gray-800 rounded-lg shadow-md overflow-hidden hover:border-pink-500/50 border border-gray-700/50 transition-all duration-200 group"
                      >
                        {/* Image Container - Layered images: background card + element PNG */}
                        <div className="w-full aspect-[961/1441] relative bg-gray-700 rounded-t-lg overflow-hidden">
                           {/* Background Card Image (bottom layer) */}
                           <img 
                             src={cardBackgroundUrl} 
                             alt={`${layerKey} background card`}
                             className="absolute inset-0 w-full h-full object-contain z-0"
                             onError={(e) => {
                               console.error(`Background Card Load Error for ${layerKey}: ${cardBackgroundUrl}`);
                               e.currentTarget.style.display = 'none';
                             }}
                           />
                           
                           {/* Element PNG Image (top layer) */}
                           {firstAssetImageUrl && firstAssetImageUrl !== '/placeholder.png' && (
                             <img 
                               src={firstAssetImageUrl} 
                               alt={`${layerKey} element`}
                               className="absolute inset-0 w-full h-full object-contain z-10"
                               onError={(e) => {
                                 console.error(`Element PNG Load Error for ${layerKey}: ${firstAssetImageUrl}`);
                                 e.currentTarget.style.display = 'none';
                               }}
                             />
                           )}
                        </div>
                        {/* Category Info */}
                        <div className="p-3">
                          <h3 className="text-md font-semibold text-gray-200 truncate" title={toTitleCase(layerKey)}>{toTitleCase(layerKey)}</h3>
                          {/* Display asset count */}
                          <p className="text-xs text-gray-400">{assetCount} element{assetCount !== 1 ? 's' : ''}</p> 
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
        )}
        {currentView === 'catalogue' && (
          <ElementsCatalogueTable assets={availableAssets} />
        )}
        {currentView === 'table' && (
          <PeriodicTable />
        )}

      </div>
      <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; 2024 Ninja Punk Girls. All rights reserved.</p>
        </footer>
    </div>
  );
}

// Wrapper with ErrorBoundary
export default function ElementsIndexPage() {
  return (
    <ErrorBoundary>
      <ElementsIndexPageContent />
    </ErrorBoundary>
  );
} 