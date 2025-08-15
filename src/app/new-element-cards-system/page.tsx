'use client';

import React, { useState } from 'react';
import { useAssets } from '@/context/AssetContext';
import { AssetDetail } from '@/types';
import { LAYER_ORDER, LAYER_DETAILS } from '@/data/layer-config';
import VectorElementCard from '@/components/VectorElementCard';
import VectorElementCardNew from '@/components/VectorElementCardNew';

export default function NewElementCardsSystemPage() {
  const { availableAssets, isLoading, error } = useAssets();
  const [selectedLayer, setSelectedLayer] = useState<string>('BODY_SKIN');
  const [showOldSystem, setShowOldSystem] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Loading Vector Element Cards System...</h1>
          <div className="animate-pulse">Loading assets...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Error Loading Vector Element Cards System</h1>
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  const layerOptions = Object.keys(LAYER_DETAILS).filter(layer => 
    !['BACKGROUND', 'GLOW', 'BANNER', 'DECALS', 'LOGO', 'COPYRIGHT', 'SCORES', 'TEAM', 'INTERFACE', 'EFFECTS'].includes(layer)
  );

  const selectedAssets = availableAssets[selectedLayer] || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Vector Element Cards System</h1>
          <p className="text-gray-300 text-lg">
            New lightweight vector-based element cards system. Replaces PNG backgrounds with scalable SVG graphics.
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Layer
              </label>
              <select
                value={selectedLayer}
                onChange={(e) => setSelectedLayer(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                {layerOptions.map(layer => (
                  <option key={layer} value={layer}>
                    {layer.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
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

          <div className="mt-4 text-sm text-gray-400">
            <strong>Selected Layer:</strong> {selectedLayer} ({selectedAssets.length} assets)
          </div>
        </div>

        {/* Comparison Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* New Vector System */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-green-400">✨ New Vector System</h2>
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {selectedAssets.slice(0, 6).map((asset, index) => (
                  <div key={asset.filename || index} className="flex justify-center">
                    <VectorElementCardNew
                      asset={asset}
                      layerKey={selectedLayer}
                      showDetails={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Old PNG System (if enabled) */}
          {showOldSystem && (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-yellow-400">🖼️ Old PNG System</h2>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {selectedAssets.slice(0, 6).map((asset, index) => (
                    <div key={asset.filename || index} className="flex justify-center">
                      <VectorElementCard
                        elementKey={selectedLayer}
                        showDetails={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features List */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
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
          </div>
        </div>
      </div>
    </div>
  );
}
