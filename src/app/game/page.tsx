'use client'; // Likely needs client-side interaction

import React, { useState, useEffect, useCallback } from 'react';
import { useHandCashWallet } from '@/context/HandCashWalletContext';
import { NFTType, NFTAttribute, StatsType } from '@/types';
import Link from 'next/link';
import NFTCanvas from '@/components/NFTCanvas'; // For displaying NFTs

// <<< Define tab types >>>
type GameTab = 'cardGame' | 'videoGame';

// Define simple type for wallet items (matching API response)
interface WalletItem {
  id: string;
  origin: string;
  name: string;
  imageUrl: string;
  attributes?: NFTAttribute[]; // Use NFTAttribute
  number?: number; 
  stats?: Record<string, number>; 
  // Add other fields from API if available and needed by NFTType
  series?: string;
  totalSupply?: number;
  qrData?: string; 
  team?: string; 
  createdAt: Date;
}

// Define a specific type for the NFT data needed for battle display/canvas
interface BattleNftDisplayData {
  name: string;
  image: string;
  attributes: NFTAttribute[];
  number: number;
  stats: StatsType;
  // Add other fields needed by NFTCanvas if any
  series: string;
  totalSupply: number;
  qrData: string;
  team: string;
}

// <<< Updated type for an open match from API/DB >>>
interface OpenMatchFromDB {
  id: string; // Added ID from DB
  initiator_handle: string; 
  initiator_nft: BattleNftDisplayData; // NFT data is nested
  created_at: string; // Added timestamp from DB (string initially)
}

