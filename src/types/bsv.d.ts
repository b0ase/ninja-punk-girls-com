declare module 'bsv' {
  export class PrivKey {
    static fromBuffer(buf: Buffer, compressed?: boolean): PrivKey;
    static fromString(str: string): PrivKey;
    static fromWif(str: string): PrivKey;
    static fromRandom(): PrivKey;
    static fromBn(bn: any): PrivKey;
    
    toString(): string;
    toWif(): string;
    toBuffer(): Buffer;
    toPublicKey(): PubKey;
  }

  export class PubKey {
    static fromPrivKey(privKey: PrivKey): PubKey;
    static fromBuffer(buf: Buffer): PubKey;
    static fromString(str: string): PubKey;
    
    toString(): string;
    toBuffer(): Buffer;
    toAddress(): Address;
  }

  export class Address {
    static fromPubKey(pubKey: PubKey): Address;
    static fromString(str: string): Address;
    
    toString(): string;
    toBuffer(): Buffer;
  }

  export class Base58 {
    static encode(buf: Buffer): string;
    static decode(str: string): Buffer;
  }

  export class Bn {
    static fromBuffer(buf: Buffer): Bn;
    
    toBuffer(): Buffer;
    toString(): string;
  }

  export default {
    PrivKey,
    PubKey,
    Address,
    Base58,
    Bn
  }
} 