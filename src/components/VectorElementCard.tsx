'use client';

import React from 'react';

// Define the element data structure for the periodic table
interface ElementCardData {
  symbol: string;        // Short symbol (e.g., "RW" for Right Weapon)
  name: string;          // Full name (e.g., "Right Weapon")
  atomicNumber: string;  // Layer number (e.g., "07")
  category: string;      // Element category (e.g., "Weapon", "Body", "Accessory")
  gradient: {
    from: string;        // Starting color
    to: string;          // Ending color
    direction?: string;  // Gradient direction (default: "to bottom right")
  };
}

// Comprehensive periodic table element definitions (all 26+ asset categories)
export const ELEMENT_CARDS: Record<string, ElementCardData> = {
  // Frame/Meta elements (Pink/Magenta family) - Static overlays
  'LOGO': {
    symbol: 'Lo',
    name: 'Logo',
    atomicNumber: '01',
    category: 'Frame',
    gradient: { from: '#ec4899', to: '#db2777', direction: 'to bottom right' }
  },
  'COPYRIGHT': {
    symbol: 'Cp',
    name: 'Copyright',
    atomicNumber: '02',
    category: 'Frame',
    gradient: { from: '#f472b6', to: '#ec4899', direction: 'to bottom right' }
  },
  'TEAM': {
    symbol: 'Te',
    name: 'Team',
    atomicNumber: '04',
    category: 'Frame',
    gradient: { from: '#db2777', to: '#be185d', direction: 'to bottom right' }
  },
  'INTERFACE': {
    symbol: 'If',
    name: 'Interface',
    atomicNumber: '05',
    category: 'Frame',
    gradient: { from: '#be185d', to: '#9d174d', direction: 'to bottom right' }
  },

  // Effects (Cyan/Teal family) - Visual enhancements
  'EFFECTS': {
    symbol: 'Ef',
    name: 'Effects',
    atomicNumber: '06',
    category: 'Effects',
    gradient: { from: '#06b6d4', to: '#0891b2', direction: 'to bottom right' }
  },
  'DECALS': {
    symbol: 'De',
    name: 'Decals',
    atomicNumber: '26',
    category: 'Effects',
    gradient: { from: '#0e7490', to: '#155e75', direction: 'to bottom right' }
  },
  'BANNER': {
    symbol: 'Bn',
    name: 'Banner',
    atomicNumber: '27',
    category: 'Effects',
    gradient: { from: '#0891b2', to: '#0e7490', direction: 'to bottom right' }
  },
  'GLOW': {
    symbol: 'Gl',
    name: 'Glow',
    atomicNumber: '28',
    category: 'Effects',
    gradient: { from: '#22d3ee', to: '#06b6d4', direction: 'to bottom right' }
  },
  'BACKGROUND': {
    symbol: 'Bg',
    name: 'Background',
    atomicNumber: '29',
    category: 'Effects',
    gradient: { from: '#155e75', to: '#164e63', direction: 'to bottom right' }
  },

  // Combat (Red family) - Weapons
  'RIGHT_WEAPON': {
    symbol: 'Rw',
    name: 'Right Weapon',
    atomicNumber: '07',
    category: 'Combat',
    gradient: { from: '#ef4444', to: '#dc2626', direction: 'to bottom right' }
  },
  'LEFT_WEAPON': {
    symbol: 'Lw',
    name: 'Left Weapon', 
    atomicNumber: '08',
    category: 'Combat',
    gradient: { from: '#f87171', to: '#ef4444', direction: 'to bottom right' }
  },
  
  // Head/Face (Blue family) - Cranial features
  'HORNS': {
    symbol: 'Hr',
    name: 'Horns',
    atomicNumber: '09', 
    category: 'Head',
    gradient: { from: '#3b82f6', to: '#1d4ed8', direction: 'to bottom right' }
  },
  'HAIR': {
    symbol: 'Ha',
    name: 'Hair',
    atomicNumber: '10',
    category: 'Head', 
    gradient: { from: '#6366f1', to: '#4338ca', direction: 'to bottom right' }
  },
  'MASK': {
    symbol: 'Mk',
    name: 'Mask',
    atomicNumber: '11',
    category: 'Head',
    gradient: { from: '#06b6d4', to: '#0891b2', direction: 'to bottom right' }
  },
  'FACE': {
    symbol: 'Fc',
    name: 'Face',
    atomicNumber: '18',
    category: 'Head',
    gradient: { from: '#0ea5e9', to: '#0284c7', direction: 'to bottom right' }
  },
  'REAR_HORNS': {
    symbol: 'Rh',
    name: 'Rear Horns',
    atomicNumber: '23',
    category: 'Head',
    gradient: { from: '#1e3a8a', to: '#172554', direction: 'to bottom right' }
  },
  'REAR_HAIR': {
    symbol: 'Ra',
    name: 'Rear Hair',
    atomicNumber: '24',
    category: 'Head',
    gradient: { from: '#8b5cf6', to: '#7c3aed', direction: 'to bottom right' }
  },

  // Clothing (Green family) - Garments
  'TOP': {
    symbol: 'Tp',
    name: 'Top',
    atomicNumber: '12',
    category: 'Clothing',
    gradient: { from: '#10b981', to: '#059669', direction: 'to bottom right' }
  },
  'BOOTS': {
    symbol: 'Bo',
    name: 'Boots',
    atomicNumber: '13',
    category: 'Clothing',
    gradient: { from: '#166534', to: '#14532d', direction: 'to bottom right' }
  },
  'BRA': {
    symbol: 'Br',
    name: 'Bra',
    atomicNumber: '16',
    category: 'Clothing',
    gradient: { from: '#4ade80', to: '#22c55e', direction: 'to bottom right' }
  },
  'BOTTOM': {
    symbol: 'Bt',
    name: 'Bottom',
    atomicNumber: '17',
    category: 'Clothing',
    gradient: { from: '#22c55e', to: '#16a34a', direction: 'to bottom right' }
  },
  'UNDERWEAR': {
    symbol: 'Uw',
    name: 'Underwear',
    atomicNumber: '19',
    category: 'Clothing',
    gradient: { from: '#15803d', to: '#166534', direction: 'to bottom right' }
  },

  // Accessories (Purple family) - Decorative items
  'JEWELLERY': {
    symbol: 'Je',
    name: 'Jewellery',
    atomicNumber: '14',
    category: 'Accessory',
    gradient: { from: '#9333ea', to: '#7c3aed', direction: 'to bottom right' }
  },
  'ACCESSORIES': {
    symbol: 'Ac',
    name: 'Accessories',
    atomicNumber: '15',
    category: 'Accessory',
    gradient: { from: '#a855f7', to: '#9333ea', direction: 'to bottom right' }
  },

  // Body (Orange family) - Physical form
  'ARMS': {
    symbol: 'Ar',
    name: 'Arms',
    atomicNumber: '20',
    category: 'Body',
    gradient: { from: '#f59e0b', to: '#d97706', direction: 'to bottom right' }
  },
  'BODY': {
    symbol: 'By',
    name: 'Body',
    atomicNumber: '21',
    category: 'Body',
    gradient: { from: '#f97316', to: '#ea580c', direction: 'to bottom right' }
  },
  'BACK': {
    symbol: 'Bk',
    name: 'Back',
    atomicNumber: '22',
    category: 'Body',
    gradient: { from: '#fb923c', to: '#f97316', direction: 'to bottom right' }
  }
};

