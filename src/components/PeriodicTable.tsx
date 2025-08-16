'use client';

import React, { useState, useEffect } from 'react';
import VectorElementCard from './VectorElementCard';
import { AssetDetail } from '../app/api/asset-data/route';

// Asset interface to match API response
interface Asset {
  layer: string;
  filename: string;
  name: string;
  assetNumber: string;
  type?: string;
  character?: string;
  genes?: string;
  rarity?: string;
  stats?: {
    strength: number;
    speed: number;
    skill: number;
    stamina: number;
    stealth: number;
    style: number;
  };
}

// Color mapping for the 29 individual asset folders
const LAYER_COLORS: { [key: string]: string } = {
  // Frame/UI Elements (Pink/Magenta)
  'LOGO': '#FF69B4',           // 01-Logo
  'COPYRIGHT': '#FF1493',      // 02-Copyright
  'TEAM': '#FF69B4',          // 04-Team
  'INTERFACE': '#FFB6C1',     // 05-Interface
  
  // Effects/Background (Cyan/Teal)
  'EFFECTS': '#00FFFF',       // 06-Effects
  'DECALS': '#00CED1',        // 26-Decals
  'BANNER': '#48D1CC',        // 27-Banner
  'GLOW': '#AFEEEE',          // 28-Glow
  'BACKGROUND': '#87CEEB',    // 29-Background
  
  // Combat/Weapons (Red)
  'RIGHT_WEAPON': '#FF4500',  // 07-Right-Weapon
  'LEFT_WEAPON': '#DC143C',   // 08-Left-Weapon
  
  // Head Elements (Blue)
  'HORNS': '#4169E1',         // 09-Horns
  'HAIR': '#0000FF',          // 10-Hair
  'MASK': '#6495ED',          // 11-Mask
  'FACE': '#1E90FF',          // 18-Face
  'REAR_HORNS': '#4682B4',    // 23-Rear-Horns
  'REAR_HAIR': '#87CEFA',     // 24-Rear-Hair
  
  // Clothing (Green)
  'TOP': '#32CD32',           // 12-Top
  'BOOTS': '#228B22',         // 13-Boots
  'BRA': '#90EE90',           // 16-Bra
  'BOTTOM': '#98FB98',        // 17-Bottom
  'UNDERWEAR': '#00FF00',     // 19-Underwear
  
  // Accessories (Purple)
  'JEWELLERY': '#8A2BE2',     // 14-Jewellery
  'ACCESSORIES': '#9932CC',   // 15-Accessories
  
  // Body Parts (Orange)
  'ARMS': '#FF8C00',          // 20-Arms
  'BODY_SKIN': '#FFA500',     // 21-Body
  'BACK': '#FF7F50'           // 22-Back
};

// Layer to folder mapping - matches the actual folder structure
const LAYER_TO_FOLDER: { [key: string]: string } = {
  'LOGO': '01-Logo',
  'COPYRIGHT': '02-Copyright', 
  'TEAM': '04-Team',
  'INTERFACE': '05-Interface',
  'EFFECTS': '06-Effects',
  'RIGHT_WEAPON': '07-Right-Weapon',
  'LEFT_WEAPON': '08-Left-Weapon', 
  'HORNS': '09-Horns',
  'HAIR': '10-Hair',
  'MASK': '11-Mask',
  'TOP': '12-Top',
  'BOOTS': '13-Boots',
  'JEWELLERY': '14-Jewellery',
  'ACCESSORIES': '15-Accessories',
  'BRA': '16-Bra',
  'BOTTOM': '17-Bottom',
  'FACE': '18-Face',
  'UNDERWEAR': '19-Underwear',
  'ARMS': '20-Arms',
  'BODY_SKIN': '21-Body',
  'BACK': '22-Back',
  'REAR_HORNS': '23-Rear-Horns',
  'REAR_HAIR': '24-Rear-Hair',
  'DECALS': '26-Decals',
  'BANNER': '27-Banner',
  'GLOW': '28-Glow',
  'BACKGROUND': '29-Background'
};

// Helper function to get correct folder name from layer
const getLayerFolder = (layer: string): string => {
  return LAYER_TO_FOLDER[layer] || layer.toLowerCase().replace(/_/g, '-');
};

// Non-character element layers to exclude (same as main elements page)
const EXCLUDED_LAYERS = new Set([
  'LOGO', 'COPYRIGHT', 'TEAM', 'INTERFACE', 'EFFECTS', 
  'DECALS', 'BANNER', 'GLOW', 'BACKGROUND'
]);

