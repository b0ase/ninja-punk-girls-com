'use client';

import { useState, useEffect, useCallback } from 'react';
import { NFTAttribute, NFTType, StatsType, AssetMetadata } from '@/types';
import { AssetDetail } from '@/app/api/asset-data/route';
import { LAYER_ORDER, REQUIRED_LAYERS, EXCLUDED_LAYERS, LAYER_DETAILS } from '@/data/layer-config';
import { getRandomName } from '@/data/japanese-names';
import { useAssets } from '@/context/AssetContext';

// Define layers that should NOT be filtered by gene
const NON_FILTERED_LAYERS = new Set([
  // 'BACKGROUND', // Removed
  'GLOW', 
  // 'BANNER', // Removed
  'Interface' // Keep Interface unfiltered
  // Add any other non-character specific layers here
]);

// Client-side cache for processed data
let clientAssetDataCache: Record<string, NFTAttribute[]> | null = null;

// Helper to create empty stats
const createEmptyStats = (): StatsType => ({
  strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0
});

// --- Existing generateNewNFTData (Needs NFTAttribute type) --- 
export type NftFilterType = 'all' | 'gene' | 'color'; // Add color type
export interface NftFilter {
    type: NftFilterType;
    value?: string; // Gene name (erobot, npg) or Color name (red, black)
}

