'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNFTStore } from '@/context/NFTStoreContext';
import { useHandCash } from '@/context/HandCashContext';
import { supabase } from '@/lib/supabaseClient';
import NFTCanvas from '@/components/NFTCanvas';
import NFTSummary from '@/components/NFTSummary';
import CollapsibleSummaryContent from '@/components/CollapsibleSummary';
import Link from 'next/link';
import { NFTType, NFTAttribute, StatsType } from '@/types';

interface MarketListing {
  identifier: string; 
  listPrice: number;
  name: string;
  number: number;
  team: string;
  series: string;
  totalSupply: number;
  image: string; 
  attributes: NFTAttribute[];
  stats: StatsType;
  qrData: string;
  seller_handle: string;
  is_listed: boolean;
  listed_at: string;
}

const getListingNftType = (item: MarketListing): 'npg' | 'erobot' | 'mix' => {
  const geneAttributes = item.attributes?.filter(attr => !!attr.metadata?.genes) || [];
  if (geneAttributes.length === 0) return 'mix'; 
  const hasNpgGene = geneAttributes.some(attr => attr.metadata?.genes?.toLowerCase() === 'npg');
  const hasErobotGene = geneAttributes.some(attr => attr.metadata?.genes?.toLowerCase() === 'erobot');
  if (hasNpgGene && !hasErobotGene) return 'npg';
  if (!hasNpgGene && hasErobotGene) return 'erobot';
  return 'mix';
};

