'use client';

import React from 'react';
import { useChain } from '@/context/ChainContext';
import { useHandCash } from '@/context/HandCashContext';
import Image from 'next/image';
import { FaTwitter, FaYoutube, FaTelegramPlane, FaEnvelope } from 'react-icons/fa';

const weaponImages = [
  // Right Weapons - Clean, short names
  '/weapons/right/boxing-glove.png',
  '/weapons/right/thrasher.png',
  '/weapons/right/red-axe.png',
  '/weapons/right/black-axe.png',
  '/weapons/right/ball-chain.png',
  '/weapons/right/sword.png',
  '/weapons/right/short-whip.png',
  '/weapons/right/sai.png',
  '/weapons/right/katana.png',
  '/weapons/right/red-bullwhip.png',
  '/weapons/right/graffiti-can.png',
  '/weapons/right/grenade-launcher.png',
  '/weapons/right/laser-rifle.png',
  '/weapons/right/flamethrower.png',
  '/weapons/right/sniper-rifle.png',
  '/weapons/right/little-thrasher.png',
  '/weapons/right/uzi.png',
  '/weapons/right/chainsaw.png',
  '/weapons/right/police-handcuffs.png',
  '/weapons/right/machete.png',
  
  // Left Weapons - Clean, short names
  '/weapons/left/paddle.png',
  '/weapons/left/boxing-glove.png',
  '/weapons/left/big-knife.png',
  '/weapons/left/black-axe.png',
  '/weapons/left/sai.png',
  '/weapons/left/small-knife.png',
  '/weapons/left/katana.png',
  '/weapons/left/red-axe.png',
  '/weapons/left/short-whip.png',
  '/weapons/left/singletail.png',
  '/weapons/left/graffiti-can.png',
  '/weapons/left/grenade-launcher.png',
  '/weapons/left/uzi.png',
  '/weapons/left/chainsaw.png',
  '/weapons/left/handcuffs.png',
  '/weapons/left/black-cat.png',
  '/weapons/left/boombox.png',
  '/weapons/left/doggy.png',
  '/weapons/left/guitar.png',
  '/weapons/left/drone.png',
];

export default function Home() {
  const { selectChain } = useChain();
  const { connect: connectHandCash } = useHandCash();

  const handleConnect = () => {
    selectChain('bsv');
    connectHandCash();
  };

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full bg-black text-white overflow-hidden -mt-8">
      
      {/* Hazard Tape Border */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Top border */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500" 
             style={{
               backgroundImage: 'repeating-linear-gradient(45deg, #facc15 0px, #facc15 20px, #000 20px, #000 40px)',
             }}></div>
        {/* Bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500"
             style={{
               backgroundImage: 'repeating-linear-gradient(45deg, #facc15 0px, #facc15 20px, #000 20px, #000 40px)',
             }}></div>
        {/* Left border */}
        <div className="absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-b from-yellow-400 to-yellow-500"
             style={{
               backgroundImage: 'repeating-linear-gradient(45deg, #facc15 0px, #facc15 20px, #000 20px, #000 40px)',
             }}></div>
        {/* Right border */}
        <div className="absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-b from-yellow-400 to-yellow-500"
             style={{
               backgroundImage: 'repeating-linear-gradient(45deg, #facc15 0px, #facc15 20px, #000 20px, #000 40px)',
             }}></div>
      </div>

      {/* Weapon Background Grid */}
      <div className="absolute inset-4 grid grid-cols-10 gap-1 opacity-20">
        {Array.from({ length: 60 }, (_, i) => (
          <div key={i} className="relative aspect-square">
            <Image
              src={weaponImages[i % weaponImages.length]}
              alt="Weapon"
              fill
              className="object-contain opacity-30 grayscale hover:grayscale-0 transition-all duration-500"
              sizes="(max-width: 768px) 10vw, 6vw"
            />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-20 h-full flex items-center justify-center p-8">
        
        {/* Left Side - Character */}
        <div className="flex-1 flex justify-center">
          <div className="relative">
            <Image
              src="/assets/00_Character_Card.png"
              alt="Character"
              width={160}
              height={200}
              className="rounded-lg shadow-2xl border-2 border-yellow-400"
              priority
            />
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          {/* Logo */}
          <div className="bg-black/80 p-4 rounded-lg border border-yellow-400/50">
            <Image
              src="/assets/01-Logo/01_001_logo_NPG-logo_x_NPG_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x.png"
              alt="Ninja Punk Girls"
              width={220}
              height={70}
              className="mx-auto"
              priority
            />
          </div>

          {/* Title */}
          <div className="text-center bg-black/80 p-4 rounded-lg border border-yellow-400/30">
            <h1 className="text-xl font-bold mb-1 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              NINJA PUNK GIRLS
            </h1>
            <p className="text-sm text-gray-300 mb-1">
              Collectible NFT Warriors on Bitcoin SV
            </p>
            <p className="text-xs text-gray-400">
              Mint • Trade • Battle
            </p>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnect}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full text-sm transition-all duration-300 hover:scale-105 shadow-lg border-2 border-yellow-400/50 hover:border-yellow-400"
          >
            Connect with HandCash
          </button>

          {/* Social Links */}
          <div className="flex space-x-3 bg-black/80 p-3 rounded-lg border border-yellow-400/30">
            <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors p-2 bg-gray-800 rounded-full hover:bg-gray-700 border border-yellow-400/20">
              <FaTwitter size={14} />
            </a>
            <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors p-2 bg-gray-800 rounded-full hover:bg-gray-700 border border-yellow-400/20">
              <FaYoutube size={14} />
            </a>
            <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors p-2 bg-gray-800 rounded-full hover:bg-gray-700 border border-yellow-400/20">
              <FaTelegramPlane size={14} />
            </a>
            <a href="mailto:ninjapunkgirls@gmail.com" className="text-gray-400 hover:text-yellow-400 transition-colors p-2 bg-gray-800 rounded-full hover:bg-gray-700 border border-yellow-400/20">
              <FaEnvelope size={14} />
            </a>
          </div>
        </div>

      </div>

    </div>
  );
}

