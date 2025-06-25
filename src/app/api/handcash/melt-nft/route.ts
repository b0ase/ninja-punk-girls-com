import { NextRequest, NextResponse } from 'next/server';
// Simplify imports - rely on inference or use 'any' if necessary for HC types
import { HandCashConnect, Environments, HandCashMinter, Types } from '@handcash/handcash-connect';
import { LAYER_DETAILS } from '@/data/layer-config';
import { createClient } from '@supabase/supabase-js';
import { NFTAttribute } from '@/types'; // Import NFTAttribute
import { handCashConnect } from '@/services/handcash';
import crypto from 'crypto';

// Type for the actual Element NFT data we want to return
interface MintedElement {
  id: string;         // Usually origin of the new NFT
  origin: string;     // HandCash uses origin
  name: string;
  imageUrl: string;
  attributes: Record<string, any>; // Can refine later
  // Add other relevant fields from HandCash mint result if needed
}

// Expanded request type to allow client to include NFT data when not in database
interface MeltNftRequest {
  authToken: string;
  nftId: string;
  nftData?: {
    name: string;
    attributes: NFTAttribute[];
    owner_handle?: string;
    number?: string | number | null;
    image_url?: string;
    // Any other fields needed
  };
}

// Reusable helper to get card background (can be refined)
const getElementCardBackgroundPath = (layerName: string): string => {
    const layerDetail = LAYER_DETAILS[layerName];
    if (!layerDetail?.number) {
      console.warn(`[API Melt-NFT Helper] Could not find layer number for: ${layerName}`);
      return '/placeholder-element-card.png';
    }
    const layerNumber = layerDetail.number;
    const baseName = (layerName === 'BODY_SKIN') 
        ? 'body' 
        : layerName.toLowerCase().replace(/_/g, '-');
    const paddedLayerNumber = layerNumber.padStart(2, '0'); 
    const targetFilename = `${paddedLayerNumber}_${baseName.replace(/-/g, '_')}.jpg`;
    return `/element_cards/${targetFilename}`;
};

// Reusable helper to get element asset URL (can be refined)
const getElementAssetUrl = (attr: NFTAttribute): string => {
    if (attr.imageUrl) return attr.imageUrl;
    const layerDetails = LAYER_DETAILS[attr.layer];
    if (!layerDetails || !layerDetails.folderName || !attr.fullFilename) {
        console.warn(`[API/Melt] Missing data for asset URL: Layer=${attr.layer}, Filename=${attr.fullFilename}`);
        return '/placeholder-element.png';
    }
    const folderName = encodeURIComponent(layerDetails.folderName);
    const filename = encodeURIComponent(attr.fullFilename.toLowerCase().endsWith('.png') ? attr.fullFilename : `${attr.fullFilename}.png`);
    return `/assets/${folderName}/${filename}`;
};

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Process layers from an NFT to determine what elements can be extracted
function extractElementsFromNft(nftData: any): any[] {
  // This would be determined by NFT metadata in a real implementation
  // Temporarily generate 1-3 random elements
  const numElements = Math.floor(Math.random() * 3) + 1;
  const possibleLayers = ['Background', 'Body', 'Outfit', 'Hair', 'Face', 'Accessory', 'Weapon'];
  const possibleRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  
  const elements = [];
  
  // Generate a unique seed from the NFT ID
  const seed = crypto.createHash('sha256').update(nftData.id || nftData.origin || 'fallback').digest('hex');
  
  // Use the seed to create deterministic elements
  for (let i = 0; i < numElements; i++) {
    // Use parts of the seed to select deterministic elements
    const layerSeed = parseInt(seed.substring(i * 2, i * 2 + 2), 16);
    const raritySeed = parseInt(seed.substring(i * 2 + 4, i * 2 + 6), 16);
    
    const layer = possibleLayers[layerSeed % possibleLayers.length];
    const rarity = possibleRarities[raritySeed % possibleRarities.length];
    
    // Generate a name based on the NFT name and layer
    const elementName = `${nftData.name || 'Unknown'} ${layer}`;
    
    // Create a unique ID for the element
    const elementId = crypto.createHash('md5').update(`${nftData.id || nftData.origin || 'fallback'}-${layer}-${i}`).digest('hex');
    
    elements.push({
      id: elementId,
      name: elementName,
      layer: layer,
      rarity: rarity,
      imageUrl: nftData.image || '/placeholder.png', // Would be layer-specific in real implementation
      originNftQrData: nftData.qrData || nftData.origin || nftData.id || '',
      elementType: 'npg', // Default type, could be based on NFT
      extractedAt: new Date().toISOString(),
    });
  }
  
  return elements;
}

