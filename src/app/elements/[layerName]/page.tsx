'use client';

import React, { useState, useEffect } from 'react';
import { useAssets } from '@/context/AssetContext';
// @ts-ignore - Attempting to suppress persistent build error for AssetDetail import
import { AssetDetail, StatsType } from '@/types';
import { LAYER_DETAILS } from '@/data/layer-config';
import Image from 'next/image'; 
import ErrorBoundary from '@/components/ErrorBoundary';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// --- Helper Function for Title Case --- 
// (Could be moved to a shared util file)
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('-');
};
// --------------------------------------

// Helper to find the layer key and generate display name
const getLayerInfoFromUrlParam = (urlParamFolderName: string): { layerKey: string | null; displayTitle: string } => {
  const decodedFolderName = decodeURIComponent(urlParamFolderName);
  const entry = Object.entries(LAYER_DETAILS).find(([_, details]) => details.folderName === decodedFolderName);
  
  if (entry) {
    const layerKey = entry[0];
    // Return the original key and a title-cased version for display
    return { layerKey: layerKey, displayTitle: toTitleCase(layerKey) }; 
  } else {
    console.warn(`Could not find layer key for folder: ${decodedFolderName}`);
    // Fallback: use decoded folder name, attempt title case
    return { layerKey: null, displayTitle: toTitleCase(decodedFolderName) }; 
  }
};

// Helper to get card cover image URL based on layer key
const getCoverImageUrl = (layerKey: string): string => {
  const layerDetail = LAYER_DETAILS[layerKey];
  if (!layerDetail) {
    console.error(`[getCoverImageUrl] No layer detail found for key: ${layerKey}`);
    return '/placeholder.png';
  }
  
  const baseName = layerKey.toLowerCase().replace(/-/g, '_').replace(/\s+/g, '_');
  const filename = `${layerDetail.number}_${baseName}.jpg`;
  console.log(`[getCoverImageUrl] Generated filename: ${filename} for layer key: ${layerKey}`);
  return `/element_cards/${filename}`;
};

