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

// Simple vector background with layer-specific colors
const getVectorBackground = (layerKey: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  const layerDetail = LAYER_DETAILS[layerKey];
  if (!layerDetail) return null;

  // Use card-sized dimensions while maintaining 961:1441 proportions
  const dimensions = {
    small: { width: 128, height: 192 },   // Small card (128:192 = 961:1441 ratio)
    medium: { width: 192, height: 288 },  // Medium card (192:288 = 961:1441 ratio)
    large: { width: 256, height: 384 }    // Large card (256:384 = 961:1441 ratio)
  };

  const { width, height } = dimensions[size];

  // Define color schemes for different layer categories (matching the working cards)
  const getColorScheme = (layerKey: string) => {
    switch (layerKey) {
      case 'ACCESSORIES': // COLLAR
        return {
          primary: '#fbbf24', // Yellow
          secondary: '#f59e0b',
          accent: '#fde047',
          pattern: '#d97706'
        };
      case 'ARMS': // GLOVES AND SLEEVES
        return {
          primary: '#10b981', // Green
          secondary: '#059669',
          accent: '#34d399',
          pattern: '#047857'
        };
      case 'BACK':
        return {
          primary: '#ef4444', // Red
          secondary: '#dc2626',
          accent: '#fca5a5',
          pattern: '#991b1b'
        };
      case 'BODY_SKIN': // BODY
        return {
          primary: '#ec4899', // Pink
          secondary: '#db2777',
          accent: '#f472b6',
          pattern: '#9d174d'
        };
      case 'BOOTS':
        return {
          primary: '#3b82f6', // Blue
          secondary: '#2563eb',
          accent: '#60a5fa',
          pattern: '#1d4ed8'
        };
      case 'BOTTOM': // SHORTS
        return {
          primary: '#8b5cf6', // Purple
          secondary: '#7c3aed',
          accent: '#a78bfa',
          pattern: '#5b21b6'
        };
      case 'BRA':
        return {
          primary: '#f59e0b', // Orange/Amber
          secondary: '#d97706',
          accent: '#fbbf24',
          pattern: '#92400e'
        };
      case 'FACE':
        return {
          primary: '#ec4899', // Pink/Magenta
          secondary: '#db2777',
          accent: '#f472b6',
          pattern: '#9d174d'
        };
      case 'HAIR':
        return {
          primary: '#8b5cf6', // Purple
          secondary: '#7c3aed',
          accent: '#a78bfa',
          pattern: '#5b21b6'
        };
      case 'HORNS': // HAIR AND HORNS
        return {
          primary: '#10b981', // Green
          secondary: '#059669',
          accent: '#34d399',
          pattern: '#047857'
        };
      case 'JEWELLERY': // BIRTHMARKS AND TATTOOS
        return {
          primary: '#ef4444', // Red
          secondary: '#dc2626',
          accent: '#fca5a5',
          pattern: '#991b1b'
        };
      case 'LEFT_WEAPON': // LEFT HAND WEAPON
        return {
          primary: '#3b82f6', // Blue
          secondary: '#2563eb',
          accent: '#60a5fa',
          pattern: '#1d4ed8'
        };
      case 'MASK':
        return {
          primary: '#8b5cf6', // Purple
          secondary: '#7c3aed',
          accent: '#a78bfa',
          pattern: '#5b21b6'
        };
      case 'REAR_HAIR': // HAIR (Rear hair)
        return {
          primary: '#8b5cf6', // Purple
          secondary: '#7c3aed',
          accent: '#a78bfa',
          pattern: '#5b21b6'
        };
      case 'REAR_HORNS': // BACK HORNS
        return {
          primary: '#10b981', // Green
          secondary: '#059669',
          accent: '#34d399',
          pattern: '#047857'
        };
      case 'RIGHT_WEAPON': // RIGHT HAND WEAPON
        return {
          primary: '#3b82f6', // Blue
          secondary: '#2563eb',
          accent: '#60a5fa',
          pattern: '#1d4ed8'
        };
      case 'TOP':
        return {
          primary: '#10b981', // Green
          secondary: '#059669',
          accent: '#34d399',
          pattern: '#047857'
        };
      case 'UNDERWEAR':
        return {
          primary: '#f59e0b', // Orange/Amber
          secondary: '#d97706',
          accent: '#fbbf24',
          pattern: '#92400e'
        };
      case 'EFFECTS':
        return {
          primary: '#6b7280', // Gray
          secondary: '#4b5563',
          accent: '#9ca3af',
          pattern: '#374151'
        };
      case 'DECALS':
        return {
          primary: '#ef4444', // Red
          secondary: '#dc2626',
          accent: '#fca5a5',
          pattern: '#991b1b'
        };
      case 'BANNER':
        return {
          primary: '#8b5cf6', // Purple
          secondary: '#7c3aed',
          accent: '#a78bfa',
          pattern: '#5b21b6'
        };
      case 'GLOW':
        return {
          primary: '#fbbf24', // Yellow
          secondary: '#f59e0b',
          accent: '#fde047',
          pattern: '#d97706'
        };
      case 'BACKGROUND':
        return {
          primary: '#6b7280', // Gray
          secondary: '#4b5563',
          accent: '#9ca3af',
          pattern: '#374151'
        };
      default:
        return {
          primary: '#6b7280', // Gray
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
        width="32"
        height="16"
        fill={colors.pattern}
        opacity="0.9"
        rx="4"
        ry="4"
      />
      <text
        x="24"
        y="20"
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
      className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold text-white"
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
    <div className="absolute bottom-4 left-4 right-4">
      <div className="grid grid-cols-3 gap-2 text-sm">
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
        return 'w-32 h-48'; // Small card size (maintains 961:1441 ratio)
      case 'medium':
        return 'w-48 h-72'; // Medium card size (maintains 961:1441 ratio)
      case 'large':
        return 'w-64 h-96'; // Large card size (maintains 961:1441 ratio)
      default:
        return 'w-48 h-72'; // Default to medium card size
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
            width={size === 'small' ? 80 : size === 'medium' ? 120 : 160}
            height={size === 'small' ? 80 : size === 'medium' ? 120 : 160}
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
        <div className="absolute top-4 left-4 px-3 py-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full text-sm font-bold text-white">
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
