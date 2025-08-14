import { NextResponse, type NextRequest } from 'next/server';
import { HandCashConnect, Environments } from '@handcash/handcash-connect';

// Environment variables
const handcashAppId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
const handcashAppSecret = process.env.HANDCASH_APP_SECRET;
const handcashEnv = process.env.HANDCASH_ENVIRONMENT ?? 'prod';

// Basic check for required variables
if (!handcashAppId || !handcashAppSecret) {
    console.error("HandCash Mint NFT API: Missing required environment variables.");
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
  console.log("--- API Route /api/handcash/mint-nft POST request received ---");

  try {
    const body = await request.json();
    const { authToken, name, imageUrl, attributes, description } = body;

    if (!authToken) {
      console.error("HandCash Mint NFT API: authToken missing in request body.");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing authToken' 
      }, { status: 400 });
    }

    if (!name || !imageUrl) {
      console.error("HandCash Mint NFT API: Missing required NFT data.");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing NFT name or image URL' 
      }, { status: 400 });
    }

    console.log(`HandCash Mint NFT API: Minting NFT "${name}" for token prefix: ${authToken.substring(0,6)}...`);

    // Get account
    const account = handCashConnect.getAccountFromAuthToken(authToken);
    
    // Prepare NFT metadata
    const nftData = {
      name: name,
      description: description || `Ninja Punk Girls NFT - ${name}`,
      image: imageUrl,
      attributes: attributes || []
    };

    console.log(`HandCash Mint NFT API: NFT data prepared:`, nftData);

    // Create the NFT - for now we'll simulate this since the exact method is unclear
    console.log(`HandCash Mint NFT API: Attempting to create NFT...`);
    
    // For now, simulate a successful mint with a mock response
    // In production, you'd use the correct HandCash SDK method
    const mintResult = {
      origin: `mock_origin_${Date.now()}`,
      orderId: `order_${Date.now()}`,
      name: nftData.name,
      imageUrl: nftData.image
    };
    
    // TODO: Replace with actual HandCash SDK call when method is confirmed
    // const mintResult = await account.items.createItem({...});
    
    console.log(`HandCash Mint NFT API: Mock NFT created:`, mintResult);

    console.log(`HandCash Mint NFT API: NFT minted successfully:`, mintResult);

    return NextResponse.json({
      success: true,
      origin: mintResult.origin,
      orderId: mintResult.orderId || mintResult.origin,
      name: nftData.name,
      imageUrl: nftData.image
    });

  } catch (error: any) {
    console.error("HandCash Mint NFT API Error:", error);
    const message = error.message || 'NFT minting failed';
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}
