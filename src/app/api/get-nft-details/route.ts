import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Setup ---
// Ensure these are set in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[API/get-nft-details] CRITICAL ERROR: Supabase URL or Service Key is missing!');
  // Avoid returning detailed error in production, but log it
}

// Initialize Supabase client - ensure env vars are loaded if initializing outside
// For serverless/edge functions, initialize inside the handler is safer.
// For now, assuming server environment where this is safe.
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || 'placeholder-service-key'
);
// --- End Supabase Setup ---

// Define the expected structure of the NFT data in the DB
// Adjust this based on your actual 'minted_nfts' table structure
interface MintedNFTData {
  origin: string;
  name: string;
  image_url: string;
  attributes: any; // Use 'any' or define a more specific type if possible
  number?: number | null;
  series?: string | null;
  team?: string | null;
  stats?: any | null; // Use 'any' or define StatsType
  owner_handle?: string | null;
  created_at?: string;
  // Add any other relevant columns from your table
}

export async function GET(request: Request) {
  // Re-check environment variables at runtime in case they weren't loaded globally
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[API/get-nft-details] Runtime CRITICAL ERROR: Supabase env vars missing!');
    return NextResponse.json({ success: false, error: 'Server configuration error.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');

  console.log(`[API/get-nft-details] Received request for origin: ${origin}`);

  if (!origin) {
    console.log('[API/get-nft-details] Origin parameter missing');
    return NextResponse.json({ success: false, error: 'Origin parameter is required.' }, { status: 400 });
  }

  try {
    console.log(`[API/get-nft-details] Querying Supabase for origin: ${origin}`);
    const { data, error } = await supabase
      .from('minted_nfts') // Ensure this table name matches your Supabase table
      .select('*')        // Select all columns, or specify needed ones like 'origin, name, image_url, attributes'
      .eq('origin', origin)
      .single();          // Expect only one row for a given origin

    if (error) {
      // Log the error but potentially differentiate between 'not found' and other errors
      console.error(`[API/get-nft-details] Supabase query error for origin ${origin}:`, error);
      if (error.code === 'PGRST116') { // Code for "Row not found"
         console.log(`[API/get-nft-details] NFT not found in database for origin: ${origin}`);
         return NextResponse.json({ success: false, error: 'NFT details not found.' }, { status: 404 });
      }
      // Throw other errors to be caught by the generic catch block
      throw error;
    }

    if (data) {
      console.log(`[API/get-nft-details] Found NFT data for origin: ${origin}`);
      // Ensure the returned data conforms to the expected type if needed, or cast
      const nftData: MintedNFTData = data;
      return NextResponse.json({ success: true, data: nftData });
    } else {
      // This case should ideally be caught by error.code PGRST116, but handle defensively
      console.log(`[API/get-nft-details] NFT not found (data was null, no error code) for origin: ${origin}`);
      return NextResponse.json({ success: false, error: 'NFT details not found.' }, { status: 404 });
    }

  } catch (error: any) {
    console.error(`[API/get-nft-details] Unexpected error processing request for origin ${origin}:`, error);
    return NextResponse.json({ success: false, error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
  }
} 