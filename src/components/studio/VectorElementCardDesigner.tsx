'use client';

import React, { useState } from 'react';
import { useAssets } from '@/context/AssetContext';
import { AssetDetail } from '@/types';
import { LAYER_ORDER, LAYER_DETAILS } from '@/data/layer-config';
import VectorElementCardNew from '@/components/VectorElementCardNew';

interface VectorElementCardDesignerProps {
  className?: string;
  selectedSeriesId?: string | null;
}

export default function VectorElementCardDesigner({ className }: VectorElementCardDesignerProps) {
  const { availableAssets, isInitialized, assetLoadingProgress } = useAssets();
  const [selectedLayer, setSelectedLayer] = useState<string>('BODY_SKIN');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'grid'>('cards');
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [filters, setFilters] = useState({
    rarity: '',
    character: '',
    genes: '',
    search: ''
  });

  if (!isInitialized) {
    return (
      <div className={`${className} bg-gray-800 rounded-lg p-6`}>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Loading Vector Element Cards...</h3>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-pink-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${assetLoadingProgress}%` }}
            ></div>
          </div>
          <div className="text-center text-gray-400">
            Loading assets... {assetLoadingProgress}%
          </div>
        </div>
      </div>
    );
  }

  const layerOptions = Object.keys(LAYER_DETAILS).filter(layer => 
    !['BACKGROUND', 'GLOW', 'BANNER', 'DECALS', 'LOGO', 'COPYRIGHT', 'SCORES', 'TEAM', 'INTERFACE', 'EFFECTS'].includes(layer)
  );

  const selectedAssets = availableAssets[selectedLayer] || [];

  // Comprehensive filtering
  const filteredAssets = selectedAssets.filter(asset => {
    if (filters.rarity && asset.rarity?.toLowerCase() !== filters.rarity.toLowerCase()) return false;
    if (filters.character && asset.character?.toLowerCase() !== filters.character.toLowerCase()) return false;
    if (filters.genes && asset.genes?.toLowerCase() !== filters.genes.toLowerCase()) return false;
    if (filters.search && !asset.name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Get unique values for filter options
  const uniqueRarities = [...new Set(selectedAssets.map(asset => asset.rarity).filter(Boolean))];
  const uniqueCharacters = [...new Set(selectedAssets.map(asset => asset.character).filter(Boolean))];
  const uniqueGenes = [...new Set(selectedAssets.map(asset => asset.genes).filter(Boolean))];

  // Helper function for rarity colors
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

  const renderCards = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {filteredAssets.map((asset, index) => (
        <div key={`${asset.filename}-${index}`} className="flex justify-center">
          <VectorElementCardNew
            asset={asset}
            layerKey={selectedLayer}
            size={cardSize}
            showDetails={true}
          />
        </div>
      ))}
    </div>
  );

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
        <thead className="bg-gray-600">
          <tr>
            <th className="px-4 py-2 text-left text-white">Name</th>
            <th className="px-4 py-2 text-left text-white">Layer</th>
            <th className="px-4 py-2 text-left text-white">Rarity</th>
            <th className="px-4 py-2 text-left text-white">Character</th>
            <th className="px-4 py-2 text-left text-white">Genes</th>
          </tr>
        </thead>
        <tbody>
          {filteredAssets.map((asset, index) => (
            <tr key={`${asset.filename}-${index}`} className="border-b border-gray-600 hover:bg-gray-600">
              <td className="px-4 py-2 text-white">{asset.name}</td>
              <td className="px-4 py-2 text-gray-300">{selectedLayer}</td>
              <td className="px-4 py-2">
                {asset.rarity && (
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{ backgroundColor: getRarityColor(asset.rarity), color: 'white' }}
                  >
                    {asset.rarity}
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-gray-300">{asset.character || '-'}</td>
              <td className="px-4 py-2 text-gray-300">{asset.genes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
      {filteredAssets.map((asset, index) => (
        <div key={`${asset.filename}-${index}`} className="flex justify-center">
          <VectorElementCardNew
            asset={asset}
            layerKey={selectedLayer}
            size="small"
            showDetails={false}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className={`${className} bg-gray-800 rounded-lg p-6`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">Vector Element Cards Designer</h3>
        <p className="text-gray-300">
          Design and manage vector-based element cards. {filteredAssets.length} assets found for {selectedLayer}.
        </p>
      </div>

      {/* Controls */}
      <div className="bg-gray-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Layer Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">Layer</label>
            <select
              value={selectedLayer}
              onChange={(e) => setSelectedLayer(e.target.value)}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            >
              {layerOptions.map(layer => (
                <option key={layer} value={layer}>
                  {layer} ({availableAssets[layer]?.length || 0})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">View Mode</label>
            <div className="flex space-x-2">
              {(['cards', 'table', 'grid'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Card Size (for cards view) */}
          {viewMode === 'cards' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">Card Size</label>
              <div className="flex space-x-2">
                {(['small', 'medium', 'large'] as const).map(size => (
                  <button
                    key={size}
                    onClick={() => setCardSize(size)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      cardSize === size
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Search</label>
            <input
              type="text"
              placeholder="Search assets..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Rarity</label>
            <select
              value={filters.rarity}
              onChange={(e) => setFilters(prev => ({ ...prev, rarity: e.target.value }))}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            >
              <option value="">All Rarities</option>
              {uniqueRarities.map(rarity => (
                <option key={rarity} value={rarity}>{rarity}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Character</label>
            <select
              value={filters.character}
              onChange={(e) => setFilters(prev => ({ ...prev, character: e.target.value }))}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            >
              <option value="">All Characters</option>
              {uniqueCharacters.map(character => (
                <option key={character} value={character}>{character}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Genes</label>
            <select
              value={filters.genes}
              onChange={(e) => setFilters(prev => ({ ...prev, genes: e.target.value }))}
              className="w-full bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            >
              <option value="">All Genes</option>
              {uniqueGenes.map(genes => (
                <option key={genes} value={genes}>{genes}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.search || filters.rarity || filters.character || filters.genes) && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-gray-300">Active filters:</span>
            {Object.entries(filters).map(([key, value]) => 
              value && (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-600 text-white"
                >
                  {key}: {value}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, [key]: '' }))}
                    className="ml-1 hover:bg-pink-700 rounded-full w-4 h-4 flex items-center justify-center"
                  >
                    ×
                  </button>
                </span>
              )
            )}
            <button
              onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '' })}
              className="text-sm text-pink-400 hover:text-pink-300 underline"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {viewMode === 'cards' && renderCards()}
        {viewMode === 'table' && renderTable()}
        {viewMode === 'grid' && renderGrid()}
      </div>

      {/* Layer Overview */}
      <div className="mt-8 bg-gray-700 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Layer Overview</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {layerOptions.map(layer => (
            <div
              key={layer}
              onClick={() => setSelectedLayer(layer)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedLayer === layer
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              <div className="text-sm font-medium">{layer}</div>
              <div className="text-xs opacity-75">
                {availableAssets[layer]?.length || 0} assets
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
