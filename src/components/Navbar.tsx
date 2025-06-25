'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useChain } from '@/context/ChainContext';
import { useHandCash } from '@/context/HandCashContext';
import HandCashConnectButton from '@/components/HandCashConnectButton';
import { FaTwitter, FaYoutube, FaTelegramPlane, FaEnvelope } from 'react-icons/fa';

// Solana Imports - Commented out
// import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Ethereum Imports - Commented out
// import { useAccount, useConnect, useDisconnect } from 'wagmi';
// import { injected } from 'wagmi/connectors';

// Helper to shorten addresses/handles
// const truncateId = (id: string, startChars = 4, endChars = 4) => {...}

export default function Navbar() {
  const { selectedChain, isChainReady } = useChain();
  const { isConnected: isHandCashConnected } = useHandCash();
  const isConnected = selectedChain === 'bsv' && isHandCashConnected;
  const pathname = usePathname();

  // Define links with color classes
  const navLinks = [
    { href: '/story', label: 'Story', colorClass: 'text-red-400' },
    { href: '/mint', label: 'Mint', colorClass: 'text-orange-400' },
    { href: '/wallet', label: 'Wallet', colorClass: 'text-yellow-400' },
    { href: '/market', label: 'Market', colorClass: 'text-green-400' },
    { href: '/elements', label: 'Elements', colorClass: 'text-teal-400' },
    { href: '/characters', label: 'Characters', colorClass: 'text-cyan-400' },
    { href: '/token', label: 'Token', colorClass: 'text-blue-400' },
    { href: '/game', label: 'Game', colorClass: 'text-indigo-400' },
    { href: '/build', label: 'Build', colorClass: 'text-purple-400' },
    { href: '/studio', label: 'Studio', colorClass: 'text-pink-400' },
  ];

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm text-white sticky top-0 z-50 shadow-lg border-b border-gray-700/50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
           {/* Left side: Logo */}
           <div className="flex items-center gap-2 order-1">
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/assets/01-Logo/01_001_logo_NPG-logo_x_NPG_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x.png"
                alt="Ninja Punk Girls Logo"
                width={150}
                height={40}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex items-center justify-center flex-1 order-3 sm:order-2 w-full sm:w-auto">
           {isChainReady ? (
             selectedChain ? (
               <>
                  {navLinks.map(link => {
                    const isActive = pathname === link.href;
                    return (
                      <Link 
                        key={link.label} 
                        href={link.href} 
                        className={`px-2 py-1 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${link.colorClass} hover:text-white relative ${isActive ? 'pb-2' : ''}`}
                      >
                        {link.label}
                        {isActive && (
                          <div 
                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" 
                            style={{ backgroundColor: `currentColor` }}
                          />
                        )}
                      </Link>
                    );
                  })}
               </>
             ) : (
               <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium border border-pink-500">
                 Choose Blockchain
               </Link>
             )
           ) : (
             <div className="h-[34px] w-3/4 bg-gray-800/50 rounded-md animate-pulse"></div>
           )}
        </div>

        {/* Right side: Connect and Social */}
        <div className="flex items-center gap-4 order-2 sm:order-3 flex-shrink-0"> 
           <>
              {isChainReady && selectedChain === 'bsv' && <HandCashConnectButton />}
              {isChainReady && (selectedChain === 'solana' || selectedChain === 'ethereum') && (
                  <button 
                    className="bg-gray-700 text-gray-400 font-medium py-2 px-4 rounded-md text-sm opacity-50 cursor-not-allowed"
                    disabled
                  >
                      {selectedChain === 'solana' ? 'Solana (Soon)' : 'Ethereum (Soon)'}
                  </button>
              )}
              {!isChainReady && (
                   <div className="h-[38px] w-[150px] bg-gray-700 rounded-md animate-pulse"></div>
              )}
           </>

            {/* Social Links */}
            <div className="hidden sm:flex items-center gap-4 pl-4 border-l border-gray-700/50">
              <a href="#X_PROFILE_URL" target="_blank" rel="noopener noreferrer" title="X (Twitter)" className="text-gray-400 hover:text-white transition-colors">
                <FaTwitter size={18} /> 
              </a>
              <a href="#YOUTUBE_CHANNEL_URL" target="_blank" rel="noopener noreferrer" title="YouTube" className="text-gray-400 hover:text-white transition-colors">
                <FaYoutube size={22} />
              </a>
              <a href="#TELEGRAM_GROUP_URL" target="_blank" rel="noopener noreferrer" title="Telegram" className="text-gray-400 hover:text-white transition-colors">
                 <FaTelegramPlane size={18} />
              </a>
              <a href="mailto:ninjapunkgirls@gmail.com" title="Email Us" className="text-gray-400 hover:text-white transition-colors">
                 <FaEnvelope size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 