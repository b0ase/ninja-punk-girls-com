import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// === TYPES ===
export interface AssetDetail {
  layer: string;
  filename: string;
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

// === CACHING ===
let assetCache: AssetDetail[] | null = null;

// === HELPER FUNCTIONS ===
async function loadAssetsFromDirectory(): Promise<AssetDetail[]> {
  const assetsDir = path.join(process.cwd(), 'public', 'assets', 'assets-source');
  const allAssets: AssetDetail[] = [];

  try {
    // Read all subdirectories (layers)
    const layerDirs = await fs.readdir(assetsDir);
    
    for (const layerDir of layerDirs) {
      const layerPath = path.join(assetsDir, layerDir);
      const layerStat = await fs.stat(layerPath);
      
      if (layerStat.isDirectory()) {
        // Read files in this layer directory
        const files = await fs.readdir(layerPath);
        
        for (const file of files) {
          if (file.endsWith('.png')) {
            // Try to find corresponding JSON file for metadata
            const jsonFile = file.replace('.png', '.json');
            const jsonPath = path.join(layerPath, jsonFile);
            
            let assetData: Partial<AssetDetail> = {
              layer: layerDir,
              filename: file,
              name: file.replace('.png', '').replace(/_/g, ' '),
              rarity: 'Common',
              stats: { strength: 0, speed: 0, skill: 0, stamina: 0, stealth: 0, style: 0 }
            };

            try {
              // Try to load JSON metadata if it exists
              const jsonContent = await fs.readFile(jsonPath, 'utf-8');
              const metadata = JSON.parse(jsonContent);
              
              // Extract metadata from JSON
              if (metadata.rarity) assetData.rarity = metadata.rarity;
              if (metadata.character) assetData.character = metadata.character;
              if (metadata.genes) assetData.genes = metadata.genes;
              if (metadata.team) assetData.team = metadata.team;
              if (metadata.stats) assetData.stats = metadata.stats;
              if (metadata.name) assetData.name = metadata.name;
            } catch (jsonError) {
              // JSON file doesn't exist or is invalid, use defaults
              console.log(`[API] No JSON metadata for ${file}, using defaults`);
            }

            allAssets.push(assetData as AssetDetail);
          }
        }
      }
    }

    console.log(`[API] Successfully loaded ${allAssets.length} assets from local directory`);
    return allAssets;

  } catch (error) {
    console.error('[API] Error reading assets directory:', error);
    throw error;
  }
}

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

    console.log('[API] Loading asset data from local assets directory...');
    
    const allAssets = await loadAssetsFromDirectory();
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