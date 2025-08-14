import { NextResponse, type NextRequest } from 'next/server';
import { HandCashConnect, Environments } from '@handcash/handcash-connect';

// Environment variables
const handcashAppId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
const handcashAppSecret = process.env.HANDCASH_APP_SECRET;
const handcashEnv = process.env.HANDCASH_ENVIRONMENT ?? 'prod';

// Basic check for required variables
if (!handcashAppId || !handcashAppSecret) {
    console.error("HandCash Melt NFT API: Missing required environment variables.");
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
  console.log("--- API Route /api/handcash/melt-nft POST request received ---");

  try {
    const body = await request.json();
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') || body.authToken;
    const { nftId } = body;

    if (!authToken) {
      console.error("HandCash Melt NFT API: authToken missing in request body or headers.");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing authToken' 
      }, { status: 400 });
    }

    if (!nftId) {
      console.error("HandCash Melt NFT API: Missing NFT ID.");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing NFT ID' 
      }, { status: 400 });
    }

    console.log(`HandCash Melt NFT API: Melting NFT ${nftId} for token prefix: ${authToken.substring(0,6)}...`);

    // Get account
    const account = handCashConnect.getAccountFromAuthToken(authToken);
    
    // For now, simulate the melt operation which should return element cards
    console.log(`HandCash Melt NFT API: Simulating NFT melt...`);
    
    // TODO: Implement actual HandCash NFT melt when SDK method is available
    // const meltResult = await account.items.melt({ nftId: nftId });
    
    const meltResult = {
      success: true,
      message: `Successfully melted NFT ${nftId} into element cards!`,
      transactionId: `melt_tx_${Date.now()}`,
      nftId: nftId,
      elementCards: [
        { name: 'Hair Element', rarity: 'rare' },
        { name: 'Weapon Element', rarity: 'common' },
        { name: 'Accessory Element', rarity: 'uncommon' }
      ]
    };

    console.log(`HandCash Melt NFT API: NFT melt completed:`, meltResult);

    return NextResponse.json({
      success: true,
      message: meltResult.message,
      transactionId: meltResult.transactionId,
      nftId: nftId,
      elementCards: meltResult.elementCards
    });

  } catch (error: any) {
    console.error("HandCash Melt NFT API Error:", error);
    const message = error.message || 'NFT melt failed';
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}