export default function MarketPage() {
  const { profile } = useHandCash();
  const { delistNFT } = useNFTStore();

  const [allListings, setAllListings] = useState<MarketListing[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  type MarketTab = 'all' | 'buying' | 'selling';
  const [activeTab, setActiveTab] = useState<MarketTab>('all'); 

  type MarketFilterType = 'all' | 'npg' | 'erobot' | 'mix' | 'element'; 
  const [activeFilter, setActiveFilter] = useState<MarketFilterType>('all');
  const [expandedNftNumber, setExpandedNftNumber] = useState<number | null>(null);

  const fetchAllListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log('[MarketPage] Fetching all listed NFTs...');
    try {
      const { data, error: dbError } = await supabase
        .from('nft_listings')
        .select('*')
        .eq('is_listed', true);

      if (dbError) throw dbError;

      if (data) {
        console.log(`[MarketPage] Found ${data.length} total listed NFTs.`);
        setAllListings(data as MarketListing[]);
      } else {
        setAllListings([]);
      }
    } catch (err: any) {
      console.error('[MarketPage] Error fetching listings:', err.message);
      setError('Failed to load market listings.');
      setAllListings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllListings();
  }, [fetchAllListings]);

  const userHandle = profile?.publicProfile?.handle;

  const myListings = useMemo(() => {
    if (!userHandle) return [];
    return allListings.filter(item => item.seller_handle === userHandle);
  }, [allListings, userHandle]);

  const othersListings = useMemo(() => {
    return allListings.filter(item => item.seller_handle && item.seller_handle !== userHandle);
  }, [allListings, userHandle]);

  const processedListings = useMemo(() => {
    switch (activeTab) {
      case 'buying':
        return othersListings;
      case 'selling':
        return myListings;
      case 'all':
      default:
        return [...myListings, ...othersListings];
    }
  }, [activeTab, myListings, othersListings]);

  const filteredDisplayedItems = useMemo(() => {
     if (activeFilter === 'all') {
       return processedListings;
     }
     return processedListings.filter(item => {
       const type = getListingNftType(item); 
       if (activeFilter === 'element') {
         return false;
       }
       return type === activeFilter;
     });
   }, [processedListings, activeFilter]);

  const handleToggleExpand = (nftNumber: number) => {
    setExpandedNftNumber(current => (current === nftNumber ? null : nftNumber));
  };

  const handleBuyNow = (item: MarketListing) => {
      console.log(`[MarketPage] TODO: Implement Buy Now logic for:`, item);
      alert(`Buy Now clicked for ${item.name} (ID: ${item.identifier}) listed for ${item.listPrice} BSV by ${item.seller_handle}. 
Implement payment and transfer logic.`);
  };

  const handleDelist = (identifier: string) => {
      console.log(`[MarketPage] handleDelist called for identifier: ${identifier}`);
      console.log(`[MarketPage] Calling context delistNFT for ${identifier}`);
      delistNFT(identifier);
      console.log(`[MarketPage] Forcing refetch after delist attempt...`);
      fetchAllListings();
  };
  
  const renderFilterButtons = () => (
    <div className="flex justify-center space-x-2 mb-6 flex-wrap gap-y-2">
      {(['all', 'npg', 'erobot', 'mix', 'element'] as MarketFilterType[]).map(filter => {
        const isActive = activeFilter === filter;
        let buttonText = filter.charAt(0).toUpperCase() + filter.slice(1);
        if (filter === 'npg') buttonText = 'NPGs';
        if (filter === 'erobot') buttonText = 'Erobotz';
        if (filter === 'mix') buttonText = 'Mixed';
        if (filter === 'element') buttonText = 'Elements';
        if (filter === 'all') buttonText = 'Show All';
        
        const isDisabled = filter === 'element';

        return (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            disabled={isDisabled}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${ 
              isActive 
                ? 'bg-pink-600 text-white' 
                : isDisabled
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            {buttonText}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold text-center text-pink-500 mb-8">
        NPG Market
      </h1>

      <div className="flex justify-center mb-6 border-b border-gray-700">
        {(['all', 'buying', 'selling'] as MarketTab[]).map(tab => {
           const buttonText = tab === 'buying' ? 'To Buy' : tab;
           return (
             <button 
               key={tab}
               onClick={() => setActiveTab(tab)}
               disabled={tab === 'selling' && !userHandle}
               className={`px-4 py-2 text-sm font-medium capitalize 
                 ${activeTab === tab ? 'text-pink-400 border-b-2 border-pink-400' : 'text-gray-400 hover:text-gray-200'} 
                 ${(tab === 'selling' && !userHandle) ? 'opacity-50 cursor-not-allowed' : ''}
               `}
             >
               {buttonText} 
             </button>
           );
         })}
      </div>

      {renderFilterButtons()}

      {isLoading && <p className="text-center text-gray-400">Loading listings...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!isLoading && !error && (
        <>
          {filteredDisplayedItems.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
               <p>
                 No {activeFilter !== 'all' ? activeFilter : ''} NFTs found 
                 {activeTab === 'selling' ? ' listed by you' : 
                  activeTab === 'buying' ? ' available to buy' : ' on the market'}.
               </p>
               {activeTab === 'selling' && (
                   <Link href="/wallet" className="text-pink-500 hover:underline mt-2 inline-block">
                     Go to your Wallet to list one!
                   </Link>
               )}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredDisplayedItems.map((nft: MarketListing) => {
                const isExpanded = nft.number === expandedNftNumber;
                const isMyListing = userHandle && nft.seller_handle === userHandle;
                const highlightClass = (activeTab === 'all' && isMyListing) 
                  ? 'border-2 border-blue-500 ring-2 ring-blue-500/50' 
                  : 'border border-transparent';

                return (
                  <div 
                    key={`market-${nft.identifier}`} 
                    className={`bg-gray-800/90 rounded-lg shadow-lg overflow-hidden transition-all duration-200 group ${highlightClass}`}
                  >
                    {activeTab === 'all' && isMyListing && (
                       <div className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                          Your Listing
                       </div>
                    )} 

                    <div className="w-full aspect-[961/1441] bg-black/20 relative">
                       <NFTCanvas 
                         nft={nft as NFTType}
                       />
                    </div>

                    <div className="p-3">
                      <div>
                        <div className="flex justify-between items-baseline gap-2">
                            <p className="text-sm font-semibold text-white truncate flex-grow" title={nft.name}>
                                {nft.name}
                            </p>
                            <p className="text-xs text-gray-400 font-mono flex-shrink-0">
                                #{nft.number}
                            </p>
                        </div>
                         <p className="text-xs text-green-400 font-mono mb-2">{nft.listPrice?.toFixed(4)} BSV</p>
                      </div>
                      
                      <button
                          onClick={() => handleToggleExpand(nft.number)} 
                          className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded w-full mb-2 flex justify-between items-center"
                      >
                          <span>Details</span>
                           <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                               <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                      </button>

                      <CollapsibleSummaryContent 
                        nft={nft as NFTType}
                        isExpanded={isExpanded}
                      />

                      {isMyListing ? (
                          <button 
                            onClick={() => handleDelist(nft.identifier)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-2 rounded transition-colors text-xs mt-2"
                          >
                            Delist
                          </button>
                      ) : (
                          <button 
                            onClick={() => handleBuyNow(nft)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-2 rounded transition-colors text-xs mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!userHandle} 
                            title={!userHandle ? "Connect wallet to buy" : `Buy ${nft.name} for ${nft.listPrice} BSV`}
                          >
                            Buy Now
                          </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
} 