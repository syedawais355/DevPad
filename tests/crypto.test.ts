import { webcrypto } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { decrypt, DecryptionError, encrypt } from '../src/crypto/aes';
import { deriveKey, generateSalt } from '../src/crypto/keys';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true
  });
});

describe('crypto', () => {
  it('encrypts and decrypts content', async () => {
    const salt = generateSalt();
    const key = await deriveKey('secret', salt);
    const ciphertext = await encrypt('hello devpad', key);
    const plaintext = await decrypt(ciphertext, key);
    expect(plaintext).toBe('hello devpad');
  });

  it('throws a typed error for wrong keys', async () => {
    const salt = generateSalt();
    const key = await deriveKey('secret', salt);
    const wrongKey = await deriveKey('wrong', salt);
    const ciphertext = await encrypt('hello devpad', key);
    await expect(decrypt(ciphertext, wrongKey)).rejects.toBeInstanceOf(DecryptionError);
  });

  it('generates random salts', () => {
    const left = generateSalt();
    const right = generateSalt();
    expect(left).toHaveLength(16);
    expect(right).toHaveLength(16);
    expect(Array.from(left)).not.toEqual(Array.from(right));
  });
});
