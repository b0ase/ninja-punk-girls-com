import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Token constants - matching the one in token-balance endpoint
const TOKEN_ID = 'b8747a4b356875cc90842c733ad2770b12bf50c17cf204afd0605f9dcba67d31_1'; // $NINJAPUNKGIRLS token ID

// Helper to get user handle from token
async function getUserHandleFromToken(token: string, supabase: SupabaseClient): Promise<string | null> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('auth_users')
      .select('handcash_handle')
      .eq('handcash_token_prefix', token.substring(0, 6)) // Match by prefix
      .single();

    if (userError || !userData) {
      console.error('[API/get-stack-token-balance] Error verifying token prefix:', userError);
      return null;
    }
    return userData.handcash_handle as string | null;
  } catch (error: any) {
    console.error('[API/get-stack-token-balance] Exception verifying token:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Get Auth Token
    const { authToken, publicKey } = await request.json();
    if (!authToken || typeof authToken !== 'string') {
      return NextResponse.json({ success: false, error: 'Auth token is required.' }, { status: 400 });
    }

    // 2. Check Supabase Configuration
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[API/get-stack-token-balance] Supabase credentials not configured. Cannot fetch balance.');
      // Return 0 balance gracefully if DB is not set up
      return NextResponse.json({ 
        success: true, 
        balance: 0,
        tokenId: TOKEN_ID,
        tokenSymbol: 'NPG',
        message: 'Database not configured.' 
      });
    }

    // 3. Initialize Supabase and Verify User Handle
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const handle = await getUserHandleFromToken(authToken, supabase);

    if (!handle) {
      return NextResponse.json({ success: false, error: 'Invalid or expired authentication token.' }, { status: 401 });
    }
    console.log(`[API/get-stack-token-balance] Verified handle: ${handle}`);

    // 4. Query for tokens associated with this wallet
    try {
      // If a public key was provided, get the balance for that specific wallet
      let query = supabase
        .from('wallet_tokens')
        .select('balance')
        .eq('token_id', TOKEN_ID)
        .eq('handcash_handle', handle);

      // If publicKey is provided, filter by it
      if (publicKey) {
        query = query.eq('public_key', publicKey);
      } else {
        // Otherwise, get the balance for the user's primary $NPG wallet
        query = query.eq('is_primary', true);
      }

      const { data: tokenData, error: tokenError } = await query.maybeSingle();

      if (tokenError) {
        console.error('[API/get-stack-token-balance] Supabase query error:', tokenError);
        return NextResponse.json({ 
          success: true, 
          balance: 0, 
          tokenId: TOKEN_ID,
          tokenSymbol: 'NPG',
          message: 'Error querying token database.' 
        });
      }

      const balance = tokenData?.balance || 0;
      console.log(`[API/get-stack-token-balance] Found balance: ${balance} for ${handle}${publicKey ? ` (wallet: ${publicKey.substring(0, 8)}...)` : ''}`);
      
      return NextResponse.json({ 
        success: true, 
        balance,
        tokenId: TOKEN_ID,
        tokenSymbol: 'NPG'
      });

    } catch (dbError: any) {
      console.error('[API/get-stack-token-balance] Error connecting/querying Supabase:', dbError);
      return NextResponse.json({ 
        success: true, 
        balance: 0, 
        tokenId: TOKEN_ID,
        tokenSymbol: 'NPG',
        message: 'Database connection error.' 
      });
    }

  } catch (error: any) {
    // Catch broader errors (e.g., request parsing)
    console.error("[API/get-stack-token-balance] General error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request." },
      { status: 500 }
    );
  }
} 