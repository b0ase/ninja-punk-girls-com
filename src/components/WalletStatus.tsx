'use client';

import React, { useEffect } from 'react';
import { useHandCashWallet } from '@/context/HandCashWalletContext';
import { useRouter } from 'next/navigation';

interface WalletStatusProps {
  onDisconnect?: () => void;
}

export const WalletStatus: React.FC<WalletStatusProps> = ({ onDisconnect }) => {
  const { wallet, isConnected, getWalletBalance, disconnect } = useHandCashWallet();
  const router = useRouter();

  // Refresh balance when component mounts
  useEffect(() => {
    if (isConnected && wallet) {
      getWalletBalance();
    }
  }, [isConnected, wallet, getWalletBalance]);

  const handleDisconnect = () => {
    disconnect();
    onDisconnect?.();
  };

  const handleEnterGame = () => {
    router.push('/mint');
  };

  if (!isConnected || !wallet) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Wallet Connected!</h3>
        <p className="text-gray-300 text-sm">{wallet.email}</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Balance</span>
            <span className="text-white font-bold text-lg">
              {wallet.balance.toFixed(8)} {wallet.currency}
            </span>
          </div>
        </div>

        {wallet.paymail && (
          <div className="bg-gray-800/30 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300 text-sm">Paymail</span>
              <span className="text-pink-400 font-mono text-sm">{wallet.paymail}</span>
            </div>
          </div>
        )}

        <div className="bg-gray-800/30 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Created</span>
            <span className="text-white text-sm">
              {new Date(wallet.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleEnterGame}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white font-bold rounded-lg transition-all transform hover:scale-105"
        >
          ENTER GAME
        </button>
        
        <button
          onClick={handleDisconnect}
          className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          Disconnect Wallet
        </button>
      </div>
    </div>
  );
};
