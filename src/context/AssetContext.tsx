'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode, useMemo, useCallback } from 'react';
import { AssetDetail, StatsType } from '@/types';

// Define cache constants
const CACHE_KEY = 'assetDataCache';
const CACHE_TIMESTAMP_KEY = 'assetDataCacheTimestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Helper to create empty stats (moved from hook)
const createEmptyStats = (): StatsType => ({
  strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0
});

interface AssetContextType {
  availableAssets: Record<string, AssetDetail[]>;
  isInitialized: boolean;
  assetLoadingProgress: number;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

// Client-side cache
let providerAssetDataCache: Record<string, AssetDetail[]> | null = null;

export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [availableAssets, setAvailableAssets] = useState<Record<string, AssetDetail[]>>(providerAssetDataCache || {});
  const [isInitialized, setIsInitialized] = useState<boolean>(!!providerAssetDataCache);
  const [assetLoadingProgress, setAssetLoadingProgress] = useState<number>(providerAssetDataCache ? 100 : 0);

  // Define loadAssets using useCallback outside useEffect
  const loadAssets = useCallback(async () => {
    console.log("[AssetProvider] loadAssets called");
    // Note: Cannot directly check isInitialized here as it would cause a stale closure.
    // The check is performed within the useEffect before calling.

    // Check cache first (logic depends on localStorage, safe outside component state checks)
    console.log('[AssetProvider] Checking cache...');
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const now = Date.now();

    if (cachedData && cachedTimestamp && (now - parseInt(cachedTimestamp, 10) < CACHE_DURATION)) {
      console.log('[AssetProvider] Loading from cache...');
      try {
        const parsedData = JSON.parse(cachedData);
        setAvailableAssets(parsedData.assets);
        setIsInitialized(true); // Update state based on cache load
        console.log('[AssetProvider] Successfully loaded from cache.');
        return; // Exit early if cache is valid and loaded
      } catch (error) {
        console.error('[AssetProvider] Failed to parse cached data:', error);
        // Proceed to fetch fresh data if cache parsing fails
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      }
    } else {
      console.log('[AssetProvider] Cache expired or not found, fetching fresh data...');
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    }

    // If cache check fails or cache is invalid, proceed to fetch
    setIsInitialized(false); // Mark as not initialized before fetching
    setAssetLoadingProgress(10);
    try {
      const response = await fetch('/api/asset-data');
      setAssetLoadingProgress(50);
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      const result = await response.json();

      console.log('[AssetProvider] Raw API Response Data (first 5 assets):', result.data?.slice(0, 5));

      if (!result.success || !Array.isArray(result.data)) {
        throw new Error('Invalid data format from asset API.');
      }

      // *** Log the raw data AND stringified stats AFTER deserialization ***
      if (result.data.length > 0) {
        console.log("[AssetProvider] Post-fetch Deserialized Data Check (sample stats):");
        for (let i = 0; i < Math.min(5, result.data.length); i++) {
          const asset = result.data[i];
          console.log(`  - Item ${i} (${asset.filename}) Raw Stats:`, asset.stats);
          console.log(`  - Item ${i} (${asset.filename}) Stringified Stats:`, JSON.stringify(asset.stats));
        }
      } else {
        console.log("[AssetProvider] Post-fetch: API returned empty data array.");
      }

      // Process the flat array into a Record grouped by layer
      const processedAssets: Record<string, AssetDetail[]> = {};

      result.data.forEach((asset: AssetDetail) => {
        const layerKey = asset.layer; // API already provides canonical key

        if (!processedAssets[layerKey]) {
          processedAssets[layerKey] = [];
        }

        // API already returns properly structured AssetDetail objects
        // Basic validation: Ensure at least filename and name exist
        if (!asset.filename || !asset.name) {
          console.warn(`[AssetProvider] Skipping asset due to missing filename or name:`, asset);
          return; // Skip adding this asset if essential info is missing
        }

        processedAssets[layerKey].push(asset); // Push AssetDetail directly
      });

      console.log("[AssetProvider] Processed assets:", Object.keys(processedAssets).length, "layers");

      providerAssetDataCache = processedAssets; // Store in module-level cache
      setAvailableAssets(processedAssets);
      setAssetLoadingProgress(100);
      setIsInitialized(true); // Mark as initialized *after* setting data
      console.log("[AssetProvider] Asset data fetched, processed, and cached.");

      // Cache in localStorage
      try {
        const cacheData = JSON.stringify({ assets: processedAssets });
        localStorage.setItem(CACHE_KEY, cacheData);
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        console.log('[AssetProvider] Data cached successfully.');
      } catch (error) {
        console.error('[AssetProvider] Failed to stringify or cache data:', error);
        // Optionally clear cache items if stringify failed
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      }

    } catch (error) {
      console.error("[AssetProvider] Failed to load and process asset data:", error);
      setAvailableAssets({}); // Set empty on error
      setIsInitialized(true); // Mark as initialized even on error to stop loading state
      setAssetLoadingProgress(100);
    } // Removed finally block as setIsLoading(false) isn't needed with useCallback
  }, []); // Empty dependency array for useCallback, as it doesn't depend on component props/state

  useEffect(() => {
    // Trigger load only if not initialized
    if (!isInitialized) {
      console.log("[AssetProvider useEffect] Not initialized, calling loadAssets.");
      loadAssets();
    }
  }, [isInitialized, loadAssets]); // Add loadAssets to dependency array

  // Use useMemo to prevent unnecessary re-renders of consumers - Temporarily disabled
  // const value = useMemo(() => ({
  //   availableAssets,
  //   isInitialized,
  //   assetLoadingProgress,
  // }), [availableAssets, isInitialized, assetLoadingProgress]);

  // *** Pass state directly without useMemo for debugging ***
  const value = {
    availableAssets,
    isInitialized,
    assetLoadingProgress,
  };

  console.log("[AssetProvider] Rendering with state:", { 
    isInitialized, 
    keys: Object.keys(availableAssets).length 
  });

  return (
    <AssetContext.Provider value={value}>
      {children}
    </AssetContext.Provider>
  );
};

// Custom hook to consume the context
export const useAssets = (): AssetContextType => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
}; 