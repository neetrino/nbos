import { describe, expect, it } from 'vitest';
import { isSellerRoleSlug, SELLER_ROLE_SLUG } from './sales-roles';

describe('isSellerRoleSlug', () => {
  it('accepts Seller regardless of casing', () => {
    expect(isSellerRoleSlug(SELLER_ROLE_SLUG)).toBe(true);
    expect(isSellerRoleSlug('Seller')).toBe(true);
  });

  it('rejects other roles', () => {
    expect(isSellerRoleSlug('head-sales')).toBe(false);
    expect(isSellerRoleSlug('pm')).toBe(false);
    expect(isSellerRoleSlug(undefined)).toBe(false);
  });

  it('does not recognise an assistant role, participation is per deal', () => {
    expect(isSellerRoleSlug('seller-assistant')).toBe(false);
  });
});
