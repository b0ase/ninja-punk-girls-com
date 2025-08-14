'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Define the HandCash profile interface based on usage patterns
interface HandCashProfile {
  publicProfile: {
    handle: string;
    displayName?: string;
    avatarUrl?: string;
    publicKey?: string;
  };
}

// Define the context interface based on usage in mint page
interface HandCashContextType {
  isConnected: boolean;
  authToken: string | null;
  profile: HandCashProfile | null;
  isLoading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

const HandCashContext = createContext<HandCashContextType | undefined>(undefined);

export const HandCashProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<HandCashProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check Supabase session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.user_metadata?.handle) {
          // We have a Supabase session with HandCash metadata
          const handle = session.user.user_metadata.handle;
          console.log(`[HandCashContext] Found Supabase session for handle: ${handle}`);
          
          // Try to get the HandCash auth token from localStorage as fallback
          const storedToken = localStorage.getItem('handcash_auth_token');
          
          if (storedToken) {
            // Verify the token is still valid
            const response = await fetch('/api/handcash/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ authToken: storedToken })
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.profile) {
                setAuthToken(storedToken);
                setProfile(data.profile);
                setIsConnected(true);
                console.log(`[HandCashContext] HandCash session restored for ${data.profile.publicProfile.handle}`);
              }
            } else {
              console.log('[HandCashContext] Stored HandCash token is invalid');
              localStorage.removeItem('handcash_auth_token');
            }
          } else {
            // We have Supabase session but no HandCash token - user needs to reconnect HandCash
            console.log('[HandCashContext] Supabase session exists but no HandCash token found');
            setProfile({
              publicProfile: {
                handle: handle,
                displayName: session.user.user_metadata.name,
                avatarUrl: session.user.user_metadata.avatar_url
              }
            });
            // Don't set isConnected=true since we don't have a valid HandCash token
          }
        } else {
          console.log('[HandCashContext] No Supabase session found');
        }
      } catch (err) {
        console.error('Error checking existing HandCash session:', err);
        localStorage.removeItem('handcash_auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[HandCashContext] Auth state changed: ${event}`);
        
        if (event === 'SIGNED_OUT') {
          setIsConnected(false);
          setAuthToken(null);
          setProfile(null);
          setError(null);
          localStorage.removeItem('handcash_auth_token');
        } else if (event === 'SIGNED_IN' && session?.user?.user_metadata?.handle) {
          // User signed in via HandCash callback - check for token
          const storedToken = localStorage.getItem('handcash_auth_token');
          if (storedToken) {
            checkExistingSession(); // Re-run session check
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const connect = useCallback(() => {
    setError(null);
    
    // HandCash Connect flow - redirect to HandCash authorization
    const appId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
    const redirectUrl = `${window.location.origin}/auth/callback/handcash`;
    
    if (!appId) {
      setError('HandCash App ID not configured');
      return;
    }
    
    // Build HandCash OAuth URL
    const handcashAuthUrl = `https://app.handcash.io/connect/${appId}?redirectUrl=${encodeURIComponent(redirectUrl)}`;
    
    // Redirect to HandCash
    window.location.href = handcashAuthUrl;
  }, []);

  const disconnect = useCallback(async () => {
    setIsConnected(false);
    setAuthToken(null);
    setProfile(null);
    setError(null);
    
    // Clear stored data
    localStorage.removeItem('handcash_auth_token');
    
    // Sign out from Supabase as well
    await supabase.auth.signOut();
  }, [supabase]);

  // Listen for successful authentication from callback
  useEffect(() => {
    const handleAuthSuccess = (event: CustomEvent) => {
      const { authToken, profile } = event.detail;
      
      setAuthToken(authToken);
      setProfile(profile);
      setIsConnected(true);
      setError(null);
      
      // Store HandCash token for API calls
      localStorage.setItem('handcash_auth_token', authToken);
    };

    // Listen for custom event from auth callback
    window.addEventListener('handcash-auth-success' as any, handleAuthSuccess);
    
    return () => {
      window.removeEventListener('handcash-auth-success' as any, handleAuthSuccess);
    };
  }, []);

  const value: HandCashContextType = {
    isConnected,
    authToken,
    profile,
    isLoading,
    error,
    connect,
    disconnect
  };

  return (
    <HandCashContext.Provider value={value}>
      {children}
    </HandCashContext.Provider>
  );
};

export const useHandCash = () => {
  const context = useContext(HandCashContext);
  if (context === undefined) {
    throw new Error('useHandCash must be used within a HandCashProvider');
  }
  return context;
};
