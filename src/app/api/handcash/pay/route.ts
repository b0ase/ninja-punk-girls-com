'use server';

import { NextResponse } from 'next/server';
import { HandCashConnect } from '@handcash/handcash-connect';

// Define expected request body structure
interface PayRequest {
  authToken: string;
  payments: Array<{
    destination: string;
    currencyCode: string;
    amount: number;
    description?: string;
  }>;
}

// Revert to simpler SDK initialization
const handCashAppId = process.env.HANDCASH_APP_ID;
const handCashAppSecret = process.env.HANDCASH_APP_SECRET;

if (!handCashAppId) {
  console.error("HANDCASH_APP_ID is not set in environment variables.");
  // Error will be caught in POST handler
}

// Initialize HandCash Connect SDK
const handCashConnect = new HandCashConnect({ 
    appId: handCashAppId!, // Use non-null assertion, checked in POST
    // Explicitly handle potentially undefined secret for type safety
    appSecret: handCashAppSecret ?? '' 
}); 

export async function POST(request: Request) {
  console.log('[API /handcash/pay] Received POST request');

  // Check if App ID was present during initialization
  if (!handCashAppId) { 
    console.error("[API /handcash/pay] HandCash SDK not initialized: HANDCASH_APP_ID missing.");
    return NextResponse.json({ success: false, error: 'Server configuration error: HandCash App ID missing.' }, { status: 500 });
  }

  let reqBody: PayRequest;
  try {
    reqBody = await request.json();
    if (!reqBody.authToken || !reqBody.payments || reqBody.payments.length === 0) {
      throw new Error('Missing authToken or payments in request body.');
    }
    console.log(`[API /handcash/pay] Request body parsed for ${reqBody.payments.length} payment(s).`);
  } catch (error: any) {
    console.error('[API /handcash/pay] Error parsing request body:', error);
    return NextResponse.json({ success: false, error: `Invalid request body: ${error.message}` }, { status: 400 });
  }

  const { authToken, payments } = reqBody;

  try {
    // Get user payment instance using the provided authToken
    const account = handCashConnect.getAccountFromAuthToken(authToken);

    // Initiate payment
    console.log(`[API /handcash/pay] Initiating payment via SDK for user associated with token ${authToken.substring(0, 6)}...`);
    
    // Prepare payment items, potentially asserting type if needed
    const paymentItems = payments.map(p => ({
        destination: p.destination,
        currencyCode: p.currencyCode, // Keep as string
        sendAmount: p.amount, 
    }));

    const paymentResult = await account.wallet.pay({
        payments: paymentItems as any, 
        description: payments[0]?.description || 'Payment'
    });

    console.log('[API /handcash/pay] HandCash SDK payment successful:', paymentResult);

    // Return relevant transaction details
    return NextResponse.json({
      success: true,
      transactionId: paymentResult.transactionId,
      // You might want to return other details from paymentResult if needed
    });

  } catch (error: any) {
    console.error('[API /handcash/pay] CRITICAL ERROR processing payment:', error);
    // Provide a more specific error if possible (e.g., insufficient funds)
    const errorMessage = error.message || 'Failed to process payment via HandCash.';
    // Determine appropriate status code based on error type if possible
    const status = error.code === 'INSUFFICIENT_FUNDS' ? 400 : 500; 
    return NextResponse.json({ success: false, error: errorMessage }, { status });
  }
}
