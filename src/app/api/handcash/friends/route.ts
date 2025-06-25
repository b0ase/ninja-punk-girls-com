import { NextResponse } from 'next/server';

// Define the expected structure of a friend from HandCash API
interface HandCashFriend {
  handle: string;
  displayName: string;
  avatarUrl: string;
  // Add other fields if provided by the API
}

export async function POST(request: Request) {
  console.log('[API /api/handcash/friends] Received request');
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('[API /api/handcash/friends] Authorization header missing or invalid');
        return NextResponse.json({ success: false, error: 'Authorization header missing or invalid' }, { status: 401 });
    }
    const authToken = authHeader.split(' ')[1];

    if (!authToken) {
      console.error('[API /api/handcash/friends] Auth token missing after split');
      return NextResponse.json({ success: false, error: 'Auth token is required' }, { status: 400 });
    }

    // **Important:** Verify this endpoint URL with HandCash documentation
    const handCashApiUrl = 'https://cloud.handcash.io/v1/connect/profile/friends';

    console.log(`[API /api/handcash/friends] Fetching friends from HandCash for token ending in ...${authToken.slice(-4)}`);

    const response = await fetch(handCashApiUrl, {
      method: 'GET', // Typically fetching data uses GET
      headers: {
        'Authorization': `Bearer ${authToken}`,
        // 'Content-Type': 'application/json', // Not usually needed for GET
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`[API /api/handcash/friends] HandCash API error: ${response.status}`, data);
      // Try to parse a specific error message if available
      const errorMessage = data?.message || data?.error || `HandCash API failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    // Assuming the friends list is in `data.items` or similar - adjust based on actual API response
    const friends: HandCashFriend[] = Array.isArray(data?.items) ? data.items : []; 
    
    console.log(`[API /api/handcash/friends] Successfully fetched ${friends.length} friends`);
    return NextResponse.json({ success: true, friends: friends });

  } catch (error: any) {
    console.error('[API /api/handcash/friends] Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
} 