// StatsDisplay component - Corrected Logic
const StatsDisplay: React.FC<{ stats?: Partial<StatsType> }> = ({ stats }) => {
  // *** Log the raw object ***
  console.log("[StatsDisplay] Received raw stats prop:", stats);
  // Also log the stringify version for comparison
  console.log("[StatsDisplay] Received stringified stats prop:", JSON.stringify(stats));

  if (typeof stats !== 'object' || stats === null) {
    return <p className="text-gray-500 text-xs italic">No stats data</p>;
  }

  // Filter out stats with value 0, undefined, or null.
  const relevantStats = Object.entries(stats)
    .filter(([key, value]) => value !== undefined && value !== null && value !== 0)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)); 

  console.log("[StatsDisplay] Filtered relevant stats:", relevantStats); // Keep this log too

  if (relevantStats.length === 0) {
      return <p className="text-gray-500 text-xs italic">Stats all zero</p>;
  }

  return (
    <div className="mt-2 pt-2 border-t border-gray-700/30">
      <p className="font-semibold text-teal-400 mb-1 text-xs">Stats:</p>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
        {relevantStats.map(([key, value]) => (
          <p key={key} className="text-gray-400 text-[10px] capitalize">
            {/* Ensure value is treated as a number if needed, but display as is */}
            {key}: <span className="font-medium text-gray-300">{String(value)}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

// AssetCard component updated for full card display
const AssetCard: React.FC<{ 
  // Use @ts-ignore as a broader suppression for the persistent error
  // @ts-ignore 
  asset: AssetDetail, 
  folderName: string,
  coverImageUrl: string,
  layerKey: string | null
}> = ({ asset, folderName, coverImageUrl, layerKey }) => {
  let assetPngUrl = '/placeholder.png'; 
  if (asset.filename && folderName) {
    assetPngUrl = `/assets/${encodeURIComponent(folderName)}/${encodeURIComponent(asset.filename)}`;
  }

  // --- Define Base Card Dimensions (IMPORTANT: Adjust if incorrect!) ---
  const cardWidth = 512; 
  const cardHeight = 768; 
  // -------------------------------------------------------------------

  // *** Add console log to inspect asset.stats ***
  console.log(`[AssetCard] Rendering for ${asset.filename || 'unknown file'}, Stats:`, asset.stats);
  // *** ADDED: Log generated image URLs for debugging ***
  console.log(`[AssetCard] DEBUG: assetPngUrl=${assetPngUrl}, coverImageUrl=${coverImageUrl}`);

  return (
    <div className="block bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col text-xs border border-gray-700/50 group">
      {/* Image container with relative positioning */}
      {/* Let the background image establish the size/aspect ratio */}
      <div className="relative w-full bg-gray-700"> 
        {/* Background Cover Image - Use responsive layout */}
        <Image
          src={coverImageUrl}
          alt={`${layerKey || 'Layer'} background`}
          layout="responsive" 
          width={cardWidth} 
          height={cardHeight}
          // objectFit="cover" // Usually default for responsive
          unoptimized 
          className="block group-hover:opacity-60 transition-opacity duration-150" // Acts as base layer
          onError={(e) => { 
            console.error(`[AssetCard] Cover Image Load Error for src: ${coverImageUrl}`);
            e.currentTarget.style.display = 'none';
          }} 
        />
        {/* Foreground Asset PNG Image - Use fill layout */}
        <Image
          src={assetPngUrl}
          alt={`${layerKey || 'Element'} layer: ${asset.name || asset.filename}`}
          layout="fill" // Fill the container established by the background
          objectFit="contain" // Contain within the bounds, keep aspect ratio
          unoptimized 
          className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-150 z-10" // Position over background
          onError={(e) => { 
            console.error(`[AssetCard] Asset Image Load Error for src: ${assetPngUrl}`);
            // Optional: Hide or show placeholder if foreground fails
            e.currentTarget.src = '/placeholder.png'; // Show placeholder on error
            (e.target as HTMLImageElement).style.objectFit = 'scale-down'; // Adjust fit for placeholder
          }} 
        />
      </div>
      {/* Asset Info - Placed AFTER the image container */}
      <div className="p-2 space-y-0.5 border-t border-gray-700/50">
        <p className="text-gray-300 font-semibold break-words text-sm" title={asset.name}>
           {asset.name || 'Unnamed Asset'}
        </p>
        <p className="text-gray-400 break-all text-[10px]" title={asset.filename || 'N/A'}>
          <span className="font-semibold text-teal-400">File:</span> {asset.filename || 'N/A'}
        </p>
        {asset.rarity && (
          <p className="text-gray-400 text-xs">
            <span className="font-semibold text-teal-400">Rarity:</span> {asset.rarity}
          </p>
        )}
        {asset.character && (
          <p className="text-gray-400 text-xs">
            <span className="font-semibold text-teal-400">Char:</span> {asset.character}
          </p>
        )}
        {asset.genes && (
          <p className="text-gray-400 text-xs">
            <span className="font-semibold text-teal-400">Genes:</span> {asset.genes}
          </p>
        )}
        <StatsDisplay stats={{ ...(asset.stats || {}) }} />
        <Link href={assetPngUrl} passHref legacyBehavior>
             <a target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400/70 hover:text-blue-300 transition-colors duration-150 inline-block mt-1">
               View Raw PNG
             </a>
        </Link>
      </div>
    </div>
  );
};

// Main component for the dynamic layer page
function LayerElementsPageContent() {
  const params = useParams();
  if (!params) {
      return <p className="text-center text-red-500">Error: Could not load route parameters.</p>;
  }

  // Get the raw folder name from URL
  const urlParamFolderName = params.layerName as string;
  if (!urlParamFolderName) {
    return <p className="text-center text-red-500">Layer name missing in URL.</p>;
  }

  // Get layerKey and the title-cased displayTitle
  const { layerKey, displayTitle } = getLayerInfoFromUrlParam(urlParamFolderName);
  const decodedFolderName = decodeURIComponent(urlParamFolderName); 
  
  // Calculate cover image URL once using the layerKey
  const coverImageUrl = layerKey ? getCoverImageUrl(layerKey) : '/placeholder.png';

  // Use the context hook
  const { 
    isInitialized, 
    availableAssets, 
    assetLoadingProgress 
  } = useAssets(); 

  // Get assets using the mapped layerKey from context state
  const currentLayerAssets = layerKey ? (availableAssets[layerKey] || []) : [];
  console.log(`[LayerElementsPageContent] Found ${currentLayerAssets.length} assets for layer key: ${layerKey} (from context)`);

  // Use loading state from context
  const isLoading = !isInitialized;
  const hasNoAssetsAfterLoad = isInitialized && currentLayerAssets.length === 0;

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center">
            <div className="text-center max-w-xl">
          <h1 className="text-3xl font-bold text-center text-pink-500 mb-6">Loading Assets for {displayTitle}...</h1>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-4">
                <div className="bg-pink-500 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${assetLoadingProgress}%` }}></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">{assetLoadingProgress}% Complete</p>
            </div>
        </div>
    );
  }
  
  if (hasNoAssetsAfterLoad) {
      return (
          <div className="min-h-screen bg-gray-950 text-white p-6">
              <div className="max-w-7xl mx-auto">
          <Breadcrumb displayName={displayTitle} />
          <h1 className="text-3xl font-bold text-pink-500 mb-8 text-center">{displayTitle} Elements</h1>
          <p className="text-center text-gray-500">No assets found for this layer key: {layerKey || 'Unknown'}.</p>
              </div>
          </div>
      );
  }

  // Success state: Render grid with composited cards
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb displayName={displayTitle} />
        
        <h1 className="text-3xl font-bold text-pink-500 mb-8 text-center">{displayTitle} Element Cards</h1>
        
        {/* Grid rendering */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {currentLayerAssets
            .sort((a, b) => (a.filename || '').localeCompare(b.filename || ''))
            .map((asset) => (
              <AssetCard 
                key={asset.filename}
                asset={asset} 
                folderName={decodedFolderName}
                coverImageUrl={coverImageUrl}
                layerKey={layerKey}
              />
          ))}
        </div>
      </div>
       <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>&copy; 2024 Ninja Punk Girls. All rights reserved.</p>
        </footer>
    </div>
  );
}

// Simple breadcrumb component
const Breadcrumb: React.FC<{ displayName: string }> = ({ displayName }) => (
  <nav aria-label="Breadcrumb" className="mb-6 text-sm">
    <ol className="flex items-center gap-1.5">
      <li>
        <Link href="/elements" className="text-gray-400 hover:text-pink-400 transition-colors">
          Elements Library
        </Link>
      </li>
      <li className="text-gray-500">/</li>
      <li>
        <span className="text-white font-medium">{displayName}</span>
      </li>
    </ol>
  </nav>
);

// Wrapper with ErrorBoundary
export default function LayerElementsPage() {
  return (
    <ErrorBoundary>
      <LayerElementsPageContent />
    </ErrorBoundary>
  );
} 