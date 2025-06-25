import { NextResponse } from 'next/server';
import { handCashConnect } from '@/services/handcash';

// Expects the authToken to be passed in the request body
export async function POST(request: Request) {
  try {
    const { authToken } = await request.json();

    if (!authToken || typeof authToken !== 'string') {
      return NextResponse.json({ error: 'Auth token is required.' }, { status: 400 });
    }

    // Get account using the provided token (server-side)
    const account = handCashConnect.getAccountFromAuthToken(authToken);
    // Fetch profile using the account instance
    const profile = await account.profile.getCurrentProfile();

    return NextResponse.json({ profile });

  } catch (error: any) {
    console.error("[API/HandCash/Profile] Error fetching profile:", error);
    // Provide more specific error feedback if possible
    let errorMessage = "Failed to fetch HandCash profile.";
    let status = 500;
    if (error.message && error.message.includes('invalid')) { // Basic check for invalid token
        errorMessage = "Invalid or expired auth token.";
        status = 401; // Unauthorized
    }
    return NextResponse.json({ error: errorMessage }, { status });
  }
} 