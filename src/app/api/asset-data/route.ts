import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { LAYER_DETAILS, LAYER_ORDER } from '@/data/layer-config';

// Cache configuration
const CACHE_DURATION = 3600000; // 1 hour in milliseconds
let lastCacheTime = 0;
let cachedAssetData: AssetDetail[] | null = null;

// Interface for asset details
interface AssetDetail {
  layer: string;
  name: string;
  filename: string;
  assetNumber?: string;
  rarity?: string;
  type?: string; // e.g., Body, Hair, Left-Weapon
  character?: string;
  genes?: string; // Renamed from creator
  stats?: {
    strength?: number;
    speed?: number;
    skill?: number;
    stamina?: number;
    stealth?: number;
    style?: number;
  };
}

// Function to parse filename and extract metadata
function parseFilename(filename: string): Partial<AssetDetail> {
  // Remove .png and split by underscore, filter out empty strings from trailing/multiple underscores
  const parts = filename.replace(/\.png$/i, '').split('_').filter(part => part !== '');
  const metadata: Partial<AssetDetail> = {
    stats: {
      strength: 0,
      speed: 0,
      skill: 0,
      stamina: 0,
      stealth: 0,
      style: 0
    }
  };

  // console.log(`[API Parse] Filename: ${filename}, Parts (${parts.length}):`, parts);

  // Basic structure: LayerNum_AssetNum_Type_ElementName_Character_Gene...
  if (parts.length >= 4) { // Need at least 4 parts for Type and ElementName
    metadata.type = parts[2]; // e.g., Hair, Underwear
    metadata.name = parts[3]; // <<< CORRECT: Element Name (e.g., G-String)

    const assetNum = parts[1];
    metadata.assetNumber = assetNum; // Assign asset number

    // Handle Character (parts[4]) - Set undefined if 'x'
    if (parts.length > 4) {
      metadata.character = parts[4] !== 'x' ? parts[4] : undefined;
    }
    // <<< Handle Genes (parts[5]) - Use 'genes', set undefined if 'x' >>>
    if (parts.length > 5) {
      metadata.genes = parts[5] !== 'x' ? parts[5] : undefined;
    }

    // Find Rarity
    const rarityIndex = parts.findIndex(part =>
      ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythical'].includes(part)
    );
    if (rarityIndex !== -1) {
      metadata.rarity = parts[rarityIndex];
    }

    // *** ADDED: Check for potential RGB in parts[6] ***
    if (parts.length > 6 && parts[6] !== 'x') {
      console.log(`[API Parse Potential RGB] Found: ${parts[6]} in ${filename}`);
      // Potential future logic to parse/store RGB if needed
    }
    // *****************************************************

    // Parse stats by looking for StatName and then the next part for the value
    for (let i = 0; i < parts.length - 1; i++) { // Iterate up to the second-to-last part
      const currentPart = parts[i];
      const nextPart = parts[i + 1];
      const value = parseInt(nextPart);

      if (!isNaN(value)) { // Check if the next part is a valid number
        switch (currentPart) {
          case 'Strength':
            metadata.stats!.strength = value;
            i++; // Skip the value part in the next iteration
            break;
          case 'Speed':
            metadata.stats!.speed = value;
            i++;
            break;
          case 'Skill':
            metadata.stats!.skill = value;
            i++;
            break;
          case 'Stamina':
            metadata.stats!.stamina = value;
            i++;
            break;
          case 'Stealth':
            metadata.stats!.stealth = value;
            i++;
            break;
          case 'Style':
            metadata.stats!.style = value;
            i++;
            break;
        }
      }
    }
  } else {
    // console.log(`[API Parse Warning] Skipping metadata for ${filename}, parts.length is ${parts.length} (< 3)`);
    // Fallback name if parsing fails early
    metadata.name = filename.replace(/\.png$/i, ''); // Fallback name
    metadata.assetNumber = parts.length > 1 ? parts[1] : 'N/A'; // Fallback asset number
    metadata.type = metadata.type || 'Unknown'; // Add fallback for type
  }

  // console.log(`[API Parse] Returning metadata for ${filename}:`, JSON.stringify(metadata));

  return metadata;
}

// Function to build asset data from filesystem
function buildAssetData(): AssetDetail[] {
  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  const assetData: AssetDetail[] = [];

  try {
    // Process each layer in order
    LAYER_ORDER.forEach(layerKey => {
      const layerDetail = LAYER_DETAILS[layerKey];
      if (!layerDetail) {
        console.warn(`No layer detail found for ${layerKey}`);
        return;
      }

      const layerDir = path.join(assetsDir, layerDetail.folderName);
      
      if (!fs.existsSync(layerDir)) {
        console.warn(`Directory not found: ${layerDir}`);
        return;
      }

      const files = fs.readdirSync(layerDir)
        .filter(file => file.endsWith('.png'));

      files.forEach(filename => {
        const metadata = parseFilename(filename);
        assetData.push({
          layer: layerKey,
          filename,
          name: metadata.name || filename.replace(/\.png$/i, ''), // Ensure name is always string
          assetNumber: metadata.assetNumber,
          rarity: metadata.rarity,
          type: metadata.type, // <<< CORRECT: Use parsed type for layer
          character: metadata.character,
          genes: metadata.genes,
          stats: metadata.stats
        });
      });
    });

    return assetData;
  } catch (error) {
    console.error('Error building asset data:', error);
    return [];
  }
}

// GET handler for the API endpoint
export async function GET() {
  try {
    const currentTime = Date.now();
    
    // Check if cache needs to be refreshed
    if (!cachedAssetData || currentTime - lastCacheTime > CACHE_DURATION) {
      cachedAssetData = buildAssetData();
      lastCacheTime = currentTime;
    }

    return NextResponse.json({ 
      success: true, 
      data: cachedAssetData 
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to retrieve asset data' 
    }, { 
      status: 500 
    });
  }
} 