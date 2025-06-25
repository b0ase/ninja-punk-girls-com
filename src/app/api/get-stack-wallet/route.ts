import { NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Helper to get user handle from token (you might want to centralize this)
async function getUserHandleFromToken(token: string, supabase: SupabaseClient): Promise<string | null> {
  try {
    const { data: userData, error: userError } = await supabase
      .from('auth_users') // Assuming this table stores token prefixes and handles
      .select('handcash_handle')
      .eq('handcash_token_prefix', token.substring(0, 6)) // Match by prefix
      .single();

    if (userError || !userData) {
      console.error('[API/get-stack-wallet] Error verifying token prefix:', userError);
      return null;
    }
    return userData.handcash_handle as string | null;
  } catch (error) {
    console.error('[API/get-stack-wallet] Exception verifying token:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Get Auth Token
    const { authToken } = await request.json();
    if (!authToken || typeof authToken !== 'string') {
      return NextResponse.json({ success: false, error: 'Auth token is required.' }, { status: 400 });
    }

    // 2. Check Supabase Configuration
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[API/get-stack-wallet] Supabase credentials not configured. Cannot fetch wallet.');
      // Return null publicKey gracefully if DB is not set up
      return NextResponse.json({ 
        success: true, 
        publicKey: null,
        message: 'Database not configured.' 
      });
    }

    // 3. Initialize Supabase and Verify User Handle
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const handle = await getUserHandleFromToken(authToken, supabase);

    if (!handle) {
      return NextResponse.json({ success: false, error: 'Invalid or expired authentication token.' }, { status: 401 });
    }
    console.log(`[API/get-stack-wallet] Checked handle: ${handle}`);

    // 4. Query for Existing Stack Wallet
    try {
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets') // Ensure this table name matches your schema
        .select('public_key')
        .eq('handcash_handle', handle)
        .eq('wallet_type', 'npg_stack') // Filter specifically for the stack wallet
        .eq('is_active', true) // Optional: only fetch active wallets
        .maybeSingle(); // Use maybeSingle to handle 0 or 1 result without error

      if (walletError) {
        // Log DB errors but don't fail the request entirely, just return null key
        console.error('[API/get-stack-wallet] Supabase query error:', walletError);
        return NextResponse.json({ 
          success: true, 
          publicKey: null, 
          message: 'Error querying wallet database.' 
        });
      }

      if (walletData && walletData.public_key) {
        console.log(`[API/get-stack-wallet] Found registered stack wallet for ${handle}`);
        return NextResponse.json({ success: true, publicKey: walletData.public_key });
      } else {
        console.log(`[API/get-stack-wallet] No registered stack wallet found for ${handle}`);
        return NextResponse.json({ success: true, publicKey: null });
      }

    } catch (dbError: any) {
      console.error('[API/get-stack-wallet] Error connecting/querying Supabase:', dbError);
      return NextResponse.json({ 
        success: true, 
        publicKey: null, 
        message: 'Database connection error.' 
      });
    }

  } catch (error: any) {
    // Catch broader errors (e.g., request parsing)
    console.error("[API/get-stack-wallet] General error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process request." },
      { status: 500 }
    );
  }
} 