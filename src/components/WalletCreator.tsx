'use client';

import React, { useState } from 'react';
import { useHandCashWallet } from '@/context/HandCashWalletContext';

interface WalletCreatorProps {
  onWalletCreated?: () => void;
}

export const WalletCreator: React.FC<WalletCreatorProps> = ({ onWalletCreated }) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [loginMode, setLoginMode] = useState<'create' | 'connect'>('create');
  
  const { createWallet, verifyEmail, connectExistingWallet, isLoading, error } = useHandCashWallet();

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsCreating(true);
    try {
      await createWallet(email);
      setShowVerification(true);
      setIsCreating(false);
    } catch (error) {
      setIsCreating(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !verificationCode) return;

    try {
      await verifyEmail(email, verificationCode);
      onWalletCreated?.();
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleConnectWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    try {
      await connectExistingWallet(authToken);
      onWalletCreated?.();
    } catch (error) {
      // Error is handled by the context
    }
  };

  const handleBackToEmail = () => {
    setShowVerification(false);
    setVerificationCode('');
  };

  if (showVerification) {
    return (
      <div className="max-w-md mx-auto bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-2">Verify Your Email</h3>
          <p className="text-gray-300 text-sm">
            We sent a verification code to <span className="text-pink-400">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerifyEmail} className="space-y-4">
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-300 mb-2">
              Verification Code
            </label>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter 6-digit code"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              maxLength={6}
              required
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded border border-red-500/30">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBackToEmail}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || !verificationCode}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify & Activate'}
            </button>
          </div>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-400 text-xs">
            Didn't receive the code? Check your spam folder or{' '}
            <button
              onClick={handleCreateWallet}
              className="text-pink-400 hover:text-pink-300 underline"
            >
              resend
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
        <p className="text-gray-300 text-sm mb-2">
          Choose how you want to connect to HandCash
        </p>
        <p className="text-xs text-gray-400">
          💡 You can also use the green "Connect HandCash" button in the top-right navbar
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex bg-gray-800/50 rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => setLoginMode('create')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginMode === 'create'
              ? 'bg-pink-500 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Create New
        </button>
        <button
          type="button"
          onClick={() => setLoginMode('connect')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginMode === 'connect'
              ? 'bg-pink-500 text-white'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          Connect Existing
        </button>
      </div>

      {/* Create New Wallet Form */}
      {loginMode === 'create' && (
        <>
          <form onSubmit={handleCreateWallet} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded border border-red-500/30">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating Wallet...' : 'Create Wallet'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs">
              By creating a wallet, you agree to our{' '}
              <a href="#" className="text-pink-400 hover:text-pink-300 underline">
                Terms of Service
              </a>
            </p>
          </div>
        </>
      )}

      {/* Connect Existing Wallet Form */}
      {loginMode === 'connect' && (
        <form onSubmit={handleConnectWallet} className="space-y-4">
          <div>
            <label htmlFor="authToken" className="block text-sm font-medium text-gray-300 mb-2">
              HandCash Auth Token
            </label>
            <input
              id="authToken"
              type="text"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="Paste your HandCash auth token here"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Get this from your HandCash app or browser extension
            </p>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded border border-red-500/30">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !authToken}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-600 text-white rounded-lg font-medium transition-all disabled:cursor-not-allowed"
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </form>
      )}
    </div>
  );
};
