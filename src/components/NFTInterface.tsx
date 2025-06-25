'use client';

import React from 'react';

interface NFTInterfaceProps {
  className?: string;
}

/**
 * This component recreates the interface layout seen in A_001_INTERFACE_((RGB)).png
 * with precise positioning of all elements
 */
export default function NFTInterface({ className = '' }: NFTInterfaceProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Top section - Logo area */}
      <div className="absolute top-[26px] left-[26px] w-[230px] h-[60px] bg-black/90 rounded-md border border-pink-500"></div>
      
      {/* Top right - Ninja Punk Girls logo box */}
      <div className="absolute top-[26px] right-[26px] w-[135px] h-[60px] bg-black/90 rounded-md border border-pink-500"></div>
      
      {/* Middle section - Character area identifier */}
      <div className="absolute top-[120px] left-[370px] w-[155px] h-[50px] bg-black/90 rounded-md border border-pink-500"></div>
      
      {/* Bottom stats section */}
      <div className="absolute bottom-[70px] left-0 w-full flex justify-center">
        <div className="relative w-[350px] h-[60px]">
          {/* Top row stat boxes */}
          <div className="absolute bottom-[30px] left-[0px] flex space-x-3">
            {/* Strength */}
            <div className="flex items-center">
              <div className="w-[80px] h-[22px] bg-black/90 rounded-sm border border-pink-500"></div>
              <div className="w-[30px] h-[22px] ml-1 bg-black/90 rounded-sm border border-pink-500"></div>
            </div>
            
            {/* Speed */}
            <div className="flex items-center ml-4">
              <div className="w-[80px] h-[22px] bg-black/90 rounded-sm border border-pink-500"></div>
              <div className="w-[30px] h-[22px] ml-1 bg-black/90 rounded-sm border border-pink-500"></div>
            </div>
            
            {/* Skill */}
            <div className="flex items-center ml-4">
              <div className="w-[80px] h-[22px] bg-black/90 rounded-sm border border-pink-500"></div>
              <div className="w-[30px] h-[22px] ml-1 bg-black/90 rounded-sm border border-pink-500"></div>
            </div>
          </div>
          
          {/* Bottom row stat boxes */}
          <div className="absolute bottom-[2px] left-[0px] flex space-x-3">
            {/* Stamina */}
            <div className="flex items-center">
              <div className="w-[80px] h-[22px] bg-black/90 rounded-sm border border-pink-500"></div>
              <div className="w-[30px] h-[22px] ml-1 bg-black/90 rounded-sm border border-pink-500"></div>
            </div>
            
            {/* Stealth */}
            <div className="flex items-center ml-4">
              <div className="w-[80px] h-[22px] bg-black/90 rounded-sm border border-pink-500"></div>
              <div className="w-[30px] h-[22px] ml-1 bg-black/90 rounded-sm border border-pink-500"></div>
            </div>
            
            {/* Style */}
            <div className="flex items-center ml-4">
              <div className="w-[80px] h-[22px] bg-black/90 rounded-sm border border-pink-500"></div>
              <div className="w-[30px] h-[22px] ml-1 bg-black/90 rounded-sm border border-pink-500"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright text at bottom */}
      <div className="absolute bottom-[10px] left-[50%] transform -translate-x-1/2 text-[10px] text-white opacity-70">
        ©NinjaPunkGirls 2022
      </div>
      
      {/* Telegram link at bottom */}
      <div className="absolute bottom-[10px] right-[30px] text-[10px] text-white opacity-70">
        t.me/ninjapunkgirls@relayX.io
      </div>
      
      {/* Yellow-black warning stripes border */}
      <div className="absolute inset-0 border-[15px] border-yellow-black-striped rounded pointer-events-none"></div>
    </div>
  );
} 