// Function now exported from the hook - Use NFTAttribute
export const generateNewNFTData = (
    availableAssets: Record<string, AssetDetail[]>, // <<< CHANGE BACK TO AssetDetail[]
    filter: NftFilter = { type: 'all' } // Default to 'all'
): Omit<NFTType, 'image'> | null => {
    if (!availableAssets || Object.keys(availableAssets).length === 0) { return null; }
    try {
      console.log(`[generateNewNFTData] Starting generation with filter:`, filter);
      // <<< Log sample availableAssets structure >>>
      if (availableAssets['BODY_SKIN'] && availableAssets['BODY_SKIN'].length > 0) {
          console.log(`[generateNewNFTData Debug] Sample BODY_SKIN asset[0]:`, JSON.stringify(availableAssets['BODY_SKIN'][0], null, 2));
      } else {
          console.log(`[generateNewNFTData Debug] No BODY_SKIN assets found.`);
      }
      // <<<

      const totalStats: StatsType = createEmptyStats();
      const selectedAssets: Record<string, AssetDetail> = {}; // <<< Use AssetDetail

      // Updated filter logic
      const matchesFilter = (asset: AssetDetail, layerKey: string): boolean => { // <<< Use AssetDetail
        // If filter is 'all', always include
        if (filter.type === 'all') return true;

        // Always include assets from non-filtered layers
        if (NON_FILTERED_LAYERS.has(layerKey)) return true; 

        // --- Gene Filtering Logic ---
        if (filter.type === 'gene' && filter.value) {
            const targetGene = filter.value.toLowerCase();
            // <<< SAFELY access genes (exists on AssetDetail) >>>
            const assetGene = asset?.genes?.toLowerCase(); 

            // Allow if the asset has NO specific gene OR if its gene MATCHES the target
            if (!assetGene || assetGene === targetGene) {
                return true;
            }
            // Otherwise (asset has a DIFFERENT gene), exclude it
            return false; 
        }
        // --- End Gene Filtering ---
        
        // Add other filter types like color later if needed
        // else if (filter.type === 'color') { ... }
        
        // Default: If filter type isn't handled (e.g., color) or no value provided, include for now
        // This might need refinement if other filters are added
        return true; 
      };
      
      // --- Layer selection logic --- 
      // Select required layers...
      console.log(`[generateNewNFTData Debug] Selecting REQUIRED layers...`);
      for (const layer of REQUIRED_LAYERS) { 
          // Pass layer key to matchesFilter
          const layerAssets = availableAssets[layer];
          if (!layerAssets) {
              console.error(`FATAL: No assets array found for required layer: ${layer}`);
              return null; // Cannot proceed if required layer list doesn't exist
          }
          const potentiallyAvailable = layerAssets.filter(asset => matchesFilter(asset, layer));
          // <<< Log potentially available assets >>>
          console.log(`[generateNewNFTData Debug] Layer ${layer} (Required): ${potentiallyAvailable?.length ?? 0} assets potentially available after filter.`);
          
          // <<< Add filter to exclude the specific unwanted asset >>>
          const available = potentiallyAvailable?.filter(asset => asset.filename !== '03_00_scores_x_x_x_x.png'); // <<< Use filename
          
          if (available?.length > 0) {
            const randomIndex = Math.floor(Math.random() * available.length);
            selectedAssets[layer] = available[randomIndex];
            // <<< Log the selected asset >>>
            console.log(`[generateNewNFTData Debug] Layer ${layer}: Selected asset index ${randomIndex}:`, JSON.stringify(selectedAssets[layer], null, 2));
          } else {
             console.warn(`No assets match filter for required layer: ${layer}`);
             // Might need a fallback to any asset if filtering causes required layer to be missing
             const fallbackAvailable = availableAssets[layer];
             if (fallbackAvailable?.length > 0) {
                console.warn(`Falling back to random asset for required layer: ${layer}`);
                const fallbackIndex = Math.floor(Math.random() * fallbackAvailable.length);
                selectedAssets[layer] = fallbackAvailable[fallbackIndex];
                // <<< Log the fallback selected asset >>>
                console.log(`[generateNewNFTData Debug] Layer ${layer}: Selected FALLBACK asset index ${fallbackIndex}:`, JSON.stringify(selectedAssets[layer], null, 2));
             } else {
                console.error(`FATAL: No assets available at all for required layer: ${layer}`);
                // Handle this critical error - maybe return null or throw
                return null;
             }
          }
      }
      // Select optional layers...
      console.log(`[generateNewNFTData Debug] Selecting OPTIONAL layers...`);
      const layersToExcludeFromSelection = ['SIX-S', 'COPYRIGHT'];
      for (const layer of LAYER_ORDER) { 
          if (layersToExcludeFromSelection.includes(layer) || selectedAssets[layer]) continue;
          
          const includeOptionalLayer = Math.random() < 0.7; // 70% chance
           if (!includeOptionalLayer) continue; 
           
           // Pass layer key to matchesFilter
           // <<< FIX: Add safety check for availableAssets[layer] before filtering >>>
           const optionalLayerAssets = availableAssets[layer];
           if (!optionalLayerAssets) {
               console.warn(`[generateNewNFTData Debug] No assets array found for optional layer: ${layer}, skipping.`);
               continue; // Skip this optional layer if no assets exist
           }
           const potentiallyAvailableOptional = optionalLayerAssets.filter(asset => matchesFilter(asset, layer));
           // <<< Log potentially available optional assets >>>
           console.log(`[generateNewNFTData Debug] Layer ${layer} (Optional): ${potentiallyAvailableOptional?.length ?? 0} assets potentially available after filter.`);

           // <<< Add filter to exclude the specific unwanted asset >>>
           const available = potentiallyAvailableOptional?.filter(asset => asset.filename !== '03_00_scores_x_x_x_x.png'); // <<< Use filename

           if (available?.length > 0) {
             const randomIndex = Math.floor(Math.random() * available.length);
             selectedAssets[layer] = available[randomIndex];
             // <<< Log the selected optional asset >>>
             console.log(`[generateNewNFTData Debug] Layer ${layer}: Selected asset index ${randomIndex}:`, JSON.stringify(selectedAssets[layer], null, 2));
           }
      }
      // -------------------------------------------------
      
      console.log(`[generateNewNFTData Debug] Final selectedAssets keys: ${Object.keys(selectedAssets).join(', ')}`);
      const attributes: NFTAttribute[] = [];
      // Layers specifically excluded from the final summary list
      const layersToExcludeFromSummary = new Set(['LOGO', 'INTERFACE', 'COPYRIGHT']);
      
      // Build attributes using the new NFTAttribute structure
      for (const layer of LAYER_ORDER) {
         // Removed 'SIX-S', 'COPYRIGHT' check here as it's handled below
         const selectedAssetDetail = selectedAssets[layer]; // This is type AssetDetail
         if (selectedAssetDetail) {
           // Skip adding excluded layers to the summary attributes
           if (layersToExcludeFromSummary.has(layer)) { 
               console.log(`[generateNewNFTData] Skipping summary for layer: ${layer}`);
               continue; // Go to the next layer
           }

           // Use actual stats from asset if available, else default/random
           const assetStats = { ...createEmptyStats(), ...(selectedAssetDetail.stats || {}) }; 
           
           // Accumulate stats (excluding decorative layers)
           if (!EXCLUDED_LAYERS.includes(layer)) { // Keep using EXCLUDED_LAYERS for stats
              Object.keys(totalStats).forEach(key => {
                const statKey = key as keyof StatsType;
                totalStats[statKey] += assetStats[statKey] || 0; // Add parsed stat or 0
              });
           }

           // <<< ADD LOGGING HERE >>>
           // Log the critical fields right before pushing the attribute
           console.log(`[Attr Generation] Layer: ${selectedAssetDetail.layer}, Name: '${selectedAssetDetail.name}', Filename: ${selectedAssetDetail.filename}`);
           if (typeof selectedAssetDetail.name !== 'string' || selectedAssetDetail.name.trim() === '') {
               console.error(`[Attr Generation ERROR] Name is invalid for layer ${selectedAssetDetail.layer}!`, selectedAssetDetail);
           }
           // <<< END LOGGING >>>

           // *** Use correct NFTAttribute structure ***
           // Add to summary attributes
           attributes.push({
             // Map from AssetDetail to NFTAttribute
             layer: selectedAssetDetail.layer || 'UNKNOWN_LAYER',
             name: selectedAssetDetail.name || 'Unknown',
             asset: selectedAssetDetail.filename || '',
             fullFilename: selectedAssetDetail.filename, // <<< Map filename to fullFilename
             metadata: {
                 // Map relevant fields from AssetDetail if needed, else empty
                 // <<< SAFELY access potentially missing metadata fields >>>
                 elementName: (selectedAssetDetail.name || ''),
                 characterName: (selectedAssetDetail.character || ''),
                 genes: (selectedAssetDetail.genes || ''),
                 rarity: (selectedAssetDetail.rarity || ''),
                 hasRGB: false, // Default - cannot determine from AssetDetail easily
             },
             stats: { ...createEmptyStats(), ...(selectedAssetDetail.stats || {}) } 
           });
         }
      }
      
      // Determine team based on filter
      let team = 'NINJA PUNK GIRLS'; // Default team
      let teamGene = 'npg'; // Default gene for team selection
      if (filter.type === 'gene') {
          if (filter.value?.toLowerCase() === 'erobot') {
              team = 'EROBOTZ';
              teamGene = 'erobot';
          } else if (filter.value?.toLowerCase() === 'npg') {
              team = 'NINJA PUNK GIRLS';
              teamGene = 'npg';
          }
      }

      // <<< Team Asset Selection Logic >>>
      const teamAssets = availableAssets['Team'];
      let selectedTeamAsset: AssetDetail | null = null; // Use AssetDetail
      if (teamAssets?.length > 0) {
          if (team === 'NINJA PUNK GIRLS') {
              // Find the specific NPG team asset
              selectedTeamAsset = teamAssets.find(asset => asset.genes?.toLowerCase() === 'npg') || null; // FIXED: Access genes directly
          } else if (team === 'EROBOTZ') {
              // Filter Erobot teams and select one randomly
              const erobotTeams = teamAssets.filter(asset => asset.genes?.toLowerCase() === 'erobot'); // FIXED: Access genes directly
              if (erobotTeams.length > 0) {
                  selectedTeamAsset = erobotTeams[Math.floor(Math.random() * erobotTeams.length)];
              }
          }
          // Fallback if specific team not found, just pick any team asset? Or leave null?
          if (!selectedTeamAsset) {
              console.warn(`Could not find specific asset for team ${team}, selecting random team asset as fallback.`);
              selectedTeamAsset = teamAssets[Math.floor(Math.random() * teamAssets.length)];
          }
      }

      // Ensure the selected team asset is correctly stored in selectedAssets 
      // (It should already be due to TEAM being in REQUIRED_LAYERS)
      if (selectedTeamAsset && !selectedAssets['Team']) {
        console.warn('[generateNewNFTData] Manually assigning selectedTeamAsset to selectedAssets. This might indicate an issue.');
        selectedAssets['Team'] = selectedTeamAsset;
      } else if (!selectedTeamAsset && selectedAssets['Team']) {
        // If TEAM was required but somehow no team asset was found, log warning
        console.warn('[generateNewNFTData] TEAM was required but no team asset selected.');
      }
      // <<< END Team Asset Selection Logic >>>

      const randomNumber = Math.floor(Math.random() * 10000) + 1;
      const randomName = getRandomName();
      const qrData = `npg-nft-${randomNumber}-${Date.now()}`;

      const newNFTData: Omit<NFTType, 'image'> = {
        number: randomNumber, name: randomName, team, series: 'Series 1',
        totalSupply: 10000, attributes, stats: totalStats, qrData: qrData
      };
      console.log(`[generateNewNFTData] Generated NFT Data:`, newNFTData);
      return newNFTData;
    } catch (error) { console.error('[generateNewNFTData] Error:', error); return null; }
}; 
// -----------------------------------------------------

