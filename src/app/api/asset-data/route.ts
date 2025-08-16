import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

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
function loadAssetsFromDirectory(dirPath: string): AssetDetail[] {
  const assets: AssetDetail[] = [];
  
  try {
    if (!fs.existsSync(dirPath)) {
      return assets;
    }

    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const jsonPath = path.join(dirPath, file);
          const jsonContent = fs.readFileSync(jsonPath, 'utf8');
          const jsonData = JSON.parse(jsonContent);
          
          const asset: AssetDetail = {
            layer: path.basename(dirPath),
            filename: file.replace('.json', '.png'),
            name: jsonData.item_name || jsonData.name || 'Unknown',
            rarity: jsonData.rarity,
            character: jsonData.character,
            genes: jsonData.genes,
            team: jsonData.team,
            stats: jsonData.stats || {
              strength: 0,
              speed: 0,
              skill: 0,
              stamina: 0,
              stealth: 0,
              style: 0
            }
          };
          
          assets.push(asset);
        } catch (error) {
          console.warn(`Failed to load JSON for ${file}:`, error);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }
  
  return assets;
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

    console.log('[API] Loading asset data from public/assets...');
    
    const assetsDir = path.join(process.cwd(), 'public', 'assets');
    if (!fs.existsSync(assetsDir)) {
      console.warn('[API] Assets directory not found');
      return NextResponse.json({
        success: false,
        error: 'Assets directory not found',
        data: []
      });
    }

    const allAssets: AssetDetail[] = [];
    const subdirs = fs.readdirSync(assetsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const subdir of subdirs) {
      const subdirPath = path.join(assetsDir, subdir);
      const assets = loadAssetsFromDirectory(subdirPath);
      allAssets.push(...assets);
    }

    console.log(`[API] Successfully loaded ${allAssets.length} assets, caching result.`);
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
