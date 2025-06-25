import { NFTAttribute, StatsType } from '@/types';

/**
 * Represents the structure of data stored in the Supabase 'minted_nfts' table.
 * This is inferred from API route usage.
 */
export interface SupabaseNftData {
  origin: string;          // HandCash item origin, likely primary key
  name: string;            // NFT name
  image_url: string;       // URL of the generated/primary NFT image
  attributes: NFTAttribute[]; // Stored as JSONB in Supabase
  number?: number | null;    // NFT number within the series
  series?: string | null;    // Series identifier (e.g., "Series 1")
  team?: string | null;      // Team name (e.g., "NINJA PUNK GIRLS")
  stats?: StatsType | null;  // Combined stats, stored as JSONB
  owner_handle?: string | null; // HandCash handle of the current owner
  created_at?: string;     // Timestamp added by Supabase
  // Add other columns from your 'minted_nfts' table if they exist
}

/**
 * Represents the structure of data stored in the Supabase 'nft_listings' table.
 * This is inferred from NFTStoreContext and market page usage.
 */
export interface SupabaseListingData {
  identifier: string; // HandCash item origin, links to minted_nfts.origin
  list_price: number; // Selling price in BSV
  seller_handle: string; // HandCash handle of the seller
  is_listed: boolean; // True if currently listed, false otherwise
  listed_at?: string; // Timestamp when listed
  // Mirrored fields for display purposes:
  name: string;
  number: number;
  team: string;
  series: string;
  image_url: string; // Use image_url consistent with minted_nfts
  attributes: NFTAttribute[];
  stats: StatsType;
  qrData: string; // Often the origin
  // Add other columns from your 'nft_listings' table if they exist
} 