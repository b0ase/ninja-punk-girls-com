'use client';

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { NFTType, NFTAttribute, StatsType } from '@/types';
import { useHandCash } from '@/context/HandCashContext';
import { supabase } from '@/lib/supabaseClient';

// Interface now mirrors NFTType more closely for component compatibility
interface ListedItemInfo {
  identifier: string; // Keep as the unique key (HandCash item ID)
  listPrice: number;
  // Mirror NFTType fields
  name: string;
  number: number;
  team: string;
  series: string;
  totalSupply: number;
  image: string; // Renamed from imageUrl
  attributes: NFTAttribute[];
  stats: StatsType;
  qrData: string;
}

// Define the shape of the context
interface NFTStoreContextType {
  listedNFTs: ListedItemInfo[];
  // Update listNFT signature to accept WalletItem-like data
  listNFT: (itemData: any, price: number) => void; // Use 'any' for now, refine if WalletItem type available
  delistNFT: (identifier: string) => void; 
}

const NFTStoreContext = createContext<NFTStoreContextType | undefined>(undefined);

export const NFTStoreProvider = ({ children }: { children: ReactNode }) => {
  const [listedNFTs, setListedNFTs] = useState<ListedItemInfo[]>([]);
  const { profile } = useHandCash(); 

  // Add function to fetch listings from Supabase
  const fetchListedNfts = useCallback(async () => {
    console.log('[NFTStore] Fetching listed NFTs from Supabase...');
    try {
      const { data, error } = await supabase
        .from('nft_listings')
        .select('*') // Select all columns
        .eq('is_listed', true); // Only fetch items marked as listed

      if (error) throw error;

      if (data) {
        console.log(`[NFTStore] Found ${data.length} listed NFTs.`);
        // <<< Log the identifiers fetched >>>
        console.log('[NFTStore] Fetched listed identifiers:', data.map(d => d.identifier)); 
        // Ensure data conforms to ListedItemInfo structure if needed
        setListedNFTs(data as ListedItemInfo[]); // Update state with fetched data
      } else {
        setListedNFTs([]); // Set to empty if no data
      }
    } catch (error: any) {
      console.error('[NFTStore] Error fetching listed NFTs:', error.message);
      setListedNFTs([]); // Clear list on error
    }
  }, []); // No dependencies needed if it only runs once on load

  // Fetch listings when the provider mounts
  useEffect(() => {
    fetchListedNfts();
  }, [fetchListedNfts]); // Run once on mount

  // listNFT now takes full item data and price
  const listNFT = useCallback(async (itemData: any, price: number) => {
    // <<< Log incoming itemData >>>
    console.log(`[NFTStore listNFT] Received itemData:`, JSON.stringify(itemData)); 
    console.log(`[NFTStore listNFT] Received price:`, price);
    // <<<
    
    if (!profile) {
      console.error('[NFTStore] Cannot list NFT: User profile not loaded.');
      return;
    }
    
    const newItemListingData = {
      identifier: itemData.origin || itemData.id,
      listPrice: price,
      name: itemData.name || 'Unknown Name',
      number: itemData.number ?? 0, 
      team: itemData.team || 'N/A',
      series: itemData.series || 'Series 1', 
      totalSupply: itemData.totalSupply || 0,
      image: itemData.imageUrl || '/placeholder.png',
      attributes: itemData.attributes || [],
      stats: itemData.stats || { strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0 },
      qrData: itemData.qrData || 'N/A',
      seller_handle: profile.publicProfile.handle, 
      is_listed: true, 
      listed_at: new Date().toISOString(), 
    };
    
    console.log(`[NFTStore] Attempting to list item: ${newItemListingData.identifier} for ${newItemListingData.listPrice} by ${newItemListingData.seller_handle}`);
    
    // <<< Restore Optimistic update >>>
    // Ensure the object shape matches ListedItemInfo exactly if strict typing is used
    setListedNFTs(prevNFTs => {
      const filtered = prevNFTs.filter(item => item.identifier !== newItemListingData.identifier);
      // We might need to cast newItemListingData if ListedItemInfo doesn't include seller_handle etc.
      // For simplicity, assuming ListedItemInfo now includes all fields saved to DB.
      return [...filtered, newItemListingData as ListedItemInfo].sort((a, b) => a.number - b.number); 
    });

    // Save listing to Supabase 
    try {
      console.log(`[NFTStore] Saving listing for ${newItemListingData.identifier} to Supabase...`);
      const { error } = await supabase
        .from('nft_listings')
        .upsert(newItemListingData, { onConflict: 'identifier' });

      if (error) {
          console.error(`[NFTStore] Error saving listing (Supabase):`, error.message);
          // Revert optimistic update on error
          setListedNFTs(prevNFTs => prevNFTs.filter(item => item.identifier !== newItemListingData.identifier));
          throw error; // Re-throw to prevent reaching the refetch
      } 

      console.log(`[NFTStore] Successfully saved listing for ${newItemListingData.identifier} to Supabase.`);
      // <<< Keep Refetch to ensure consistency after optimistic update >>>
      console.log("[DEBUG List] Reached point to call fetchListedNfts after save."); 
      fetchListedNfts(); 
    } catch (error: any) {
      // Error already logged, optimistic update reverted.
      // Optionally: show error notification to user
      console.error(`[NFTStore] Listing failed for ${newItemListingData.identifier}.`);
    }
  }, [profile, fetchListedNfts]); // Keep fetchListedNfts dependency here now

  // delistNFT - Update is_listed to false
  const delistNFT = useCallback(async (identifier: string) => {
    
    const itemToDelist = listedNFTs.find(item => item.identifier === identifier);
    if (!itemToDelist) return;

    // <<< Restore Optimistic update >>>
    setListedNFTs(prevNFTs => prevNFTs.filter(item => item.identifier !== identifier));

    // Update listing in Supabase
    try {
      console.log(`[NFTStore] Updating listing status for ${identifier} in Supabase...`);
      const { error } = await supabase
        .from('nft_listings')
        .update({ is_listed: false })
        .eq('identifier', identifier);

      if (error) {
        console.error(`[NFTStore] Error delisting (Supabase):`, error.message);
        // Revert optimistic update on error
        setListedNFTs(prevNFTs => [...prevNFTs, itemToDelist].sort((a, b) => a.number - b.number));
        throw error; // Re-throw
      }

      console.log(`[NFTStore] Successfully delisted ${identifier} in Supabase.`);
      // <<< Keep Refetch >>>
      console.log("[DEBUG List] Reached point to call fetchListedNfts after delist."); 
      fetchListedNfts(); 
    } catch (error: any) {
      // Error logged, optimistic update reverted.
       console.error(`[NFTStore] Delisting failed for ${identifier}.`);
    }
    // Keep dependencies
  }, [listedNFTs, fetchListedNfts]); 

  const contextValue = {
    listedNFTs,
    listNFT,
    delistNFT, 
  };

  return (
    <NFTStoreContext.Provider value={contextValue}>
      {children}
    </NFTStoreContext.Provider>
  );
};

export const useNFTStore = () => {
  const context = useContext(NFTStoreContext);
  if (context === undefined) {
    throw new Error('useNFTStore must be used within a NFTStoreProvider');
  }
  return context;
}; 