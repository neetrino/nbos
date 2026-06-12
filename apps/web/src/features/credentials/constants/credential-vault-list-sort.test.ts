import { describe, it, expect } from 'vitest';
import {
  normalizeCredentialVaultSortFilter,
  resolveCredentialVaultListSort,
} from './credential-vault-list-sort';

describe('normalizeCredentialVaultSortFilter', () => {
  it('maps legacy all to recent on active vault', () => {
    expect(normalizeCredentialVaultSortFilter('all', 'active')).toBe('recent');
  });

  it('maps legacy values to created_desc on trash vault', () => {
    expect(normalizeCredentialVaultSortFilter('all', 'trash')).toBe('created_desc');
    expect(normalizeCredentialVaultSortFilter('recent', 'trash')).toBe('created_desc');
  });
});

describe('resolveCredentialVaultListSort', () => {
  it('resolves recent to API recent on active vault', () => {
    expect(resolveCredentialVaultListSort({ sort: 'recent' }, 'active')).toBe('recent');
  });

  it('resolves created_desc default on trash vault', () => {
    expect(resolveCredentialVaultListSort({ sort: 'created_desc' }, 'trash')).toBe('created_desc');
  });
});