// Organized structure with each asset class on its own row (character elements only)
const PYRAMID_STRUCTURE = [
  // Row 1: Right Weapon (07-Right-Weapon)
  { title: "07 - Right Weapon Class", elements: ['RIGHT_WEAPON'], layout: 'center' },
  
  // Row 2: Left Weapon (08-Left-Weapon)
  { title: "08 - Left Weapon Class", elements: ['LEFT_WEAPON'], layout: 'center' },
  
  // Row 3: Horns (09-Horns)
  { title: "09 - Horns Class", elements: ['HORNS'], layout: 'center' },
  
  // Row 4: Hair (10-Hair)
  { title: "10 - Hair Class", elements: ['HAIR'], layout: 'center' },
  
  // Row 5: Mask (11-Mask)
  { title: "11 - Mask Class", elements: ['MASK'], layout: 'center' },
  
  // Row 6: Top (12-Top)
  { title: "12 - Top Class", elements: ['TOP'], layout: 'center' },
  
  // Row 7: Boots (13-Boots)
  { title: "13 - Boots Class", elements: ['BOOTS'], layout: 'center' },
  
  // Row 8: Jewellery (14-Jewellery)
  { title: "14 - Jewellery Class", elements: ['JEWELLERY'], layout: 'center' },
  
  // Row 9: Accessories (15-Accessories)
  { title: "15 - Accessories Class", elements: ['ACCESSORIES'], layout: 'center' },
  
  // Row 10: Bra (16-Bra)
  { title: "16 - Bra Class", elements: ['BRA'], layout: 'center' },
  
  // Row 11: Bottom (17-Bottom)
  { title: "17 - Bottom Class", elements: ['BOTTOM'], layout: 'center' },
  
  // Row 12: Face (18-Face)
  { title: "18 - Face Class", elements: ['FACE'], layout: 'center' },
  
  // Row 13: Underwear (19-Underwear)
  { title: "19 - Underwear Class", elements: ['UNDERWEAR'], layout: 'center' },
  
  // Row 14: Arms (20-Arms)
  { title: "20 - Arms Class", elements: ['ARMS'], layout: 'center' },
  
  // Row 15: Body (21-Body)
  { title: "21 - Body Class", elements: ['BODY_SKIN'], layout: 'center' },
  
  // Row 16: Back (22-Back)
  { title: "22 - Back Class", elements: ['BACK'], layout: 'center' },
  
  // Row 17: Rear Horns (23-Rear-Horns)
  { title: "23 - Rear Horns Class", elements: ['REAR_HORNS'], layout: 'center' },
  
  // Row 18: Rear Hair (24-Rear-Hair)
  { title: "24 - Rear Hair Class", elements: ['REAR_HAIR'], layout: 'center' }
];

interface PeriodicTableProps {
  onElementClick?: (asset: Asset) => void;
  className?: string;
}

