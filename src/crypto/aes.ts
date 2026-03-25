import { EMPTY_STRING, IV_BYTES } from '../constants';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export class EncryptionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = EMPTY_STRING;
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const encoded = textEncoder.encode(plaintext);
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encoded
    );
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);
    return bytesToBase64(combined);
  } catch (error) {
    throw new EncryptionError(error instanceof Error ? error.message : 'Encryption failed');
  }
}

export async function decrypt(ciphertext: string, key: CryptoKey): Promise<string> {
  try {
    const combined = base64ToBytes(ciphertext);
    if (combined.length <= IV_BYTES) {
      throw new DecryptionError('Ciphertext is invalid');
    }
    const iv = combined.slice(0, IV_BYTES);
    const payload = combined.slice(IV_BYTES);
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      payload
    );
    return textDecoder.decode(plaintext);
  } catch (error) {
    if (error instanceof DecryptionError) {
      throw error;
    }
    throw new DecryptionError(error instanceof Error ? error.message : 'Decryption failed');
  }
}
