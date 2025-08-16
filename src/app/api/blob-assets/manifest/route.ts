import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Types
interface BlobAsset {
  path: string;
  url: string;
  size: number;
  contentType: string;
}

interface BlobAssetManifest {
  generated: string;
  totalFiles: number;
  uploadedFiles: number;
  failedFiles: number;
  assets: BlobAsset[];
}

// Cache the manifest
let manifestCache: BlobAssetManifest | null = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load the blob asset manifest from the generated file
 */
async function loadBlobAssetManifest(): Promise<BlobAssetManifest | null> {
  try {
    const manifestPath = path.join(process.cwd(), 'src', 'data', 'blob-asset-manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    return JSON.parse(manifestContent);
  } catch (error) {
    console.error('Failed to load blob asset manifest:', error);
    return null;
  }
}

/**
 * GET handler for the blob assets manifest
 */
export async function GET() {
  try {
    const now = Date.now();
    
    // Check if we need to refresh the cache
    if (!manifestCache || (now - lastCacheTime) > CACHE_DURATION) {
      manifestCache = await loadBlobAssetManifest();
      lastCacheTime = now;
    }
    
    if (!manifestCache) {
      return NextResponse.json({
        success: false,
        error: 'Blob asset manifest not found. Please run the upload script first.',
        data: {
          generated: new Date().toISOString(),
          totalFiles: 0,
          uploadedFiles: 0,
          failedFiles: 0,
          assets: []
        }
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: manifestCache,
      cached: true,
      lastUpdated: new Date(lastCacheTime).toISOString()
    });
    
  } catch (error: any) {
    console.error('Error in blob-assets manifest route:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load blob asset manifest',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST handler to refresh the manifest cache
 */
export async function POST() {
  try {
    // Clear cache and reload
    manifestCache = null;
    lastCacheTime = 0;
    
    const manifest = await loadBlobAssetManifest();
    
    if (!manifest) {
      return NextResponse.json({
        success: false,
        error: 'Failed to reload blob asset manifest'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Manifest cache refreshed',
      data: manifest,
      generated: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Error refreshing blob asset manifest:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh manifest cache',
      details: error.message
    }, { status: 500 });
  }
}
