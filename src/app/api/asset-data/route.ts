
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import assetManifest from '@/data/asset-manifest.json';

// === TYPES ===
export interface AssetDetail {
  layer: string;
  filename: string;
  name: string;
  assetNumber: string;
  folder_number: string;
  category: string;
  item_name: string;
  character?: string;
  team?: string;
  genes?: string;
  rarity?: string;
  stats: {
    strength: number;
    speed: number;
    skill: number;
    stamina: number;
    stealth: number;
    style: number;
  };
  original_filename?: string;
  simplified_filename?: string;
  layerKey?: string; // Added for reference in UI components
}

// === CACHING ===
let assetCache: AssetDetail[] | null = null;

// === API HANDLER ===
export async function GET() {
  try {
    if (assetCache) {
      console.log('[API] Returning cached asset data');
      return NextResponse.json({
        success: true,
        data: assetCache,
        count: assetCache.length
      });
    }

    console.log('[API] Loading asset data from manifest...');
    
    if (!assetManifest || assetManifest.length === 0) {
      console.warn('[API] Asset manifest is empty or not found');
      return NextResponse.json({
        success: false,
        error: 'Asset manifest is empty or not found',
        data: []
      });
    }

    console.log(`[API] Successfully loaded ${assetManifest.length} assets from manifest, caching result.`);
    assetCache = assetManifest as AssetDetail[];

    return NextResponse.json({
      success: true,
      data: assetCache,
      count: assetCache.length
    });

  } catch (error: any) {
    console.error('[API] Error in asset-data route:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load asset data',
      details: error.message
    }, {
      status: 500
    });
  }
}
