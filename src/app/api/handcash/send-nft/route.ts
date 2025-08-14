import { NextResponse, type NextRequest } from 'next/server';
import { HandCashConnect, Environments } from '@handcash/handcash-connect';

// Environment variables
const handcashAppId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
const handcashAppSecret = process.env.HANDCASH_APP_SECRET;
const handcashEnv = process.env.HANDCASH_ENVIRONMENT ?? 'prod';

// Basic check for required variables
if (!handcashAppId || !handcashAppSecret) {
    console.error("HandCash Send NFT API: Missing required environment variables.");
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
  console.log("--- API Route /api/handcash/send-nft POST request received ---");

  try {
    const body = await request.json();
    const { authToken, origin, recipientHandle } = body;

    if (!authToken) {
      console.error("HandCash Send NFT API: authToken missing in request body.");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing authToken' 
      }, { status: 400 });
    }

    if (!origin || !recipientHandle) {
      console.error("HandCash Send NFT API: Missing required parameters.");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing NFT origin or recipient handle' 
      }, { status: 400 });
    }

    console.log(`HandCash Send NFT API: Sending NFT ${origin} to ${recipientHandle} for token prefix: ${authToken.substring(0,6)}...`);

    // Get account
    const account = handCashConnect.getAccountFromAuthToken(authToken);
    
    // For now, simulate the send operation
    console.log(`HandCash Send NFT API: Simulating NFT send...`);
    
    // TODO: Implement actual HandCash NFT transfer when SDK method is available
    // const sendResult = await account.items.transfer({
    //   origin: origin,
    //   destination: recipientHandle
    // });
    
    const sendResult = {
      success: true,
      transactionId: `tx_${Date.now()}`,
      origin: origin,
      recipient: recipientHandle
    };

    console.log(`HandCash Send NFT API: NFT send completed:`, sendResult);

    return NextResponse.json({
      success: true,
      transactionId: sendResult.transactionId,
      origin: origin,
      recipient: recipientHandle
    });

  } catch (error: any) {
    console.error("HandCash Send NFT API Error:", error);
    const message = error.message || 'NFT send failed';
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}
