import { describe, it, expect } from 'vitest';
import { normalizeCredentialVaultPageSize } from './credential-vault-pagination';

describe('normalizeCredentialVaultPageSize', () => {
  it('defaults invalid values to 30', () => {
    expect(normalizeCredentialVaultPageSize(99)).toBe(30);
  });
});
