'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FaTwitter, FaYoutube, FaTelegramPlane, FaEnvelope } from 'react-icons/fa';
import { useHandCashWallet } from '@/context/HandCashWalletContext';

// Solana Imports - Commented out
// import { useWallet } from '@solana/wallet-adapter-react';
// import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Ethereum Imports - Commented out
// import { useAccount, useConnect, useDisconnect } from 'wagmi';
// import { injected } from 'wagmi/connectors';

// Helper to shorten addresses/handles
// const truncateId = (id: string, startChars = 4, endChars = 4) => {...}

export default function Navbar() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isConnected, wallet, isLoading, error, connect } = useHandCashWallet();

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

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
    { href: '/forge', label: 'Forge', colorClass: 'text-purple-400' },
    { href: '/studio', label: 'Studio', colorClass: 'text-pink-400' },
  ];

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm text-white sticky top-0 z-50 shadow-lg border-b border-gray-700/50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
           {/* Left side: Logo */}
           <div className="flex items-center gap-2 order-1">
            <Link href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
              <Image
                src="/npg_navbar_logo.png"
                alt="Ninja Punk Girls Logo"
                width={180}
                height={50}
                className="object-contain h-10 sm:h-12 w-auto"
                priority
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  // Fallback to text if image fails
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {/* Fallback text logo */}
              <span className="text-lg sm:text-xl font-bold text-pink-500 hidden" id="fallback-logo">
                NPG
              </span>
            </Link>
          </div>

          {/* Center: Navigation Links - Always visible */}
          <div className="hidden md:flex items-center justify-center flex-1 order-3 sm:order-2 w-full sm:w-auto">
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
          </div>

          {/* Right side: Connect Wallet and Social Links */}
          <div className="flex items-center gap-4 order-2 sm:order-3 flex-shrink-0"> 
            {/* HandCash Wallet Status */}
            {isConnected ? (
              <div className="px-4 py-2 bg-green-800/20 border border-green-500/30 rounded-md text-sm text-green-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {wallet?.email ? `${wallet.email.split('@')[0]}@...` : 'Wallet Connected'}
              </div>
            ) : (
              <button
                onClick={connect}
                className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Connect HandCash
              </button>
            )}

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

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-700/50">
        <div className="px-4 py-2 space-y-1">
          {navLinks.map(link => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.label} 
                href={link.href} 
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${link.colorClass} hover:text-white ${isActive ? 'bg-gray-800' : ''}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
} 