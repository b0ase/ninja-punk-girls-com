// Layer configuration for NFT generation
// <<< REMOVE This Temporary Log >>>
// console.log("@@@ Loading layer-config.ts module @@@ Timestamp:", Date.now());
// <<<

// Updated LAYER_ORDER based on actual folder numbers and logical drawing
export const LAYER_ORDER = [
  'BACKGROUND',    // 29
  'GLOW',          // 28
  'BANNER',        // 27
  'DECALS',        // 26
  'REAR_HAIR',     // 24
  'REAR_HORNS',    // 23
  'BACK',          // 22
  'BODY_SKIN',     // 21 (Mapped from Body folder, representing Skin)
  'ARMS',          // 20
  'UNDERWEAR',     // 19
  'FACE',          // 18
  'BOTTOM',        // 17
  'BRA',           // 16
  'ACCESSORIES',   // 15
  'JEWELLERY',     // 14 (Mapped to EARRINGS conceptually for now)
  'BOOTS',         // 13
  'TOP',           // 12
  'MASK',          // 11 (Mapped to HEADWEAR conceptually for now)
  'HAIR',          // 10
  'HORNS',         // 09
  'LEFT_WEAPON',   // 08
  'RIGHT_WEAPON',  // 07
  'EFFECTS',       // 06
  'INTERFACE',     // 05
  'TEAM',          // 04
  'SCORES',        // 03 - Unused?
  'COPYRIGHT',     // 02 - Unused?
  'LOGO',          // 01
];

// Updated LAYER_DETAILS reflecting actual folder structure with dashes instead of spaces
export const LAYER_DETAILS: Record<string, { number: string; folderName: string }> = {
  LOGO: { number: '01', folderName: '01-Logo' },
  COPYRIGHT: { number: '02', folderName: '02-Copyright' },
  SCORES: { number: '03', folderName: '03-Scores' },       // Note: This directory doesn't exist
  TEAM: { number: '04', folderName: '04-Team' },
  INTERFACE: { number: '05', folderName: '05-Interface' },
  EFFECTS: { number: '06', folderName: '06-Effects' },
  RIGHT_WEAPON: { number: '07', folderName: '07-Right-Weapon' },
  LEFT_WEAPON: { number: '08', folderName: '08-Left-Weapon' },
  HORNS: { number: '09', folderName: '09-Horns' },
  HAIR: { number: '10', folderName: '10-Hair' },
  MASK: { number: '11', folderName: '11-Mask' },
  TOP: { number: '12', folderName: '12-Top' },
  BOOTS: { number: '13', folderName: '13-Boots' },
  JEWELLERY: { number: '14', folderName: '14-Jewellery' },
  ACCESSORIES: { number: '15', folderName: '15-Accessories' },
  BRA: { number: '16', folderName: '16-Bra' },
  BOTTOM: { number: '17', folderName: '17-Bottom' },
  FACE: { number: '18', folderName: '18-Face' },
  UNDERWEAR: { number: '19', folderName: '19-Underwear' },
  ARMS: { number: '20', folderName: '20-Arms' },
  BODY_SKIN: { number: '21', folderName: '21-Body' },
  BACK: { number: '22', folderName: '22-Back' },
  REAR_HORNS: { number: '23', folderName: '23-Rear-Horns' },
  REAR_HAIR: { number: '24', folderName: '24-Rear-Hair' },
  DECALS: { number: '26', folderName: '26-Decals' },
  BANNER: { number: '27', folderName: '27-Banner' },
  GLOW: { number: '28', folderName: '28-Glow' },
  BACKGROUND: { number: '29', folderName: '29-Background' },

  // Removed layers from previous config that don't match folders:
  // SKIN: { number: '01', folderName: '01 Skin' },          // Replaced by BODY_SKIN
  // CLOTHING: { number: '02', folderName: '02 Clothing' },  // Represented by TOP, BOTTOM, BRA, UNDERWEAR, BOOTS
  // HEADWEAR: { number: '08', folderName: '08 Headwear' },  // Replaced by MASK
  // EYEWEAR: { number: '09', folderName: '09 Eyewear' },    // No folder found
  // FACIAL_HAIR: { number: '10', folderName: '10 Facial Hair' }, // No folder found
  // EARRINGS: { number: '11', folderName: '11 Earrings' },   // Replaced by JEWELLERY
};

// Mapping from folder names used in file structure to canonical Layer Names
// Regenerated based on the updated LAYER_DETAILS
export const FOLDER_MAPPING: Record<string, string> = Object.entries(
  LAYER_DETAILS,
).reduce(
  (acc, [layerKey, details]) => {
    acc[details.folderName] = layerKey;
    return acc;
  },
  {} as Record<string, string>,
);

// Reverse mapping: Layer Name -> Folder Name
// Regenerated based on the updated LAYER_DETAILS
export const LAYER_NAME_MAPPING: Record<string, string> = Object.entries(
  LAYER_DETAILS,
).reduce(
  (acc, [layerName, details]) => {
    acc[layerName] = details.folderName;
    return acc;
  },
  {} as Record<string, string>,
);

export const DRAW_ORDER = LAYER_ORDER.map((layer) => LAYER_DETAILS[layer]?.folderName).filter(Boolean) as string[]; // Added safety check for missing layers

// Define the structure for layer details
export interface LayerDetail {
  number: string;
  folderName: string;
}

// Define the explicit set of character layer keys based on the numeric prefix 07-29
// We use LAYER_DETAILS to map the number prefix back to the key used in availableAssets
export const CHARACTER_LAYER_KEYS_SET: Set<string> = new Set(
    Object.entries(LAYER_DETAILS)
        .filter(([key, details]) => {
            const layerNumber = parseInt(details.number, 10);
            return layerNumber >= 7 && layerNumber <= 29;
        })
        .map(([key, details]) => key) // Extract the key (e.g., 'BODY')
);

// Layers to exclude from summary (decorative/metadata layers)
export const EXCLUDED_LAYERS = [
  'BACKGROUND',
  'GLOW',
  'BANNER',
  'DECALS'
];

// Required layers might need updating based on the new keys
export const REQUIRED_LAYERS = [
  'BACKGROUND',
  'BODY_SKIN', // Was BODY
  'FACE',
  'HAIR',
  'BRA',
  'UNDERWEAR',
  'ARMS',
  'MASK',
  'TEAM',
  'LOGO',
  'INTERFACE',
  'COPYRIGHT'
];

// Layer configuration with detailed information
// Regenerated based on the updated LAYER_ORDER and LAYER_DETAILS
export const LAYER_CONFIG = LAYER_ORDER.map(layer => ({
  name: layer,
  folder: LAYER_DETAILS[layer]?.folderName || 'unknown', // Added safety check
  required: REQUIRED_LAYERS.includes(layer),
  excludeFromSummary: EXCLUDED_LAYERS.includes(layer) // EXCLUDED_LAYERS might also need review
})); 