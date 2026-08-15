import { describe, expect, it } from 'vitest';
import type { CredentialsVaultListQueryParams } from './build-credentials-vault-list-request';
import {
  buildCredentialsVaultListRequest,
  resolveCredentialsVaultListCategory,
} from './build-credentials-vault-list-request';

function params(
  overrides: Partial<CredentialsVaultListQueryParams> = {},
): CredentialsVaultListQueryParams {
  return {
    viewMode: 'list',
    page: 1,
    pageSize: 30,
    search: '',
    filters: {},
    quickCategory: null,
    quickFilters: new Set(),
    activeTab: 'all',
    vaultListScope: 'active',
    listSort: 'recent',
    ...overrides,
  };
}

describe('resolveCredentialsVaultListCategory', () => {
  it('uses the board column key when provided', () => {
    expect(
      resolveCredentialsVaultListCategory(params({ viewMode: 'category-board' }), 'DOMAIN'),
    ).toBe('DOMAIN');
  });

  it('uses the list quick category', () => {
    expect(resolveCredentialsVaultListCategory(params({ quickCategory: 'MAIL' }))).toBe('MAIL');
  });
});

describe('buildCredentialsVaultListRequest', () => {
  it('sends page size and category for a board column', () => {
    const request = buildCredentialsVaultListRequest(
      params({ viewMode: 'category-board', search: 'iris' }),
      { page: 1, pageSize: 8, category: 'DOMAIN' },
    );

    expect(request.page).toBe(1);
    expect(request.pageSize).toBe(8);
    expect(request.category).toBe('DOMAIN');
    expect(request.search).toBe('iris');
    expect(request.scope).toBe('active');
  });
});
