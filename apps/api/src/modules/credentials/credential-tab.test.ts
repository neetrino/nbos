import { describe, expect, it } from 'vitest';
import { normalizeCredentialTab } from './credential-tab';

describe('normalizeCredentialTab', () => {
  it('maps company vault tab query param', () => {
    expect(normalizeCredentialTab('company')).toBe('company');
    expect(normalizeCredentialTab('Company')).toBe('company');
  });

  it('returns undefined for unknown tabs', () => {
    expect(normalizeCredentialTab('unknown')).toBeUndefined();
  });
});
