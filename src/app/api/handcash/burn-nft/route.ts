import { NextResponse } from 'next/server';
import { handCashConnect } from '@/services/handcash'; // Use existing instance for connect features if needed elsewhere
import { Types, HandCashMinter, Environments } from '@handcash/handcash-connect'; // Import directly from SDK
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    // Move environment variable checks INSIDE handler
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';
    const appId = process.env.HANDCASH_APP_ID;
    const appSecret = process.env.HANDCASH_APP_SECRET;
    // Determine environment based on an env variable, default to prod
    const environment = process.env.HANDCASH_ENVIRONMENT === 'iae' 
        ? Environments.iae 
        : Environments.prod;

    // CHECK VARS BUT DON'T THROW - return proper JSON error  
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error("[API/BurnNFT] CRITICAL ERROR: Supabase URL or Service Role Key is missing!");
        return NextResponse.json(
            { success: false, error: "Server configuration error: Supabase credentials missing" },
            { status: 500 }
        );
    }
    
    // Initialize client only when needed
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { authToken, itemOrigin } = await request.json();

        // --- Input Validation ---
        if (!authToken || typeof authToken !== 'string') {
            return NextResponse.json({ success: false, error: 'Auth token is required.' }, { status: 400 });
        }
        if (!itemOrigin || typeof itemOrigin !== 'string') {
            return NextResponse.json({ success: false, error: 'Item Origin is required.' }, { status: 400 });
        }
        if (!appId || !appSecret) {
            console.error('[API/BurnNFT] Error: HANDCASH_APP_ID or HANDCASH_APP_SECRET env vars not set.');
            return NextResponse.json({ success: false, error: 'Server config error: App credentials missing.' }, { status: 500 });
        }

        console.log(`[API/BurnNFT] Received burn request for origin: ${itemOrigin}. Env: ${environment.apiEndpoint}`);

        // --- Burn the NFT using HandCashMinter ---
        let burnOrderResult: any;
        try {
            // Initialize Minter with App Credentials AND User Auth Token
            const handCashMinter = HandCashMinter.fromAppCredentials({
                appId: appId,
                appSecret: appSecret,
                authToken: authToken, // User's token for authorization
                env: environment // Specify environment
            });

            // Submit the burn order for the single origin
            burnOrderResult = await handCashMinter.burnAndCreateItemsOrder({
                burn: {
                    origins: [itemOrigin], // Array with the single origin
                }
            });

            console.log(`[API/BurnNFT] Burn order submitted successfully for origin ${itemOrigin}:`, burnOrderResult);

        } catch (burnError: any) {
            console.error(`[API/BurnNFT] Failed to submit burn order for origin ${itemOrigin}:`, burnError.message || burnError);
            if (burnError.response?.data) {
                console.error('[API/BurnNFT] HandCash Burn Error Data:', burnError.response.data);
            }
            return NextResponse.json(
                { success: false, error: burnError.message || "Failed to submit burn order to HandCash." },
                { status: burnError.httpStatusCode || 500 }
            );
        }

        // --- Delete from Supabase (Only if burn submission was successful) ---
        let dbDeletedCount = 0;
        console.log(`[API/BurnNFT] Attempting to delete record from Supabase for origin: ${itemOrigin}...`);
        try {
            const { count, error: dbError } = await supabaseAdmin
                .from('minted_nfts')
                .delete({ count: 'exact' })
                .eq('origin', itemOrigin); // Match the specific origin

            if (dbError) {
                console.error("[API/BurnNFT] Supabase error deleting burned NFT:", dbError);
                // Log error but proceed, the item is burned on chain.
            } else {
                dbDeletedCount = count ?? 0;
                console.log(`[API/BurnNFT] Successfully deleted ${dbDeletedCount} record(s) from Supabase for origin ${itemOrigin}.`);
            }
        } catch (dbCatchError: any) {
            console.error("[API/BurnNFT] Exception during Supabase delete operation:", dbCatchError?.message);
        }

        // --- Return Response ---
        return NextResponse.json({
            success: true,
            message: `Burn attempt for ${itemOrigin} submitted successfully. DB Deleted: ${dbDeletedCount}.`,
            itemOrigin: itemOrigin,
            dbDeleted: dbDeletedCount,
            burnOrderResult: burnOrderResult // Include burn result for potential client use
        });

    } catch (error: any) {
        console.error("[API/BurnNFT] Unhandled error processing burn request:", error);
        // Avoid leaking detailed errors unless necessary
        return NextResponse.json(
            { success: false, error: "Internal server error processing burn request." },
            { status: 500 }
        );
    }
} 