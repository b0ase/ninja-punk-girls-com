'use client';

import React from 'react';
import Image from 'next/image';
import { AssetDetail } from '@/types';
import { LAYER_DETAILS } from '@/data/layer-config';

interface VectorElementCardNewProps {
  asset: AssetDetail;
  layerKey: string;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
}

// Vector background patterns and gradients for different layers
const getVectorBackground = (layerKey: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  const layerDetail = LAYER_DETAILS[layerKey];
  if (!layerDetail) return null;

  const dimensions = {
    small: { width: 120, height: 180 },
    medium: { width: 160, height: 240 },
    large: { width: 200, height: 300 }
  };

  const { width, height } = dimensions[size];

  // Define color schemes for different layer categories
  const getColorScheme = (layerKey: string) => {
    if (layerKey.includes('WEAPON')) {
      return {
        primary: '#ef4444',
        secondary: '#dc2626',
        accent: '#fca5a5',
        pattern: '#991b1b'
      };
    } else if (layerKey.includes('BODY') || layerKey.includes('SKIN')) {
      return {
        primary: '#f59e0b',
        secondary: '#d97706',
        accent: '#fbbf24',
        pattern: '#92400e'
      };
    } else if (layerKey.includes('HAIR')) {
      return {
        primary: '#8b5cf6',
        secondary: '#7c3aed',
        accent: '#a78bfa',
        pattern: '#5b21b6'
      };
    } else if (layerKey.includes('FACE')) {
      return {
        primary: '#ec4899',
        secondary: '#db2777',
        accent: '#f472b6',
        pattern: '#9d174d'
      };
    } else if (layerKey.includes('HORNS')) {
      return {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#34d399',
        pattern: '#047857'
      };
    } else {
      return {
        primary: '#6b7280',
        secondary: '#4b5563',
        accent: '#9ca3af',
        pattern: '#374151'
      };
    }
  };

  const colors = getColorScheme(layerKey);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 w-full h-full"
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id={`gradient-${layerKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
        
        {/* Pattern definition */}
        <pattern
          id={`pattern-${layerKey}`}
          patternUnits="userSpaceOnUse"
          width="20"
          height="20"
        >
          <rect width="20" height="20" fill={colors.primary} opacity="0.1" />
          <circle cx="10" cy="10" r="2" fill={colors.pattern} opacity="0.3" />
        </pattern>
      </defs>

      {/* Main background */}
      <rect
        width={width}
        height={height}
        fill={`url(#gradient-${layerKey})`}
        rx="12"
        ry="12"
      />

      {/* Pattern overlay */}
      <rect
        width={width}
        height={height}
        fill={`url(#pattern-${layerKey})`}
        rx="12"
        ry="12"
      />

      {/* Border */}
      <rect
        width={width}
        height={height}
        fill="none"
        stroke={colors.accent}
        strokeWidth="2"
        rx="12"
        ry="12"
      />

      {/* Corner accents */}
      <circle cx="12" cy="12" r="4" fill={colors.accent} opacity="0.8" />
      <circle cx={width - 12} cy="12" r="4" fill={colors.accent} opacity="0.8" />
      <circle cx="12" cy={height - 12} r="4" fill={colors.accent} opacity="0.8" />
      <circle cx={width - 12} cy={height - 12} r="4" fill={colors.accent} opacity="0.8" />

      {/* Layer indicator */}
      <rect
        x="8"
        y="8"
        width="40"
        height="20"
        fill={colors.pattern}
        opacity="0.9"
        rx="4"
        ry="4"
      />
      <text
        x="28"
        y="22"
        textAnchor="middle"
        fill="white"
        fontSize="10"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {layerDetail.number}
      </text>
    </svg>
  );
};

// Rarity indicator component
const RarityIndicator: React.FC<{ rarity?: string | null }> = ({ rarity }) => {
  if (!rarity) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#6b7280';
      case 'uncommon': return '#10b981';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      case 'mythic': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div
      className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white"
      style={{ backgroundColor: getRarityColor(rarity) }}
    >
      {rarity}
    </div>
  );
};

// Stats display component
const StatsDisplay: React.FC<{ stats?: Partial<{ strength: number; speed: number; skill: number; stamina: number; stealth: number; style: number }> }> = ({ stats }) => {
  if (!stats) return null;

  const statNames = ['STR', 'SPD', 'SKL', 'STM', 'STL', 'STY'];
  const statValues = [
    stats.strength || 0,
    stats.speed || 0,
    stats.skill || 0,
    stats.stamina || 0,
    stats.stealth || 0,
    stats.style || 0
  ];

  return (
    <div className="absolute bottom-2 left-2 right-2">
      <div className="grid grid-cols-3 gap-1 text-xs">
        {statNames.map((stat, index) => (
          <div key={stat} className="text-center">
            <div className="text-gray-300 font-bold">{stat}</div>
            <div className="text-white">{statValues[index]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function VectorElementCardNew({
  asset,
  layerKey,
  showDetails = false,
  size = 'medium'
}: VectorElementCardNewProps) {
  const layerDetail = LAYER_DETAILS[layerKey];
  const isRgb = asset.filename?.includes('_RGB_');

  const getSizeClasses = (size: 'small' | 'medium' | 'large') => {
    switch (size) {
      case 'small':
        return 'w-32 h-48';
      case 'medium':
        return 'w-40 h-60';
      case 'large':
        return 'w-48 h-72';
      default:
        return 'w-40 h-60';
    }
  };

  return (
    <div className={`relative ${getSizeClasses(size)} group cursor-pointer transition-transform hover:scale-105`}>
      {/* Vector Background */}
      {getVectorBackground(layerKey, size)}

      {/* Rarity Indicator */}
      <RarityIndicator rarity={asset.rarity} />

      {/* Element Image */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {asset.filename ? (
          <Image
            src={`/assets/${layerDetail?.folderName || layerKey}/${asset.filename}`}
            alt={asset.name || 'Unknown Asset'}
            width={size === 'small' ? 80 : size === 'medium' ? 100 : 120}
            height={size === 'small' ? 80 : size === 'medium' ? 100 : 120}
            className="object-contain z-10"
            unoptimized
            onError={(e) => {
              e.currentTarget.src = '/placeholder.png';
            }}
          />
        ) : (
          <div className="text-gray-400 text-center">
            <div className="text-2xl">?</div>
            <div className="text-xs">No Image</div>
          </div>
        )}
      </div>

      {/* RGB Indicator */}
      {isRgb && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full text-xs font-bold text-white">
          RGB
        </div>
      )}

      {/* Stats Display */}
      <StatsDisplay stats={asset.stats} />

      {/* Hover Details */}
      {showDetails && (
        <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex flex-col justify-center items-center text-white text-center p-4">
          <div className="font-bold text-sm mb-2">{asset.name}</div>
          <div className="text-xs text-gray-300 mb-1">
            {layerKey.replace(/_/g, ' ')}
          </div>
          {asset.assetNumber && (
            <div className="text-xs text-gray-300 mb-1">
              #{asset.assetNumber}
            </div>
          )}
          {asset.character && (
            <div className="text-xs text-gray-300 mb-1">
              {asset.character}
            </div>
          )}
          {asset.genes && (
            <div className="text-xs text-gray-300">
              {asset.genes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
