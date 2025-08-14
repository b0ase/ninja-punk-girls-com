import { NextResponse, type NextRequest } from 'next/server';
import { HandCashConnect, Environments } from '@handcash/handcash-connect';

// Environment variables
const handcashAppId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
const handcashAppSecret = process.env.HANDCASH_APP_SECRET;
const handcashEnv = process.env.HANDCASH_ENVIRONMENT ?? 'prod';

// Basic check for required variables
if (!handcashAppId || !handcashAppSecret) {
    console.error("HandCash Balance API: Missing required environment variables.");
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
  console.log("--- API Route /api/handcash/balance POST request received ---");

  try {
    const body = await request.json();
    const { authToken } = body;

    if (!authToken) {
      console.error("HandCash Balance API: authToken missing in request body.");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing authToken' 
      }, { status: 400 });
    }

    console.log(`HandCash Balance API: Getting balance for token prefix: ${authToken.substring(0,6)}...`);

    // Get account and wallet balance
    const account = handCashConnect.getAccountFromAuthToken(authToken);
    const wallet = account.wallet;
    
    // Get spendable balance
    const spendableBalance = await wallet.getSpendableBalance();
    console.log(`HandCash Balance API: Retrieved balance:`, spendableBalance);

    // Return the balance data in expected format
    return NextResponse.json({
      success: true,
      totalBalance: spendableBalance
    });

  } catch (error: any) {
    console.error("HandCash Balance API Error:", error);
    const message = error.message || 'Failed to get wallet balance';
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}
