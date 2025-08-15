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
    
    // Debug: Log the structure of the first few items to understand the data format
    if (items.length > 0) {
      console.log(`HandCash Collection API: Sample item structure:`, JSON.stringify(items[0], null, 2));
      if (items.length > 1) {
        console.log(`HandCash Collection API: Second item structure:`, JSON.stringify(items[1], null, 2));
      }
    }

    // Filter items to only include NPG and Erobot NFTs
    const filteredItems = items.filter((item: any) => {
      // Skip items that don't have basic structure
      if (!item || typeof item !== 'object') {
        console.log(`HandCash Collection API: Skipping invalid item:`, item);
        return false;
      }
      
      // Check if the item has qrData that matches our game patterns
      const qrData = item.qrData || item.name || item.id || '';
      const itemName = item.name || item.id || '';
      
      // NPG NFTs start with "npg-nft-" or contain "npg"
      const isNPG = qrData.toLowerCase().includes('npg-nft-') || 
                   qrData.toLowerCase().includes('npg-') ||
                   itemName.toLowerCase().includes('npg');
      
      // Erobot NFTs might have similar patterns
      const isErobot = qrData.toLowerCase().includes('erobot') || 
                      qrData.toLowerCase().includes('erobot-') ||
                      itemName.toLowerCase().includes('erobot');
      
      // Also check if the item has team information that matches our games
      const team = item.team || '';
      const isOurTeam = team.toLowerCase().includes('ninja punk girls') || 
                       team.toLowerCase().includes('erobotz') || 
                       team.toLowerCase().includes('npg');
      
      // Check if the item has attributes that match our game structure
      const hasOurAttributes = item.attributes && Array.isArray(item.attributes) && 
        item.attributes.some((attr: any) => 
          attr.layer && ['BODY_SKIN', 'HAIR', 'FACE', 'ARMS', 'WEAPON', 'TOP', 'BOOTS', 'MASK', 'HORNS'].includes(attr.layer)
        );
      
      // Check if the item has metadata that suggests it's from our game
      const metadata = item.metadata || {};
      const hasGameMetadata = metadata.team || metadata.series || metadata.game;
      
      const isOurGame = isNPG || isErobot || isOurTeam || hasOurAttributes || hasGameMetadata;
      
      if (!isOurGame) {
        console.log(`HandCash Collection API: Filtering out non-game item: ${itemName} (qrData: ${qrData}, team: ${team}, hasAttributes: ${!!hasOurAttributes})`);
      } else {
        console.log(`HandCash Collection API: Keeping game item: ${itemName} (type: ${isNPG ? 'NPG' : isErobot ? 'Erobot' : 'Other'})`);
      }
      
      return isOurGame;
    });

    console.log(`HandCash Collection API: Filtered to ${filteredItems.length} game items out of ${items.length} total items`);

    // Transform filtered items to expected format
    const transformedItems = filteredItems.map((item: any) => ({
      id: item.origin || item.id,
      origin: item.origin || item.id,
      name: item.name || 'Unknown NFT',
      imageUrl: item.imageUrl || item.image || '',
      attributes: item.attributes || [],
      qrData: item.qrData || '',
      team: item.team || ''
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
