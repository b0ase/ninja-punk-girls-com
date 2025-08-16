import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// === TYPES ===
export interface AssetDetail {
  layer: string;
  filename: string; // This will now be the full blob URL
  name: string;
  rarity?: string;
  character?: string;
  genes?: string;
  team?: string;
  stats: {
    strength: number;
    speed: number;
    skill: number;
    stamina: number;
    stealth: number;
    style: number;
  };
}

export interface BlobAsset {
  path: string; // Relative path within assets-source, e.g., "01-Logo/logo.png"
  url: string;  // Full Vercel Blob URL
  size: number;
  contentType: string;
}

export interface BlobAssetManifest {
  generated: string;
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: number;
  assets: BlobAsset[];
}

// === CACHING ===
let assetCache: AssetDetail[] | null = null;

// === API HANDLER ===
export async function GET() {
  try {
    if (assetCache) {
      console.log('[API] Returning cached asset data from Blob Manifest');
      return NextResponse.json({
        success: true,
        data: assetCache,
        count: assetCache.length
      });
    }

    console.log('[API] Loading asset data from Blob Manifest...');
    
    const manifestPath = path.join(process.cwd(), 'src', 'data', 'asset-manifest.json');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    const manifest: BlobAssetManifest = JSON.parse(manifestContent);

    const allAssets: AssetDetail[] = manifest.assets.map(blobAsset => {
      const pathParts = blobAsset.path.split('/');
      const layer = pathParts[0]; // e.g., "01-Logo"
      const filename = pathParts[pathParts.length - 1]; // e.g., "01_001_logo_NPG-logo_x_NPG_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x.png"

      // Extract name from filename (assuming it's the 4th part after splitting by '_')
      const filenameParts = filename.split('_');
      let name = filename; // Default to full filename
      if (filenameParts.length > 3) {
        name = filenameParts[3]; 
      }
      name = name.replace(/\.png$/, ''); // Remove .png extension

      // Placeholder for rarity and stats, as they are not in the current manifest
      // In a real scenario, these would come from metadata files or a database
      const rarity = 'Common'; 
      const stats = { strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0 };

      return {
        layer: layer,
        filename: blobAsset.url, // Use the full blob URL
        name: name,
        rarity: rarity,
        stats: stats,
      } as AssetDetail;
    });

    assetCache = allAssets;

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