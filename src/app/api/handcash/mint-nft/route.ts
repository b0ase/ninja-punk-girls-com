import { NextResponse } from 'next/server';
// Import both Minter and Connect interfaces
import { HandCashMinter, HandCashConnect, Environments, Types } from '@handcash/handcash-connect'; 
import { NFTAttribute } from '@/types'; // Assuming your NFTAttribute type is defined here
// Import Supabase client
import { createClient } from '@supabase/supabase-js';

interface MintRequestData {
  authToken: string; // User's auth token
  name: string;
  imageUrl: string;
  attributes: NFTAttribute[];
  description?: string; // Optional description
}

export async function POST(request: Request) {
  // --- Move all environment variable checks inside handler ---
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const appId = process.env.HANDCASH_APP_ID;
  const appSecret = process.env.HANDCASH_APP_SECRET;
  const businessAuthToken = process.env.HANDCASH_BUSINESS_AUTH_TOKEN;
  const collectionId = process.env.NPG_NFT_COLLECTION_ID;
  const envString = process.env.HANDCASH_ENVIRONMENT;

  // --- Supabase initialization check ---
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("[API/Mint-NFT] CRITICAL ERROR: Supabase URL or Service Key is missing!");
    return NextResponse.json(
      { success: false, error: "Server configuration error: Supabase credentials missing" },
      { status: 500 }
    );
  }

  // Initialize Supabase admin client only after validation
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // --- <<< Add Specific Debug Logs >>> ---
  console.log(`[API/Mint-NFT Debug] HANDCASH_APP_ID: ${appId ? 'Loaded' : 'MISSING!'}`);
  console.log(`[API/Mint-NFT Debug] HANDCASH_APP_SECRET: ${appSecret ? 'Loaded' : 'MISSING!'}`);
  console.log(`[API/Mint-NFT Debug] BUSINESS_AUTH_TOKEN used for Minter: ${businessAuthToken ? businessAuthToken.substring(0,5)+'...' : 'MISSING!'}`);
  console.log(`[API/Mint-NFT Debug] NPG_NFT_COLLECTION_ID: ${collectionId ? 'Loaded' : 'MISSING!'}`);
  console.log(`[API/Mint-NFT Debug] HANDCASH_ENVIRONMENT: ${envString ? 'Loaded' : 'MISSING!'}`);
  // --- <<< End Debug Logs >>> ---

  // Runtime validation
  if (!appId || !appSecret || !businessAuthToken || !collectionId || !envString) {
    console.error('[API/Mint-NFT] CRITICAL ERROR: One or more required Handcash environment variables are missing!');
    return NextResponse.json({ success: false, error: 'Server configuration error: Missing Handcash variables.'}, { status: 500 });
  }
  
  const environment = envString === 'prod' ? Environments.prod : Environments.iae;

  // --- Initialize SDK Instances inside handler ---
  const handCashMinter = HandCashMinter.fromAppCredentials({
    appId: appId,
    appSecret: appSecret,
    authToken: businessAuthToken,
    // env: environment // Add if Minter needs environment context
  });

  const handCashConnect = new HandCashConnect({
      appId: appId, 
      appSecret: appSecret,
      env: environment
  });
  // --- End Initialization ---

  try {
    const { 
      authToken, 
      name, 
      imageUrl, 
      attributes, 
      description 
    }: MintRequestData = await request.json();

    // --- Input Validation ---
    if (!authToken) return NextResponse.json({ success: false, error: 'User Auth token is required.' }, { status: 400 });
    if (!name) return NextResponse.json({ success: false, error: 'NFT Name is required.' }, { status: 400 });
    if (!imageUrl) return NextResponse.json({ success: false, error: 'NFT Image URL is required.' }, { status: 400 });
    if (!Array.isArray(attributes)) return NextResponse.json({ success: false, error: 'NFT Attributes must be an array.' }, { status: 400 });
    if (!collectionId) return NextResponse.json({ success: false, error: 'Server configuration error: Collection ID missing (runtime check).'}, { status: 500 });

    console.log(`[API/Mint-NFT] Received mint request for: ${name}`);

    // --- Get User ID from User Auth Token ---
    let userProfile: any = null;
    let userId: string | undefined = undefined;
    try {
      console.log(`[API/Mint-NFT] Attempting to get account for token: ${authToken.substring(0,5)}...`);
      const account = handCashConnect.getAccountFromAuthToken(authToken);
      console.log(`[API/Mint-NFT] Account instance created. Fetching profile...`);
      userProfile = await account.profile.getCurrentProfile();
      userId = (userProfile as any)?.publicProfile?.id;
      console.log(`[API/Mint-NFT] Profile fetched. User ID: ${userId}`);
    } catch (profileError: any) {
        console.error('[API/Mint-NFT] Error fetching profile within mint route:', profileError);
        // Return specific error if profile fetch fails
        return NextResponse.json({ success: false, error: `Profile fetch failed: ${profileError.message || 'Unknown error'}` }, { status: 401 });
    }
    
    // Check userId AFTER the try/catch
    if (!userId) {
      console.error('[API/Mint-NFT] Could not retrieve user ID from profile data.', userProfile);
      return NextResponse.json({ success: false, error: 'Invalid profile data retrieved. Check user ID path.' }, { status: 401 });
    }
    // User ID is confirmed valid here

    // --- Prepare Item Data for Minting ---
    const itemData: Types.CreateItemMetadata = {
      name: name,
      description: description || `Ninja Punk Girls NFT - ${name}`, // Default description
      rarity: 'Common', // TODO: Determine rarity based on attributes?
      mediaDetails: {
        image: {
          url: imageUrl,
          contentType: 'image/png' // Assuming PNG, adjust if needed
        }
      },
      // Map attributes to Handcash format (name, value, displayType)
      attributes: attributes.map(attr => { 
        // Use the elementNameForAssetField from the NFTAttribute
        const traitValue = String(attr.elementNameForAssetField ?? 'N/A'); // Use the correct field! Fallback to 'N/A'

        // Keep the layer as the HandCash 'name' (Trait Type)
        const traitType = String(attr.layer ?? 'Unknown Layer');

        // Log the intended mapping
        console.log(`[API/Mint-NFT Mapping Corrected] Trait Type (layer): ${traitType}, Trait Value (name): ${traitValue}`);

        return {
          name: traitType,   // Use the layer name (e.g., "HAIR") as the trait_type for HandCash
          value: traitValue, // Use the actual attribute name (e.g., "Red-Cute") as the value for HandCash
          displayType: 'string'
        };
      }),
      quantity: 1,
      user: userId, // Mint directly TO the user!
      actions: [], // Add empty actions array
    };

    console.log(`[API/Mint-NFT] Submitting item creation order to collection ${collectionId} for user ${userId}`);

    // --- Call Minter SDK ---
    const creationOrder = await handCashMinter.createItemsOrder({
      collectionId: collectionId,
      items: [itemData]
    });

    console.log('[API/Mint-NFT] Mint order submitted successfully:', creationOrder);

    // --- Poll for Order Completion --- 
    let orderStatus: string | undefined = undefined;
    let attempts = 0;
    const maxAttempts = 15; 
    const delayMs = 2000; 

    console.log(`[API/Mint-NFT] Starting polling for order ${creationOrder.id} status to be 'completed'...`);
    while (attempts < maxAttempts) {
      let currentOrder = null;
      try {
        // Poll only for the order status
        currentOrder = await handCashMinter.getOrder(creationOrder.id); 
        orderStatus = currentOrder?.status;
        console.log(`[API/Mint-NFT] Poll attempt ${attempts + 1}, status: ${orderStatus}`);
        
        if (orderStatus === 'completed') {
            console.log(`[API/Mint-NFT] Order ${creationOrder.id} status is 'completed'.`);
            break; // Exit loop once status is completed
        }
        // Added check for potential failure status during polling
        if (orderStatus === 'failed' || orderStatus === 'expired') { 
            console.error(`[API/Mint-NFT] Order ${creationOrder.id} failed during polling with status: ${orderStatus}`);
            throw new Error(`Mint order failed with status: ${orderStatus}`);
        }

      } catch (pollError: any) {
        console.error(`[API/Mint-NFT] Error polling order status ${creationOrder.id} (Attempt ${attempts + 1}):`, pollError.message);
        // Rethrow or handle terminal errors - for now, just break and let final check handle it.
        console.warn(`[API/Mint-NFT] Breaking poll loop due to error.`);
        break; // Exit loop on polling error
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, delayMs)); 
    }

    // --- Check Final Status and Get Items --- 
    if (orderStatus !== 'completed') {
      console.error(`[API/Mint-NFT] Order ${creationOrder.id} did not reach 'completed' status after ${attempts} attempts. Last status: ${orderStatus || 'Polling Error/Timeout'}`);
      throw new Error(`Mint order processing failed. Final Status: ${orderStatus || 'Polling Error/Timeout'}`);
    }
    
    // --- NEW: Call getOrderItems to retrieve origin --- 
    let mintedItems: any[] | null = null;
    let finalOriginCheck: string | undefined = undefined;
    try {
        console.log(`[API/Mint-NFT] Order status is 'completed'. Fetching items using getOrderItems(${creationOrder.id})...`);
        mintedItems = await handCashMinter.getOrderItems(creationOrder.id);
        console.log(`[API/Mint-NFT] Received items from getOrderItems:`, JSON.stringify(mintedItems, null, 2));

        if (mintedItems && mintedItems.length > 0 && mintedItems[0].origin) {
            finalOriginCheck = mintedItems[0].origin;
            console.log(`[API/Mint-NFT] Successfully extracted origin: ${finalOriginCheck}`);
        } else {
            console.error('[API/Mint-NFT] Failed to get items or extract origin from getOrderItems response.', mintedItems);
            throw new Error('Failed to retrieve minted item details after order completion.');
        }
    } catch (getItemsError: any) {
        console.error(`[API/Mint-NFT] Error calling getOrderItems for order ${creationOrder.id}:`, getItemsError);
        throw new Error(`Failed to retrieve minted item details: ${getItemsError.message}`);
    }
    // --- End NEW logic --- 

    // If we reach here, origin was found successfully.
    console.log(`[API/Mint-NFT] Order ${creationOrder.id} processing finished. Origin: ${finalOriginCheck}`);

    // --- Save to Supabase --- 
    console.log(`[API/Mint-NFT] Saving metadata to Supabase for origin: ${finalOriginCheck}`);
    const {
      data: dbData,
      error: dbError,
      status: dbStatus,
      count: dbCount,
    } = await supabaseAdmin
      .from('minted_nfts')
      .insert([
        {
          origin: finalOriginCheck,
          name: itemData.name, // Use prepared name
          image_url: imageUrl, // Use original imageUrl passed in request
          attributes: attributes, // Use original attributes array passed in request
          number: null, // TODO: Extract number from name if possible?
          series: null, // TODO: Determine series?
          team: null, // TODO: Determine team?
          stats: null, // TODO: Add stats if generated?
          owner_handle: userProfile?.publicProfile?.handle || null, // Save owner handle if available
        },
      ])
      .select(); // Ensure we request the inserted data back

    // Rigorous check for insert success
    if (dbError) {
      console.error('[API/Mint-NFT] Supabase insert error:', dbError);
      // Throw an error to prevent proceeding with an inconsistent state
      throw new Error(
        `Failed to save NFT metadata to database. Status: ${dbStatus}, Error: ${dbError.message}`,
      );
    } else if (!dbData || dbData.length === 0) {
      // This case might happen due to RLS or other issues not throwing a direct error
      console.error(
        '[API/Mint-NFT] Supabase insert succeeded according to status, but no data returned. Check RLS policies.',
        { dbStatus, dbCount },
      );
      throw new Error(
        'Failed to save NFT metadata (no data returned). Check RLS policies.',
      );
    } else {
      console.log(
        '[API/Mint-NFT] Successfully saved metadata to Supabase:', dbData,
      );
    }
    // --- End Save to Supabase ---

    // --- Success Response --- 
    return NextResponse.json({ 
        success: true, 
        message: 'NFT Minted and metadata saved.',
        orderId: creationOrder.id, 
        origin: finalOriginCheck // Return the origin as well
    });

  } catch (error: any) {
    console.error("[API/Mint-NFT] Error processing mint request:", error);
    let handcashErrorData = null;
    if (error.response?.data) {
        handcashErrorData = error.response.data;
        console.error("[API/Mint-NFT] HandCash Error Data:", handcashErrorData);
    }
    
    // Determine error message
    let errorMessage = error.message || "Failed to submit mint order.";
    if (error.httpStatusCode === 401 || error.message?.toLowerCase().includes('authorization')) {
        errorMessage = "Minting authorization failed. Check Business Auth Token.";
    } else if (error.httpStatusCode === 403 || error.message?.toLowerCase().includes('permission') || error.message?.toLowerCase().includes('feature')) {
        errorMessage = "Minting permission denied. Feature might not be enabled by Handcash.";
    } else if (error.message?.toLowerCase().includes('creator') || error.message?.toLowerCase().includes('owner')) {
        errorMessage = "Minting failed: App might not be registered creator.";
    }
    
    // <<< Add log BEFORE returning response >>>
    console.error(`[API/Mint-NFT] Preparing to return error response. Status: ${error.httpStatusCode || 500}, Message: ${errorMessage}`);
    // <<< End log >>>

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        handcashError: handcashErrorData
      },
      { status: error.httpStatusCode || 500 }
    );
  }
} 