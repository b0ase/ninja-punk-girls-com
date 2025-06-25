'use client';

import React from 'react';
import { NFTType } from '@/types';

interface StatsCardProps {
  nft: NFTType | null;
}

export default function StatsCard({ nft }: StatsCardProps) {
  if (!nft) {
    return (
      <div className="bg-gray-900 rounded-lg p-5 shadow-lg">
        <h3 className="text-xl font-bold text-pink-500 mb-4">NFT Stats</h3>
        <div className="text-gray-400 text-center py-10">
          Generate an NFT to see its stats
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-5 shadow-lg">
      <h3 className="text-xl font-bold text-pink-500 mb-4">NFT Stats</h3>
      
      <div className="mb-4">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-300">{nft.name}</span>
          <span className="text-sm text-gray-300">{nft.number}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-300">Team</span>
          <span className="text-sm text-gray-300">{nft.team}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-300">Series</span>
          <span className="text-sm text-gray-300">{nft.series}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatBar name="Strength" value={nft.stats.strength} maxValue={100} color="bg-red-500" />
        <StatBar name="Speed" value={nft.stats.speed} maxValue={100} color="bg-blue-500" />
        <StatBar name="Skill" value={nft.stats.skill} maxValue={100} color="bg-yellow-500" />
        <StatBar name="Stamina" value={nft.stats.stamina} maxValue={100} color="bg-green-500" />
        <StatBar name="Stealth" value={nft.stats.stealth} maxValue={100} color="bg-purple-500" />
        <StatBar name="Style" value={nft.stats.style} maxValue={100} color="bg-pink-500" />
      </div>
      
      <div className="text-sm text-gray-400 text-center">
        Total Power: {Object.values(nft.stats).reduce((sum, stat) => sum + stat, 0)}
      </div>
    </div>
  );
}

interface StatBarProps {
  name: string;
  value: number;
  maxValue: number;
  color: string;
}

function StatBar({ name, value, maxValue, color }: StatBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-300">{name}</span>
        <span className="text-xs text-gray-300">{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className={`${color} h-2.5 rounded-full`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
} 