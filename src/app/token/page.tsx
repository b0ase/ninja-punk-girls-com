'use client'; // Or remove if no client-side interaction needed initially

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // Import Link
import { useHandCash } from '@/context/HandCashContext'; // Import HandCash context
import MockTokenChart from '@/components/MockTokenChart'; // Import the chart component

// Define tab types
type TokenTabKey = 'overview' | 'chart' | 'dividends' | 'invest' | 'wallet' | 'roadmap';

export default function TokenPage() {
  const tokenDeployTxid = 'b8747a4b356875cc90842c733ad2770b12bf50c17cf204afd0605f9dcba67d31_1';
  const tokenMarketUrl = `https://1sat.market/market/bsv21/${tokenDeployTxid}`;

  // State for market data (placeholders)
  const [marketData, setMarketData] = useState<{
    price: string | null;
    marketCap: string | null;
    holders: number | null;
  }>({ price: null, marketCap: null, holders: null });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // <<< Added State from Mint Page >>>
  const { 
    isConnected, 
    authToken, 
    connect,
    profile,
    disconnect,
    isLoading: isHandCashLoading, 
    error: handCashError 
  } = useHandCash();

  const [walletBalance, setWalletBalance] = useState<any>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [npgOrigins, setNpgOrigins] = useState<string[]>([]); 
  const [isLoadingNpgBalance, setIsLoadingNpgBalance] = useState<boolean>(false);
  const [recipientHandle, setRecipientHandle] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  // <<<

  // State for active tab
  const [activeTab, setActiveTab] = useState<TokenTabKey>('overview');

  // Placeholder for fetching data
  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoading(true);
      console.log("TODO: Implement API call to fetch data for", tokenDeployTxid);
      // Example: Fetch data from 1Sat Market API (if available)
      // try {
      //   const response = await fetch(`/api/get-1sat-data?tokenId=${tokenDeployTxid}`); // Your backend endpoint
      //   const data = await response.json();
      //   if (data.success) {
      //      setMarketData({
      //         price: data.price, // Adjust field names based on actual API response
      //         marketCap: data.marketCap,
      //         holders: data.holders
      //      });
      //   } else {
      //      console.error("Failed to fetch market data:", data.error);
      //      setMarketData({ price: 'N/A', marketCap: 'N/A', holders: null });
      //   }
      // } catch (error) {
      //   console.error("Error fetching market data:", error);
      //   setMarketData({ price: 'N/A', marketCap: 'N/A', holders: null });
      // }
      
      // Simulate loading finished for now
      setTimeout(() => {
        setMarketData({ price: '0.0001', marketCap: '$10,000', holders: 50 }); // Example data
        setIsLoading(false);
      }, 1500);
    };

    fetchMarketData();
  }, [tokenDeployTxid]);

  // <<< Added Functions from Mint Page >>>
  const fetchWalletBalance = useCallback(async () => {
    if (!authToken) return;
    setIsLoadingBalance(true);
    try {
      const response = await fetch('/api/handcash/balance', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authToken })
       });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch balance');
      setWalletBalance(data);
    } catch (err) { console.error('Error fetching balance:', err); setWalletBalance(null); }
    finally { setIsLoadingBalance(false); }
  }, [authToken]);

  const fetchNpgBalance = useCallback(async () => {
    // NOTE: This currently fetches NFT origins, NOT the BSV21 token balance.
    // TODO: Update this to fetch actual $NINJAPUNKGIRLS token balance when API is ready.
    console.log("[Token Page] fetchNpgBalance: Placeholder - Fetches NFT origins, not token balance.");
    if (!authToken) return;
    setIsLoadingNpgBalance(true);
    setNpgOrigins([]); // Keep this structure for now, but data represents NFTs
    try {
      const response = await fetch('/api/handcash/collection', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authToken })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Failed to fetch NPG balance (NFTs)');
      setNpgOrigins(Array.isArray(data.npgOrigins) ? data.npgOrigins : []);
    } catch (err) { console.error('Error fetching NPG origins (NFTs):', err); setNpgOrigins([]); }
    finally { setIsLoadingNpgBalance(false); }
  }, [authToken]);

  const handleSendNpg = useCallback(async () => {
    // NOTE: This sends an NPG NFT, NOT the BSV21 token.
    // TODO: Update this to send $NINJAPUNKGIRLS tokens when API is ready.
    console.log("[Token Page] handleSendNpg: Placeholder - Sends NFT, not token.");
    setSendError(null);
    setSendSuccess(null);
    if (!authToken || npgOrigins.length === 0 || !recipientHandle.trim()) { 
        setSendError("Auth token, NPG NFT, and recipient handle required."); return; 
    }
    const originToSend = npgOrigins[0]; // Sending the first NFT
    const recipient = recipientHandle.trim();
    setIsSending(true);
    try {
        const response = await fetch('/api/handcash/send-npg', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authToken, recipientHandle: recipient, origin: originToSend })
        });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'Failed to send NPG NFT.');
        setSendSuccess(`Sent 1 NPG NFT to ${recipient}. Tx: ${data.transactionId.substring(0, 8)}...`);
        setRecipientHandle(''); 
        fetchNpgBalance(); // Refresh NFT balance
    } catch (err: any) { setSendError(err.message); }
    finally { setIsSending(false); }
  }, [authToken, npgOrigins, recipientHandle, fetchNpgBalance]);

  // Load balances on connect
  useEffect(() => {
    if (isConnected && authToken) {
      fetchWalletBalance();
      fetchNpgBalance(); // Fetches NFT balance currently
    } else {
      setWalletBalance(null);
      setNpgOrigins([]); 
    }
  }, [isConnected, authToken, fetchWalletBalance, fetchNpgBalance]);
  // <<<

  // Define the actual tabs used in the UI
  const TABS: { key: TokenTabKey; label: string }[] = [
    { key: 'overview', label: 'Overview & Market' },
    { key: 'chart', label: 'Price Chart' },
    { key: 'dividends', label: 'Dividends & Revenue' },
    { key: 'invest', label: 'Invest / Buy Tokens' },
    { key: 'roadmap', label: 'Roadmap & Vision' },
    { key: 'wallet', label: 'Your Wallet & Transfer' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-pink-500 text-center mb-8">
        NPG Token ($NINJAPUNKGIRLS)
      </h1>

      {/* Tab Navigation - Above the columns */}
      <div className="mb-8 border-b border-gray-700 flex justify-center flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap mx-1
              ${activeTab === tab.key
                ? 'border-pink-500 text-white'
                : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-300'}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-opacity-50`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conditional Layout based on activeTab */}
      <div className="max-w-full mx-auto mt-6"> {/* Added a simple container for tab content */}
        
        {/* Overview Tab: Shows main info */}
        {activeTab === 'overview' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg space-y-6"> {/* Full width */}
            {/* Token Info */}
            <div> 
              <p className="text-gray-300 mb-4">
                $NINJAPUNKGIRLS is the official utility token for the Ninja Punk Girls ecosystem, deployed as a BSV21 token.
              </p>
              <div className="space-y-1">
                <p className="text-gray-400">Ticker: <span className="font-mono text-pink-400">$NINJAPUNKGIRLS</span></p>
                <p className="text-gray-400">Standard: <span className="font-mono text-pink-400">BSV21</span></p>
                <p className="text-gray-400">Deployment ID (txid_vout): <span className="font-mono text-pink-400 break-all">{tokenDeployTxid}</span></p>
              </div>
            </div>

            {/* Market Data Section */}
            <div className="pt-4 border-t border-gray-700/50">
              <h2 className="text-xl font-semibold text-pink-400 mb-3">Market Data (from 1Sat)</h2>
              {isLoading ? (
                <div className="text-center text-gray-400 animate-pulse">Loading market data...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-800/50 p-4 rounded">
                    <p className="text-sm text-gray-400 mb-1">Recent Price</p>
                    <p className="text-xl font-bold text-green-400">{marketData.price || 'N/A'} <span className="text-xs text-gray-500">sats/token</span></p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded">
                    <p className="text-sm text-gray-400 mb-1">Market Cap</p>
                    <p className="text-xl font-bold text-white">{marketData.marketCap || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded">
                    <p className="text-sm text-gray-400 mb-1">Holders</p>
                    <p className="text-xl font-bold text-white">{marketData.holders ?? 'N/A'}</p>
                  </div>
                </div>
              )}
              <div className="flex justify-center items-center gap-4 mt-4">
                <Link 
                  href={tokenMarketUrl}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 px-4 rounded transition-colors text-sm"
                >
                  View on 1Sat.Market
                </Link>
                {/* <<< Added Buy Button >>> */}
                <Link 
                  href={tokenMarketUrl} // Link to market for now
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded transition-colors text-sm"
                >
                  Buy $NINJAPUNKGIRLS
                </Link>
                {/* <<< */}
              </div>
            </div>

            {/* Utility Section */}
            <div className="pt-4 border-t border-gray-700/50">
              <h2 className="text-xl font-semibold text-pink-400 mb-2">Utility</h2>
              <p className="text-gray-400 mb-3">
                The $NINJAPUNKGIRLS token represents actual company shares in Ninja Punk Girls Ltd., providing shareholders with:
              </p>
              <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
                <li>Dividend payments from platform revenue</li>
                <li>Real equity in Ninja Punk Girls Ltd.</li>
                <li>Voting rights on development priorities</li>
                <li>Marketplace fee discounts for shareholders</li>
                <li>Access to shareholder-only features</li>
              </ul>
            </div>

            {/* Token Distribution Section - New section */}
            <div className="pt-4 border-t border-gray-700/50">
              <h2 className="text-xl font-semibold text-pink-400 mb-2">Company Shares & Token Distribution</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-4 rounded">
                  <p className="text-sm text-gray-400 mb-1">Total Shares/Tokens</p>
                  <p className="text-xl font-bold text-white">2,045,457 $NPG</p>
                  <p className="text-xs text-gray-500">1:1 ratio with company shares</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded">
                  <p className="text-sm text-gray-400 mb-1">Current Distribution</p>
                  <p className="text-xl font-bold text-white">~15% Sold to Investors</p>
                  <p className="text-xs text-gray-500">~306,818 $NPG tokens</p>
                </div>
              </div>
              <div className="mt-4 bg-gray-800/50 p-4 rounded">
                <p className="text-gray-400 mb-2">Each $NPG token represents one share in Ninja Punk Girls Ltd., a UK registered company. When you purchase $NPG tokens, you are acquiring actual equity in the company, entitling you to dividends and voting rights.</p>
                
                <div className="mt-4 w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-pink-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-pink-400">Sold to Investors</span>
                  <span className="text-gray-400">Available Shares</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart Tab: Shows Price Chart */}
        {activeTab === 'chart' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg"> {/* Full width */}
            <h2 className="text-2xl font-semibold text-pink-400 mb-4 text-center">Price Chart</h2>
            <MockTokenChart tokenId={tokenDeployTxid} />
            <p className="text-center text-gray-400 mt-4">(Placeholder - Real chart data needed)</p>
          </div>
        )}

        {/* Dividends Tab: Shows Dividends/Staking Info */}
        {activeTab === 'dividends' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg space-y-6"> {/* Full width */}
             <h2 className="text-2xl font-semibold text-pink-400 mb-4 text-center">Dividends & Revenue</h2>
            {/* MOVED Staking Section (Dividends Info) here */}
            {/* <div className="pt-6 border-t border-gray-700/50"> */} {/* Optional top border */}
              {/* <h2 className="text-xl font-semibold text-pink-400 mb-3">Shareholder Dividends</h2> */} {/* Title already added above */}
              <p className="text-gray-400 mb-4 text-center"> {/* Centered intro text */}
                As a shareholder, you receive dividends from Ninja Punk Girls Ltd. platform revenue. Dividends are distributed proportionally based on your ownership percentage.
              </p>
              
              {/* Staking Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
                <div className="bg-gray-800/50 p-4 rounded">
                  <p className="text-sm text-gray-400 mb-1">Total Shares Issued</p>
                  <p className="text-xl font-bold text-white">306,818 $NPG</p>
                  <p className="text-xs text-gray-500">~15% of Total Supply</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded">
                  <p className="text-sm text-gray-400 mb-1">Dividend Distribution</p>
                  <p className="text-xl font-bold text-green-400">Quarterly</p>
                  <p className="text-xs text-gray-500">Via BSV micropayments</p>
                </div>
                <div className="bg-gray-800/50 p-4 rounded">
                  <p className="text-sm text-gray-400 mb-1">Your Shares</p>
                  <p className="text-xl font-bold text-white">{isConnected ? (npgOrigins.length * 1000) : 0} $NPG</p>
                  <p className="text-xs text-gray-500">{isConnected ? (npgOrigins.length > 0 ? 'Dividend Eligible' : 'No Shares Owned') : 'Connect to View'}</p>
                </div>
              </div>
              
              {/* Improved Revenue Distribution Diagram */}
              <div className="bg-gray-800/50 p-4 rounded mb-6">
                <h3 className="text-md font-semibold text-center mb-4">Dividend Distribution Model</h3>
                <div className="flex flex-col items-center">
                  {/* Simplified Diagram */}
                  <div className="w-full max-w-md h-48 relative">
                    {/* Platform Revenue */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-blue-500 w-48 h-10 rounded flex items-center justify-center shadow-lg">
                      <span className="text-white font-medium">Platform Revenue</span>
                    </div>
                    
                    {/* Arrow Down */}
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4V20M12 20L6 14M12 20L18 14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    
                    {/* Revenue Pool */}
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-purple-500 w-48 h-10 rounded flex items-center justify-center shadow-lg">
                      <span className="text-white font-medium">Shareholder Dividends</span>
                    </div>
                    
                    {/* Arrows to Stakers */}
                    <div className="absolute bottom-0 w-full flex justify-between items-end px-4">
                      {/* Left Arrow */}
                      <svg className="absolute bottom-20 left-1/4" width="24" height="50" viewBox="0 0 24 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0V40M12 40L6 34M12 40L18 34" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      
                      {/* Middle Arrow */}
                      <svg className="absolute bottom-20 left-1/2 transform -translate-x-1/2" width="24" height="60" viewBox="0 0 24 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0V50M12 50L6 44M12 50L18 44" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      
                      {/* Right Arrow */}
                      <svg className="absolute bottom-20 right-1/4" width="24" height="40" viewBox="0 0 24 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 0V30M12 30L6 24M12 30L18 24" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      
                      {/* Shareholders */}
                      <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <div className="text-center text-white">
                          <div className="font-bold">5%</div>
                          <div className="text-xs">Holder</div>
                        </div>
                      </div>
                      
                      <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <div className="text-center text-white">
                          <div className="font-bold">10%</div>
                          <div className="text-xs">Holder</div>
                        </div>
                      </div>
                      
                      <div className="w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <div className="text-center text-white">
                          <div className="font-bold">3%</div>
                          <div className="text-xs">Holder</div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-400 text-center max-w-lg mt-4">
                      BSV blockchain technology allows us to efficiently distribute even small dividend amounts to all shareholders proportionally.
                    </p>
                  </div>
                </div>
              </div>
            {/* </div> */} {/* Optional closing div for moved section */}
          </div>
        )}

        {/* Invest Tab: Shows Feature Investment Info */}
        {activeTab === 'invest' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg space-y-6"> {/* Full width */}
             <h2 className="text-2xl font-semibold text-pink-400 mb-4 text-center">Invest in Features</h2>
            {/* MOVED Feature Investment Section here */}
            {/* <div className="bg-gray-800/70 p-5 rounded-lg border border-pink-500/30"> */} {/* Use main card style instead */}
              {/* <h3 className="text-lg font-semibold text-center mb-4">Invest in Feature Development</h3> */} {/* Title already added above */}
              <p className="text-gray-400 mb-4 text-center">
                Purchase $NPG tokens to fund specific features and earn dividends from their success.
              </p>
              
              <div className="space-y-4 mt-6 max-w-2xl mx-auto"> {/* Center the investment cards */}
                <div className="border border-gray-700 rounded-lg p-4 hover:border-pink-500/50 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-pink-300">Studio Feature</h4>
                    <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">100,000 $NPG</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">Advanced NFT creation tools with custom attribute support and batch minting capabilities.</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">45% Funded</span>
                    <span className="text-blue-400" onClick={() => window.open(tokenMarketUrl, '_blank')}>Invest Now</span>
                  </div>
                </div>
                
                <div className="border border-gray-700 rounded-lg p-4 hover:border-pink-500/50 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-pink-300">Marketplace Expansion</h4>
                    <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">150,000 $NPG</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">Enhanced marketplace with auctions, offers, and collection analytics for traders.</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">20% Funded</span>
                    <span className="text-blue-400" onClick={() => window.open(tokenMarketUrl, '_blank')}>Invest Now</span>
                  </div>
                </div>
                
                <div className="border border-gray-700 rounded-lg p-4 hover:border-pink-500/50 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-pink-300">Mobile App Development</h4>
                    <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">200,000 $NPG</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">iOS and Android apps for trading, collecting and managing your NPG assets on the go.</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">5% Funded</span>
                    <span className="text-blue-400" onClick={() => window.open(tokenMarketUrl, '_blank')}>Invest Now</span>
                  </div>
                </div>
              </div>
             {/* </div> */} {/* Optional closing div */}
          </div>
        )}

        {/* Roadmap Tab: New tab for detailed roadmap */}
        {activeTab === 'roadmap' && (
          <div className="bg-gray-900 p-6 rounded-lg shadow-lg space-y-6"> {/* Full width */}
            <h2 className="text-2xl font-semibold text-pink-400 mb-4 text-center">Roadmap & Vision</h2>

            {/* Roadmap Introduction & Valuation Context*/}
            <div className="text-center max-w-3xl mx-auto">
              <h3 className="text-xl font-semibold text-white mb-2">Strategic Funding & Vision</h3>
              <p className="text-gray-300 mb-4">
                Ninja Punk Girls Ltd. is seeking to raise <span className="font-bold text-green-400">$1,000,000 USD</span> in exchange for <span className="font-bold text-pink-400">10% company equity</span> (represented by 204,546 $NPG tokens). This targets a <span className="font-bold text-white">$10 Million total valuation</span> for the company, implying a target value of approximately <span className="font-bold text-green-400">$4.89 USD per $NPG token</span>.
              </p>
              <p className="text-gray-400 mb-6">
                Funds raised will accelerate development across key areas outlined below. Revenue generated by these features directly contributes to shareholder dividends.
              </p>
            </div>

            {/* Roadmap Feature Details */}
            <div className="space-y-4 mt-6 max-w-3xl mx-auto"> {/* Wider container for roadmap details */}

               {/* NPG Studio */}
               <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="font-semibold text-pink-300">NPG Studio - Advanced Creation Tools</h4>
                   <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">Est. 100k $NPG</span>
                 </div>
                 <p className="text-sm text-gray-400">Enhance the NPG Studio with features like layered NFTs, trait rarity configuration, batch minting/updating capabilities, and potential integration with generative art tools. Empower creators with professional-grade tools.</p>
               </div>

               {/* Marketplace */}
               <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="font-semibold text-pink-300">Marketplace Expansion</h4>
                   <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">Est. 150k $NPG</span>
                 </div>
                 <p className="text-sm text-gray-400">Upgrade the marketplace with robust features including timed auctions, direct offers between users, detailed collection analytics (floor price, volume), activity feeds, and improved search/filtering.</p>
               </div>

               {/* Mobile App */}
               <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/30">
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="font-semibold text-pink-300">Mobile App Development</h4>
                   <span className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">Est. 200k $NPG</span>
                 </div>
                 <p className="text-sm text-gray-400">Develop native iOS and Android applications for a seamless mobile experience. Enable users to browse, trade, manage their portfolio, receive notifications, and interact with the NPG ecosystem on the go.</p>
               </div>

               {/* 3D Studio */}
               <div className="border border-yellow-500/50 rounded-lg p-4 bg-gradient-to-br from-gray-800 to-gray-800/70 shadow-md">
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="font-semibold text-yellow-300 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> </svg>
                     Next-Gen 3D Studio
                   </h4>
                   <span className="bg-gray-700 px-2 py-1 rounded text-xs text-yellow-200">Est. 500k $NPG</span>
                 </div>
                 <p className="text-sm text-gray-400">Develop a cutting-edge 3D studio for creating, customizing, and rigging high-fidelity NPG avatars and assets. Ensure compatibility with leading metaverse platforms and the upcoming NPG 3D World.</p>
               </div>

               {/* 3D World */}
               <div className="border border-purple-500/50 rounded-lg p-4 bg-gradient-to-br from-gray-800 to-gray-800/70 shadow-md">
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="font-semibold text-purple-300 flex items-center gap-2">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6z" /> <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> </svg>
                     NPG 3D World (Metaverse/Game)
                   </h4>
                   <span className="bg-gray-700 px-2 py-1 rounded text-xs text-purple-200">Est. 1M+ $NPG</span>
                 </div>
                 <p className="text-sm text-gray-400">Build an immersive 3D world or game where players can socialize, interact, trade, and utilize their NPG assets within an engaging environment. Focus on sustainable tokenomics and player-driven experiences.</p>
               </div>

            </div> {/* End Roadmap Feature Details */} 

            {/* Concluding Text */}
            <p className="text-center text-gray-500 text-sm mt-8">
              This roadmap is driven by community feedback and strategic goals. Feature prioritization and NPG requirements may evolve based on shareholder input and market opportunities.
            </p>
          </div>
        )}

        {/* Wallet Tab: Shows Wallet and Transfer */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Keep internal 2-column grid for wallet content */}
            {/* Card 1: Your Wallet */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg shadow-lg"> {/* Removed max-h */}
              <h3 className="text-lg font-semibold mb-3 text-pink-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H7a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Your Wallet
              </h3>
              {isConnected && profile ? (
                <div>
                  {/* Paymail Display */} 
                  <div className="border-b border-gray-700/50 pb-3 mb-3">
                      <p className="text-gray-400 text-xs mb-1">Receive NPG Tokens & BSV at:</p>
                      <p className="font-mono text-green-400 break-all cursor-pointer" title="Click to copy" onClick={() => navigator.clipboard.writeText(`$${profile.publicProfile.handle}`)}>
                          ${profile.publicProfile.handle}
                      </p>
                  </div>
                  
                  {/* BSV Balance */}
                  <div className="border-b border-gray-700/50 pb-3 mb-3">
                      {isLoadingBalance ? (
                        <p className="text-gray-400 animate-pulse">Loading BSV...</p>
                      ) : walletBalance ? ( 
                          <p className="flex justify-between items-center text-gray-300">
                              <span>BSV Balance:</span> 
                              <span className="font-mono text-white">{walletBalance.totalBalance?.satoshiBalance?.toLocaleString() || 0} sats</span>
                          </p>
                        ) : (
                          <p className="text-yellow-400">Cannot load BSV</p>
                        )}
                  </div>
                  
                  {/* NPG Balance - Currently shows NFT count */}
                  <div>
                    {isLoadingNpgBalance ? (
                      <p className="text-gray-400 animate-pulse">Loading NPG...</p>
                    ) : (
                        <p className="flex justify-between items-center text-gray-300">
                            <span>$NPG Tokens Held:</span> 
                            <span className="font-mono text-white text-lg">{npgOrigins.length * 1000} <span className="text-xs text-gray-500">(1000 per NFT)</span></span>
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">*Each NPG NFT represents 1000 $NPG tokens</p>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={connect} 
                  disabled={isHandCashLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
                >
                  {isHandCashLoading ? 'Connecting...' : 'Connect HandCash Wallet'}
                </button>
              )}
              
              {/* Refresh Button */} 
              {isConnected && (!isLoadingBalance || !isLoadingNpgBalance) && (
                <button 
                  onClick={() => { fetchWalletBalance(); fetchNpgBalance();}} 
                  className="mt-4 text-xs text-blue-400 hover:text-blue-300 self-start flex items-center gap-1"
                  disabled={isLoadingBalance || isLoadingNpgBalance}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isLoadingBalance || isLoadingNpgBalance ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m-15.357-2a8.001 8.001 0 0115.357-2m0 0H15" />
                    </svg>
                    {isLoadingBalance || isLoadingNpgBalance ? 'Refreshing...' : 'Refresh Balances'}
                </button>
              )}
            </div>

            {/* Card 2: Send NPG Token */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-5 rounded-lg shadow-lg"> 
              <h3 className="text-lg font-semibold mb-3 text-teal-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Transfer $NINJAPUNKGIRLS Shares
              </h3>
              {isConnected ? (
                <div className="space-y-3">
                  {sendError && <p className="text-red-400 text-xs">Error: {sendError}</p>}
                  {sendSuccess && <p className="text-green-400 text-xs">{sendSuccess}</p>}
                  <p className="text-xs text-yellow-400">*NOTE: Each transfer sends 1000 $NPG tokens (1 NFT)</p>
                  <input 
                    type="text" 
                    placeholder="Recipient Handle (e.g., $satoshi)" 
                    value={recipientHandle} 
                    onChange={(e) => setRecipientHandle(e.target.value)} 
                    disabled={isSending || npgOrigins.length === 0} 
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm disabled:opacity-50"
                  />
                  <button 
                    onClick={handleSendNpg} 
                    disabled={isSending || !recipientHandle.trim() || npgOrigins.length === 0} 
                    className={`w-full px-4 py-2 rounded-md font-semibold text-sm transition-colors ${isSending || !recipientHandle.trim() || npgOrigins.length === 0 ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700 text-white'}`}
                  >
                    {isSending ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending NFT...
                      </span>
                    ) : npgOrigins.length > 0 ? (
                      `Send 1 NPG NFT (from ${npgOrigins.length})` 
                    ) : (
                      'No NPG NFTs to Send' 
                    )}
                  </button>
                  {npgOrigins.length > 0 && <p className="text-xs text-gray-500 text-center">Sends oldest NPG NFT.</p>}
                </div>
              ) : (
                <p className="text-gray-400">Connect wallet to send tokens.</p>
              )}
            </div>
          </div>
        )}

      </div> {/* End Tab Content Container */}
    </div>
  );
} 