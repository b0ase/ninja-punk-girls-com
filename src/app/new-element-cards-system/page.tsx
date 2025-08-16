'use client';

import React, { useState } from 'react';
import { useAssets } from '@/context/AssetContext';
import { AssetDetail } from '@/types';
import { LAYER_ORDER, LAYER_DETAILS } from '@/data/layer-config';
import VectorElementCard from '@/components/VectorElementCard';
import VectorElementCardNew from '@/components/VectorElementCardNew';

export default function NewElementCardsSystemPage() {
  const { availableAssets, isInitialized, assetLoadingProgress } = useAssets();
  const [selectedLayer, setSelectedLayer] = useState<string>('BODY_SKIN');
  const [showOldSystem, setShowOldSystem] = useState<boolean>(false);
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
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading Vector Element Cards System...</h1>
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Vector Element Cards System</h1>
          <p className="text-gray-300 text-lg">
            New lightweight vector-based element cards system. Replaces PNG backgrounds with scalable SVG graphics.
          </p>
          <div className="mt-4">
            <a 
              href="/new-element-cards-system/all" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              🗂️ View All Element Cards ({Object.values(availableAssets || {}).reduce((total, assets) => total + (Array.isArray(assets) ? assets.length : 0), 0)} total)
            </a>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Layer
                </label>
                <select
                  value={selectedLayer}
                  onChange={(e) => setSelectedLayer(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {layerOptions.map(layer => (
                    <option key={layer} value={layer}>
                      {layer.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    View Mode
                  </label>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as 'cards' | 'table' | 'grid')}
                    className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="cards">Cards View</option>
                    <option value="table">Table View</option>
                    <option value="grid">Grid View</option>
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showOldSystem"
                  checked={showOldSystem}
                  onChange={(e) => setShowOldSystem(e.target.checked)}
                  className="rounded border-gray-600 text-pink-500 focus:ring-pink-500"
                />
                <label htmlFor="showOldSystem" className="text-sm text-gray-300">
                  Show Old PNG System for Comparison
                </label>
              </div>
            </div>

            {/* Right Column - Advanced Filters */}
            <div className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <button
                onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '' })}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                🗑️ Clear All Filters
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <div><strong>Selected Layer:</strong> {selectedLayer}</div>
              <div><strong>Total Assets:</strong> {selectedAssets.length}</div>
              <div><strong>Filtered Assets:</strong> {filteredAssets.length}</div>
              <div><strong>View Mode:</strong> {viewMode}</div>
              <div><strong>Card Size:</strong> {cardSize}</div>
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
                onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '' })}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-8">
          {/* New Vector System */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-green-400">✨ New Vector System</h2>
            
            {/* View Mode Selection */}
            {viewMode === 'cards' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex flex-wrap gap-4 justify-center">
                  {filteredAssets.map((asset, index) => (
                    <div key={asset.filename || index} className="flex justify-center">
                      <VectorElementCardNew
                        asset={asset}
                        layerKey={selectedLayer}
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
                      onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '' })}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'table' && (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Image</th>
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
                        <tr key={asset.filename || index} className="hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="w-16 h-24">
                              <VectorElementCardNew
                                asset={asset}
                                layerKey={selectedLayer}
                                showDetails={false}
                                size="small"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-200">{asset.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-300">{asset.filename || 'N/A'}</td>
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
                      onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '' })}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {viewMode === 'grid' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex flex-wrap gap-6 justify-center">
                  {filteredAssets.map((asset, index) => (
                    <div key={asset.filename || index} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex justify-center mb-4">
                        <VectorElementCardNew
                          asset={asset}
                          layerKey={selectedLayer}
                          showDetails={false}
                          size="medium"
                        />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="font-bold text-white">{asset.name}</div>
                        <div className="text-gray-300">#{asset.filename || 'N/A'}</div>
                        {asset.rarity && (
                          <div className="text-gray-400">Rarity: {asset.rarity}</div>
                        )}
                        {asset.character && (
                          <div className="text-gray-400">Character: {asset.character}</div>
                        )}
                        {asset.genes && (
                          <div className="text-gray-400">Genes: {asset.genes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {filteredAssets.length === 0 && (
                  <div className="text-center text-gray-500 py-12">
                    <div className="text-lg font-medium mb-2">No assets match the current filters</div>
                    <div className="text-sm mb-4">Try adjusting your filters or clearing them to see all assets</div>
                    <button
                      onClick={() => setFilters({ rarity: '', character: '', genes: '', search: '' })}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Old PNG System (if enabled) */}
          {showOldSystem && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-yellow-400">🖼️ Old PNG System</h2>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredAssets.slice(0, 6).map((asset, index) => (
                    <div key={asset.filename || index} className="flex justify-center">
                      <VectorElementCard
                        elementKey={selectedLayer}
                        variant="default"
                        width={160}
                        height={240}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center text-gray-400 text-sm">
                  <p>Old system: Static vector cards with predefined colors and patterns</p>
                  <p>New system: Dynamic cards with actual asset data and customizable backgrounds</p>
                </div>
              </div>
            </div>
          )}
        </div>

        

        {/* Layer Overview */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Layer Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {layerOptions.map(layer => {
              const layerAssets = availableAssets[layer] || [];
              const isSelected = layer === selectedLayer;
              return (
                <div
                  key={layer}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-pink-500 bg-pink-500/10' 
                      : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedLayer(layer)}
                >
                  <div className="text-sm font-bold text-white mb-2">
                    {layer.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs text-gray-400">
                    {layerAssets.length} assets
                  </div>
                  {isSelected && (
                    <div className="text-xs text-pink-400 mt-2">
                      ✓ Selected
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Features List */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">New System Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-green-400">Lightweight:</strong> SVG backgrounds instead of heavy PNGs
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-green-400">Scalable:</strong> Perfect at any size without quality loss
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-green-400">Customizable:</strong> Easy to modify colors, patterns, and themes
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-green-400">Performance:</strong> Faster loading and smoother interactions
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-green-400">Multiple Views:</strong> Cards, Table, and Grid layouts
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong className="text-green-400">Advanced Filtering:</strong> Search, rarity, character, genes, series
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
