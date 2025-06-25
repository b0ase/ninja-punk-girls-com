'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useHandCash } from '@/context/HandCashContext';
// Placeholder icons (replace with actual icons if you have them)
// import { FaChevronDown, FaExternalLinkAlt } from 'react-icons/fa'; 

// Helper to truncate handles/addresses
const truncateId = (id: string | null | undefined, startChars = 4, endChars = 4): string => {
  if (!id) return '';
  if (id.length <= startChars + endChars) return id;
  return `${id.substring(0, startChars)}...${id.substring(id.length - endChars)}`;
};

const HandCashConnectButton: React.FC = () => {
  const { profile, isConnected, isLoading, connect, disconnect, error } = useHandCash();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleConnect = () => {
    setIsDropdownOpen(false); // Close dropdown when connecting
    connect();
  };

  const handleDisconnect = () => {
    setIsDropdownOpen(false); // Close dropdown when disconnecting
    disconnect();
  };

  const userHandle = profile?.publicProfile?.handle;

  // Base styling for the main button
  const buttonBaseClasses = "font-medium py-2 px-4 rounded-md text-sm flex items-center justify-center gap-2 transition-colors duration-150 ease-in-out";

  if (isLoading) {
    return (
      <button
        className={`${buttonBaseClasses} bg-gray-700 text-white opacity-70 cursor-wait`}
        disabled
      >
        Loading...
      </button>
    );
  }

  // Container for relative positioning
  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={handleToggleDropdown}
        className={`${buttonBaseClasses} 
          ${error ? 'bg-red-600 hover:bg-red-700 text-white' : ''} 
          ${isConnected && profile ? 'bg-green-600 hover:bg-green-700 text-white' : ''} 
          ${!isConnected && !error && !isLoading ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold shadow-md' : ''}
        `}
        title={error ? `Error: ${error}` : (isConnected && userHandle ? `Connected as $${userHandle}` : 'Connect Wallet')}
      >
        {error ? (
          'Connect Error'
        ) : isConnected && profile ? (
          <>
            <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <span className="font-mono">${truncateId(userHandle, 6, 4)}</span>
             {/* Simple dropdown arrow placeholder */} 
            <svg className="w-3 h-3 ml-1 fill-current opacity-70" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
          </>
        ) : (
          'Connect Wallet' // Default text when disconnected and no error
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div 
          className="origin-top-right absolute right-0 mt-2 w-60 rounded-md shadow-xl bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            {isConnected && profile && (
              <>
                <div className="px-4 py-2 border-b border-gray-700">
                  <p className="text-sm text-gray-400">Connected Wallet</p>
                  <p className="text-md font-medium text-green-400 font-mono break-all">${userHandle}</p>
                  {/* Add Balance display here? Requires fetching balance context/props */}
                </div>
                {/* Placeholder for future actions */}
                {/* <a href="#" className="text-gray-300 hover:bg-gray-700 hover:text-white block px-4 py-2 text-sm" role="menuitem">View Details</a> */}
                <button
                  onClick={handleDisconnect}
                  className="w-full text-left text-red-400 hover:bg-red-900/30 hover:text-red-300 block px-4 py-2 text-sm"
                  role="menuitem"
                >
                  Disconnect
                </button>
              </>
            )}

            {!isConnected && (
              <>
                 <button
                  onClick={handleConnect}
                  className="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white block px-4 py-2 text-sm font-semibold"
                  role="menuitem"
                 >
                   Connect HandCash (BSV)
                 </button>
                {/* Add placeholders for other wallet/chain connection options */}
                {/* <button className="w-full text-left text-gray-500 cursor-not-allowed block px-4 py-2 text-sm" role="menuitem" disabled>Connect Phantom (Solana)</button> */}
                {/* <button className="w-full text-left text-gray-500 cursor-not-allowed block px-4 py-2 text-sm" role="menuitem" disabled>Connect MetaMask (ETH)</button> */}
             </>
            )}

            {error && (
                <p className="px-4 py-2 text-xs text-red-400">Connection Error: {truncateId(error, 50, 0)}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HandCashConnectButton; 