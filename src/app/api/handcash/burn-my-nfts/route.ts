import { NextResponse } from 'next/server';
import { handCashConnect } from '@/services/handcash';
import { Types, HandCashMinter } from '@handcash/handcash-connect';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[API/BurnMyNfts] CRITICAL ERROR: Supabase URL or Service Key is missing!');
}
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceKey || 'placeholder-service-key'
);
// --- End Supabase Setup ---

const MAX_ITEMS_PER_PAGE = 100; // HandCash API limit for fetching inventory

export async function POST(request: Request) {
    const collectionId = process.env.NPG_NFT_COLLECTION_ID;
    const appId = process.env.HANDCASH_APP_ID; // Need App ID for Minter
    const appSecret = process.env.HANDCASH_APP_SECRET; // Need App Secret for Minter

    try {
        const { authToken } = await request.json();

        // --- Input Validation ---
        if (!authToken || typeof authToken !== 'string') {
            return NextResponse.json({ success: false, error: 'Auth token is required.' }, { status: 400 });
        }
        if (!collectionId) {
            console.error('[API/BurnMyNFTs] Error: NPG_NFT_COLLECTION_ID env var not set.');
            return NextResponse.json({ success: false, error: 'Server config error: Collection ID missing.' }, { status: 500 });
        }
        if (!appId || !appSecret) {
            console.error('[API/BurnMyNFTs] Error: HANDCASH_APP_ID or HANDCASH_APP_SECRET env vars not set.');
            return NextResponse.json({ success: false, error: 'Server config error: App credentials missing.' }, { status: 500 });
        }
        if (!supabase) {
            console.error('[API/BurnMyNFTs] Error: Supabase client failed to initialize.');
            return NextResponse.json({ success: false, error: 'Server config error: DB connection failed.' }, { status: 500 });
        }

        // --- Get User Account ---
        const account = handCashConnect.getAccountFromAuthToken(authToken);
        const profile = await account.profile.getCurrentProfile();
        console.log(`[API/BurnMyNFTs] Initiating burn request for user: ${profile.publicProfile.handle}`);

        // --- Fetch ALL user's NFTs in the collection ---
        let allItems: Types.Item[] = [];
        let currentOffset = 0;
        let hasMore = true;
        console.log(`[API/BurnMyNFTs] Fetching all items in collection ${collectionId} for user ${profile.publicProfile.handle}...`);
        while (hasMore) {
            try {
                const itemsPage: Types.Item[] = await account.items.getItemsInventory({
                    collectionId: collectionId,
                    from: currentOffset,
                    to: currentOffset + MAX_ITEMS_PER_PAGE,
                });
                if (itemsPage.length > 0) {
                    allItems = allItems.concat(itemsPage);
                    currentOffset += itemsPage.length;
                    console.log(`[API/BurnMyNFTs] Fetched ${itemsPage.length} items, total: ${allItems.length}`);
                }
                if (itemsPage.length < MAX_ITEMS_PER_PAGE) {
                    hasMore = false;
                }
            } catch (fetchError: any) {
                console.error(`[API/BurnMyNFTs] Error fetching items inventory page (offset ${currentOffset}):`, fetchError);
                return NextResponse.json(
                    { success: false, error: 'Failed to fetch complete NFT inventory for burning.' },
                    { status: fetchError.httpStatusCode || 500 }
                );
            }
        }
        console.log(`[API/BurnMyNFTs] Total items found for user ${profile.publicProfile.handle} in collection: ${allItems.length}`);

        if (allItems.length === 0) {
            return NextResponse.json({ success: true, message: "No NFTs found in this collection to burn.", itemsBurned: 0, dbDeleted: 0 });
        }

        // --- Burn the NFTs using HandCashMinter ---
        let successfullyBurnedCount = 0;
        let failedBurnCount = 0;
        const originsToBurn = allItems.map(item => item.origin);

        console.log(`[API/BurnMyNFTs] Attempting batch burn for ${originsToBurn.length} origins...`);

        try {
            // Initialize Minter with App Credentials AND User Auth Token
            const handCashMinter = HandCashMinter.fromAppCredentials({
                appId: appId,
                appSecret: appSecret,
                authToken: authToken, // User's token for authorization
            });

            // Submit the burn order for all fetched origins
            const burnOrderResult = await handCashMinter.burnAndCreateItemsOrder({
                burn: {
                    origins: originsToBurn,
                }
                // No 'issue' section needed for just burning
            });

            console.log('[API/BurnMyNFTs] Burn order submitted successfully:', burnOrderResult);
            // Assume success if the call doesn't throw an error
            successfullyBurnedCount = originsToBurn.length;

        } catch (burnError: any) {
            failedBurnCount = originsToBurn.length; // If batch fails, assume all failed
            successfullyBurnedCount = 0;
            console.error(`[API/BurnMyNFTs] Failed to submit burn order for ${originsToBurn.length} origins:`, burnError.message || burnError);
            if (burnError.response?.data) {
                console.error('[API/BurnMyNFTs] HandCash Burn Error Data:', burnError.response.data);
            }
            // Return error response immediately if burn fails
            return NextResponse.json(
                { success: false, error: burnError.message || "Failed to submit burn order to HandCash." },
                { status: burnError.httpStatusCode || 500 }
            );
        }

        console.log(`[API/BurnMyNFTs] Burn submission complete. Attempted: ${originsToBurn.length}, Assumed Success: ${successfullyBurnedCount}, Assumed Failed: ${failedBurnCount}`);

        // --- Delete from Supabase (Only if burn submission was successful) ---
        let dbDeletedCount = 0;
        if (successfullyBurnedCount > 0) {
            console.log(`[API/BurnMyNFTs] Attempting to delete ${originsToBurn.length} records from Supabase...`);
            try {
                const { count, error: dbError } = await supabase
                    .from('minted_nfts')
                    .delete({ count: 'exact' }) // Request count of deleted rows
                    .in('origin', originsToBurn);

                if (dbError) {
                    console.error("[API/BurnMyNFTs] Supabase error deleting burned NFTs:", dbError);
                    // Don't fail the whole request, but log the error
                } else {
                    dbDeletedCount = count ?? 0;
                    console.log(`[API/BurnMyNFTs] Successfully deleted ${dbDeletedCount} records from Supabase.`);
                    if (dbDeletedCount !== originsToBurn.length) {
                        console.warn(`[API/BurnMyNFTs] Mismatch: Attempted to burn ${originsToBurn.length} origins but deleted ${dbDeletedCount} DB records.`);
                    }
                }
            } catch (dbCatchError) {
                console.error("[API/BurnMyNFTs] Exception during Supabase delete operation:", dbCatchError);
            }
        } else {
            console.log("[API/BurnMyNFTs] Skipping Supabase delete because burn submission failed.");
        }

        // --- Return Response ---
        return NextResponse.json({
            success: true,
            message: `Burn attempt submitted. Attempted: ${originsToBurn.length}. DB Deleted: ${dbDeletedCount}.`,
            itemsTargeted: originsToBurn.length,
            itemsBurnedSuccessfully: successfullyBurnedCount, // Based on API call success
            dbDeleted: dbDeletedCount,
        });

    } catch (error: any) {
        console.error("[API/BurnMyNFTs] Unhandled error processing burn request:", error);
        if (error.response?.data) {
            console.error("[API/BurnMyNFTs] HandCash Error Data:", error.response.data);
        }
        return NextResponse.json(
            { success: false, error: error.message || "Failed to process burn request." },
            { status: error.httpStatusCode || 500 }
        );
    }
} 