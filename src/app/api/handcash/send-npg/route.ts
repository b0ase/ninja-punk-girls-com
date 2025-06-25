import { NextResponse } from 'next/server';
import { handCashConnect } from '@/services/handcash';

// POST function to handle sending a specific item (NPG token)
export async function POST(request: Request) {
  let originToSend: string | null = null; // Keep track for logging
  let recipient: string | null = null; // Keep track for logging
  
  try {
    const { authToken, recipientHandle, origin } = await request.json();
    originToSend = origin; // Store for logging
    recipient = recipientHandle; // Store for logging

    // --- Input Validation ---
    if (!authToken || typeof authToken !== 'string') {
      return NextResponse.json({ success: false, error: 'Auth token is required.' }, { status: 400 });
    }
    if (!recipientHandle || typeof recipientHandle !== 'string') {
      return NextResponse.json({ success: false, error: 'Recipient handle is required.' }, { status: 400 });
    }
    if (!origin || typeof origin !== 'string') {
      return NextResponse.json({ success: false, error: 'Item origin is required.' }, { status: 400 });
    }

    // Clean recipient handle (remove leading $ if present, SDK expects it without)
    const cleanedRecipientHandle = recipientHandle.startsWith('$') 
      ? recipientHandle.substring(1) 
      : recipientHandle;

    console.log(`[API/Send-NPG] Attempting transfer: Origin ${originToSend} to Handle ${cleanedRecipientHandle}`);

    // --- Handcash SDK Interaction ---
    const account = handCashConnect.getAccountFromAuthToken(authToken);

    const transferParams = {
      destinationsWithOrigins: [
        {
          destination: cleanedRecipientHandle, // Use the cleaned handle
          origins: [origin] // Send the specific origin
        }
      ]
    };

    const transferResult = await account.items.transfer(transferParams);
    console.log("[API/Send-NPG] Transfer successful:", transferResult);

    // --- Success Response ---
    return NextResponse.json({ 
      success: true, 
      transactionId: transferResult.transactionId 
    });

  } catch (error: any) {
    console.error(`[API/Send-NPG] Error transferring origin ${originToSend} to ${recipient}:`, error);
    
    // Log specific HandCash error data if available
    let handcashErrorData = null;
    if (error.response?.data) {
        handcashErrorData = error.response.data;
        console.error("[API/Send-NPG] HandCash Error Data:", handcashErrorData);
    }

    // Check for common permission/creator errors
    let errorMessage = error.message || "Failed to process transfer.";
    if (error.message?.includes('permission')) {
        errorMessage = "Transfer failed: Check if the required ITEMS_WRITE permission is granted.";
    } else if (error.message?.includes('creator') || error.message?.includes('owner')) {
        errorMessage = "Transfer failed: The application might not be registered as the creator of this item.";
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        handcashError: handcashErrorData // Optionally include HC error details
      },
      { status: error.httpStatusCode || 500 }
    );
  }
} 