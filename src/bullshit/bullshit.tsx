'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { NFTAttribute } from '@/types'; // Assuming NFTAttribute is needed

// Define the shape of the context data
interface AssetContextType {
  availableAssets: Record<string, NFTAttribute[]>;
  isInitialized: boolean;
  assetLoadingProgress: number;
  loadAssets: () => Promise<void>;
}

// Create the context
const AssetContext = createContext<AssetContextType | undefined>(undefined);

// Create the provider component
export const AssetProvider = ({ children }: { children: ReactNode }) => {
  const [availableAssets, setAvailableAssets] = useState<Record<string, NFTAttribute[]>>({});
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [assetLoadingProgress, setAssetLoadingProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Function to load assets (replace with your actual loading logic)
  const loadAssets = useCallback(async () => {
    if (isLoading || isInitialized) return; // Prevent concurrent loads or re-initialization
    
    console.log('[AssetProvider] loadAssets called');
    setIsLoading(true);
    setAssetLoadingProgress(0);

    try {
      // TODO: Implement your actual asset fetching and processing logic here.
      // This likely involves fetching JSON metadata, parsing it, 
      // and structuring it into the availableAssets format.
      console.log('[AssetProvider] Placeholder: Simulating asset load...');
      
      // Simulate progress
      await new Promise(resolve => setTimeout(resolve, 200)); setAssetLoadingProgress(25);
      await new Promise(resolve => setTimeout(resolve, 300)); setAssetLoadingProgress(50);
      await new Promise(resolve => setTimeout(resolve, 400)); setAssetLoadingProgress(75);

      // --- Example: Fetch and process asset data --- 
      // const response = await fetch('/api/assets-metadata'); // Example API call
      // if (!response.ok) throw new Error('Failed to fetch asset metadata');
      // const rawData = await response.json();
      // const processedAssets = processRawAssetData(rawData); // Your processing function
      // setAvailableAssets(processedAssets);
      // ---------------------------------------------

      // For now, set dummy data or leave empty
      setAvailableAssets({}); // Replace with actual processed assets
      
      await new Promise(resolve => setTimeout(resolve, 100)); setAssetLoadingProgress(100);
      setIsInitialized(true);
      console.log('[AssetProvider] Asset loading simulation complete.');

    } catch (error) {
      console.error('[AssetProvider] Error loading assets:', error);
      // Handle error state appropriately
      setAvailableAssets({});
      setIsInitialized(false); // Ensure not marked as initialized on error
    } finally {
      setIsLoading(false);
      // Reset progress if load failed but might be retried?
      // if (!isInitialized) setAssetLoadingProgress(0);
    }
  }, [isLoading, isInitialized]);

  // Optionally load assets automatically when the provider mounts
  useEffect(() => {
    console.log('[AssetProvider useEffect] Not initialized, calling loadAssets.');
    loadAssets();
  }, [loadAssets]); // Dependency array ensures loadAssets is stable

  // The value provided to consuming components
  const value = {
    availableAssets,
    isInitialized,
    assetLoadingProgress,
    loadAssets,
  };
  
  console.log('[AssetProvider] Rendering with state:', { isInitialized, isLoading, keys: Object.keys(availableAssets).length });

  return (
    <AssetContext.Provider value={value}>
      {children}
    </AssetContext.Provider>
  );
};

// Hook to use the asset context
export const useAssets = () => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
}; 