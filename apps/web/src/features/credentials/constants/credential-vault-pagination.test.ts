import { describe, it, expect } from 'vitest';
import {
  buildCredentialVaultPageSequence,
  normalizeCredentialVaultPageSize,
} from './credential-vault-pagination';

describe('buildCredentialVaultPageSequence', () => {
  it('returns empty when no pages', () => {
    expect(buildCredentialVaultPageSequence(1, 0)).toEqual([]);
  });

  it('includes ellipsis for large page counts', () => {
    expect(buildCredentialVaultPageSequence(5, 12)).toEqual([
      1,
      'ellipsis',
      4,
      5,
      6,
      'ellipsis',
      12,
    ]);
  });
});

describe('normalizeCredentialVaultPageSize', () => {
  it('defaults invalid values to 30', () => {
    expect(normalizeCredentialVaultPageSize(99)).toBe(30);
  });
});
