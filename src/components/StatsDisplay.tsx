'use client';

import React from 'react';
import { StatsType } from '@/types';

interface StatsDisplayProps {
  stats: StatsType;
}

const StatsDisplay: React.FC<StatsDisplayProps> = ({ stats }) => {
  return (
    <div>
      <h3 className="text-xl font-bold text-pink-500 mb-3">Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        <StatItem name="Strength" value={stats.strength} />
        <StatItem name="Speed" value={stats.speed} />
        <StatItem name="Skill" value={stats.skill} />
        <StatItem name="Stamina" value={stats.stamina} />
        <StatItem name="Stealth" value={stats.stealth} />
        <StatItem name="Style" value={stats.style} />
      </div>
    </div>
  );
};

function StatItem({ name, value }: { name: string; value: number }) {
  return (
    <div className="bg-gray-800 p-3 rounded-md">
      <p className="text-xs text-gray-400 mb-1">{name}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

export default StatsDisplay; 