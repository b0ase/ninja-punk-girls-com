'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHandCashWallet } from '@/context/HandCashWalletContext';
import { useNFTStore } from '@/context/NFTStoreContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { type NFTType, type StatsType, type NFTAttribute, type AssetDetail } from '@/types';
import { useAssets } from '@/context/AssetContext';
import { LAYER_ORDER, EXCLUDED_LAYERS, LAYER_DETAILS } from '@/data/layer-config';
import { JAPANESE_NAMES } from '@/data/japanese-names';
import { EROBOT_NAMES } from '@/data/erobot-names';
import { INTERFACE_CONFIG, type InterfaceDetail } from '@/data/interface-config';

// Constants for preview canvas
const CANVAS_WIDTH = 961;
const CANVAS_HEIGHT = 1441;

// Helper to create empty stats
const createEmptyStats = (): StatsType => ({
  strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0
});

// Helper Type for Combined Item List
interface SelectedItemDetail {
  id: string; // Unique key (filename or type)
  displayName: string;
  type: string; // Layer key or static type ('Interface', 'Team', 'Logo')
  stats: StatsType | null; // Stats object or null
  cost: number; // Individual item cost
}

// Define Shared Layers - These layers are available regardless of character type filter
const SHARED_LAYERS = new Set([
  'BACKGROUND', 
  'INTERFACE', 
  'TEAM', 
  'LOGO', 
  'GLOW', 
  'BANNER', 
  'DECALS', 
  'EFFECTS'
]);

export default function ForgePage() {
  return (
    <ErrorBoundary>
      <ForgePageContent />
    </ErrorBoundary>
  );
}