// Hook now primarily manages NFT generation state and uses AssetContext for data
export function useNFTGenerator() {
  const { availableAssets: contextAssets, isInitialized, assetLoadingProgress } = useAssets();

  const [nft, setNFT] = useState<NFTType | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Removed useEffect for loading assets - this is handled by AssetProvider

  const updateNFTStats = useCallback((newStats: StatsType) => {
     if (!nft) return;
     setNFT(currentNFT => currentNFT ? { ...currentNFT, stats: newStats } : null);
  }, [nft]);

  // Memoize the generate function to avoid recreating it unnecessarily
  const generateNFT = useCallback((filter: NftFilter = { type: 'all' }) => {
    // Pass the contextAssets (which are AssetDetail[]) to the generation function
    return generateNewNFTData(contextAssets, filter);
  }, [contextAssets]); // Depend on contextAssets

  // Generate NFT using asset data from context
  const generateRandomNFT = useCallback(async (filter: NftFilter = { type: 'all' }) => {
    if (!isInitialized || isGenerating || !contextAssets || Object.keys(contextAssets).length === 0) {
       console.warn("Cannot generate: Asset context not initialized, generating, or no assets loaded.");
       return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationError(null);
    setNFT(null);
    
    try {
      // Use the generateNewNFTData function, passing the assets from context
      const newNFTData = generateNFT(filter);
      
      if (newNFTData) {
          // Here you would typically generate the image based on attributes/newNFTData
          // For now, just setting the data part
          const generatedNFT: NFTType = {
              ...newNFTData,
              image: '' // Placeholder for generated image URL/data
          };
          setNFT(generatedNFT);
          console.log("Generated NFT (in hook):", generatedNFT);
          setGenerationProgress(100);
      } else {
          console.error("Failed to generate NFT data.");
          setGenerationError("Failed to generate NFT data internally."); // Set error state
          setGenerationProgress(100);
      }

    } catch (error: any) {
        console.error("Error during NFT generation:", error);
        setGenerationError(error.message || "Failed to generate NFT.");
        setGenerationProgress(100); // Ensure progress completes even on error
    } finally {
        setIsGenerating(false);
    }
  }, [isInitialized, isGenerating, contextAssets]); 

  // Return the state and functions managed by this hook
  return {
    nft, // The generated NFT object
    isGenerating, // Is NFT generation in progress?
    generationProgress, // Progress of the current NFT generation
    generationError, // Error message if generation fails
    generateRandomNFT, // Function to trigger generation
    updateNFTStats, // Function to update stats (if needed separately)
    
    // Pass through the asset state from the context for convenience
    availableAssets: contextAssets, 
    isInitialized, 
    assetLoadingProgress, 
    
    // Expose the static generator function if needed elsewhere
    // Note: Consider if this static function should live outside the hook entirely
    generateNewNFTData: generateNFT
  };
} 