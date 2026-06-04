import { describe, it, expect } from 'vitest';
import { slugifyCredentialProviderName } from './credential-provider-slug';

describe('slugifyCredentialProviderName', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyCredentialProviderName('Google Play')).toBe('google-play');
  });

  it('returns fallback for empty', () => {
    expect(slugifyCredentialProviderName('   ')).toBe('provider');
  });
});