function ForgePageContent(): JSX.Element {
  const { isConnected, wallet } = useHandCashWallet();
  const { listNFT } = useNFTStore();
  const { availableAssets, isInitialized, assetLoadingProgress } = useAssets();

  // Character Type Selection
  type CharacterType = 'all' | 'erobot' | 'ninjapunk';
  const [selectedCharacterType, setSelectedCharacterType] = useState<CharacterType>('all');

  // Interface and Static Asset Selection
  const [selectedInterface, setSelectedInterface] = useState<string | null>(
    INTERFACE_CONFIG.length > 0 ? INTERFACE_CONFIG[0].filename : null
  );
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);

  // Asset Selection State
  const [selectedAssets, setSelectedAssets] = useState<Record<string, AssetDetail>>({});
  const [customNftName, setCustomNftName] = useState<string>('');
  const [mintingStatus, setMintingStatus] = useState<'idle' | 'paying' | 'generating'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Preview State
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  // Layer Groupings for UI Organization
  const BODY_LAYERS = ['BODY_SKIN', 'FACE', 'HAIR', 'REAR_HAIR', 'ARMS'];
  const OUTFIT_LAYERS = ['TOP', 'BOTTOM', 'BRA', 'UNDERWEAR', 'BOOTS', 'BACK'];
  const WEAPON_LAYERS = ['LEFT_WEAPON', 'RIGHT_WEAPON'];
  const ACCESSORY_LAYERS = ['HORNS', 'REAR_HORNS', 'MASK', 'JEWELLERY', 'ACCESSORIES'];
  const FX_LAYERS = ['BACKGROUND', 'GLOW', 'BANNER', 'DECALS', 'EFFECTS'];

  // Filter valid layers
  const filterValidLayers = (layers: string[]) => layers.filter(key => LAYER_DETAILS[key]);

  const bodyLayers = filterValidLayers(BODY_LAYERS);
  const outfitLayers = filterValidLayers(OUTFIT_LAYERS);
  const weaponLayers = filterValidLayers(WEAPON_LAYERS);
  const accessoryLayers = filterValidLayers(ACCESSORY_LAYERS);
  const fxLayers = filterValidLayers(FX_LAYERS);

  // Memoized Filtered Assets
  const filteredAssets = useMemo(() => {
    if (selectedCharacterType === 'all') {
      return availableAssets;
    }
    
    const filterString = selectedCharacterType === 'erobot' ? 'Erobot' : 'NPG';
    const filtered: typeof availableAssets = {};
    
    Object.entries(availableAssets).forEach(([layer, assets]) => {
      if (SHARED_LAYERS.has(layer)) {
        filtered[layer] = assets;
      } else {
        filtered[layer] = assets.filter(asset => 
          asset.filename.includes(filterString) || 
          asset.character === filterString ||
          asset.team === filterString
        );
      }
    });
    
    return filtered;
  }, [availableAssets, selectedCharacterType]);

  // Combined Selected Items for Display
  const combinedSelectedItems = useMemo(() => {
    const items: SelectedItemDetail[] = [];
    
    // Add interface
    if (selectedInterface) {
      items.push({
        id: 'interface',
        displayName: `Interface: ${selectedInterface}`,
        type: 'Interface',
        stats: null,
        cost: 0.001
      });
    }

    // Add team
    if (selectedTeam) {
      items.push({
        id: 'team',
        displayName: `Team: ${selectedTeam}`,
        type: 'Team',
        stats: null,
        cost: 0.001
      });
    }

    // Add logo
    if (selectedLogo) {
      items.push({
        id: 'logo',
        displayName: `Logo: ${selectedLogo}`,
        type: 'Logo',
        stats: null,
        cost: 0.001
      });
    }

    // Add selected assets
    Object.entries(selectedAssets).forEach(([layer, asset]) => {
      items.push({
        id: asset.filename,
        displayName: `${layer}: ${asset.name}`,
        type: layer,
        stats: asset.stats,
        cost: 0.001
      });
    });

    return items;
  }, [selectedInterface, selectedTeam, selectedLogo, selectedAssets]);

  // Calculate Total Cost
  const totalCalculatedCost = useMemo(() => {
    return combinedSelectedItems.reduce((total, item) => total + item.cost, 0);
  }, [combinedSelectedItems]);

  // Calculate Combined Stats
  const calculatedStats = useMemo(() => {
    const stats = createEmptyStats();
    
    combinedSelectedItems.forEach(item => {
      if (item.stats) {
        stats.strength += item.stats.strength;
        stats.speed += item.stats.speed;
        stats.skill += item.stats.skill;
        stats.stamina += item.stats.stamina;
        stats.stealth += item.stats.stealth;
        stats.style += item.stats.style;
      }
    });
    
    return stats;
  }, [combinedSelectedItems]);

  // Filter Character Names
  const filteredCharacterNames = useMemo(() => {
    if (selectedCharacterType === 'all') {
      return [...JAPANESE_NAMES, ...EROBOT_NAMES];
    } else if (selectedCharacterType === 'ninjapunk') {
      return JAPANESE_NAMES;
    } else {
      return EROBOT_NAMES;
    }
  }, [selectedCharacterType]);

  // Get Name Placeholder Text
  const getNamePlaceholderText = () => {
    if (selectedCharacterType === 'all') return 'Select Character Type First';
    if (selectedCharacterType === 'ninjapunk') return 'Select Ninja Punk Girl Name';
    return 'Select Erobot Name';
  };

  // Asset Selection Handlers
  const handleAssetSelect = useCallback((layer: string, asset: AssetDetail) => {
    setSelectedAssets(prev => ({
      ...prev,
      [layer]: asset
    }));
  }, []);

  const handleAssetDeselect = useCallback((layer: string) => {
    setSelectedAssets(prev => {
      const newSelection = { ...prev };
      delete newSelection[layer];
      return newSelection;
    });
  }, []);

  // Generate Preview
  const generatePreview = useCallback(async () => {
    if (Object.keys(selectedAssets).length === 0) {
      setError('Please select at least one asset to generate preview');
      return;
    }

    setIsPreviewLoading(true);
    setError(null);

    try {
      // For now, we'll use a placeholder preview
      // In a real implementation, this would call an API to generate the composite image
      setTimeout(() => {
        setPreviewImageUrl('/placeholder-preview.png');
        setIsPreviewLoading(false);
      }, 1000);
    } catch (error) {
      setError('Failed to generate preview');
      setIsPreviewLoading(false);
    }
  }, [selectedAssets]);

  // Mint Custom NFT
  const handleMintCustom = useCallback(async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!customNftName) {
      setError('Please enter a character name');
      return;
    }

    if (Object.keys(selectedAssets).length === 0) {
      setError('Please select at least one asset');
      return;
    }

    setMintingStatus('generating');
    setError(null);

    try {
      // Create NFT data structure
      const nftData: NFTType = {
        number: Date.now(), // Use timestamp as number
        name: customNftName,
        team: selectedCharacterType === 'ninjapunk' ? 'Ninja Punk Girls' : 'Erobots',
        series: 'Custom Series',
        totalSupply: 1,
        attributes: Object.entries(selectedAssets).map(([layer, asset]) => ({
          layer: layer,
          name: asset.name,
          asset: asset.filename,
          stats: asset.stats,
          metadata: {
            elementName: asset.name,
            characterName: customNftName,
            genes: asset.genes || 'Unknown',
            rarity: asset.rarity || 'Common',
            hasRGB: false
          }
        } as NFTAttribute)),
        stats: calculatedStats,
        qrData: `custom-${Date.now()}`,
        image: previewImageUrl || ''
      };

      // Add to NFT store with a default price
      await listNFT(nftData, 0.001);
      
      setMintingStatus('idle');
      // Reset form
      setSelectedAssets({});
      setCustomNftName('');
      setPreviewImageUrl(null);
      
    } catch (error: any) {
      setError(error.message || 'Failed to mint NFT');
      setMintingStatus('idle');
    }
  }, [isConnected, customNftName, selectedAssets, selectedCharacterType, previewImageUrl, calculatedStats, totalCalculatedCost, listNFT]);

  // Loading State
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⚡ Forging Assets...</div>
          <div className="w-64 bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${assetLoadingProgress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-400">{assetLoadingProgress}%</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            🏭 NFT Forge
          </h1>
          <p className="text-gray-300 mt-2">
            Build your custom Ninja Punk Girls and Erobot characters
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Asset Selection */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Character Type Filter */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-400 mb-4">Character Type</h2>
              <div className="flex space-x-4">
                {(['all', 'ninjapunk', 'erobot'] as CharacterType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedCharacterType(type)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCharacterType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {type === 'all' ? 'Mix' : type === 'ninjapunk' ? 'Ninja Punk Girls' : 'Erobots'}
                  </button>
                ))}
              </div>
            </div>

            {/* Interface Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">Interface Template</h2>
              <select
                value={selectedInterface || ''}
                onChange={(e) => setSelectedInterface(e.target.value || null)}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select Interface Template</option>
                {INTERFACE_CONFIG.map(interfaceFile => (
                  <option key={interfaceFile.filename} value={interfaceFile.filename}>
                    {interfaceFile.name} - {interfaceFile.filename}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Selection by Layer Groups */}
            <div className="space-y-6">
              
              {/* Body Layers */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-400 mb-4">Body & Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {bodyLayers.map(layer => (
                    <AssetSelector
                      key={layer}
                      layer={layer}
                      assets={filteredAssets[layer] || []}
                      selectedAsset={selectedAssets[layer]}
                      onSelect={(asset) => handleAssetSelect(layer, asset)}
                      onDeselect={() => handleAssetDeselect(layer)}
                    />
                  ))}
                </div>
              </div>

              {/* Outfit Layers */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-pink-400 mb-4">Outfit & Clothing</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {outfitLayers.map(layer => (
                    <AssetSelector
                      key={layer}
                      layer={layer}
                      assets={filteredAssets[layer] || []}
                      selectedAsset={selectedAssets[layer]}
                      onSelect={(asset) => handleAssetSelect(layer, asset)}
                      onDeselect={() => handleAssetDeselect(layer)}
                    />
                  ))}
                </div>
              </div>

              {/* Weapon Layers */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Weapons & Gear</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {weaponLayers.map(layer => (
                    <AssetSelector
                      key={layer}
                      layer={layer}
                      assets={filteredAssets[layer] || []}
                      selectedAsset={selectedAssets[layer]}
                      onSelect={(asset) => handleAssetSelect(layer, asset)}
                      onDeselect={() => handleAssetDeselect(layer)}
                    />
                  ))}
                </div>
              </div>

              {/* Accessory Layers */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-4">Accessories & Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {accessoryLayers.map(layer => (
                    <AssetSelector
                      key={layer}
                      layer={layer}
                      assets={filteredAssets[layer] || []}
                      selectedAsset={selectedAssets[layer]}
                      onSelect={(asset) => handleAssetSelect(layer, asset)}
                      onDeselect={() => handleAssetDeselect(layer)}
                    />
                  ))}
                </div>
              </div>

              {/* FX Layers */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-cyan-400 mb-4">Effects & Background</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fxLayers.map(layer => (
                    <AssetSelector
                      key={layer}
                      layer={layer}
                      assets={filteredAssets[layer] || []}
                      selectedAsset={selectedAssets[layer]}
                      onSelect={(asset) => handleAssetSelect(layer, asset)}
                      onDeselect={() => handleAssetDeselect(layer)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Preview & Mint */}
          <div className="space-y-6">
            
            {/* Character Name & Mint Button */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="space-y-4">
                {/* Name Selection */}
                <div>
                  <label htmlFor="nftNameSelect" className="block text-sm font-medium text-pink-400 mb-2">
                    Character Name:
                  </label>
                  <select 
                    id="nftNameSelect"
                    value={customNftName}
                    onChange={(e) => setCustomNftName(e.target.value)}
                    className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                  >
                    <option value="" disabled>{getNamePlaceholderText()}</option> 
                    {filteredCharacterNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                {/* Mint Button */}
                <button 
                  onClick={handleMintCustom}
                  disabled={mintingStatus !== 'idle' || !isConnected}
                  className={`w-full px-6 py-3 rounded-lg font-semibold text-lg transition-colors ${
                    !isConnected 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : mintingStatus !== 'idle' 
                        ? 'bg-yellow-600 text-yellow-100 cursor-wait' 
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white'
                  }`}
                >
                  {!isConnected ? 'Connect Wallet' 
                    : mintingStatus === 'generating' ? 'Generating...' 
                    : totalCalculatedCost > 0 ? `Mint (${totalCalculatedCost.toFixed(3)} BSV)`
                    : 'Mint Custom NFT'
                  }
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-400 mb-4">Preview</h3>
              <div className="w-full max-w-[300px] aspect-[961/1441] bg-gray-700 rounded-lg flex items-center justify-center relative mx-auto">
                {isPreviewLoading ? (
                  <div className="text-gray-400">Generating Preview...</div>
                ) : previewImageUrl ? (
                  <img src={previewImageUrl} alt="NFT Preview" className="object-contain w-full h-full rounded-lg"/>
                ) : (
                  <div className="text-gray-500 text-center px-4">
                    Select assets to generate preview
                  </div>
                )}
              </div>
              <button
                onClick={generatePreview}
                disabled={Object.keys(selectedAssets).length === 0}
                className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Generate Preview
              </button>
            </div>

            {/* Stats & Details */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4">Character Stats</h3>
              
              {/* Calculated Stats */}
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Calculated Stats:</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="text-blue-400 font-semibold">STR</div>
                    <div className="text-white">{calculatedStats.strength}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 font-semibold">SPD</div>
                    <div className="text-white">{calculatedStats.speed}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-purple-400 font-semibold">SKL</div>
                    <div className="text-white">{calculatedStats.skill}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-semibold">STA</div>
                    <div className="text-white">{calculatedStats.stamina}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-semibold">STL</div>
                    <div className="text-white">{calculatedStats.stealth}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-pink-400 font-semibold">STY</div>
                    <div className="text-white">{calculatedStats.style}</div>
                  </div>
                </div>
              </div>

              {/* Selected Items */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Selected Items ({combinedSelectedItems.length}):</h4>
                {combinedSelectedItems.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {combinedSelectedItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300 truncate">{item.displayName}</span>
                        <span className="text-blue-400 font-mono">{item.cost.toFixed(3)} BSV</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No items selected</p>
                )}
              </div>

              {/* Total Cost */}
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-white">Total Cost:</span>
                  <span className="text-2xl font-bold text-green-400">{totalCalculatedCost.toFixed(3)} BSV</span>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Asset Selector Component
interface AssetSelectorProps {
  layer: string;
  assets: AssetDetail[];
  selectedAsset: AssetDetail | undefined;
  onSelect: (asset: AssetDetail) => void;
  onDeselect: () => void;
}

function AssetSelector({ layer, assets, selectedAsset, onSelect, onDeselect }: AssetSelectorProps) {
  if (assets.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        {LAYER_DETAILS[layer]?.number || ''} {layer.replace(/_/g, ' ')}
      </label>
      
      <select
        value={selectedAsset?.filename || ''}
        onChange={(e) => {
          if (e.target.value) {
            const asset = assets.find(a => a.filename === e.target.value);
            if (asset) onSelect(asset);
          } else {
            onDeselect();
          }
        }}
        className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
      >
        <option value="">None</option>
        {assets.map(asset => (
          <option key={asset.filename} value={asset.filename}>
            {asset.name} ({asset.rarity || 'Common'})
          </option>
        ))}
      </select>
      
      {selectedAsset && (
        <div className="text-xs text-gray-400">
          <div>Rarity: {selectedAsset.rarity || 'Common'}</div>
          <div>Stats: STR {selectedAsset.stats.strength} SPD {selectedAsset.stats.speed} SKL {selectedAsset.stats.skill}</div>
        </div>
      )}
    </div>
  );
}
