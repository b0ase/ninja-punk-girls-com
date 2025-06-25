import { NextResponse } from 'next/server';
import { handCashConnect } from '@/services/handcash';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Token constants
const TOKEN_ID = 'b8747a4b356875cc90842c733ad2770b12bf50c17cf204afd0605f9dcba67d31_1'; // $NINJAPUNKGIRLS token ID

export async function POST(request: Request) {
  let handle: string | undefined;
  try {
    const { authToken } = await request.json();

    if (!authToken || typeof authToken !== 'string') {
      return NextResponse.json({ success: false, error: 'Auth token is required.' }, { status: 400 });
    }

    try {
      // Get HandCash account from auth token
      const account = handCashConnect.getAccountFromAuthToken(authToken);
      const userProfile = await account.profile.getCurrentProfile();
      handle = userProfile.publicProfile.handle;
      console.log(`[API/HandCash/TokenBalance] Verified user: ${handle}`);

    } catch (authError: any) {
      console.error("[API/HandCash/TokenBalance] HandCash Auth error:", authError);
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token. Please reconnect wallet.' },
        { status: 401 }
      );
    }

    // Proceed only if handle was successfully obtained
    if (!handle) {
      // This case should technically be caught above, but as a safeguard:
      return NextResponse.json({ success: false, error: 'Could not verify user handle.' }, { status: 401 });
    }

    let balance = 0; // Default to 0 balance
    
    // Check if Supabase credentials are properly configured
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[API/HandCash/TokenBalance] Supabase credentials not configured. Returning 0 balance.');
      // Return 0 balance gracefully if DB is not set up
      return NextResponse.json({ 
        success: true, 
        balance: 0, 
        tokenId: TOKEN_ID, 
        tokenSymbol: 'NPG',
        warning: 'Database connection not configured.'
      });
    }
    
    // Attempt to query the database
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      console.log(`[API/HandCash/TokenBalance] Querying Supabase for handle: ${handle}, token: ${TOKEN_ID}`);
      
      const { data: tokenData, error: tokenError } = await supabase
        .from('user_tokens') // Ensure this table exists
        .select('balance')
        .eq('handcash_handle', handle)
        .eq('token_id', TOKEN_ID)
        .single();

      if (tokenError) {
        if (tokenError.code === 'PGRST116') { // Code for "No rows found"
          console.log(`[API/HandCash/TokenBalance] No token record found for ${handle}. Returning 0 balance.`);
          balance = 0;
        } else {
          // Log other database errors but still return 0 balance
          console.error('[API/HandCash/TokenBalance] Supabase query error:', tokenError);
          balance = 0; // Default to 0 on other DB errors
        }
      } else if (tokenData) {
        balance = tokenData.balance || 0; // Use fetched balance
        console.log(`[API/HandCash/TokenBalance] Found balance: ${balance} for ${handle}`);
      } else {
        // Should be caught by PGRST116, but as a fallback
        balance = 0;
      }

    } catch (dbError: any) {
      console.error('[API/HandCash/TokenBalance] Error connecting/querying Supabase:', dbError);
      // Return 0 balance if there's an issue connecting or querying
      balance = 0;
    }

    // Return the final balance (either fetched or default 0)
    return NextResponse.json({ 
      success: true,
      balance,
      tokenId: TOKEN_ID,
      tokenSymbol: 'NPG'
    });

  } catch (error: any) {
    // Catch broader errors like request parsing issues
    console.error("[API/HandCash/TokenBalance] General error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request." },
      { status: 500 }
    );
  }
} 