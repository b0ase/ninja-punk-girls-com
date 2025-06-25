'use client'; // Can be client or server, doesn't matter much for static content

import React from 'react';

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-pink-500 mb-8 text-center">Application Plan & User Flows</h1>

        <div className="space-y-8">
          {/* Solana Flow */}
          <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-purple-400 mb-3">1. Solana User Flow (Phantom Wallet)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>User selects "Enter on Solana" on the landing page.</li>
              <li>`ChainContext` is set to `'solana'`.</li>
              <li>Navbar displays the Solana `WalletMultiButton`.</li>
              <li>User connects their Phantom wallet.</li>
              <li>**/collection** page fetches and displays Solana NFTs associated with the connected wallet address (using Metaplex standards, likely via an RPC call or specialized API like Helius/Alchemy).</li>
              <li>**/studio** page (if adapted for Solana) would potentially mint new NFTs to the connected Solana wallet, requiring SOL for fees.</li>
              <li>**/game** page uses Solana NFTs from the collection for gameplay.</li>
            </ul>
          </div>

          {/* BSV Flow */}
          <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-green-400 mb-3">2. BSV User Flow (HandCash Wallet)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>User selects "Enter on BSV" on the landing page.</li>
              <li>`ChainContext` is set to `'bsv'`.</li>
              <li>Navbar displays the `HandCashConnectButton`.</li>
              <li>User connects their HandCash wallet (OAuth redirect flow).</li>
              <li>**/collection** page fetches and displays BSV items (NFTs) associated with the connected HandCash account using `account.items.getItemsInventory()`.</li>
              <li>**/studio** page uses HandCash `account.wallet.pay()` to pay the generation fee and triggers NFT creation (server-side minting/association needed).</li>
              <li>**/game** page uses BSV items from the collection for gameplay.</li>
            </ul>
          </div>

          {/* Ethereum Flow */}
          <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold text-orange-400 mb-3">3. Ethereum User Flow (MetaMask Wallet)</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li>User selects "Enter on Ethereum" on the landing page.</li>
              <li>`ChainContext` is set to `'ethereum'`.</li>
              <li>Navbar displays an Ethereum connect button (using `wagmi` hooks).</li>
              <li>User connects their MetaMask wallet.</li>
              <li>**/collection** page fetches and displays Ethereum NFTs (ERC-721/ERC-1155) associated with the connected wallet address (using RPC calls via `wagmi`/`viem` or specialized APIs).</li>
              <li>**/studio** page (if adapted for Ethereum) would potentially mint new NFTs to the connected Ethereum wallet, requiring ETH for gas fees.</li>
              <li>**/game** page uses Ethereum NFTs from the collection for gameplay.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 