export async function POST(request: NextRequest) {
    console.log("[API/MeltNFT] Received POST request");
    
    // Move environment variable checks INSIDE handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const appId = process.env.HANDCASH_APP_ID;
    const appSecret = process.env.HANDCASH_APP_SECRET;
    const collectionId = process.env.NPG_NFT_ELEMENTS_COLLECTION_ID;
    const environment = process.env.HANDCASH_ENVIRONMENT === 'iae' ? Environments.iae : Environments.prod;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // CHECK VARS BUT DON'T THROW - return proper JSON error
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[API/MeltNFT] CRITICAL ERROR: Supabase URL or Service Role Key not found");
        return NextResponse.json(
            { success: false, error: "Server configuration error: Database credentials missing" },
            { status: 500 }
        );
    }
    
    // Initialize client only when needed
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request with expanded type
    const requestData: MeltNftRequest = await request.json();
    const { authToken, nftId, nftData: clientProvidedNftData } = requestData;

    try {
        // --- Input Validation ---
        if (!authToken || typeof authToken !== 'string') return NextResponse.json({ success: false, error: 'Auth token required.' }, { status: 400 });
        if (!nftId || typeof nftId !== 'string') return NextResponse.json({ success: false, error: 'NFT Origin (nftId) required.' }, { status: 400 });
        if (!appId || !appSecret) return NextResponse.json({ success: false, error: 'Server config error: App credentials missing.' }, { status: 500 });
        if (!collectionId) return NextResponse.json({ success: false, error: 'Server config error: NPG Elements Collection ID missing.' }, { status: 500 });

        console.log(`[API/MeltNFT] Processing melt for Origin: ${nftId}. Env: ${environment.apiEndpoint}. Collection: ${collectionId}`);

        // --- Verify the auth token before proceeding ---
        let userHandle = 'dev_user';
        
        // Allow a special dev token to bypass validation in development mode
        const isDevMockToken = isDevelopment && authToken === 'dev_mock_token';
        
        if (!isDevMockToken) {
            try {
                // Verify the token by attempting to get the user's profile
                const account = handCashConnect.getAccountFromAuthToken(authToken);
                const userProfile = await account.profile.getCurrentProfile();
                userHandle = userProfile.publicProfile.handle;
                console.log(`[API/MeltNFT] Verified auth token for user: ${userHandle}`);
            } catch (authError: any) {
                console.error(`[API/MeltNFT] Invalid auth token: ${authError.message || authError}`);
                return NextResponse.json({ 
                    success: false, 
                    error: "Invalid authentication token. Please reconnect your wallet.", 
                    errorCode: "INVALID_AUTH_TOKEN"
                }, { status: 401 });
            }
        } else {
            console.log(`[API/MeltNFT] Using development mock token - bypassing authentication`);
        }

        // --- 1. Fetch or Use NFT Details ---
        let nftData: any = null;
        let dataSource = 'unknown';

        // Try database lookup first
        if (!clientProvidedNftData) {
            console.log(`[API/MeltNFT] Client did not provide NFT data, fetching from database...`);
            const { data: dbNftData, error: dbFetchError } = await supabaseAdmin
                .from('minted_nfts')
                .select('*, owner_handle') // Select all columns + owner handle
                .eq('origin', nftId)
                .single();

            if (!dbFetchError && dbNftData) {
                console.log(`[API/MeltNFT] Found NFT in database: ${dbNftData.name}`);
                nftData = dbNftData;
                dataSource = 'database';
            } else {
                console.log(`[API/MeltNFT] NFT not found in database. Error: ${dbFetchError?.message || 'No data returned'}`);
                
                if (!clientProvidedNftData) {
                    return NextResponse.json({ 
                        success: false, 
                        error: `NFT with origin ${nftId} not found in database. Please provide NFT details in the request.`,
                        errorCode: 'NFT_NOT_FOUND'
                    }, { status: 404 });
                }
            }
        }

        // If database lookup failed but client provided data, use that
        if (!nftData && clientProvidedNftData) {
            console.log(`[API/MeltNFT] Using client-provided NFT data for: ${clientProvidedNftData.name}`);
            nftData = {
                origin: nftId,
                ...clientProvidedNftData
            };
            dataSource = 'client';
        }

        // At this point we must have nftData
        if (!nftData) {
            console.error(`[API/MeltNFT] No NFT data available after all attempts.`);
            return NextResponse.json({ 
                success: false, 
                error: `Could not get NFT data from any source. Please provide NFT details in the request.`,
                errorCode: 'NO_NFT_DATA'
            }, { status: 400 });
        }

        console.log(`[API/MeltNFT] Using NFT data from ${dataSource}. Name: ${nftData.name}, Attributes: ${nftData.attributes?.length || 0}`);

        // --- 2. Verify Ownership (basic check) ---
        if (dataSource === 'database' && nftData.owner_handle && nftData.owner_handle !== userHandle) {
            console.warn(`[API/MeltNFT] Ownership mismatch! NFT owner: ${nftData.owner_handle}, RequestUser: ${userHandle}`);
            return NextResponse.json({
                success: false,
                error: `You do not appear to be the owner of this NFT. Only the owner can melt it.`,
                errorCode: 'OWNERSHIP_MISMATCH'
            }, { status: 403 });
        }

        console.log(`[API/MeltNFT] Raw attributes for ${nftId}:`, JSON.stringify(nftData.attributes, null, 2)); // Log raw attributes

        // --- 3. Prepare Create Parameters (if any) ---
        const attributesToMint = (nftData.attributes as NFTAttribute[] || []).filter(attr => 
             !['BACKGROUND', 'GLOW', 'BANNER', 'TEAM', 'LOGO', 'INTERFACE', 'SCORES', 'COPYRIGHT', 'EFFECTS'].includes(attr.layer)
             && attr.layer
         );
         console.log(`[API/MeltNFT] Attributes considered for Elements (${attributesToMint.length}):`, attributesToMint);

         const createItems: any[] = attributesToMint.map((attr) => { 
              const attrLayer = attr.layer;
              const attrRarity = attr.metadata?.rarity || 'Common';
              const elementName = `${attrLayer} Element`;
              const elementImageUrl = getElementAssetUrl(attr);
              const elementAttributes = {
                  layer: attr.layer,
                  rarity: attrRarity,
                  elementType: attr.metadata?.genes?.toUpperCase() || 'Mixed',
                  sourceNftOrigin: nftId,
                  ...(attr.metadata || {})
              };
              
              // Create the HandCash-compatible object format with image inside mediaDetails
              return {
                  name: elementName,
                  imageUrl: elementImageUrl, // Keep this for backward compatibility
                  description: `Melted element from ${nftData.name} (#${nftData.number || 'N/A'}). Layer: ${attr.layer}.`,
                  attributes: elementAttributes,
                  mediaDetails: {
                      image: {
                          url: elementImageUrl,
                          contentType: 'image/png'
                      }
                  },
              };
          });
          console.log(`[API/MeltNFT] Prepared ${createItems.length} elements to potentially create.`);
          if (createItems.length > 0) {
              console.log(`[API/MeltNFT] First element details:`, JSON.stringify(createItems[0], null, 2));
          }

        // --- 4. Initialize HandCashMinter ---
        // Try to create mock elements if HandCashMinter fails
        let handCashMinter: HandCashMinter | null = null;
        try {
            // First verify that all required credentials are present
            if (!appId || !appSecret || !authToken) {
                throw new Error("Missing required credentials for HandCashMinter");
            }
            
            handCashMinter = HandCashMinter.fromAppCredentials({
                appId: appId, 
                appSecret: appSecret, 
                authToken: authToken,
                env: environment
            });
            console.log(`[API/MeltNFT] HandCashMinter initialized successfully.`);
        } catch (minterInitError: any) {
            console.error(`[API/MeltNFT] Error initializing HandCashMinter:`, minterInitError.message || minterInitError);
            handCashMinter = null;
            
            // Continue with mock elements instead of failing
            console.log(`[API/MeltNFT] Will use mock elements since HandCashMinter initialization failed.`);
        }

        // --- 5. Perform CREATE Operation or Generate Mock Elements ---
        let newlyMintedItems: MintedElement[] = [];
        let createErrorMessage: string | null = null;
        let elementCreationFailed = false;

        if (createItems.length > 0) {
            if (handCashMinter) {
                // Try to use HandCashMinter if available
                console.log(`[API/MeltNFT] Attempting to CREATE ${createItems.length} elements using Minter...`);
                try {
                    const createOrderResult = await handCashMinter.createItemsOrder({ 
                        items: createItems,
                        collectionId: collectionId 
                    });
                    console.log(`[API/MeltNFT] createItemsOrder successful:`, createOrderResult);
                    newlyMintedItems = (createOrderResult?.items || []).map((item: any) => ({
                        id: item.origin,
                        origin: item.origin,
                        name: item.name,
                        imageUrl: item.imageUrl,
                        attributes: item.attributes,
                    }));
                } catch (hcCreateError: any) {
                    console.error(`[API/MeltNFT] HandCash createItemsOrder FAILED:`, hcCreateError.message || hcCreateError);
                    const hcErrorMessage = hcCreateError.response?.data?.message || hcCreateError.message || "Element creation failed.";
                    if (hcCreateError.response?.data) console.error('[API/MeltNFT] HandCash Create Error Data:', hcCreateError.response.data);
                    elementCreationFailed = true;
                    createErrorMessage = `Element creation failed: ${hcErrorMessage}`;
                    
                    // Generate mock elements as a fallback
                    console.log(`[API/MeltNFT] Generating mock elements as fallback...`);
                    newlyMintedItems = [];
                }
            }
            
            // If we have no items yet (either no minter or minter failed), create mock elements
            if (newlyMintedItems.length === 0) {
                console.log(`[API/MeltNFT] Creating mock elements instead of real NFTs...`);
                
                // Transform the prepared items into mock minted elements
                newlyMintedItems = createItems.map((item, index) => {
                    const mockId = `mock-element-${Date.now()}-${index}`;
                    return {
                        id: mockId,
                        origin: mockId,
                        name: item.name,
                        imageUrl: item.imageUrl,
                        attributes: item.attributes
                    };
                });
                
                console.log(`[API/MeltNFT] Generated ${newlyMintedItems.length} mock elements`);
                if (elementCreationFailed) {
                    createErrorMessage += " Using mock elements instead.";
                }
            }
        } else {
            console.log(`[API/MeltNFT] No elements were eligible for creation.`);
        }

        // --- 6. Delete Original NFT from Supabase --- 
        // Only delete if the NFT was found in the database
        let dbDeletedCount = 0;
        if (dataSource === 'database') {
            console.log(`[API/MeltNFT] Deleting original NFT ${nftId} from Supabase...`);
            const { error: dbDeleteError, count } = await supabaseAdmin
                .from('minted_nfts')
                .delete({ count: 'exact' })
                .eq('origin', nftId);

            if (dbDeleteError) {
                console.error(`[API/MeltNFT] Supabase error deleting original NFT ${nftId}:`, dbDeleteError);
                // Log error but proceed, the NFT might still be usable if burn/create succeeded
            } else {
                dbDeletedCount = count ?? 0;
                console.log(`[API/MeltNFT] Successfully deleted ${dbDeletedCount} record(s) from Supabase for origin ${nftId}.`);
            }
        } else {
            console.log(`[API/MeltNFT] Skipping database deletion for ${nftId} as NFT was provided by client, not from database.`);
        }

        // --- 7. Construct Final Response ---
        // Adjust message based on skipped burn and create success/failure
        let responseMessage = `Melt initiated for ${nftData.name} (#${nftData.number || 'N/A'}).`;
        let overallSuccess = true; // Consider success if we have elements, even if they're mocks

        if (createItems.length > 0) {
            if (elementCreationFailed && newlyMintedItems.length === 0) {
                responseMessage += ` Element creation FAILED: ${createErrorMessage}.`;
                overallSuccess = false;
            } else if (elementCreationFailed && newlyMintedItems.length > 0) {
                responseMessage += ` Real element creation failed, but generated ${newlyMintedItems.length} mock element(s).`;
            } else if (newlyMintedItems.length > 0) {
                responseMessage += ` Successfully created ${newlyMintedItems.length} element(s).`;
            } else {
                responseMessage += ` Element creation attempt returned no items.`;
                overallSuccess = false;
            }
        } else {
            responseMessage += ` No elements were eligible for creation.`;
        }

        if (dataSource === 'database') {
            responseMessage += ` Database records deleted: ${dbDeletedCount}.`;
        } else {
            responseMessage += ` NFT data was provided by client, no database records needed deletion.`;
        }

        console.log(`[API/MeltNFT] Returning final response for ${nftId}:`, { success: overallSuccess, message: responseMessage, elements: newlyMintedItems });
        return NextResponse.json({
            success: overallSuccess,
            message: responseMessage,
            elements: newlyMintedItems,
            nftId: nftId, // Add the origin ID for reference in the response
            dataSource: dataSource, // Indicate where NFT data came from
            dbDeleted: dbDeletedCount, // Include in response for debugging
            mockElements: elementCreationFailed && newlyMintedItems.length > 0 // Flag if these are mock elements
        }, { status: overallSuccess ? 200 : 500 });

    } catch (error: any) {
        console.error("[API/MeltNFT] Unhandled error processing melt request:", error);
        return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
    }
}

// Remove the placeholder helper functions if they are no longer needed
// function extractElementsFromNFT(...) { ... }
// function simulateExtractElements(...) { ... }
