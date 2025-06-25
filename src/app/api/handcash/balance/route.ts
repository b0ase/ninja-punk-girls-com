import { NextResponse } from 'next/server';
import { handCashConnect } from '@/services/handcash';

export async function POST(request: Request) {
  try {
    const { authToken } = await request.json();

    if (!authToken || typeof authToken !== 'string') {
      return NextResponse.json({ error: 'Auth token is required.' }, { status: 400 });
    }

    const account = handCashConnect.getAccountFromAuthToken(authToken);
    
    // Get total balance
    const totalBalance = await account.wallet.getTotalBalance();
    
    // Get spendable balance (defaults to sats)
    const spendableBalance = await account.wallet.getSpendableBalance();
    
    return NextResponse.json({ 
      success: true,
      totalBalance,
      spendableBalance
    });

  } catch (error: any) {
    console.error("[API/HandCash/Balance] Error fetching balance:", error);
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch wallet balance." },
      { status: error.httpStatusCode || 500 }
    );
  }
} 