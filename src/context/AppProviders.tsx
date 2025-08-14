'use client';

import React, { useMemo, ReactNode } from 'react';

// Chain Context
import { ChainProvider } from '@/context/ChainContext';

// Solana - Temporarily commented out
// import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
// import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
// import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
// import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
// import { clusterApiUrl } from '@solana/web3.js';

// Ethereum (Wagmi) - Temporarily commented out
// import { WagmiProvider, createConfig, http } from 'wagmi';
// import { mainnet, sepolia } from 'wagmi/chains';
// import { injected } from 'wagmi/connectors';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// === ADDED HandCash Context Import ===
import { HandCashProvider } from '@/context/HandCashContext';

// === ADDED AuthContext Import ===
import { AuthProvider } from '@/context/AuthContext';

// === ADDED LayerManager Context Import ===
import { LayerManagerProvider } from '@/context/LayerManagerContext';

// App-Specific Contexts
import { NFTStoreProvider } from '@/context/NFTStoreContext';

// Solana Wallet Styles - Commented out
// require('@solana/wallet-adapter-react-ui/styles.css');

// Wagmi config - Commented out
// const wagmiConfig = createConfig({...

// Query client - Commented out
// const queryClient = new QueryClient();

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Solana setup - Commented out
  // const network = WalletAdapterNetwork.Devnet;
  // const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  // const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

  // Return only necessary providers for now
  // --- Order providers logically: General -> Specific -> App --- 
  return (
    // <WagmiProvider config={wagmiConfig}>
    //   <QueryClientProvider client={queryClient}>
        <ChainProvider>
          <AuthProvider>
            <HandCashProvider>
              <LayerManagerProvider>
                {/* <ConnectionProvider endpoint={endpoint}> */}
                {/*   <WalletProvider wallets={wallets} autoConnect> */}
                {/*     <WalletModalProvider> */}
                      <NFTStoreProvider>
                        {children}
                      </NFTStoreProvider>
                {/*     </WalletModalProvider> */}
                {/*   </WalletProvider> */}
                {/* </ConnectionProvider> */}
              </LayerManagerProvider>
            </HandCashProvider>
          </AuthProvider>
        </ChainProvider>
    //   </QueryClientProvider>
    // </WagmiProvider>
  );
} 