export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { handCashConnect } from '@/services/handcash';
import { NextApiRequest } from 'next'; // Import type if needed, or handle URL directly
// Removed Permissions import as it seems permissions are not passed here
// import { Permissions } from '@handcash/handcash-connect';

export async function GET(request: Request) { // Use standard Request object
  try {
    // Extract query parameters from the URL
    const url = new URL(request.url);
    const clientRedirectUri = url.searchParams.get('redirectUrl'); // Get redirectUrl from query param

    console.log("[API/HandCash/Connect] Client requested redirect URI:", clientRedirectUri);

    // Prepare options for getRedirectionUrl
    const options: { redirectUrl?: string } = {};
    if (clientRedirectUri) {
        // Basic validation (optional): Ensure it's a relative path or expected domain
        if (clientRedirectUri.startsWith('/') || clientRedirectUri.startsWith(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')) {
            options.redirectUrl = clientRedirectUri;
        } else {
             console.warn("[API/HandCash/Connect] Received potentially unsafe redirectUrl:", clientRedirectUri);
             // Decide whether to ignore it, error out, or use a default
             // For now, we'll ignore it if it looks unsafe
        }
    }

    // Get redirection URL, passing the validated redirectUrl from options if provided
    const redirectionUrl = handCashConnect.getRedirectionUrl(options);
    console.log("[API/HandCash/Connect] Generated HandCash Redirection URL:", redirectionUrl);

    if (!redirectionUrl) {
      throw new Error('SDK did not return a redirection URL.');
    }

    return NextResponse.json({ url: redirectionUrl });
  } catch (error: any) {
    console.error("[API/HandCash/Connect] Error getting redirection URL:", error);
    return NextResponse.json(
      { error: "Failed to initiate HandCash connection." },
      { status: 500 }
    );
  }
} 