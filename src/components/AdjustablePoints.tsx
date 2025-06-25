'use client';

import React, { useState, useEffect } from 'react';
import { NFTType, StatsType } from '@/types';

interface AdjustablePointsProps {
  nft: NFTType | null;
  onStatsChange: (stats: StatsType) => void;
}

export default function AdjustablePoints({ nft, onStatsChange }: AdjustablePointsProps) {
  const [availablePoints, setAvailablePoints] = useState(0);
  const [customStats, setCustomStats] = useState<StatsType>({
    strength: 0,
    speed: 0,
    skill: 0,
    stamina: 0,
    stealth: 0,
    style: 0
  });
  
  // Calculate total points from the NFT stats
  useEffect(() => {
    if (!nft) return;
    
    // Calculate initial stats
    const initialStats = { ...nft.stats };
    
    // Calculate max available points (20% more than the total)
    const totalPoints = Object.values(initialStats).reduce((sum, stat) => sum + stat, 0);
    const maxPoints = Math.round(totalPoints * 1.2);
    
    setCustomStats(initialStats);
    setAvailablePoints(maxPoints - totalPoints);
  }, [nft]);
  
  // Update the NFT stats when custom stats change
  useEffect(() => {
    if (!nft) return;
    
    onStatsChange(customStats);
  }, [customStats, nft, onStatsChange]);
  
  const handleStatChange = (statName: keyof StatsType, increment: number) => {
    if (!nft) return;
    
    // Check if we can make this change
    if (increment > 0 && availablePoints <= 0) return;
    
    // Prevent going below 0
    if (increment < 0 && customStats[statName] <= 0) return;
    
    // Update stats
    setCustomStats(prev => ({
      ...prev,
      [statName]: prev[statName] + increment
    }));
    
    // Update available points
    setAvailablePoints(prev => prev - increment);
  };
  
  if (!nft) {
    return (
      <div className="bg-gray-900 rounded-lg p-5 shadow-lg">
        <h3 className="text-xl font-bold text-pink-500 mb-4">Customize Points</h3>
        <div className="text-gray-400 text-center py-10">
          Generate an NFT to customize points
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-900 rounded-lg p-5 shadow-lg">
      <h3 className="text-xl font-bold text-pink-500 mb-4">Customize Points</h3>
      
      <div className="mb-3 text-sm text-gray-300">
        Available Points: <span className="font-bold">{availablePoints}</span>
      </div>
      
      <div className="space-y-4">
        <StatAdjuster 
          name="Strength" 
          value={customStats.strength}
          onIncrement={() => handleStatChange('strength', 1)}
          onDecrement={() => handleStatChange('strength', -1)}
        />
        
        <StatAdjuster 
          name="Speed" 
          value={customStats.speed}
          onIncrement={() => handleStatChange('speed', 1)}
          onDecrement={() => handleStatChange('speed', -1)}
        />
        
        <StatAdjuster 
          name="Skill" 
          value={customStats.skill}
          onIncrement={() => handleStatChange('skill', 1)}
          onDecrement={() => handleStatChange('skill', -1)}
        />
        
        <StatAdjuster 
          name="Stamina" 
          value={customStats.stamina}
          onIncrement={() => handleStatChange('stamina', 1)}
          onDecrement={() => handleStatChange('stamina', -1)}
        />
        
        <StatAdjuster 
          name="Stealth" 
          value={customStats.stealth}
          onIncrement={() => handleStatChange('stealth', 1)}
          onDecrement={() => handleStatChange('stealth', -1)}
        />
        
        <StatAdjuster 
          name="Style" 
          value={customStats.style}
          onIncrement={() => handleStatChange('style', 1)}
          onDecrement={() => handleStatChange('style', -1)}
        />
      </div>
    </div>
  );
}

interface StatAdjusterProps {
  name: string;
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

function StatAdjuster({ name, value, onIncrement, onDecrement }: StatAdjusterProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{name}</span>
      
      <div className="flex items-center space-x-2">
        <button 
          className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-white"
          onClick={onDecrement}
        >
          -
        </button>
        
        <span className="text-lg font-semibold w-8 text-center">{value}</span>
        
        <button 
          className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white"
          onClick={onIncrement}
        >
          +
        </button>
      </div>
    </div>
  );
} 