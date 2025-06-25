'use client';

import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';

export type SupportedChain = 'solana' | 'bsv' | 'ethereum';

interface ChainContextType {
  selectedChain: SupportedChain | null;
  selectChain: (chain: SupportedChain | null) => void;
  isChainReady: boolean;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

interface ChainProviderProps {
  children: ReactNode;
}

export const ChainProvider: React.FC<ChainProviderProps> = ({ children }) => {
  // Start with null, don't read localStorage immediately
  const [selectedChain, setSelectedChain] = useState<SupportedChain | null>(null);
  const [isChainReady, setIsChainReady] = useState<boolean>(false); // Track if initial check is done

  // Effect to read from localStorage only on the client after mounting
  useEffect(() => {
    const storedChain = localStorage.getItem('selectedChain') as SupportedChain | null;
    if (storedChain === 'solana' || storedChain === 'bsv' || storedChain === 'ethereum') {
      setSelectedChain(storedChain);
      console.log(`[ChainContext] Restored chain from localStorage: ${storedChain}`);
    }
    setIsChainReady(true); // Mark as ready after checking localStorage
  }, []); // Empty dependency array ensures this runs only once on mount

  const selectChain = useCallback((chain: SupportedChain | null) => {
    setSelectedChain(chain);
    if (chain && typeof window !== 'undefined') {
      localStorage.setItem('selectedChain', chain);
      console.log(`[ChainContext] Chain selected and stored: ${chain}`);
    } else if (typeof window !== 'undefined'){
        localStorage.removeItem('selectedChain');
        console.log(`[ChainContext] Chain selection cleared.`);
    }
  }, []);

  const value = useMemo(() => ({ selectedChain, selectChain, isChainReady }), [selectedChain, selectChain, isChainReady]);

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
};

export const useChain = (): ChainContextType => {
  const context = useContext(ChainContext);
  if (context === undefined) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
}; 