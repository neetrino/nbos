import { describe, expect, it } from 'vitest';
import { encrypt, decrypt } from '../../../common/utils/crypto';

const TEST_KEY = '0123456789abcdef0123456789abcdef';

describe('MetaProviderSecretStore encryption round-trip', () => {
  it('encrypts and decrypts page access token payload', () => {
    const payload = JSON.stringify({
      pageAccessToken: 'page-token-value',
      userAccessToken: 'user-token-value',
    });
    const encrypted = encrypt(payload, TEST_KEY);
    const decrypted = decrypt(encrypted, TEST_KEY);
    expect(JSON.parse(decrypted)).toEqual({
      pageAccessToken: 'page-token-value',
      userAccessToken: 'user-token-value',
    });
  });
});
