import { list, del } from '@vercel/blob';

// Types for blob-based assets
export interface BlobAsset {
  path: string;
  url: string;
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

// Cache for asset manifest
let assetManifestCache: BlobAssetManifest | null = null;

/**
 * Load the asset manifest from blob storage
 */
export async function loadBlobAssetManifest(): Promise<BlobAssetManifest> {
  if (assetManifestCache) {
    return assetManifestCache;
  }

  try {
    // Try to load from the generated manifest first
    const response = await fetch('/api/blob-assets/manifest');
    if (response.ok) {
      const manifest = await response.json();
      assetManifestCache = manifest;
      return manifest;
    }
  } catch (error) {
    console.warn('Failed to load blob asset manifest:', error);
  }

  // Fallback: return empty manifest
  return {
    generated: new Date().toISOString(),
    totalFiles: 0,
    uploadedFiles: 0,
    failedFiles: 0,
    assets: []
  };
}

/**
 * Get a specific asset by path
 */
export async function getBlobAsset(path: string): Promise<BlobAsset | null> {
  const manifest = await loadBlobAssetManifest();
  return manifest.assets.find(asset => asset.path === path) || null;
}

/**
 * Get all assets for a specific layer/category
 */
export async function getBlobAssetsByLayer(layer: string): Promise<BlobAsset[]> {
  const manifest = await loadBlobAssetManifest();
  return manifest.assets.filter(asset => 
    asset.path.startsWith(layer + '/') || asset.path.startsWith(layer + '\\')
  );
}

/**
 * Get asset URL by path
 */
export async function getBlobAssetUrl(path: string): Promise<string | null> {
  const asset = await getBlobAsset(path);
  return asset?.url || null;
}

/**
 * List all available blob assets
 */
export async function listBlobAssets(): Promise<BlobAsset[]> {
  const manifest = await loadBlobAssetManifest();
  return manifest.assets;
}

/**
 * Search assets by filename or path
 */
export async function searchBlobAssets(query: string): Promise<BlobAsset[]> {
  const manifest = await loadBlobAssetManifest();
  const lowerQuery = query.toLowerCase();
  
  return manifest.assets.filter(asset => 
    asset.path.toLowerCase().includes(lowerQuery) ||
    asset.path.toLowerCase().includes(lowerQuery.replace(/\s+/g, '_'))
  );
}

/**
 * Get assets by file extension
 */
export async function getBlobAssetsByType(extension: string): Promise<BlobAsset[]> {
  const manifest = await loadBlobAssetManifest();
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  
  return manifest.assets.filter(asset => 
    asset.path.toLowerCase().endsWith(ext)
  );
}

/**
 * Clear the asset manifest cache (useful for development)
 */
export function clearBlobAssetCache(): void {
  assetManifestCache = null;
}

/**
 * Get asset statistics
 */
export async function getBlobAssetStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  layers: string[];
}> {
  const manifest = await loadBlobAssetManifest();
  const layers = new Set<string>();
  
  manifest.assets.forEach(asset => {
    const layer = asset.path.split('/')[0] || asset.path.split('\\')[0];
    if (layer) layers.add(layer);
  });
  
  return {
    totalFiles: manifest.totalFiles,
    totalSize: manifest.assets.reduce((sum, asset) => sum + asset.size, 0),
    layers: Array.from(layers).sort()
  };
}
