import { describe, it, expect } from 'vitest';
import {
  normalizeCredentialVaultSortFilter,
  resolveCredentialVaultListSort,
} from './credential-vault-list-sort';

describe('normalizeCredentialVaultSortFilter', () => {
  it('maps legacy all to recent on active vault', () => {
    expect(normalizeCredentialVaultSortFilter('all', 'active')).toBe('recent');
  });

  it('maps legacy values to created_desc on archived vault', () => {
    expect(normalizeCredentialVaultSortFilter('all', 'archived')).toBe('created_desc');
    expect(normalizeCredentialVaultSortFilter('recent', 'archived')).toBe('created_desc');
  });
});

describe('resolveCredentialVaultListSort', () => {
  it('resolves recent to API recent on active vault', () => {
    expect(resolveCredentialVaultListSort({ sort: 'recent' }, 'active')).toBe('recent');
  });

  it('resolves created_desc default on archived vault', () => {
    expect(resolveCredentialVaultListSort({ sort: 'created_desc' }, 'archived')).toBe(
      'created_desc',
    );
  });
});
