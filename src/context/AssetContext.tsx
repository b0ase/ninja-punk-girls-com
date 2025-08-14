'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AssetDetail } from '@/app/api/asset-data/route';

interface AssetContextType {
  availableAssets: Record<string, AssetDetail[]>;
  isInitialized: boolean;
  assetLoadingProgress: number;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [availableAssets, setAvailableAssets] = useState<Record<string, AssetDetail[]>>({});
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [assetLoadingProgress, setAssetLoadingProgress] = useState<number>(0);

  useEffect(() => {
    console.log("[AssetProvider SIMPLE] useEffect triggered");
    
    const loadAssets = async () => {
      try {
        console.log("[AssetProvider SIMPLE] Starting asset load...");
        setAssetLoadingProgress(25);
        
        const response = await fetch('/api/asset-data');
        console.log("[AssetProvider SIMPLE] API response:", response.status);
        setAssetLoadingProgress(50);
        
        if (!response.ok) {
          throw new Error(`API failed: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("[AssetProvider SIMPLE] API result:", result.success, "data count:", result.data?.length);
        setAssetLoadingProgress(75);
        
        if (result.success && Array.isArray(result.data)) {
          // Process assets
          const processedAssets: Record<string, AssetDetail[]> = {};
          
          result.data.forEach((asset: AssetDetail) => {
            if (asset.layer && asset.filename && asset.name) {
              if (!processedAssets[asset.layer]) {
                processedAssets[asset.layer] = [];
              }
              processedAssets[asset.layer].push(asset);
            }
          });
          
          console.log("[AssetProvider SIMPLE] Processed into layers:", Object.keys(processedAssets).length);
          console.log("[AssetProvider SIMPLE] Sample layers:", Object.keys(processedAssets).slice(0, 3));
          
          // Update state
          setAvailableAssets(processedAssets);
          setAssetLoadingProgress(100);
          setIsInitialized(true);
          
          console.log("[AssetProvider SIMPLE] SUCCESS! State updated");
        } else {
          throw new Error("Invalid API response format");
        }
        
      } catch (error) {
        console.error("[AssetProvider SIMPLE] ERROR:", error);
        setAvailableAssets({});
        setAssetLoadingProgress(100);
        setIsInitialized(true); // Set to true even on error to prevent infinite retries
      }
    };
    
    if (!isInitialized) {
      loadAssets();
    }
  }, []); // Empty dependency array to run only once

  const value = {
    availableAssets,
    isInitialized,
    assetLoadingProgress,
  };

  // Removed excessive render logging to prevent console spam

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