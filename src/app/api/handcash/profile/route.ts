import { NextResponse, type NextRequest } from 'next/server';
import { HandCashConnect, Environments } from '@handcash/handcash-connect';

// Environment variables
const handcashAppId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
const handcashAppSecret = process.env.HANDCASH_APP_SECRET;
const handcashEnv = process.env.HANDCASH_ENVIRONMENT ?? 'prod';

// Basic check for required variables
if (!handcashAppId || !handcashAppSecret) {
    console.error("HandCash Profile API: Missing required environment variables.");
}

// Determine HandCash environment
const hcEnvironment = handcashEnv.toLowerCase() === 'iae'
  ? Environments.iae
  : Environments.prod;

// Initialize HandCash Connect SDK
const handCashConnect = new HandCashConnect({
    appId: handcashAppId || 'placeholder-app-id',
    appSecret: handcashAppSecret || 'placeholder-app-secret',
    env: hcEnvironment
});

export async function POST(request: NextRequest) {
  console.log("--- API Route /api/handcash/profile POST request received ---");

  try {
    const body = await request.json();
    const { authToken } = body;

    if (!authToken) {
      console.error("HandCash Profile API: authToken missing in request body.");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing authToken' 
      }, { status: 400 });
    }

    console.log(`HandCash Profile API: Validating token prefix: ${authToken.substring(0,6)}...`);

    // Verify token and get HandCash profile
    const account = handCashConnect.getAccountFromAuthToken(authToken);
    const { publicProfile } = await account.profile.getCurrentProfile();
    
    console.log(`HandCash Profile API: Profile retrieved for handle: ${publicProfile.handle}`);

    // Return the profile data
    return NextResponse.json({
      success: true,
      profile: {
        publicProfile: {
          handle: publicProfile.handle,
          displayName: publicProfile.displayName,
          avatarUrl: publicProfile.avatarUrl,
          // publicKey might not be available in the profile, try to access it safely
          publicKey: (publicProfile as any).publicKey || undefined
        }
      }
    });

  } catch (error: any) {
    console.error("HandCash Profile API Error:", error);
    const message = error.message || 'Profile validation failed';
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 401 }); // 401 for invalid/expired token
  }
}
