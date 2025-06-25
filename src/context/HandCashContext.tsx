'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Removed Profile import - using 'any' for now

type UserProfile = any; 

interface HandCashContextType {
  authToken: string | null;
  profile: UserProfile | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

const HandCashContext = createContext<HandCashContextType | undefined>(undefined);

interface HandCashProviderProps {
  children: ReactNode;
}

export const HandCashProvider: React.FC<HandCashProviderProps> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Updated loadProfile to use the API route
  const loadProfile = useCallback(async (token: string) => {
    console.log("[HandCashContext] loadProfile STARTING for token:", token?.substring(0, 6));
    setIsLoading(true);
    setError(null);
    console.log("Attempting to load profile via API route with token:", token);
    try {
      const response = await fetch('/api/handcash/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authToken: token }),
      });

      const data = await response.json();
      console.log(`[HandCashContext] /api/handcash/profile response status: ${response.status}`);

      if (!response.ok || data.error) {
        console.error("[HandCashContext] Profile fetch FAILED. Status:", response.status, "Data:", data);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log("[HandCashContext] Profile fetch SUCCEEDED. Setting profile state.");
      setProfile(data.profile);
      console.log("Profile loaded via API:", data.profile);

    } catch (err: any) {
      console.error('[HandCashContext] loadProfile CATCH block triggered:', err);
      setError(`Failed to load profile: ${err.message}`);
      setAuthToken(null);
      setProfile(null);
      localStorage.removeItem('handcash_auth_token'); 
    } finally {
      console.log("[HandCashContext] loadProfile FINALLY block. isLoading=false");
      setIsLoading(false);
    }
  }, []);

  // useEffect to handle auth token from URL or localStorage
  useEffect(() => {
    if (!searchParams) {
        console.log("[HandCashContext] useEffect: Waiting for searchParams...");
        return; 
    }

    const storedToken = localStorage.getItem('handcash_auth_token');
    const urlToken = searchParams.get('authToken');

    console.log(`[HandCashContext] useEffect Check. storedToken: ${!!storedToken}, urlToken: ${!!urlToken}, current profile: ${!!profile}, current authToken: ${!!authToken}`);

    // Priority 1: Use stored token if available and profile isn't loaded yet
    if (storedToken && !profile) { 
        console.log("[HandCashContext] Found storedToken and no profile. Setting token state (if needed) and loading profile.");
        if (!authToken) { // Only set token state if it's not already set
            setAuthToken(storedToken);
        }
        // Always attempt profile load if we have a stored token but no profile data yet
        setIsLoading(true); // Set loading before async call
        loadProfile(storedToken);
    }
    // Priority 2: Use URL token ONLY if no stored token exists
    else if (urlToken && !storedToken) {
        console.log("[HandCashContext] Processing URL token (no stored token found). Saving token, loading profile, then redirecting.");
        setIsLoading(true);
        setAuthToken(urlToken);
        localStorage.setItem('handcash_auth_token', urlToken);
        
        // Load profile FIRST
        loadProfile(urlToken).then(() => {
            // Redirect AFTER profile load attempt (success or fail)
            console.log("[HandCashContext] Profile load attempt finished after URL token. Redirecting to /mint...");
            router.replace('/mint'); 
        }).catch(profileError => {
            console.error("[HandCashContext] Error during loadProfile (after URL token):", profileError);
             // Still redirect even if profile load failed, but maybe to a different page or show error?
             router.replace('/mint'); 
        });
    }
    // Priority 3: No tokens found, or profile already loaded
    else {
        if (!storedToken && !urlToken) {
            console.log("[HandCashContext] No auth token found anywhere.");
             setAuthToken(null); // Ensure token is cleared
             setProfile(null);  // Ensure profile is cleared
        }
        // If we have a profile or no tokens, loading is finished
        setIsLoading(false); 
    }

  // Use a dependency array that makes sense for re-checking storage/URL
  }, [searchParams, router, loadProfile, authToken, profile]); // Added profile here too

  // connect function
  const connect = async () => {
    console.log("[HandCashContext] connect() called. Clearing profile.");
    setProfile(null);
    setIsLoading(true);
    setError(null);
    try {
      // <<< Define the callback URL >>>
      const callbackPath = '/auth/callback/handcash';
      // Ensure it's a full URL for the API call if needed, or handle base URL assembly
      // For simplicity, using just the path assuming same origin
      const apiUrl = `/api/handcash/connect?redirectUrl=${encodeURIComponent(callbackPath)}`;
      console.log(`[HandCashContext] Fetching connection URL from: ${apiUrl}`);

      // <<< Update fetch call to include the redirectUrl query parameter >>>
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to get HandCash connection URL from server.');
      }

      const redirectionUrl = data.url;
      if (!redirectionUrl) {
        throw new Error('Received empty redirection URL from server.');
      }

      console.log("[HandCashContext] Redirecting to HandCash via API route:", redirectionUrl);
      window.location.href = redirectionUrl;

    } catch (err: any) {
      console.error('[HandCashContext] Failed to initiate HandCash connection:', err);
      setError(err.message || 'Could not initiate connection with HandCash.');
      setIsLoading(false);
    }
  };

  // disconnect function remains the same
  const disconnect = () => {
    console.log("Disconnecting HandCash");
    setAuthToken(null);
    setProfile(null);
    localStorage.removeItem('handcash_auth_token');
    setError(null);
  };

  // isConnected now correctly depends on profile presence
  const isConnected = !!authToken && !!profile;

  const value: HandCashContextType = {
    authToken,
    profile,
    isConnected,
    isLoading,
    error,
    connect,
    disconnect,
  };

  return <HandCashContext.Provider value={value}>{children}</HandCashContext.Provider>;
};

export const useHandCash = (): HandCashContextType => {
  const context = useContext(HandCashContext);
  if (context === undefined) {
    throw new Error('useHandCash must be used within a HandCashProvider');
  }
  return context;
}; 