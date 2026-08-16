import { describe, expect, it } from 'vitest';
import { buildProductDetailPageHref } from '@/features/projects/constants/product-detail-tab';
import {
  buildCredentialVaultCardMetaBadges,
  credentialProductHref,
} from '@/features/credentials/utils/credential-vault-card-meta';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

function base(overrides: Partial<CredentialListItem> = {}): CredentialListItem {
  return {
    id: 'c1',
    name: 'Test',
    category: 'ADMIN',
    credentialType: 'LOGIN_PASSWORD',
    criticality: 'LOW',
    provider: null,
    url: null,
    login: null,
    phone: null,
    accessLevel: 'PROJECT_TEAM',
    allowedEmployees: [],
    project: { id: 'proj-1', name: 'Acme Project' },
    product: null,
    department: null,
    owner: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('credentialProductHref', () => {
  it('builds product detail href when project and product ids exist', () => {
    expect(credentialProductHref('proj-1', { id: 'prod-9', name: 'Mobile App' })).toBe(
      buildProductDetailPageHref('proj-1', 'prod-9'),
    );
  });

  it('returns undefined without project id', () => {
    expect(credentialProductHref(null, { id: 'prod-9', name: 'Mobile App' })).toBeUndefined();
  });

  it('returns undefined without product id', () => {
    expect(credentialProductHref('proj-1', null)).toBeUndefined();
  });
});

describe('buildCredentialVaultCardMetaBadges', () => {
  it('adds linked product badge with href separate from access badge', () => {
    const badges = buildCredentialVaultCardMetaBadges(
      base({
        product: { id: 'prod-9', name: 'Mobile App' },
      }),
    );

    const accessBadge = badges.find((badge) => badge.key === 'access');
    const productBadge = badges.find((badge) => badge.key === 'product');

    expect(accessBadge?.label).toBe('Project');
    expect(productBadge).toMatchObject({
      label: 'Mobile App',
      variant: 'indigo',
      href: buildProductDetailPageHref('proj-1', 'prod-9'),
    });
  });

  it('omits product badge when product is absent', () => {
    const badges = buildCredentialVaultCardMetaBadges(base());
    expect(badges.some((badge) => badge.key === 'product')).toBe(false);
  });
});
