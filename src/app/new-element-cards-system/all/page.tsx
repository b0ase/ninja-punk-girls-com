'use client';

import React, { useState, useEffect } from 'react';
import { useAssets } from '@/context/AssetContext';
import { AssetDetail } from '@/types';
import VectorElementCardNew from '@/components/VectorElementCardNew';

export default function AllElementCardsPage() {
  const { availableAssets, isInitialized, assetLoadingProgress } = useAssets();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [filters, setFilters] = useState({
    rarity: '',
    character: '',
    genes: '',
    search: '',
    layer: ''
  });

  // Get all assets from all layers
  const getAllAssets = (): AssetDetail[] => {
    if (!availableAssets) return [];
    
    const allAssets: AssetDetail[] = [];
    Object.entries(availableAssets).forEach(([layerKey, assets]) => {
      if (Array.isArray(assets)) {
        assets.forEach(asset => {
          allAssets.push({
            ...asset,
            layerKey // Add layer key to each asset for reference
          });
        });
      }
    });
    return allAssets;
  };

  const allAssets = getAllAssets();
  
  // Get unique values for filter options
  const uniqueRarities = [...new Set(allAssets.map(asset => asset.rarity).filter((rarity): rarity is string => Boolean(rarity)))];
  const uniqueCharacters = [...new Set(allAssets.map(asset => asset.character).filter((character): character is string => Boolean(character)))];
  const uniqueGenes = [...new Set(allAssets.map(asset => asset.genes).filter((genes): genes is string => Boolean(genes)))];
  const uniqueLayers = Object.keys(availableAssets || {});

  // Apply filters
  const filteredAssets = allAssets.filter(asset => {
    if (filters.rarity && asset.rarity?.toLowerCase() !== filters.rarity.toLowerCase()) return false;
    if (filters.character && asset.character?.toLowerCase() !== filters.character.toLowerCase()) return false;
    if (filters.genes && asset.genes?.toLowerCase() !== filters.genes.toLowerCase()) return false;
    if (filters.layer && asset.layerKey !== filters.layer) return false;
    if (filters.search && !asset.name?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

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

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading All Element Cards...</h1>
          <div className="space-y-4">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">All Element Cards</h1>
          <p className="text-gray-300 text-lg">
            Complete collection of all {allAssets.length} element cards across all layers
          </p>
        </div>

        {/* Statistics */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{allAssets.length}</div>
              <div className="text-sm text-blue-300">Total Cards</div>
            </div>
            <div className="bg-green-600/20 border border-green-500 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">{uniqueLayers.length}</div>
              <div className="text-sm text-green-300">Total Layers</div>
            </div>
            <div className="bg-purple-600/20 border border-purple-500 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{filteredAssets.length}</div>
              <div className="text-sm text-purple-300">Filtered Cards</div>
            </div>
            <div className="bg-yellow-600/20 border border-yellow-500 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{uniqueRarities.length}</div>
              <div className="text-sm text-yellow-300">Rarity Types</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Controls */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    View Mode
                  </label>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as 'grid' | 'list')}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="grid">Grid View</option>
                    <option value="list">List View</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Card Size
                  </label>
                  <select
                    value={cardSize}
                    onChange={(e) => setCardSize(e.target.value as 'small' | 'medium' | 'large')}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Assets
                </label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Right Column - Advanced Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Layer
                  </label>
                  <select
                    value={filters.layer}
                    onChange={(e) => setFilters(prev => ({ ...prev, layer: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">All Layers</option>
                    {uniqueLayers.map(layer => (
                      <option key={layer} value={layer}>{layer.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rarity
                  </label>
                  <select
                    value={filters.rarity}
                    onChange={(e) => setFilters(prev => ({ ...prev, rarity: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">All Rarities</option>
                    {uniqueRarities.map(rarity => (
                      <option key={rarity} value={rarity}>{rarity}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Character
                  </label>
                  <select
                    value={filters.character}
                    onChange={(e) => setFilters(prev => ({ ...prev, character: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">All Characters</option>
                    {uniqueCharacters.map(character => (
                      <option key={character} value={character}>{character}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Genes
                  </label>
                  <select
                    value={filters.genes}
                    onChange={(e) => setFilters(prev => ({ ...prev, genes: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">All Genes</option>
                    {uniqueGenes.map(genes => (
                      <option key={genes} value={genes}>{genes}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '', layer: '' })}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                🗑️ Clear All Filters
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <div><strong>Total Cards:</strong> {allAssets.length}</div>
              <div><strong>Filtered Cards:</strong> {filteredAssets.length}</div>
              <div><strong>View Mode:</strong> {viewMode}</div>
              <div><strong>Card Size:</strong> {cardSize}</div>
              {filters.layer && <div><strong>Selected Layer:</strong> {filters.layer}</div>}
            </div>
          </div>
        </div>

        {/* Filter Status */}
        {Object.values(filters).some(filter => filter) && (
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 text-lg">🔍</span>
                <span className="text-yellow-300 font-medium">Active Filters:</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => 
                    value && (
                      <span key={key} className="px-2 py-1 bg-yellow-600/30 text-yellow-200 rounded text-sm">
                        {key}: {value}
                      </span>
                    )
                  )}
                </div>
              </div>
              <button
                onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '', layer: '' })}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-8">
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex flex-wrap gap-4 justify-center">
                {filteredAssets.map((asset, index) => (
                  <div key={`${asset.layerKey}-${asset.filename || index}`} className="flex justify-center">
                    <VectorElementCardNew
                      asset={asset}
                      layerKey={asset.layerKey || 'UNKNOWN'}
                      showDetails={true}
                      size={cardSize}
                    />
                  </div>
                ))}
              </div>
              {filteredAssets.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-lg font-medium mb-2">No assets match the current filters</div>
                  <div className="text-sm mb-4">Try adjusting your filters or clearing them to see all assets</div>
                  <button
                    onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '', layer: '' })}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Card</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Layer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rarity</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Character</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Genes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Stats</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {filteredAssets.map((asset, index) => (
                      <tr key={`${asset.layerKey}-${asset.filename || index}`} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="w-16 h-24">
                            <VectorElementCardNew
                              asset={asset}
                              layerKey={asset.layerKey || 'UNKNOWN'}
                              showDetails={false}
                              size="small"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-200">
                          {asset.layerKey?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-200">{asset.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{asset.assetNumber || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {asset.rarity && (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold text-white`}
                                  style={{ backgroundColor: getRarityColor(asset.rarity) }}>
                              {asset.rarity}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{asset.character || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{asset.genes || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {asset.stats && (
                            <div className="text-xs">
                              <div>STR: {asset.stats.strength || 0}</div>
                              <div>SPD: {asset.stats.speed || 0}</div>
                              <div>SKL: {asset.stats.skill || 0}</div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredAssets.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <div className="text-lg font-medium mb-2">No assets match the current filters</div>
                  <div className="text-sm mb-4">Try adjusting your filters or clearing them to see all assets</div>
                  <button
                    onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '', layer: '' })}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Layer Breakdown */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Layer Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uniqueLayers.map(layer => {
              const layerAssets = availableAssets[layer] || [];
              const isFiltered = filters.layer === layer;
              return (
                <div
                  key={layer}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isFiltered 
                      ? 'border-pink-500 bg-pink-500/10' 
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                  }`}
                  onClick={() => setFilters(prev => ({ ...prev, layer: isFiltered ? '' : layer }))}
                >
                  <div className="text-sm font-bold text-white mb-2">
                    {layer.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-gray-400">
                    {layerAssets.length} assets
                  </div>
                  {isFiltered && (
                    <div className="text-xs text-pink-400 mt-2">
                      ✓ Filtered
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
