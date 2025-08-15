import { NFTAttribute } from '@/types';
import { LAYER_DETAILS } from '@/data/layer-config';

/**
 * Helper function to extract the identifier from a wallet item.
 * Prefers 'origin' if available, otherwise uses 'id'.
 */
export const getItemIdentifier = (item: { id: string; origin?: string }): string => {
  return item.origin || item.id;
};

/**
 * Helper function to derive the base filename component from layer details.
 * Handles cases like "21 Body" -> "Body" or "07 Right-Weapon" -> "Right-Weapon".
 */
const getBaseNameFromFolderName = (folderName: string): string | null => {
  const spaceIndex = folderName.indexOf(' ');
  if (spaceIndex === -1 || spaceIndex + 1 === folderName.length) {
    console.warn(`[utils] Could not extract base name from folderName: ${folderName}`);
    return null; // Or return the original name part? Depends on expected map keys
  }
  return folderName.substring(spaceIndex + 1);
};

/**
 * Constructs the path for an element card background image.
 * Assumes backgrounds are in /public/element_cards/ and are JPGs.
 * 
 * @param layerName - The name of the layer.
 * @param backgroundMap - A map of layer names (e.g., "BOTTOM") to their file paths (e.g., "/element_cards/10_BOTTOM.jpg").
 * @returns The relative path to the background image.
 */
export const getCardBackgroundPath = (layerName: string, backgroundMap: Record<string, string>): string => {
  if (!layerName) {
    console.warn('[utils] getCardBackgroundPath called with empty layerName. Returning default.');
    return '/element_cards/default_background.jpg';
  }

  // 1. Get layer details from config
  const layerDetail = LAYER_DETAILS[layerName];
  if (!layerDetail || !layerDetail.number) {
    console.warn(`[utils] Layer details missing for layer '${layerName}'. Cannot determine background map key.`);
    return '/element_cards/default_background.jpg';
  }

  // 2. Construct the expected map key based on the actual file naming convention
  // Files are named like: "21_body.jpg", "07_right_weapon.jpg"
  let baseName: string;
  
  // Handle special cases
  if (layerName === 'BODY_SKIN') {
    baseName = 'body';
  } else if (layerName === 'RIGHT_WEAPON') {
    baseName = 'right_weapon';
  } else if (layerName === 'LEFT_WEAPON') {
    baseName = 'left_weapon';
  } else if (layerName === 'REAR_HORNS') {
    baseName = 'rear_horns';
  } else if (layerName === 'REAR_HAIR') {
    baseName = 'rear_hair';
  } else {
    // Convert layer name to lowercase and replace spaces/hyphens with underscores
    baseName = layerName.toLowerCase().replace(/[\s-]/g, '_');
  }

  const expectedMapKey = `${layerDetail.number}_${baseName}`;
  console.log(`[getCardBackgroundPath] Looking for key: '${expectedMapKey}' in backgroundMap`);

  // Look up the path in the provided map
  const pathFromMap = backgroundMap[expectedMapKey];

  if (pathFromMap) {
    console.log(`[getCardBackgroundPath] Found background: ${pathFromMap}`);
    return pathFromMap;
  }

  // Fallback if not found in map
  console.warn(`[getCardBackgroundPath] Background path for key '${expectedMapKey}' not found in map. Available keys:`, Object.keys(backgroundMap));
  return '/element_cards/default_background.jpg';
};

/**
 * Constructs the URL for an element's asset image based on its attribute data.
 * Uses LAYER_DETAILS for directory mapping.
 * Assumes assets are PNGs under /public/assets/...
 *
 * @param attribute - The NFTAttribute object containing layer and filename information.
 * @returns The relative URL to the asset image.
 */
export const getElementAssetUrl = (attribute: NFTAttribute): string => {
  if (!attribute || !attribute.layer || !attribute.fullFilename) {
    console.warn('[utils] getElementAssetUrl called with invalid attribute:', attribute);
    return '/placeholder.png';
  }

  // Access the layer detail directly using the layer key
  const layerDetail = LAYER_DETAILS[attribute.layer];

  if (!layerDetail || !layerDetail.folderName) {
    console.warn(`[utils] Layer detail or folderName not found for layer key: ${attribute.layer}. Using layer key as directory.`);
    return `/assets/${attribute.layer}/${attribute.fullFilename}`;
  }

  // Construct the path using the folderName from LAYER_DETAILS
  // Example: layerDetail.folderName = "07-Right-Weapon", attribute.fullFilename = "07_001_Right-Weapon_Short-Whip.png"
  // Returns: "/assets/07-Right-Weapon/07_001_Right-Weapon_Short-Whip.png"
  const assetUrl = `/assets/${layerDetail.folderName}/${attribute.fullFilename}`;
  console.log(`[getElementAssetUrl] Constructed URL: ${assetUrl} for layer: ${attribute.layer}, filename: ${attribute.fullFilename}`);
  return assetUrl;
}; 