const PeriodicTable: React.FC<PeriodicTableProps> = ({ 
  onElementClick, 
  className = '' 
}) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Fetch assets from API
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/asset-data');
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Map AssetDetail objects from API to Asset objects expected by component
          // Filter out non-character elements
          const mappedAssets: Asset[] = data.data
            .filter((apiAsset: AssetDetail) => !EXCLUDED_LAYERS.has(apiAsset.layer))
            .map((apiAsset: AssetDetail) => ({
              layer: apiAsset.layer,
              filename: apiAsset.filename,
              name: apiAsset.name || 'Unknown',
              assetNumber: apiAsset.filename,
              type: apiAsset.layer,
              character: apiAsset.character,
              genes: apiAsset.genes,
              rarity: apiAsset.rarity,
              stats: apiAsset.stats
            }));
          setAssets(mappedAssets);
        }
      } catch (error) {
        console.error('Failed to fetch assets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  // Category filter options (character elements only)
  const categories = ['All', 'Combat', 'Head', 'Clothing', 'Accessory', 'Body'];
  
  // Filter assets based on search and category
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        asset.layer.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'All') return matchesSearch;
    
    // Map layers to categories (character elements only)
    const layerToCategory: { [key: string]: string } = {
      'RIGHT_WEAPON': 'Combat', 'LEFT_WEAPON': 'Combat',
      'HORNS': 'Head', 'HAIR': 'Head', 'MASK': 'Head', 'FACE': 'Head', 'REAR_HORNS': 'Head', 'REAR_HAIR': 'Head',
      'TOP': 'Clothing', 'BOOTS': 'Clothing', 'BRA': 'Clothing', 'BOTTOM': 'Clothing', 'UNDERWEAR': 'Clothing',
      'JEWELLERY': 'Accessory', 'ACCESSORIES': 'Accessory',
      'ARMS': 'Body', 'BODY_SKIN': 'Body', 'BACK': 'Body'
    };
    
    const matchesCategory = layerToCategory[asset.layer] === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group assets by layer
  const assetsByLayer = filteredAssets.reduce((acc, asset) => {
    if (!acc[asset.layer]) {
      acc[asset.layer] = [];
    }
    acc[asset.layer].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  // Get category colors
  const getCategoryColor = (layer: string) => {
    return LAYER_COLORS[layer as keyof typeof LAYER_COLORS] || '#808080';
  };

  const handleAssetClick = (asset: Asset) => {
    setSelectedAsset(asset);
    onElementClick?.(asset);
  };

  const closeModal = () => {
    setSelectedAsset(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-white">Loading NPG Periodic Table...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-pink-500 mb-2">
          The Periodic Table of NPG Character Elements
        </h1>
        <p className="text-xl text-gray-400">
          {filteredAssets.length} Character Assets (Interface/UI elements excluded)
        </p>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 justify-center items-center">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'All' ? 'All Classes' : `● ${category} Class`}
            </option>
          ))}
        </select>
      </div>

      {/* Class Legend */}
      <div className="flex flex-wrap justify-center gap-4 mb-8 text-sm">
        {[
          { category: 'Combat', hex: '#FF4500', assets: ['Right Weapon', 'Left Weapon'] },
          { category: 'Head', hex: '#4169E1', assets: ['Horns', 'Hair', 'Mask', 'Face', 'Rear Horns', 'Rear Hair'] },
          { category: 'Clothing', hex: '#32CD32', assets: ['Top', 'Boots', 'Bra', 'Bottom', 'Underwear'] },
          { category: 'Accessory', hex: '#8A2BE2', assets: ['Jewellery', 'Accessories'] },
          { category: 'Body', hex: '#FF8C00', assets: ['Arms', 'Body', 'Back'] }
        ].map(({ category, hex, assets }) => (
          <div key={category} className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: hex }}></div>
            <span className="text-gray-300">
              {category} Class ({assets.length} types)
            </span>
          </div>
        ))}
      </div>

      {/* Compact Row Structure */}
      <div className="space-y-2">
        {PYRAMID_STRUCTURE.map((row, rowIndex) => {
          // Get all assets for this row
          const rowAssets = row.elements.flatMap(layer => assetsByLayer[layer] || []);
          
          if (rowAssets.length === 0) return null;

          return (
            <div key={rowIndex} className="flex items-center gap-4">
              {/* Class Title on Left */}
              <div className="w-48 text-right flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-300">
                  {row.title.replace(/^\d+\s-\s/, '')} 
                </h3>
                <div className="text-xs text-gray-500">
                  ({rowAssets.length} elements)
                </div>
              </div>
              
              {/* Elements on Right */}
              <div className="flex flex-wrap gap-1 flex-1">
                {rowAssets.map((asset, index) => {
                  const color = getCategoryColor(asset.layer);
                  const atomicNumber = assets.indexOf(asset) + 1;
                  const elementSymbol = asset.name.substring(0, 2).toUpperCase();
                  
                  return (
                    <div
                      key={`${asset.layer}-${index}`}
                      onClick={() => handleAssetClick(asset)}
                      className="relative cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10 w-10 h-12 flex flex-col justify-center items-center text-center rounded shadow-lg hover:shadow-xl text-white text-[9px] leading-tight"
                      style={{
                        backgroundColor: color,
                        borderColor: color,
                        borderWidth: '1px',
                        filter: 'brightness(0.8)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.0)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'brightness(0.8)';
                      }}
                      title={`${asset.name} (${asset.layer})`}
                    >
                      {/* Atomic Number */}
                      <div className="absolute top-0 left-0 text-[7px] opacity-75 px-0.5">
                        {atomicNumber}
                      </div>
                      
                      {/* Element Symbol */}
                      <div className="font-bold text-xs">
                        {elementSymbol}
                      </div>
                      
                      {/* Asset Number */}
                      <div className="text-[7px] opacity-90">
                        {asset.assetNumber}
                      </div>
                      
                      {/* Layer indicator */}
                      <div className="absolute bottom-0 right-0 text-[6px] opacity-60 px-0.5">
                        {asset.layer.substring(0, 3)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Asset Details */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-pink-500">
                  {selectedAsset.name}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Asset Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Class:</span>
                    <span className="ml-2 text-white">{selectedAsset.layer}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Asset Number:</span>
                    <span className="ml-2 text-white">{selectedAsset.assetNumber}</span>
                  </div>
                  {selectedAsset.type && (
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <span className="ml-2 text-white">{selectedAsset.type}</span>
                    </div>
                  )}
                  {selectedAsset.character && (
                    <div>
                      <span className="text-gray-400">Character:</span>
                      <span className="ml-2 text-white">{selectedAsset.character}</span>
                    </div>
                  )}
                  {selectedAsset.rarity && (
                    <div>
                      <span className="text-gray-400">Rarity:</span>
                      <span className="ml-2 text-white">{selectedAsset.rarity}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                {selectedAsset.stats && (
                  <div>
                    <h3 className="text-lg font-semibold text-pink-400 mb-2">Stats</h3>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>Strength: {selectedAsset.stats.strength}</div>
                      <div>Speed: {selectedAsset.stats.speed}</div>
                      <div>Skill: {selectedAsset.stats.skill}</div>
                      <div>Stamina: {selectedAsset.stats.stamina}</div>
                      <div>Stealth: {selectedAsset.stats.stealth}</div>
                      <div>Style: {selectedAsset.stats.style}</div>
                    </div>
                  </div>
                )}

                {/* Asset Preview */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-pink-400 mb-4">Asset Preview</h3>
                  
                  {/* Element Tile Preview */}
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-300 mb-2">Element Tile</h4>
                    <div className="flex justify-center">
                      <div
                        className="relative w-24 h-28 flex flex-col justify-center items-center text-center rounded shadow-lg text-white"
                        style={{
                          backgroundColor: getCategoryColor(selectedAsset.layer),
                          borderColor: getCategoryColor(selectedAsset.layer),
                          borderWidth: '2px',
                        }}
                      >
                        {/* Atomic Number */}
                        <div className="absolute top-1 left-1 text-xs opacity-75">
                          {assets.indexOf(selectedAsset) + 1}
                        </div>
                        
                        {/* Element Symbol */}
                        <div className="font-bold text-lg">
                          {selectedAsset.name.substring(0, 2).toUpperCase()}
                        </div>
                        
                        {/* Asset Number */}
                        <div className="text-xs opacity-90">
                          {selectedAsset.assetNumber}
                        </div>
                        
                        {/* Layer indicator */}
                        <div className="absolute bottom-1 right-1 text-[8px] opacity-60">
                          {selectedAsset.layer.substring(0, 3)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actual Asset Image */}
                  <div className="mb-4">
                    <h4 className="text-md font-semibold text-gray-300 mb-2">Asset Image (961×1441)</h4>
                    <div className="flex justify-center">
                      <div 
                        className="rounded-lg p-3 relative" 
                        style={{ 
                          backgroundColor: `${getCategoryColor(selectedAsset.layer)}40`,
                          maxWidth: '320px'
                        }}
                      >
                        <div className="bg-white bg-opacity-10 rounded p-2">
                          {/* Asset container with correct 961:1441 aspect ratio */}
                          <div 
                            className="relative w-full rounded overflow-hidden"
                            style={{ 
                              aspectRatio: '961 / 1441',
                              maxWidth: '280px',
                              maxHeight: '420px'
                            }}
                          >
                            <img
                              src={`/assets/${getLayerFolder(selectedAsset.layer)}/${selectedAsset.filename}`}
                              alt={selectedAsset.name}
                              className="w-full h-full object-contain"
                              style={{
                                imageRendering: 'crisp-edges'
                              }}
                              onError={(e) => {
                                console.error(`Failed to load image: /assets/${getLayerFolder(selectedAsset.layer)}/${selectedAsset.filename}`);
                                e.currentTarget.style.display = 'none';
                                const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                                if (errorDiv) errorDiv.style.display = 'block';
                              }}
                            />
                            <div className="text-red-400 text-sm mt-2 hidden">
                              Failed to load: /assets/{getLayerFolder(selectedAsset.layer)}/{selectedAsset.filename}
                            </div>
                          </div>
                          
                          {/* Image info */}
                          <div className="mt-2 text-xs text-gray-400 text-center">
                            Original: 961×1441 pixels • Aspect ratio: 2:3
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeriodicTable;