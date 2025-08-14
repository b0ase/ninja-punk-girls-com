import { NextResponse, type NextRequest } from 'next/server';
import { HandCashConnect, Environments } from '@handcash/handcash-connect';

// Environment variables
const handcashAppId = process.env.NEXT_PUBLIC_HANDCASH_APP_ID;
const handcashAppSecret = process.env.HANDCASH_APP_SECRET;
const handcashEnv = process.env.HANDCASH_ENVIRONMENT ?? 'prod';

// Basic check for required variables
if (!handcashAppId || !handcashAppSecret) {
    console.error("HandCash Pay API: Missing required environment variables.");
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
  console.log("--- API Route /api/handcash/pay POST request received ---");

  try {
    const body = await request.json();
    const { authToken, amount } = body;

    if (!authToken) {
      console.error("HandCash Pay API: authToken missing in request body.");
      return NextResponse.json({ 
        success: false, 
        error: 'Missing authToken' 
      }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      console.error("HandCash Pay API: Invalid amount.");
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid amount' 
      }, { status: 400 });
    }

    console.log(`HandCash Pay API: Processing payment of ${amount} BSV for token prefix: ${authToken.substring(0,6)}...`);

    // Get account
    const account = handCashConnect.getAccountFromAuthToken(authToken);
    
    // For now, we'll simulate a payment to the app's business wallet
    // In production, you'd want to set up proper payment destinations
    const businessAuthToken = process.env.HANDCASH_BUSINESS_AUTH_TOKEN;
    
    if (!businessAuthToken) {
      console.error("HandCash Pay API: Business auth token not configured.");
      return NextResponse.json({ 
        success: false, 
        error: 'Payment processing not configured' 
      }, { status: 500 });
    }

    // Create payment parameters
    const paymentParameters = {
      description: `NPG Mint Payment - ${amount} BSV`,
      payments: [
        {
          destination: businessAuthToken, // Pay to business wallet
          currencyCode: 'BSV' as const,
          sendAmount: amount
        }
      ]
    };

    console.log(`HandCash Pay API: Sending payment with parameters:`, paymentParameters);

    // Execute the payment
    const paymentResult = await account.wallet.pay(paymentParameters);
    
    console.log(`HandCash Pay API: Payment successful:`, paymentResult);

    return NextResponse.json({
      success: true,
      transactionId: paymentResult.transactionId,
      amount: amount,
      currency: 'BSV'
    });

  } catch (error: any) {
    console.error("HandCash Pay API Error:", error);
    const message = error.message || 'Payment failed';
    
    return NextResponse.json({ 
      success: false, 
      error: message 
    }, { status: 500 });
  }
}
