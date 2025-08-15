import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

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
}

// === FOLDER MAPPING ===
const FOLDER_MAPPING: { [key: string]: string } = {
  '01-Logo': 'LOGO',
  '02-Copyright': 'COPYRIGHT',
  '04-Team': 'TEAM',
  '05-Interface': 'INTERFACE',
  '06-Effects': 'EFFECTS',
  '07-Right-Weapon': 'RIGHT_WEAPON',
  '08-Left-Weapon': 'LEFT_WEAPON',
  '09-Horns': 'HORNS',
  '10-Hair': 'HAIR',
  '11-Mask': 'MASK',
  '12-Top': 'TOP',
  '13-Boots': 'BOOTS',
  '14-Jewellery': 'JEWELLERY',
  '15-Accessories': 'ACCESSORIES',
  '16-Bra': 'BRA',
  '17-Bottom': 'BOTTOM',
  '18-Face': 'FACE',
  '19-Underwear': 'UNDERWEAR',
  '20-Arms': 'ARMS',
  '21-Body': 'BODY_SKIN',
  '22-Back': 'BACK',
  '23-Rear-Horns': 'REAR_HORNS',
  '24-Rear-Hair': 'REAR_HAIR',
  '26-Decals': 'DECALS',
  '27-Banner': 'BANNER',
  '28-Glow': 'GLOW',
  '29-Background': 'BACKGROUND'
};

// === CACHING ===
let assetCache: AssetDetail[] | null = null;

// Function to load asset data from JSON file
function loadAssetFromJSON(folderPath: string, jsonFilename: string, layerKey: string): AssetDetail | null {
  try {
    const jsonPath = path.join(folderPath, jsonFilename);

    if (!fs.existsSync(jsonPath)) {
      console.warn(`[API] JSON file not found: ${jsonPath}`);
      return null;
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    const pngFilename = jsonData.simplified_filename || jsonData.original_filename;

    if (!pngFilename) {
      console.warn(`[API] No PNG filename found in JSON: ${jsonFilename}`);
      return null;
    }

    const pngPath = path.join(folderPath, pngFilename);
    if (!fs.existsSync(pngPath)) {
      console.warn(`[API] PNG file not found: ${pngPath}`);
      return null;
    }

    const asset: AssetDetail = {
      layer: layerKey,
      filename: pngFilename,
      name: jsonData.item_name || jsonData.name || 'Unknown',
      assetNumber: jsonData.asset_number || 'N/A',
      folder_number: jsonData.folder_number || '00',
      category: jsonData.category || 'Unknown',
      item_name: jsonData.item_name || 'Unknown',
      character: jsonData.character || undefined,
      team: jsonData.team || undefined,
      genes: jsonData.genes || undefined,
      rarity: jsonData.rarity || undefined,
      stats: {
        strength: jsonData.stats?.strength || 0,
        speed: jsonData.stats?.speed || 0,
        skill: jsonData.stats?.skill || 0,
        stamina: jsonData.stats?.stamina || 0,
        stealth: jsonData.stats?.stealth || 0,
        style: jsonData.stats?.style || 0
      },
      original_filename: jsonData.original_filename,
      simplified_filename: jsonData.simplified_filename
    };

    return asset;
  } catch (error) {
    console.error(`[API] Error loading asset from JSON ${jsonFilename}:`, error);
    return null;
  }
}

// Function to load asset data on demand
function loadAssetsOnDemand(): AssetDetail[] {
  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  const assetData: AssetDetail[] = [];

  try {
    if (!fs.existsSync(assetsDir)) {
      console.warn(`Assets directory not found: ${assetsDir}`);
      return [];
    }

    const folders = fs.readdirSync(assetsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    folders.forEach(folderName => {
      const folderPath = path.join(assetsDir, folderName);
      const layerKey = FOLDER_MAPPING[folderName];

      if (!layerKey) {
        console.warn(`[API] No layer mapping found for folder: ${folderName}`);
        return;
      }

      try {
        const jsonFiles = fs.readdirSync(folderPath)
          .filter(file => file.endsWith('.json'));

        jsonFiles.forEach(jsonFilename => {
          const asset = loadAssetFromJSON(folderPath, jsonFilename, layerKey);
          if (asset) {
            assetData.push(asset);
          }
        });
      } catch (error) {
        console.error(`[API] Error reading folder ${folderName}:`, error);
      }
    });

    return assetData;
  } catch (error) {
    console.error('[API] Error loading assets on demand:', error);
    return [];
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

    console.log('[API] Loading asset data from JSON files...');
    const assetData = loadAssetsOnDemand();

    if (assetData.length === 0) {
      console.warn('[API] No asset data found');
      return NextResponse.json({
        success: false,
        error: 'No asset data found',
        data: []
      });
    }

    console.log(`[API] Successfully loaded ${assetData.length} assets, caching result.`);
    assetCache = assetData;

    return NextResponse.json({
      success: true,
      data: assetData,
      count: assetData.length
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