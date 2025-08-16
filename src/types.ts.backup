// src/types.ts

// Represents metadata associated with a single asset file
export interface AssetMetadata {
  elementName: string; // e.g., "Paddle", "G-String"
  characterName?: string; // e.g., "Miyuki"
  genes?: string; // e.g., "Erobot", "NPG"
  rarity?: string; // e.g., "Common", "Mythical"
  hasRGB?: boolean; // Placeholder for color data
}

// Represents the overall statistics for the NFT
export interface StatsType {
  strength: number;
  speed: number;
  skill: number;
  stamina: number;
  stealth: number;
  style: number;
}

// Represents a single selected attribute for the final NFT
export interface NFTAttribute {
  layer: string; // The layer key (e.g., 'LEFT-WEAPON')
  elementNameForAssetField?: string; // NEW - Element Name (e.g., G-String)
  assetNumber?: string; // NEW - Asset number (e.g., 004)
  fullFilename: string; // Full filename (e.g., 19_004_...png)
  imageUrl?: string; // URL of the specific element asset image
  metadata: AssetMetadata; // Parsed metadata
  stats: StatsType; // Stats associated with this attribute
}

// Represents the complete NFT data structure
export interface NFTType {
  number: number; // Unique identifier number
  name: string; // Generated name (e.g., from japanese-names)
  team: string; // e.g., EROBOTZ, NINJA PUNK GIRLS
  series: string; // e.g., Series 1
  totalSupply: number; // Total supply for the series/collection
  image: string; // URL or data URL of the generated image
  attributes: NFTAttribute[]; // Array of selected attributes
  stats: StatsType; // Combined stats from attributes
  qrData: string; // Data to be encoded in QR code
}

// Define AssetDetail type based on usage in elements page
export interface AssetDetail {
  filename: string;
  name: string;
  assetNumber?: string | number | null;
  rarity?: string | null;
  character?: string | null;
  genes?: string | null;
  series?: string | null;
  stats?: Partial<StatsType>;
  layerKey?: string; // Added during processing in elements page
  // Add any other properties fetched by AssetContext
}

// Interface for the structure of decoded token data
// ... existing code ... 