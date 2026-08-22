import { describe, expect, it } from 'vitest';
import { encrypt } from '../../../common/utils/crypto';
import {
  assertNoProviderSecretFields,
  containsProviderSecretField,
  requireProviderApiKey,
  toProviderKeyPrefix,
} from './ai-provider-key';

const SAMPLE_KEY = 'sk-test-provider-secret-value-12345';

describe('ai-provider-key', () => {
  it('returns a prefix that is not the raw key', () => {
    const prefix = toProviderKeyPrefix(SAMPLE_KEY);
    expect(prefix).not.toBe(SAMPLE_KEY);
    expect(prefix.startsWith('sk-')).toBe(true);
    expect(prefix.includes('…')).toBe(true);
    expect(prefix.length).toBeLessThan(SAMPLE_KEY.length);
  });

  it('rejects a short key without echoing it', () => {
    expect(() => requireProviderApiKey('short')).toThrow(/at least/);
  });

  it('detects secret fields in audit-shaped objects', () => {
    expect(containsProviderSecretField({ keyPrefix: 'sk-…1234' })).toBe(false);
    expect(containsProviderSecretField({ apiKey: SAMPLE_KEY })).toBe(true);
    expect(
      containsProviderSecretField({ encryptedApiKey: encrypt(SAMPLE_KEY, 'k'.repeat(32)) }),
    ).toBe(true);
    expect(() => assertNoProviderSecretFields({ secret: SAMPLE_KEY })).toThrow(/must not leave/);
  });
});
