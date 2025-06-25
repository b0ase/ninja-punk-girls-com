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
  // Example: backgroundFileName = "01_BACKGROUND"
  // Returns: "/element_cards/01_BACKGROUND.jpg"
  if (!layerName) {
    console.warn('[utils] getCardBackgroundPath called with empty layerName. Returning default.');
    return '/element_cards/default_background.jpg'; // Provide a default or handle error
  }

  // 1. Get layer details from config
  const layerDetail = LAYER_DETAILS[layerName];
  if (!layerDetail || !layerDetail.number || !layerDetail.folderName) {
    console.warn(`[utils] Layer details missing for layer '${layerName}'. Cannot determine background map key.`);
    return '/element_cards/default_background.jpg'; // Return default if no details
  }

  // 2. Construct the expected map key (e.g., "21_Body", "07_Right-Weapon")
  const baseName = getBaseNameFromFolderName(layerDetail.folderName);
  if (!baseName) { // Handle missing base name
     return '/element_cards/default_background.jpg';
  }
  // Construct key using number and baseName, replacing hyphens with underscores
  const baseNameWithUnderscores = baseName.replace(/-/g, '_');
  const expectedMapKey = `${layerDetail.number}_${baseNameWithUnderscores}`;

  // Convert key to lowercase for case-insensitive lookup
  const lookupKey = expectedMapKey.toLowerCase();

  // Look up the path in the provided map using the lowercase key
  const pathFromMap = backgroundMap[lookupKey];

  if (pathFromMap) {
    return pathFromMap;
  }

  // Fallback if not found in map (or if map is empty)
  console.warn(`[utils] Background path for lookup key '${lookupKey}' (derived from layer '${layerName}') not found in map. Available keys:`, Object.keys(backgroundMap));
  // This fallback might be incorrect if filenames don't match layer names exactly
  return '/element_cards/default_background.jpg'; // Use default placeholder on failure
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
    return '/placeholder.png'; // Return a placeholder or handle error
  }

  // Access the layer detail directly using the layer key
  const layerDetail = LAYER_DETAILS[attribute.layer];

  if (!layerDetail || !layerDetail.folderName) {
    console.warn(`[utils] Layer detail or folderName not found for layer key: ${attribute.layer}. Using layer key as directory.`);
    // Fallback: Use the layer key directly if no detail found (might be incorrect)
    return `/assets/${attribute.layer}/${attribute.fullFilename}`;
  }

  // Construct the path using the folderName from LAYER_DETAILS
  // Example: layerDetail.folderName = "07 Right-Weapon", attribute.fullFilename = "07_001_WEAPON.png"
  // Returns: "/assets/07 Right-Weapon/07_001_WEAPON.png"
  return `/assets/${layerDetail.folderName}/${attribute.fullFilename}`;
}; 