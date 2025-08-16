export type AssetType = {
  name: string;
  path: string;
};

export type LayerType = {
  name: string;
  assets: AssetType[];
};

export interface StatsType {
  strength: number;
  speed: number;
  skill: number;
  stamina: number;
  stealth: number;
  style: number;
}

export interface AssetMetadata {
  elementName: string;
  characterName: string;
  genes: string;
  rarity: string;
  hasRGB: boolean;
}

export interface NFTAttribute {
  layer: string;
  name: string;
  asset: string;
  fullFilename?: string;
  metadata?: AssetMetadata;
  stats: StatsType;
  elementType?: string;
  cardLayoutUrl?: string;
}

export interface NFTType {
  number: number;
  name: string;
  team: string;
  series: string;
  totalSupply: number;
  attributes: NFTAttribute[];
  stats: StatsType;
  qrData: string;
  image?: string;
  listPrice?: number;
}

export interface KeypairType {
  publicKey: string;
  privateKey: string;
  shortKey: string;
  qrCode: string;
}

export interface LayerAsset {
  filename: string;
  rarity: number;
}

export interface ImageDataType {
  [layer: string]: {
    [filename: string]: string;
  };
}

export interface LayerConfig {
  name: string;
  folder: string;
  required: boolean;
  excludeFromSummary: boolean;
}

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
  layerKey?: string; // Added for reference in UI components
  // Legacy fields for backward compatibility
  type?: string;
  series?: string;
}

export interface WalletItem {
  id: string;
  origin: string;
  name: string;
  imageUrl: string;
  attributes?: NFTAttribute[];
  number?: number;
  isListed?: boolean;
  listPrice?: number;
}

export interface Asset {
  // ... existing code ...
}

export interface GroupedAssets {
  // ... existing code ...
}

export interface DirectoryStructure {
  // ... existing code ...
} 