import { describe, expect, it } from 'vitest';
import { createCipheriv, randomBytes } from 'crypto';
import { decrypt, deriveLegacyKey, encrypt } from './crypto';
import { isV2Ciphertext, reencryptCiphertextToV2 } from './crypto-reencrypt.ops';

const TEST_KEY = 'test-encryption-key-for-unit-tests';

function encryptLegacy(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', deriveLegacyKey(TEST_KEY), iv, {
    authTagLength: 16,
  });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
}

describe('isV2Ciphertext', () => {
  it('detects v2 prefix', () => {
    expect(isV2Ciphertext(encrypt('x', TEST_KEY))).toBe(true);
    expect(isV2Ciphertext(encryptLegacy('x'))).toBe(false);
  });
});

describe('reencryptCiphertextToV2', () => {
  it('migrates legacy blob to v2', () => {
    const legacy = encryptLegacy('mail secret json');
    const { value, migrated } = reencryptCiphertextToV2(legacy, TEST_KEY);
    expect(migrated).toBe(true);
    expect(isV2Ciphertext(value)).toBe(true);
    expect(decrypt(value, TEST_KEY)).toBe('mail secret json');
  });

  it('skips already v2 ciphertext', () => {
    const v2 = encrypt('already v2', TEST_KEY);
    const { value, migrated } = reencryptCiphertextToV2(v2, TEST_KEY);
    expect(migrated).toBe(false);
    expect(value).toBe(v2);
  });
});
