import { NextResponse } from 'next/server';
import { handCashConnect } from '@/services/handcash';
import { Types } from '@handcash/handcash-connect'; // Import Types for Item
// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// --- Supabase Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Use Service Role Key for backend operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[API/Collection] CRITICAL ERROR: Supabase URL or Service Key is missing!');
  // Avoid returning detailed error in production, but log it
}
// Initialize Supabase client. For serverless functions, initializing outside should be fine.
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || 'placeholder-service-key'
);
// --- End Supabase Setup ---

// Remove hardcoded origin prefix - we'll fetch by collection
// const NINJA_PUNK_GIRLS_ORIGIN_ID_PREFIX = '...'; 

// No need for DetailedWalletItem interface anymore
/*
interface DetailedWalletItem {
  id: string; 
  origin: string;
  name: string;
  imageUrl: string;
  attributes: Types.ItemAttribute[];
}
*/

export async function POST(request: Request) {
  // Load Collection ID from environment variables
  const collectionId = process.env.NPG_NFT_COLLECTION_ID;

  try {
    // <<< Get token from header >>>
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('[API/Collection] Authorization header missing or invalid');
        return NextResponse.json({ success: false, error: 'Authorization header missing or invalid' }, { status: 401 });
    }
    const authToken = authHeader.split(' ')[1];
    // <<< Get limit/offset from body >>>
    const { limit = 20, offset = 0 } = await request.json(); // Default limit 20, offset 0

    if (!authToken) { // Check token after extraction
      console.error('[API/Collection] Auth token missing after split');
      return NextResponse.json({ error: 'Auth token is required.' }, { status: 400 });
    }
    if (!collectionId) {
        console.error('[API/Collection] Error: NPG_NFT_COLLECTION_ID environment variable is not set.');
        return NextResponse.json({ success: false, error: 'Server configuration error: Collection ID missing.'}, { status: 500 });
    }
    if (!supabase) { // Check if supabase client initialized (due to potential missing env vars)
        console.error('[API/Collection] Error: Supabase client failed to initialize. Check server logs.');
        return NextResponse.json({ success: false, error: 'Server configuration error: Database connection failed.'}, { status: 500 });
    }

    // Validate limit and offset
    const numLimit = Number(limit) || 20;
    const numOffset = Number(offset) || 0;
    if (numLimit <= 0 || numOffset < 0 || numLimit > 100) {
      return NextResponse.json({ error: 'Invalid limit (1-100) or offset (>=0).' }, { status: 400 });
    }
    
    // Calculate from and to
    const fromIndex = numOffset;
    const toIndex = numOffset + numLimit; // SDK 'to' is exclusive index

    console.log(`[API/Collection] Fetching inventory page for token: ${authToken.substring(0, 5)}..., collection: ${collectionId}, from: ${fromIndex}, to: ${toIndex}`);
    const account = handCashConnect.getAccountFromAuthToken(authToken);
    
    // Fetch inventory WITHOUT attributes from HandCash
    const items: Types.Item[] = await account.items.getItemsInventory({
        collectionId: collectionId,
        from: fromIndex,
        to: toIndex,
        // fetchAttributes: false // Explicitly false or omitted (default is false)
    });

    console.log(`[API/Collection] Fetched ${items.length} basic items from HandCash.`);

    // If no items fetched, return early
    if (items.length === 0) {
        console.log(`[API/Collection] No items found for this range. Returning empty array.`);
        return NextResponse.json({
            success: true,
            items: []
        });
    }

    // --- Fetch Attributes from Supabase ---
    const origins = items.map(item => item.origin);
    console.log(`[API/Collection] Fetching metadata from Supabase for ${origins.length} origins:`, origins);

    const { data: dbNfts, error: dbError } = await supabase
        .from('minted_nfts')
        .select('origin, name, image_url, attributes') // Select necessary fields
        .in('origin', origins);

    if (dbError) {
        console.error("[API/Collection] Supabase error fetching NFT metadata:", dbError);
        // Decide how to handle: Return error, or return items without attributes?
        // For now, log error and proceed, potentially returning items without attributes.
        // Consider returning an error response for critical DB failures.
        // return NextResponse.json({ success: false, error: "Failed to fetch metadata from database." }, { status: 500 });
        console.warn("[API/Collection] Proceeding without Supabase metadata due to error.");
    }

    // Create a map for quick lookup: origin -> { attributes, name, imageUrl }
    const attributeMap = new Map<string, { attributes: any[], name?: string, imageUrl?: string }>();
    if (dbNfts) {
        dbNfts.forEach(nft => {
            attributeMap.set(nft.origin, {
                attributes: nft.attributes || [], // Use db attributes, default empty
                name: nft.name,                  // Store db name
                imageUrl: nft.image_url          // Store db image url
            });
        });
        console.log(`[API/Collection] Found metadata for ${attributeMap.size} origins in Supabase.`);
    }
    // --- End Supabase Fetch ---

    // Map HandCash items and merge with Supabase data
    const walletItems = items.map(item => {
        const dbData = attributeMap.get(item.origin);
        return {
            id: item.id,
            origin: item.origin,
            // Use DB name/image if available, otherwise HandCash's
            name: dbData?.name || item.name,
            imageUrl: dbData?.imageUrl || item.imageUrl,
            // Use attributes from DB if found, otherwise default to empty array
            attributes: dbData?.attributes || [],
            // number: item.number // Property 'number' does not exist on type 'Item'.
        }
    });

    console.log(`[API/Collection] Returning ${walletItems.length} items merged with Supabase metadata.`);

    return NextResponse.json({
      success: true,
      items: walletItems
    });

  } catch (error: any) {
    console.error("[API/Collection] Error processing collection request:", error);
    // Log specific HandCash error data if available
    if (error.response?.data) {
        console.error("[API/Collection] HandCash Error Data:", error.response.data);
    }
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch collection inventory." },
      { status: error.httpStatusCode || 500 }
    );
  }
} 