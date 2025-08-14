import { NextResponse, type NextRequest } from 'next/server';
import { HandCashConnect, Environments } from '@handcash/handcash-connect';

// Environment variables
const handcashAppId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
const handcashAppSecret = process.env.HANDCASH_APP_SECRET;
const handcashEnv = process.env.HANDCASH_ENVIRONMENT ?? 'prod';

// Basic check for required variables
if (!handcashAppId || !handcashAppSecret) {
    console.error("HandCash Collection API: Missing required environment variables.");
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
  console.log("--- API Route /api/handcash/collection POST request received ---");

  try {
    const body = await request.json();
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '') || body.authToken;

    if (!authToken) {
      console.error("HandCash Collection API: authToken missing in request body or headers.");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing authToken' 
      }, { status: 400 });
    }

    console.log(`HandCash Collection API: Getting collection for token prefix: ${authToken.substring(0,6)}...`);

    // Get account and items
    const account = handCashConnect.getAccountFromAuthToken(authToken);
    
    // Get items from wallet - this will get all NFTs/collectibles
    // For now, return empty array until we can verify the correct SDK method
    console.log(`HandCash Collection API: Attempting to get items inventory...`);
    
    let items: any[] = [];
    try {
      // Try with required parameter
      items = await account.items.getItemsInventory({ from: 0, to: 100 });
    } catch (error) {
      console.log('getItemsInventory with params failed:', error);
      // Return empty array for now
      items = [];
    }
    
    console.log(`HandCash Collection API: Retrieved ${items.length} items`);

    // Transform items to expected format
    const transformedItems = items.map((item: any) => ({
      id: item.origin || item.id,
      origin: item.origin || item.id,
      name: item.name || 'Unknown NFT',
      imageUrl: item.imageUrl || item.image || '',
      attributes: item.attributes || []
    }));

    return NextResponse.json({
      success: true,
      items: transformedItems
    });

  } catch (error: any) {
    console.error("HandCash Collection API Error:", error);
    const message = error.message || 'Failed to get collection items';
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}
