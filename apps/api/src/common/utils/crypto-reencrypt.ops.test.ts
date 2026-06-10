import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from './crypto';
import {
  encryptLegacyCiphertextForTest,
  isV2Ciphertext,
  reencryptCiphertextToV2,
} from './crypto-reencrypt.ops';

const TEST_KEY = 'test-encryption-key-for-unit-tests';

describe('isV2Ciphertext', () => {
  it('detects v2 prefix', () => {
    expect(isV2Ciphertext(encrypt('x', TEST_KEY))).toBe(true);
    expect(isV2Ciphertext(encryptLegacyCiphertextForTest('x', TEST_KEY))).toBe(false);
  });
});

describe('reencryptCiphertextToV2', () => {
  it('migrates legacy blob to v2', () => {
    const legacy = encryptLegacyCiphertextForTest('mail secret json', TEST_KEY);
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