interface VectorElementCardProps {
  elementKey: string;
  width?: number;
  height?: number;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  variant?: 'default' | 'compact' | 'large';
}

export const VectorElementCard: React.FC<VectorElementCardProps> = ({
  elementKey,
  width = 200,
  height = 300,
  className = '',
  onClick,
  onMouseEnter,
  onMouseLeave,
  variant = 'default'
}) => {
  const element = ELEMENT_CARDS[elementKey];
  
  if (!element) {
    // Fallback for unknown elements
    console.warn(`Unknown element key: ${elementKey}`);
    return (
      <div 
        className={`bg-gray-600 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height }}
        onClick={onClick}
      >
        <span className="text-white text-sm">Unknown Element</span>
      </div>
    );
  }

  const gradientId = `gradient-${elementKey}`;
  const { gradient } = element;

  // Determine text sizes based on variant
  const getTextSizes = () => {
    switch (variant) {
      case 'compact':
        return { symbol: '24px', number: '12px', name: '10px', category: '8px' };
      case 'large':
        return { symbol: '36px', number: '16px', name: '14px', category: '12px' };
      default:
        return { symbol: '28px', number: '14px', name: '12px', category: '10px' };
    }
  };

  const textSizes = getTextSizes();

  return (
    <div 
      className={`${className}`} 
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <svg 
        width={width} 
        height={height} 
        viewBox={`0 0 ${width} ${height}`}
        className="rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
      >
        <defs>
          <linearGradient 
            id={gradientId} 
            x1="0%" 
            y1="0%" 
            x2="100%" 
            y2="100%"
          >
            <stop offset="0%" stopColor={gradient.from} />
            <stop offset="100%" stopColor={gradient.to} />
          </linearGradient>
          
          {/* Subtle overlay gradient for depth */}
          <linearGradient id={`overlay-${elementKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.1)" />
          </linearGradient>
        </defs>
        
        {/* Main card background */}
        <rect 
          width="100%" 
          height="100%" 
          fill={`url(#${gradientId})`} 
          rx="8" 
          ry="8"
        />
        
        {/* Overlay for depth */}
        <rect 
          width="100%" 
          height="100%" 
          fill={`url(#overlay-${elementKey})`} 
          rx="8" 
          ry="8"
        />
        
        {/* Border */}
        <rect 
          width="100%" 
          height="100%" 
          fill="none" 
          stroke="rgba(255,255,255,0.2)" 
          strokeWidth="1" 
          rx="8" 
          ry="8"
        />
        
        {/* Atomic number (top-left) */}
        <text 
          x="10" 
          y="25" 
          fill="rgba(255,255,255,0.8)" 
          fontSize={textSizes.number}
          fontFamily="monospace"
          fontWeight="bold"
        >
          {element.atomicNumber}
        </text>
        
        {/* Element symbol (center) */}
        <text 
          x="50%" 
          y="50%" 
          textAnchor="middle" 
          dominantBaseline="middle"
          fill="white" 
          fontSize={textSizes.symbol}
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
        >
          {element.symbol}
        </text>
        
        {/* Element name (bottom) */}
        <text 
          x="50%" 
          y={height - 30} 
          textAnchor="middle" 
          fill="rgba(255,255,255,0.9)" 
          fontSize={textSizes.name}
          fontFamily="Arial, sans-serif"
          fontWeight="500"
        >
          {element.name}
        </text>
        
        {/* Category (bottom) */}
        <text 
          x="50%" 
          y={height - 15} 
          textAnchor="middle" 
          fill="rgba(255,255,255,0.7)" 
          fontSize={textSizes.category}
          fontFamily="Arial, sans-serif"
          fontStyle="italic"
        >
          {element.category}
        </text>
        
        {/* Hover effect overlay */}
        <rect 
          width="100%" 
          height="100%" 
          fill="rgba(255,255,255,0)" 
          className="hover:fill-[rgba(255,255,255,0.1)] transition-all duration-200" 
          rx="8" 
          ry="8"
        />
      </svg>
    </div>
  );
};

export default VectorElementCard; 