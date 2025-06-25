'use client';

import React from 'react';
import Image from 'next/image';
import CoordinateGridOverlay from '@/components/CoordinateGridOverlay';

// Define the known dimensions of the base image
const IMAGE_WIDTH = 961;
const IMAGE_HEIGHT = 1441;
const GRID_STEP = 50; // Draw grid lines every 50px
const LABEL_STEP = 100; // Show coordinate labels every 100px

export default function DataPlacementPage() {

  return (
    <div className="min-h-screen bg-gray-800 p-4 flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold text-pink-500 mb-4">Data Placement Reference</h1>
      <p className="text-gray-400 mb-6">Use this grid (lines every {GRID_STEP}px, labels every {LABEL_STEP}px) to find the Top-Left (X, Y) coordinates for data placement.</p>
      
      {/* Container to hold the image and the overlay */}
      <div 
        className="relative overflow-auto border border-pink-500/50" 
        style={{ width: `${IMAGE_WIDTH}px`, height: `${IMAGE_HEIGHT}px` }}
      >
        <Image
          src="/assets/05 Interface/05_01_interface_x_x_x_x.png"
          alt="Base Interface Layout"
          width={IMAGE_WIDTH}
          height={IMAGE_HEIGHT}
          priority
          unoptimized
          style={{ display: 'block' }} // Ensure no extra space below image
        />
        <CoordinateGridOverlay 
          width={IMAGE_WIDTH} 
          height={IMAGE_HEIGHT} 
          step={GRID_STEP} 
          labelStep={LABEL_STEP}
          color="rgba(0, 255, 0, 0.6)" // Bright Green lines
          labelColor="rgba(0, 255, 0, 1)" // Brighter Green labels
          strokeWidth={1}
        />
      </div>
    </div>
  );
} 