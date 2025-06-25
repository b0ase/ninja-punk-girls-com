import { NextResponse } from 'next/server';
import { handCashConnect } from '@/services/handcash';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Mock elements for development
const getMockElements = (handle: string) => {
  const mockElements = [];
  const possibleLayers = ['Background', 'Body', 'Outfit', 'Hair', 'Face', 'Accessory', 'Weapon'];
  const possibleRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  
  // Generate 5-10 random elements
  const count = Math.floor(Math.random() * 6) + 5;
  
  for (let i = 0; i < count; i++) {
    const layer = possibleLayers[Math.floor(Math.random() * possibleLayers.length)];
    const rarity = possibleRarities[Math.floor(Math.random() * possibleRarities.length)];
    
    mockElements.push({
      id: `mock-element-${i}-${handle}`,
      name: `${layer} Element ${i + 1}`,
      imageUrl: '/placeholder.png',
      layer: layer,
      originNftQrData: `mock-nft-${i}`,
      rarity: rarity,
      elementType: 'npg',
      cardLayoutUrl: '/placeholder.png',
      createdAt: new Date().toISOString(),
      owner: handle,
      stackId: i < 3 ? 'stack-1' : (i < 6 ? 'stack-2' : null) // Assign some elements to stacks
    });
  }
  
  return mockElements;
};

export async function POST(request: Request) {
  try {
    const { authToken } = await request.json();

    if (!authToken || typeof authToken !== 'string') {
      return NextResponse.json({ success: false, error: 'Auth token is required.' }, { status: 400 });
    }

    // Verify HandCash auth token
    let handle: string;
    try {
      const account = handCashConnect.getAccountFromAuthToken(authToken);
      const userProfile = await account.profile.getCurrentProfile();
      handle = userProfile.publicProfile.handle;
      console.log(`[API/HandCash/GetElements] Verified user: ${handle}`);
    } catch (authError: any) {
      console.error("[API/HandCash/GetElements] HandCash Auth error:", authError);
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token. Please reconnect wallet.' },
        { status: 401 }
      );
    }

    // Check if Supabase credentials are properly configured
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('[API/HandCash/GetElements] Supabase credentials not configured. Returning mock elements.');
      // Return mock elements for development if DB is not set up
      return NextResponse.json({ 
        success: true, 
        elements: getMockElements(handle),
        warning: 'Database connection not configured - returning mock data.'
      });
    }
    
    // Connect to Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Query elements
    console.log(`[API/HandCash/GetElements] Querying Supabase for elements owned by: ${handle}`);
    const { data: elements, error } = await supabase
      .from('elements')
      .select('*')
      .eq('owner', handle);
      
    if (error) {
      console.error('[API/HandCash/GetElements] Error querying elements:', error);
      // Return mock data for development
      return NextResponse.json({ 
        success: true, 
        elements: getMockElements(handle),
        warning: 'Error querying database - returning mock data.',
        error: error.message
      });
    }
    
    if (!elements || elements.length === 0) {
      console.log(`[API/HandCash/GetElements] No elements found for ${handle}. Returning mock elements.`);
      // Return mock elements for development/testing
      return NextResponse.json({ 
        success: true, 
        elements: getMockElements(handle),
        warning: 'No elements found - returning mock data.'
      });
    }
    
    console.log(`[API/HandCash/GetElements] Found ${elements.length} elements for ${handle}`);
    
    return NextResponse.json({ 
      success: true, 
      elements 
    });
    
  } catch (error: any) {
    console.error('[API/HandCash/GetElements] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred.' 
    }, { status: 500 });
  }
} 