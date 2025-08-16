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
  // Layout Designer Integration Props
  interfaceTemplate?: string;
  elementPositions?: Record<string, any>;
  sampleTexts?: Record<string, string>;
  layoutScale?: number;
}

// Enhanced vector background with layer-specific colors and patterns
const getVectorBackground = (layerKey: string, size: 'small' | 'medium' | 'large' = 'medium') => {
  const layerDetail = LAYER_DETAILS[layerKey];
  if (!layerDetail) return null;

  // Fixed dimensions that match PNG card sizes exactly
  const dimensions = {
    small: { width: 120, height: 180 },   // Fixed small size
    medium: { width: 160, height: 240 },  // Fixed medium size  
    large: { width: 200, height: 300 }    // Fixed large size
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
      case 'LEFT_WEAPON':
        return {
          primary: '#dc2626', // Red
          secondary: '#b91c1c',
          accent: '#f87171',
          pattern: '#7f1d1d'
        };
      case 'RIGHT_WEAPON':
        return {
          primary: '#dc2626', // Red
          secondary: '#b91c1c',
          accent: '#f87171',
          pattern: '#7f1d1d'
        };
      case 'MASK':
        return {
          primary: '#6366f1', // Indigo
          secondary: '#4f46e5',
          accent: '#818cf8',
          pattern: '#3730a3'
        };
      case 'TOP':
        return {
          primary: '#06b6d4', // Cyan
          secondary: '#0891b2',
          accent: '#22d3ee',
          pattern: '#0e7490'
        };
      case 'UNDERWEAR':
        return {
          primary: '#f97316', // Orange
          secondary: '#ea580c',
          accent: '#fb923c',
          pattern: '#c2410c'
        };
      case 'JEWELLERY':
        return {
          primary: '#fbbf24', // Amber
          secondary: '#f59e0b',
          accent: '#fde047',
          pattern: '#d97706'
        };
      case 'REAR_HAIR':
        return {
          primary: '#8b5cf6', // Purple
          secondary: '#7c3aed',
          accent: '#a78bfa',
          pattern: '#5b21b6'
        };
      case 'REAR_HORNS':
        return {
          primary: '#10b981', // Green
          secondary: '#059669',
          accent: '#34d399',
          pattern: '#047857'
        };
      case 'DECALS':
        return {
          primary: '#ec4899', // Pink
          secondary: '#db2777',
          accent: '#f472b6',
          pattern: '#9d174d'
        };
      case 'BANNER':
        return {
          primary: '#f59e0b', // Amber
          secondary: '#d97706',
          accent: '#fbbf24',
          pattern: '#92400e'
        };
      case 'GLOW':
        return {
          primary: '#06b6d4', // Cyan
          secondary: '#0891b2',
          accent: '#22d3ee',
          pattern: '#0e7490'
        };
      case 'BACKGROUND':
        return {
          primary: '#1f2937', // Gray
          secondary: '#111827',
          accent: '#374151',
          pattern: '#0f172a'
        };
      default:
        return {
          primary: '#6b7280', // Default gray
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
      className="w-full h-full"
    >
      {/* Enhanced background with gradient and pattern */}
      <defs>
        <linearGradient id={`bg-${layerKey}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colors.primary} />
          <stop offset="100%" stopColor={colors.secondary} />
        </linearGradient>
        <pattern id={`pattern-${layerKey}`} patternUnits="userSpaceOnUse" width="20" height="20">
          <circle cx="10" cy="10" r="2" fill={colors.pattern} opacity="0.3" />
        </pattern>
      </defs>
      
      {/* Main background with gradient */}
      <rect
        width={width}
        height={height}
        fill={`url(#bg-${layerKey})`}
        rx="8"
        ry="8"
      />
      
      {/* Pattern overlay */}
      <rect
        width={width}
        height={height}
        fill={`url(#pattern-${layerKey})`}
        rx="8"
        ry="8"
      />

      {/* Top banner with layer info */}
      <rect
        x="0"
        y="0"
        width={width}
        height="30"
        fill={colors.pattern}
        opacity="0.9"
        rx="8"
        ry="8"
      />
      
      {/* Layer number */}
      <text
        x={width / 2}
        y="20"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="bold"
        fontFamily="monospace"
      >
        {layerDetail.number}
      </text>
      
      {/* Layer name */}
      <text
        x={width / 2}
        y="40"
        textAnchor="middle"
        fill="white"
        fontSize="10"
        fontWeight="500"
        fontFamily="monospace"
        opacity="0.8"
      >
        {layerKey.replace(/_/g, ' ')}
      </text>

      {/* Bottom accent bar */}
      <rect
        x="0"
        y={height - 20}
        width={width}
        height="20"
        fill={colors.accent}
        opacity="0.7"
        rx="8"
        ry="8"
      />
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
      className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg"
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
          <div key={stat} className="text-center bg-black bg-opacity-50 rounded px-1 py-0.5">
            <div className="text-gray-300 font-bold text-[10px]">{stat}</div>
            <div className="text-white font-bold">{statValues[index]}</div>
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
  size = 'medium',
  // Layout Designer Integration Props
  interfaceTemplate,
  elementPositions,
  sampleTexts,
  layoutScale = 1
}: VectorElementCardNewProps) {
  // Map the folder-style layer key (e.g., "21-Body") to the canonical layer key (e.g., "BODY_SKIN")
  const getCanonicalLayerKey = (folderStyleKey: string) => {
    // Find the canonical layer key that maps to this folder name
    for (const [canonicalKey, details] of Object.entries(LAYER_DETAILS)) {
      if (details.folderName === folderStyleKey) {
        return canonicalKey;
      }
    }
    // If no match found, return the original key
    return folderStyleKey;
  };

  const canonicalLayerKey = getCanonicalLayerKey(layerKey);
  const layerDetail = LAYER_DETAILS[canonicalLayerKey];
  const isRgb = asset.filename?.includes('_RGB_');

  // Fixed dimensions that match PNG card sizes exactly
  const dimensions = {
    small: { width: 120, height: 180 },   // Fixed small size
    medium: { width: 160, height: 240 },  // Fixed medium size  
    large: { width: 200, height: 300 }    // Fixed large size
  };

  const { width, height } = dimensions[size];

  // Get the correct asset path - assets are in assets-source subdirectory
  const getAssetPath = (filename: string) => {
    if (!filename || !layerDetail) return null;
    
    // Map layer key to folder name and construct path
    const folderName = layerDetail.folderName;
    const path = `/assets/assets-source/${folderName}/${filename}`;
    
    return path;
  };

  const assetPath = getAssetPath(asset.filename || '');

  // Layout Designer Integration: Apply positioning and styling
  const getLayoutStyle = (elementKey: string) => {
    if (!elementPositions || !elementPositions[elementKey]) return {};
    
    const position = elementPositions[elementKey];
    const scale = layoutScale || 1;
    
    return {
      position: 'absolute' as const,
      left: `${position.x * scale}px`,
      top: `${position.y * scale}px`,
      fontSize: position.fontSize ? `${position.fontSize * scale}px` : undefined,
      width: position.width ? `${position.width * scale}px` : undefined,
      height: position.height ? `${position.height * scale}px` : undefined,
      zIndex: 20
    };
  };

  return (
    <div className={`relative w-${width} h-${height} group cursor-pointer transition-transform hover:scale-105`} style={{ width: `${width}px`, height: `${height}px` }}>
      {/* Interface Template Background (if selected) */}
      {interfaceTemplate && (
        <div className="absolute inset-0 z-0">
          <Image
            src={`/api/interface-files/${interfaceTemplate}`}
            alt="Interface Template"
            fill
            className="object-cover rounded-xl"
            unoptimized
          />
        </div>
      )}

      {/* Vector Background (only if no interface template) */}
      {!interfaceTemplate && getVectorBackground(canonicalLayerKey, size)}

      {/* Rarity Indicator */}
      <RarityIndicator rarity={asset.rarity} />

      {/* Element Image - Centered and properly sized */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {assetPath ? (
          <Image
            src={assetPath}
            alt={asset.name || 'Unknown Asset'}
            width={size === 'small' ? 80 : size === 'medium' ? 120 : 160}
            height={size === 'small' ? 120 : size === 'medium' ? 180 : 240}
            className="object-contain z-10 max-w-full max-h-full"
            unoptimized
            onError={(e) => {
              console.error(`Failed to load image: ${assetPath}`);
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
        <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded-full text-xs font-bold text-white shadow-lg">
          RGB
        </div>
      )}

      {/* Layout Designer Elements - Applied from positioning data */}
      {elementPositions && sampleTexts && (
        <>
          {/* Element Name */}
          {elementPositions.elementName && (
            <div 
              className="text-white font-bold pointer-events-none"
              style={getLayoutStyle('elementName')}
            >
              {sampleTexts.elementName || asset.name}
            </div>
          )}

          {/* Series Number */}
          {elementPositions.seriesNumber && (
            <div 
              className="text-white font-medium pointer-events-none"
              style={getLayoutStyle('seriesNumber')}
            >
              {sampleTexts.seriesNumber || 'Series #1'}
            </div>
          )}

          {/* Layer Name */}
          {elementPositions.layerName && (
            <div 
              className="text-white text-sm pointer-events-none"
              style={getLayoutStyle('layerName')}
            >
              {sampleTexts.layerName || canonicalLayerKey.replace(/_/g, ' ')}
            </div>
          )}

          {/* Element Number */}
          {elementPositions.elementNumber && (
            <div 
              className="text-white text-sm pointer-events-none"
              style={getLayoutStyle('elementNumber')}
            >
              {sampleTexts.elementNumber || `#${asset.filename?.split('_')[1] || '001'}`}
            </div>
          )}

          {/* Rarity */}
          {elementPositions.rarity && asset.rarity && (
            <div 
              className="text-white font-medium pointer-events-none"
              style={getLayoutStyle('rarity')}
            >
              {sampleTexts.rarity || asset.rarity}
            </div>
          )}

          {/* Stats */}
          {elementPositions.strengthStat && (
            <div 
              className="text-white text-sm pointer-events-none"
              style={getLayoutStyle('strengthStat')}
            >
              {sampleTexts.strengthStat || `STR: ${asset.stats.strength}`}
            </div>
          )}

          {elementPositions.speedStat && (
            <div 
              className="text-white text-sm pointer-events-none"
              style={getLayoutStyle('speedStat')}
            >
              {sampleTexts.speedStat || `SPD: ${asset.stats.speed}`}
            </div>
          )}

          {elementPositions.skillStat && (
            <div 
              className="text-white text-sm pointer-events-none"
              style={getLayoutStyle('skillStat')}
            >
              {sampleTexts.skillStat || `SKL: ${asset.stats.skill}`}
            </div>
          )}

          {elementPositions.staminaStat && (
            <div 
              className="text-white text-sm pointer-events-none"
              style={getLayoutStyle('staminaStat')}
            >
              {sampleTexts.staminaStat || `STA: ${asset.stats.stamina}`}
            </div>
          )}

          {elementPositions.stealthStat && (
            <div 
              className="text-white text-sm pointer-events-none"
              style={getLayoutStyle('stealthStat')}
            >
              {sampleTexts.stealthStat || `STL: ${asset.stats.stealth}`}
            </div>
          )}

          {elementPositions.styleStat && (
            <div 
              className="text-white text-sm pointer-events-none"
              style={getLayoutStyle('styleStat')}
            >
              {sampleTexts.styleStat || `STY: ${asset.stats.style}`}
            </div>
          )}

          {/* Character Name */}
          {elementPositions.characterName && asset.character && (
            <div 
              className="text-white font-medium pointer-events-none"
              style={getLayoutStyle('characterName')}
            >
              {sampleTexts.characterName || asset.character}
            </div>
          )}

          {/* Banner Elements */}
          {elementPositions.topBanner && (
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center font-bold py-1 pointer-events-none"
              style={getLayoutStyle('topBanner')}
            >
              {sampleTexts.topBanner || 'NINJA PUNK GIRLS'}
            </div>
          )}

          {elementPositions.layerBanner && (
            <div 
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white text-center font-medium py-1 pointer-events-none"
              style={getLayoutStyle('layerBanner')}
            >
              {sampleTexts.layerBanner || canonicalLayerKey.replace(/_/g, ' ')}
            </div>
          )}

          {/* Stat Boxes */}
          {['statBox1', 'statBox2', 'statBox3', 'statBox4', 'statBox5', 'statBox6'].map(boxKey => {
            if (!elementPositions[boxKey as keyof typeof elementPositions]) return null;
            return (
              <div 
                key={boxKey}
                className="bg-gray-800 bg-opacity-80 border border-gray-600 rounded pointer-events-none"
                style={getLayoutStyle(boxKey)}
              >
                {sampleTexts[boxKey as keyof typeof sampleTexts] || 'Stat'}
              </div>
            );
          })}
        </>
      )}

      {/* Stats Display (only if no layout designer elements) */}
      {(!elementPositions || Object.keys(elementPositions).length === 0) && (
        <StatsDisplay stats={asset.stats} />
      )}

      {/* Hover Details */}
      {showDetails && (
        <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex flex-col justify-center items-center text-white text-center p-4">
          <div className="font-bold text-sm mb-2">{asset.name}</div>
          <div className="text-xs text-gray-300 mb-1">
            {canonicalLayerKey.replace(/_/g, ' ')}
          </div>
          {asset.filename && (
            <div className="text-xs text-gray-300 mb-1">
              #{asset.filename}
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
