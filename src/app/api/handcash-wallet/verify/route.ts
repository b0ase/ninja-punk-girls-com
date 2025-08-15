import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode } = await request.json();

    if (!email || !verificationCode) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual HandCash White-label Wallet API when available
    // For now, this is a placeholder implementation
    
    // Simulate email verification (accept any 6-digit code for demo)
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check your email and try again.' },
        { status: 400 }
      );
    }

    // In a real implementation, this would:
    // 1. Call HandCash White-label Wallet API to verify the code
    // 2. Activate the wallet
    // 3. Return the activated wallet details

    console.log(`[HandCash Wallet] Verifying email: ${email} with code: ${verificationCode}`);
    
    // Return mock verified wallet data
    const mockWallet = {
      id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      balance: 0.001, // Demo balance
      currency: 'BSV',
      paymail: `${email.split('@')[0]}.npg@handcash.io`,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      wallet: mockWallet,
      message: 'Email verified successfully! Your wallet is now active.',
      note: 'This is a demo implementation. Contact HandCash sales to enable White-label Wallet API.',
    });

  } catch (error) {
    console.error('HandCash Wallet Verification Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
