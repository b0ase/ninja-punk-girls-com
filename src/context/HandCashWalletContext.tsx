'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// HandCash White-label Wallet types
interface HandCashWallet {
  id: string;
  email: string;
  balance: number;
  currency: string;
  paymail?: string;
  createdAt: string;
}

interface HandCashWalletContextType {
  // Wallet state
  wallet: HandCashWallet | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Wallet operations
  createWallet: (email: string) => Promise<void>;
  verifyEmail: (email: string, verificationCode: string) => Promise<void>;
  connect: () => void; // Original HandCash Connect flow
  connectExistingWallet: (authToken: string) => Promise<void>;
  getWalletBalance: () => Promise<void>;
  sendPayment: (to: string, amount: number, currency: string) => Promise<void>;
  disconnect: () => void;
}

const HandCashWalletContext = createContext<HandCashWalletContextType | undefined>(undefined);

export const useHandCashWallet = () => {
  const context = useContext(HandCashWalletContext);
  if (context === undefined) {
    throw new Error('useHandCashWallet must be used within a HandCashWalletProvider');
  }
  return context;
};

export const HandCashWalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallet, setWallet] = useState<HandCashWallet | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  // Check for existing wallet on mount
  useEffect(() => {
    const checkExistingWallet = async () => {
      try {
        // First check for HandCash wallet data in localStorage (from callback)
        const storedWalletData = localStorage.getItem('handcash_wallet_data');
        if (storedWalletData) {
          try {
            const walletData = JSON.parse(storedWalletData);
            setWallet(walletData);
            setIsConnected(true);
            console.log('[HandCashWalletContext] Restored wallet from localStorage:', walletData);
            return; // Found wallet, no need to check Supabase
          } catch (parseError) {
            console.error('Error parsing stored wallet data:', parseError);
            localStorage.removeItem('handcash_wallet_data'); // Clean up invalid data
          }
        }

        // Check Supabase session for existing wallet
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Check if user has a wallet in metadata
          const walletData = session.user.user_metadata?.handcash_wallet;
          if (walletData) {
            setWallet(walletData);
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error('Error checking existing wallet:', error);
      }
    };

    checkExistingWallet();

    // Listen for wallet ready events from the callback page
    const handleWalletReady = (event: CustomEvent) => {
      console.log('[HandCashWalletContext] Received wallet ready event:', event.detail);
      const { wallet: walletData } = event.detail;
      setWallet(walletData);
      setIsConnected(true);
      setError(null);
    };

    window.addEventListener('handcash-wallet-ready' as any, handleWalletReady);

    return () => {
      window.removeEventListener('handcash-wallet-ready' as any, handleWalletReady);
    };
  }, [supabase.auth]);

  // Create a new wallet with email verification
  const createWallet = useCallback(async (email: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/handcash-wallet/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create wallet');
      }

      const data = await response.json();
      
      // Store wallet info in Supabase user metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { handcash_wallet: data.wallet }
        });
      }

      setWallet(data.wallet);
      setIsConnected(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  // Verify email with verification code
  const verifyEmail = useCallback(async (email: string, verificationCode: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/handcash-wallet/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, verificationCode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify email');
      }

      const data = await response.json();
      
      // Update wallet info in Supabase user metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { handcash_wallet: data.wallet }
        });
      }

      setWallet(data.wallet);
      setIsConnected(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify email');
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  // Connect to existing HandCash wallet using auth token
  const connectExistingWallet = useCallback(async (authToken: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Use the existing HandCash Connect API to get profile info
      const response = await fetch('/api/handcash/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect to HandCash wallet');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to connect to HandCash wallet');
      }

      const profile = result.profile;
      
      // Create a wallet object from the profile
      const existingWallet: HandCashWallet = {
        id: profile.publicProfile?.publicKey || authToken,
        email: profile.publicProfile?.handle || 'handcash_user',
        balance: 0, // Will be fetched separately
        currency: 'BSV',
        paymail: profile.publicProfile?.paymail,
        createdAt: new Date().toISOString(),
      };

      // Store wallet info in Supabase user metadata
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.auth.updateUser({
          data: { handcash_wallet: existingWallet }
        });
      }

      setWallet(existingWallet);
      setIsConnected(true);
      
      // Fetch the actual balance - we'll call this after getWalletBalance is defined
      // For now, just set the wallet without balance
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to connect to HandCash wallet');
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  // Get wallet balance
  const getWalletBalance = useCallback(async () => {
    if (!wallet) return;
    
    try {
      const response = await fetch('/api/handcash-wallet/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletId: wallet.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to get wallet balance');
      }

      const data = await response.json();
      setWallet(prev => prev ? { ...prev, balance: data.balance } : null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to get wallet balance');
    }
  }, [wallet]);

  // Send payment from wallet
  const sendPayment = useCallback(async (to: string, amount: number, currency: string) => {
    if (!wallet) return;
    
    try {
      const response = await fetch('/api/handcash-wallet/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          walletId: wallet.id, 
          to, 
          amount, 
          currency 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send payment');
      }

      // Refresh wallet balance after payment
      await getWalletBalance();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send payment');
    }
  }, [wallet, getWalletBalance]);

  // Original HandCash Connect flow
  const connect = useCallback(() => {
    setError(null);
    
    // HandCash Connect flow - redirect to HandCash authorization
    const appId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
    const redirectUrl = `${window.location.origin}/auth/callback/handcash`;
    
    if (!appId) {
      setError('HandCash App ID not configured');
      return;
    }
    
    // Build HandCash OAuth URL - using the correct format from official documentation
    const handcashAuthUrl = `https://app.handcash.io/#/authorizeApp?appId=${appId}&redirectUrl=${encodeURIComponent(redirectUrl)}`;
    
    // Redirect to HandCash
    console.log(`[HandCashWalletContext] Redirecting to: ${handcashAuthUrl}`);
    
    // Add error handling for the redirect
    try {
      window.location.href = handcashAuthUrl;
    } catch (error) {
      console.error('[HandCashWalletContext] Redirect failed:', error);
      setError('Failed to redirect to HandCash. Please check your app configuration.');
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWallet(null);
    setIsConnected(false);
    setError(null);
    
    // Remove wallet from Supabase user metadata
    supabase.auth.updateUser({
      data: { handcash_wallet: null }
    });
  }, [supabase.auth]);

  const value: HandCashWalletContextType = {
    wallet,
    isConnected,
    isLoading,
    error,
    createWallet,
    verifyEmail,
    connect,
    connectExistingWallet,
    getWalletBalance,
    sendPayment,
    disconnect,
  };

  return (
    <HandCashWalletContext.Provider value={value}>
      {children}
    </HandCashWalletContext.Provider>
  );
};
