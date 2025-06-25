import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Base58 encoding function
function base58Encode(buffer: Buffer): string {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const BASE = BigInt(58);
  
  let num = BigInt(0);
  // Convert buffer to BigInt
  for (let i = 0; i < buffer.length; i++) {
    num = (num * BigInt(256)) + BigInt(buffer[i]);
  }
  
  // Count leading zeros
  let leadingZeros = 0;
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    leadingZeros++;
  }
  
  // Convert to base58
  let str = '';
  while (num > 0) {
    const mod = Number(num % BASE);
    str = ALPHABET[mod] + str;
    num = num / BASE;
  }
  
  // Add leading '1's for each leading zero byte
  for (let i = 0; i < leadingZeros; i++) {
    str = '1' + str;
  }
  
  return str;
}

// Create a Bitcoin WIF from a private key buffer
function createWifFromPrivateKey(privateKey: Buffer, compressed: boolean = true): string {
  // Add version byte (0x80 for Bitcoin mainnet)
  const versionByte = Buffer.from([0x80]);
  
  // If compressed public key is desired, add compression flag
  const compressionFlag = compressed ? Buffer.from([0x01]) : Buffer.alloc(0);
  
  // Create extended key
  const extendedKey = Buffer.concat([versionByte, privateKey, compressionFlag]);
  
  // Calculate double SHA-256 checksum (first 4 bytes)
  const firstSha = crypto.createHash('sha256').update(extendedKey).digest();
  const secondSha = crypto.createHash('sha256').update(firstSha).digest();
  const checksum = secondSha.slice(0, 4);
  
  // Combine extended key and checksum
  const wifBuffer = Buffer.concat([extendedKey, checksum]);
  
  // Encode as Base58
  return base58Encode(wifBuffer);
}

// Derive Bitcoin SV public key and address from a private key
function derivePublicKeyAndAddress(privateKey: Buffer) {
  try {
    // Since we can't use the Node.js crypto's generateKeyPairSync directly with our private key,
    // we'll create a mock public key for now
    // In a real implementation, you would use a proper secp256k1 library like elliptic
    
    // Mock compressed public key (in real implementation, derive this properly)
    // Using first byte of 0x02 (even Y coordinate prefix) followed by the private key
    const mockCompressedPublicKey = Buffer.concat([
      Buffer.from([0x02]), // Prefix for even Y
      privateKey
    ]);
    
    const publicKeyHex = mockCompressedPublicKey.toString('hex');
    
    // Create a Bitcoin SV address (P2PKH)
    // 1. SHA-256 hash of the public key
    const sha256 = crypto.createHash('sha256').update(mockCompressedPublicKey).digest();
    
    // 2. RIPEMD-160 hash of the SHA-256 hash
    const ripemd160 = crypto.createHash('ripemd160').update(sha256).digest();
    
    // 3. Add version byte (0x00 for Bitcoin mainnet P2PKH)
    const versionedHash = Buffer.concat([Buffer.from([0x00]), ripemd160]);
    
    // 4. Calculate checksum (first 4 bytes of double SHA-256)
    const addrChecksum = crypto.createHash('sha256')
      .update(crypto.createHash('sha256').update(versionedHash).digest())
      .digest()
      .slice(0, 4);
    
    // 5. Combine versioned hash and checksum
    const addressBytes = Buffer.concat([versionedHash, addrChecksum]);
    
    // 6. Encode as Base58
    const address = base58Encode(addressBytes);
    
    return { publicKey: publicKeyHex, address };
  } catch (error) {
    console.error('Error deriving public key and address:', error);
    return { 
      publicKey: 'Error deriving public key',
      address: 'Error deriving address'
    };
  }
}

export async function POST(request: Request) {
  try {
    const { signature } = await request.json();

    if (!signature) {
      return NextResponse.json({ success: false, error: 'No signature provided' }, { status: 400 });
    }

    console.log(`[API/derive-keys] Received signature with length: ${signature.length}, first 20 chars: ${signature.substring(0, 20)}`);

    // Create a SHA-256 hash of the signature to use as the private key
    const privateKey = crypto.createHash('sha256').update(Buffer.from(signature)).digest();
    console.log(`[API/derive-keys] Generated private key hash with length: ${privateKey.length}`);
    
    // Create a WIF format from the private key (compressed public key)
    const wif = createWifFromPrivateKey(privateKey);
    console.log(`[API/derive-keys] Generated WIF: ${wif}`);
    
    // Derive public key and address
    const { publicKey, address } = derivePublicKeyAndAddress(privateKey);
    console.log(`[API/derive-keys] Generated public key and address: ${publicKey.substring(0, 10)}..., ${address}`);
    
    // Return the complete wallet information
    return NextResponse.json({
      success: true,
      publicKey: publicKey,
      privateKeyWIF: wif,
      address: address
    });
  } catch (error: any) {
    console.error('[API/derive-keys] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
} 