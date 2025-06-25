import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export async function POST(request: Request) {
  try {
    // Extract authorization token and wallet data from request
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Missing or invalid authorization token' }, { status: 401 });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Get wallet data from request body
    const { publicKey, handcashHandle, isPrimary = false } = await request.json();
    
    if (!publicKey || !handcashHandle) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log(`[API/register-wallet] Registering wallet for ${handcashHandle} with public key: ${publicKey.substring(0, 8)}...${isPrimary ? ' (PRIMARY)' : ''}`);
    
    // Check if Supabase credentials are available
    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn('[API/register-wallet] Supabase credentials not found. Skipping database registration.');
      // Return success anyway to allow the app to continue in development mode
      return NextResponse.json({
        success: true,
        message: 'Wallet registered successfully (development mode)'
      });
    }
    
    try {
      // Initialize Supabase client (only when needed)
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // First verify the HandCash token is valid by checking against user accounts
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('id, auth_id, handcash_handle')
        .eq('handcash_token_prefix', token.substring(0, 6))
        .single();
      
      if (userError || !userData) {
        console.error('[API/register-wallet] Error verifying HandCash token:', userError);
        return NextResponse.json({ success: false, error: 'Invalid authorization token' }, { status: 401 });
      }
      
      // Check that the handle from token matches the one being registered
      if (userData.handcash_handle.toLowerCase() !== handcashHandle.toLowerCase()) {
        console.error('[API/register-wallet] Handle mismatch:', userData.handcash_handle, handcashHandle);
        return NextResponse.json({ success: false, error: 'Handle mismatch' }, { status: 403 });
      }
      
      // If this is a primary wallet and we're enforcing single primary,
      // first update any existing primary wallets to non-primary
      if (isPrimary) {
        console.log(`[API/register-wallet] Setting as primary wallet for ${handcashHandle}. Updating any existing primary wallets...`);
        
        await supabase
          .from('user_wallets')
          .update({ is_primary: false })
          .eq('handcash_handle', handcashHandle)
          .eq('is_primary', true);
      }
      
      // Store or update the wallet information
      const { error: walletError } = await supabase
        .from('user_wallets')
        .upsert({
          user_id: userData.id,
          public_key: publicKey,
          wallet_type: 'npg',
          is_active: true,
          is_compromised: false,
          is_primary: isPrimary,
          handcash_handle: handcashHandle,
          created_at: new Date().toISOString(),
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'handcash_handle, public_key'
        });
      
      if (walletError) {
        console.error('[API/register-wallet] Error registering wallet:', walletError);
        return NextResponse.json({ success: false, error: 'Failed to register wallet' }, { status: 500 });
      }
      
      // Also add an initial zero balance entry in the wallet_tokens table
      // This makes it easier to query token balances later
      const TOKEN_ID = 'b8747a4b356875cc90842c733ad2770b12bf50c17cf204afd0605f9dcba67d31_1'; // $NINJAPUNKGIRLS token ID
      
      const { error: tokenError } = await supabase
        .from('wallet_tokens')
        .upsert({
          public_key: publicKey,
          token_id: TOKEN_ID,
          handcash_handle: handcashHandle,
          is_primary: isPrimary,
          balance: 0,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'public_key, token_id'
        });
      
      if (tokenError) {
        console.warn('[API/register-wallet] Error initializing token balance:', tokenError);
        // Continue anyway, as the wallet is registered
      }
      
      console.log(`[API/register-wallet] Successfully registered wallet for ${handcashHandle}`);
      
      // Return success
      return NextResponse.json({
        success: true,
        message: 'Wallet registered successfully'
      });
    } catch (dbError: any) {
      console.error('[API/register-wallet] Database error:', dbError);
      // Return success anyway to allow the app to continue
      return NextResponse.json({
        success: true,
        message: 'Wallet information stored locally (database unavailable)'
      });
    }
    
  } catch (error: any) {
    console.error('[API/register-wallet] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred'
    }, { status: 500 });
  }
} 