// <<< Rename component to GamePage >>>
export default function GamePage() {
  const { wallet, isConnected } = useHandCashWallet();
  // <<< Log profile on every render >>>
  console.log("[GamePage] Rendering. Wallet from useHandCashWallet():", wallet);

  // <<< State for active tab >>>
  const [activeTab, setActiveTab] = useState<GameTab>('cardGame');

  // State for user's NFTs
  const [myNfts, setMyNfts] = useState<WalletItem[]>([]);
  const [isLoadingNfts, setIsLoadingNfts] = useState<boolean>(false);

  // State for selecting NFT to start a match
  const [selectedNftIdentifier, setSelectedNftIdentifier] = useState<string | null>(null);
  
  // <<< State for managing open matches fetched from DB >>>
  const [openMatches, setOpenMatches] = useState<OpenMatchFromDB[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState<boolean>(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [createMatchStatus, setCreateMatchStatus] = useState<'idle' | 'loading' | 'error'>('idle'); // Status for creating match

  // Fetch Owned NFTs function (Adapted from WalletPage)
  const fetchMyNfts = useCallback(async () => {
    if (!wallet?.id) return;
    setIsLoadingNfts(true);
    console.log("[BattlePage] Fetching owned NFT items...");
    try {
      // TODO: Add pagination if needed for large collections
      const response = await fetch('/api/handcash/collection', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletId: wallet.id })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch owned NFTs');
      // Ensure data items match WalletItem structure
      const items = Array.isArray(data.items) ? data.items.map((item: any) => ({ ...item })) : [];
      setMyNfts(items); 
      console.log(`[BattlePage] Found ${items.length} owned NFTs.`);
    } catch (err) { 
        console.error('[BattlePage] Error fetching owned NFTs:', err);
        setMyNfts([]); 
    }
    finally { setIsLoadingNfts(false); }
  }, [wallet?.id]);

  // <<< Function to fetch open matches from API >>>
  const fetchOpenMatches = useCallback(async () => {
    console.log("[GamePage] Fetching open matches...");
    setIsLoadingMatches(true);
    setMatchError(null);
    try {
      const response = await fetch('/api/matches'); // Use the new API endpoint
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch open matches');
      }
      // Ensure data items match OpenMatchFromDB structure
      // Important: Supabase returns column names as is (e.g., initiator_handle)
      const matches: OpenMatchFromDB[] = Array.isArray(result.data) ? result.data.map((item: any) => ({
          id: item.id, // Map DB fields
          initiator_handle: item.initiator_handle,
          initiator_nft: item.initiator_nft, // Directly use the JSONB object
          created_at: item.created_at
      })) : [];
      setOpenMatches(matches);
      console.log(`[GamePage] Found ${matches.length} open matches.`);

    } catch (err: any) {
      console.error('[GamePage] Error fetching open matches:', err);
      setMatchError(err.message || 'Could not load matches.');
      setOpenMatches([]);
    } finally {
      setIsLoadingMatches(false);
    }
  }, []);

  // Load user NFTs and open matches on connect/mount
  useEffect(() => {
    if (isConnected && wallet?.id) {
      fetchMyNfts();
    }
    fetchOpenMatches(); // Fetch matches regardless of connection status initially
  }, [isConnected, wallet?.id, fetchMyNfts, fetchOpenMatches]);

  // <<< Updated handleCreateMatch function >>>
  const handleCreateMatch = async () => {
    if (!selectedNftIdentifier || !wallet?.email || !isConnected) {
      console.error("Cannot create match: User not connected, email missing, or NFT not selected.", { isConnected, email: wallet?.email, selectedNftIdentifier });
      setMatchError("Connect wallet, ensure profile is loaded, and select an NFT.");
      return;
    }

    const nftToPlay = myNfts.find(nft => nft.id === selectedNftIdentifier);
    if (!nftToPlay) {
      console.error("Selected NFT not found in collection.");
      setMatchError("Selected NFT not found. Please refresh.");
      return;
    }

    setCreateMatchStatus('loading');
    setMatchError(null); // Clear previous errors

    // Correctly map WalletItem to BattleNftDisplayData
    const initiatorNftData: BattleNftDisplayData = {
        name: nftToPlay.name,
        image: nftToPlay.imageUrl,
        attributes: nftToPlay.attributes ?? [],
        number: nftToPlay.number ?? 0,
        stats: { 
            strength: nftToPlay.stats?.strength ?? 0,
            speed: nftToPlay.stats?.speed ?? 0,
            skill: nftToPlay.stats?.skill ?? 0,
            stamina: nftToPlay.stats?.stamina ?? 0,
            stealth: nftToPlay.stats?.stealth ?? 0,
            style: nftToPlay.stats?.style ?? 0,
        },
        series: nftToPlay.series || 'N/A',
        totalSupply: nftToPlay.totalSupply || 0,
        qrData: nftToPlay.qrData || '',
        team: nftToPlay.team || 'N/A'
    };

    try {
        // <<< Add console logs right before fetch >>>
        console.log("[GamePage Frontend] Sending Email:", wallet?.email); 
        console.log("[GamePage Frontend] Sending NFT Data:", initiatorNftData);
        
        console.log("Creating new match via API:", { initiatorEmail: wallet?.email, initiatorNft: initiatorNftData });
        // <<< Send POST request to API >>>
        const response = await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                initiatorEmail: wallet?.email,
                initiatorNft: initiatorNftData // Send the mapped data
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
             console.error("API Error creating match:", result.error, result.details);
            throw new Error(result.error || 'Failed to create match via API');
        }

        console.log("Match created successfully:", result.data);
        setSelectedNftIdentifier(null); // Reset selection
        setCreateMatchStatus('idle');
        // <<< Refetch matches to show the new one >>>
        fetchOpenMatches(); 

    } catch (err: any) {
        console.error("Error creating match:", err);
        setMatchError(err.message || "Failed to create match.");
        setCreateMatchStatus('error');
    }
  };
  // <<< End of updated function >>>

  const handleJoinMatch = (matchId: string) => {
     console.log(`TODO: Implement joining match: ${matchId}`);
     // This would involve selecting one of the current user's NFTs
     // and updating the match state (likely in the backend)
  }

  // <<< Helper for tab button styles >>>
  const tabButtonBase = "px-4 py-2 rounded-t-md text-sm font-medium transition-colors border-b-2";
  const activeTabStyle = "border-pink-500 text-white bg-gray-800/50";
  const inactiveTabStyle = "border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600";

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-pink-500 mb-6 text-center">
          {/* <<< Update title based on tab >>> */}
          NPG Game Center
        </h1>

        {/* <<< Add Tab Buttons >>> */}
        <div className="mb-6 border-b border-gray-700 flex justify-center space-x-4">
          <button 
              onClick={() => setActiveTab('cardGame')}
              className={`${tabButtonBase} ${activeTab === 'cardGame' ? activeTabStyle : inactiveTabStyle}`}
          >
              Card Game
          </button>
          <button 
              onClick={() => setActiveTab('videoGame')}
              className={`${tabButtonBase} ${activeTab === 'videoGame' ? activeTabStyle : inactiveTabStyle}`}
          >
              Video Game
          </button>
        </div>

        {/* <<< Conditional Rendering based on activeTab >>> */} 
        {activeTab === 'cardGame' && (
          // <<< Wrap existing content in a fragment for the card game tab >>>
          <>
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-300">Card Battle Arena</h2>
            {/* <<< Display general match error if any >>> */}
            {matchError && (
                <p className="text-center text-red-500 mb-4">Error: {matchError}</p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Column 1: Start New Match */}
              <div className="lg:col-span-1 bg-gray-900 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl text-pink-400 mb-4">Start a New Match</h2>
                {!isConnected ? (
                  <p className="text-gray-400">Connect your wallet to start a match.</p>
                ) : isLoadingNfts ? (
                  <p className="text-gray-400 animate-pulse">Loading your NFTs...</p>
                ) : myNfts.length === 0 ? (
                  <p className="text-gray-400">You need NFTs in your collection to play. <Link href="/mint" className="text-pink-400 hover:underline">Mint some!</Link></p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-300">Select one of your NFTs:</p>
                    <select 
                      value={selectedNftIdentifier ?? ''} 
                      onChange={(e) => setSelectedNftIdentifier(e.target.value || null)}
                      className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                    >
                      <option value="" disabled>-- Choose NFT --</option>
                      {myNfts.map(nft => (
                        <option key={nft.id} value={nft.id}>
                          {nft.name}
                        </option>
                      ))}
                    </select>
                    <button 
                      onClick={handleCreateMatch}
                      // <<< Update disabled condition to include profile.handle check >>>
                      disabled={!selectedNftIdentifier || !wallet?.email || createMatchStatus === 'loading'}
                      className={`w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${createMatchStatus === 'loading' ? 'cursor-wait' : ''}`}
                    >
                      {createMatchStatus === 'loading' ? 'Creating Match...' : 'Create Match'}
                    </button>
                     {/* Optional: Add a small message if handle is missing but connected */}
                                          {!wallet?.email && isConnected && (
                        <p className="text-xs text-yellow-500 text-center">Waiting for wallet email...</p>
                      )}
                  </div>
                )}
              </div>

              {/* Column 2 & 3: Open Matches */}
              <div className="lg:col-span-2 bg-gray-900 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl text-pink-400 mb-4">Open Matches</h2>
                 {/* <<< Handle loading state for matches >>> */}
                 {isLoadingMatches ? (
                    <p className="text-gray-400 text-center py-8 animate-pulse">Loading open matches...</p>
                 ) : openMatches.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No open matches available. Start one!</p>
                 ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2"> 
                    {/* <<< Map over openMatches (type OpenMatchFromDB) >>> */}
                    {openMatches.map(match => (
                      <div key={match.id} className="bg-gray-800/50 p-4 rounded flex items-center justify-between gap-4">
                        {/* Initiator Info */} 
                        <div className="flex-1">
                           {/* <<< Use match.initiator_handle >>> */}
                          <p className="text-sm text-gray-400">Initiator: <span className="font-semibold text-pink-300">${match.initiator_handle}</span></p>
                          {/* <<< Use match.initiator_nft.name / .number >>> */}
                          <p className="text-sm text-gray-400">NFT: <span className="font-semibold text-white">{match.initiator_nft.name} ({match.initiator_nft.number})</span></p>
                           {/* <<< Use match.created_at >>> */}
                          <p className="text-xs text-gray-500 mt-1">Started: {new Date(match.created_at).toLocaleString()}</p>
                        </div>
                        {/* NFT Preview (Small) */}
                        <div className="w-16 h-16 flex-shrink-0">
                           {/* <<< Use match.initiator_nft >>> */}
                           <NFTCanvas nft={match.initiator_nft as NFTType} /> {/* Added assertion for compatibility */} 
                        </div>
                        {/* Join Button */}
                        <div>
                          <button 
                             // <<< Use match.id >>>
                            onClick={() => handleJoinMatch(match.id)}
                             // <<< Use match.initiator_handle >>>
                            disabled={!isConnected || wallet?.email === match.initiator_handle} // Can't join own match
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded transition-colors text-sm disabled:opacity-50"
                          >
                            Join Match
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </>
        )}

        {activeTab === 'videoGame' && (
          <div className="text-center p-10 bg-gray-900 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-purple-400">Video Game</h2>
            <p className="text-gray-400 mb-4">
              The NPG vs Evil Erobotz game is under development!
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              Soon, you'll be able to convert your collected Element Cards and minted NFTs into dynamic 3D game objects and playable characters right here. 
              Prepare to bring your unique NPG assets into an immersive gaming experience.
            </p>
            <p className="text-gray-400">
              Stay tuned for updates on the game launch and integration!
            </p>
            {/* Placeholder for future video game components/previews */}
          </div>
        )}

      </div>
    </div>
  );
} 